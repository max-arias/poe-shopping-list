#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["arcshiftwrap>=0.1.0"]
# ///
"""Collect Mercenary-related Path of Exile trade links from Reddit.

This is a one-shot Arctic Shift collector.  By default it searches each
configured subreddit (r/pathofexile and r/PathOfExileBuilds by default) with
daily paginated post searches for five context terms, then fetches comment
trees for every matched post.  Full-text comment searches and resolution of
comment-only matches are opt-in because they are slower.  Matching remains
lexical: a thread must mention a context term and contain a
``pathofexile.com/trade/search`` URL.  Results are written as date-stamped JSON
and Markdown files.  Run with ``uv run --script``; no API credentials or LLM
service is required.
"""

from __future__ import annotations

import argparse
import asyncio
import html
import json
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit


CONCURRENCY = 8
REQUEST_DELAY_SECONDS = 1
KEYWORDS = ("mercenary", "mercenaries", "merc", "warrant", "warrants")
SUBREDDITS = ("pathofexile", "PathOfExileBuilds")
URL_RE = re.compile(
    r"https?://(?:www\.)?pathofexile\.com/trade/search/[^\s<>\"'\[\]\(\)]+",
    re.IGNORECASE,
)
CONTEXT_RE = re.compile(r"\b(?:mercenary|mercenaries|merc|warrant|warrants)\b", re.IGNORECASE)


def positive_int(value: str) -> int:
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return number


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    result.add_argument("--days", type=positive_int, default=7, help="Trailing UTC days (default: 7)")
    result.add_argument(
        "--subreddit", dest="subreddits", action="append", default=None,
        help="Subreddit to search (repeatable; defaults to pathofexile and PathOfExileBuilds)",
    )
    result.add_argument(
        "--include-comment-search", action="store_true",
        help="Also search comment full text and resolve comment-only matches (off by default; slower)",
    )
    result.add_argument("--limit-per-query", type=positive_int, default=25, help="Posts per search page (default: 25)")
    result.add_argument("--max-pages", type=positive_int, default=None, help="Maximum pages per query (default: no cap)")
    result.add_argument("--out-dir", default="data/reddit-mercenary-trade", help="Artifact directory (default: %(default)s)")
    return result


def as_posts(response: Any) -> list[dict[str, Any]]:
    value = response.get("data", response) if isinstance(response, dict) else response
    if isinstance(value, dict):
        value = value.get("children", [])
    return [dict(item) for item in (value or []) if isinstance(item, dict)]


def created_utc(post: dict[str, Any]) -> str | None:
    value = post.get("created_utc", post.get("created"))
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, timezone.utc).isoformat()
        if value:
            parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            return parsed.astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError, OverflowError):
        pass
    return None


def created_timestamp(post: dict[str, Any]) -> float | None:
    value = post.get("created_utc", post.get("created"))
    try:
        if isinstance(value, (int, float)):
            return float(value)
        if value:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except (TypeError, ValueError, OverflowError):
        pass
    return None


def permalink(post: dict[str, Any]) -> str | None:
    value = post.get("permalink") or post.get("url")
    if value:
        value = str(value)
        return "https://www.reddit.com" + value if value.startswith("/") else value
    subreddit, post_id = post.get("subreddit"), post.get("id")
    if subreddit and post_id:
        return f"https://www.reddit.com/r/{subreddit}/comments/{post_id}/"
    return None


def canonical_url(raw: str) -> str | None:
    raw = html.unescape(raw).strip()
    while raw and raw[-1] in ".,;:!?)]}>\"'":
        raw = raw[:-1]
    try:
        parts = urlsplit(raw)
    except ValueError:
        return None
    if parts.scheme.lower() not in ("http", "https") or parts.hostname is None:
        return None
    if parts.hostname.lower() not in ("pathofexile.com", "www.pathofexile.com"):
        return None
    if not parts.path.lower().startswith("/trade/search/"):
        return None
    return urlunsplit(("https", "www.pathofexile.com", parts.path, parts.query, ""))


def text_fields(value: Any) -> list[str]:
    """Collect user-facing post/comment text without depending on API shape."""
    if not isinstance(value, dict):
        return []
    fields: list[str] = []
    for key in ("title", "selftext", "body", "text", "content"):
        item = value.get(key)
        if isinstance(item, str):
            fields.append(item)
    return fields


def comment_records(tree: Any) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    def visit(value: Any) -> None:
        if isinstance(value, dict):
            if any(key in value for key in ("body", "text", "content")):
                records.append(value)
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(tree)
    # A few response formats expose the same comment at multiple wrapper levels.
    unique: list[dict[str, Any]] = []
    seen: set[tuple[Any, str]] = set()
    for record in records:
        key = (record.get("id"), "\n".join(text_fields(record)))
        if key not in seen:
            seen.add(key)
            unique.append(record)
    return unique


async def fetch_tree(client: Any, post_id: str, semaphore: asyncio.Semaphore) -> tuple[str, Any]:
    async with semaphore:
        try:
            return post_id, await asyncio.to_thread(
                client.get_comment_tree, link_id=f"t3_{post_id}", limit=9999,
                start_breadth=4, start_depth=4,
            )
        except Exception as exc:  # API failures should not lose other threads.
            return post_id, {"error": str(exc)}


def extract(post: dict[str, Any], tree: Any, discovered_via: set[str]) -> dict[str, Any] | None:
    post_text = text_fields(post)
    comments = [] if isinstance(tree, dict) and "error" in tree else comment_records(tree)
    comment_text = ["\n".join(text_fields(comment)) for comment in comments]
    all_text = "\n".join(post_text + comment_text)
    if not CONTEXT_RE.search(all_text):
        return None

    found: dict[str, list[dict[str, Any]]] = {}
    for raw in URL_RE.findall("\n".join(post_text)):
        url = canonical_url(raw)
        if url:
            location = {"source": "post"}
            if location not in found.setdefault(url, []):
                found[url].append(location)
    for comment, text in zip(comments, comment_text):
        for raw in URL_RE.findall(text):
            url = canonical_url(raw)
            if url:
                location = {"source": "comment", "comment_id": comment.get("id")}
                if location not in found.setdefault(url, []):
                    found[url].append(location)
    if not found:
        return None
    links = []
    for url, locations in sorted(found.items()):
        unique_locations = list({json.dumps(location, sort_keys=True): location for location in locations}.values())
        links.append({"url": url, "locations": sorted(unique_locations, key=lambda location: (location["source"], str(location.get("comment_id") or "")))})
    return {
        "discovered_via": sorted(discovered_via),
        "post": {
            "id": post.get("id"), "title": post.get("title", ""),
            "author": post.get("author", post.get("author_name")),
            "created_utc": created_utc(post), "permalink": permalink(post),
        },
        "links": links,
    }


def markdown(artifact: dict[str, Any]) -> str:
    lines = ["# Mercenary trade-link candidates", "", "**Trade-query validation is required; URL paths alone do not establish a Mercenary Warrant listing.**", "", f"Fetched: `{artifact['fetched_at']}`", f"Window: `{artifact['window']['start']}` → `{artifact['window']['end']}`", "", f"Candidate posts: **{len(artifact['posts'])}**", ""]
    for item in artifact["posts"]:
        post = item["post"]
        title = str(post.get("title") or "(untitled)").replace("[", "\\[").replace("]", "\\]")
        target = post.get("permalink") or ""
        lines += [f"## [{title}]({target})", "", f"- Discovered via: `{', '.join(item['discovered_via'])}`", f"- Author: `{post.get('author') or '[deleted]'}`", f"- Created UTC: `{post.get('created_utc') or 'unknown'}`"]
        for link in item["links"]:
            origins = ", ".join(
                f"{location['source']}" + (f" `{location['comment_id']}`" if location.get("comment_id") else "")
                for location in link["locations"]
            )
            lines.append(f"- <{link['url']}> ({origins})")
        lines.append("")
    return "\n".join(lines)


async def run(args: argparse.Namespace) -> None:
    from arcshiftwrap import ArcticShiftClient  # type: ignore[import-not-found]

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=args.days)
    post_fields = ["id", "title", "selftext", "created_utc", "author", "subreddit"]
    comment_fields = ["id", "body", "created_utc", "link_id", "subreddit"]
    subreddits = args.subreddits or list(SUBREDDITS)
    queries = [(subreddit, keyword) for subreddit in subreddits for keyword in KEYWORDS]
    client = ArcticShiftClient(timeout=90, sleep_seconds=1, max_retries=4, backoff_factor=2.0)
    coverage: dict[str, Any] = {
        "discovery_scope": (
            "daily paginated post searches over all five context terms, plus full comment trees "
            "for matched posts"
        ),
        "comment_search_included": args.include_comment_search,
        "comment_only_matches": "included via comment search" if args.include_comment_search else "not searched",
        "posts": [],
        "comments": [],
    }
    posts_by_id: dict[str, dict[str, Any]] = {}
    discovered_via: dict[str, set[str]] = {}
    comment_post_ids: set[str] = set()

    async def collect_search(
        kind: str, subreddit: str, keyword: str, interval_start: datetime, interval_end: datetime,
    ) -> dict[str, Any]:
        fields = post_fields if kind == "posts" else comment_fields
        method = client.search_posts if kind == "posts" else client.search_comments
        record: dict[str, Any] = {
            "subreddit": subreddit, "query": keyword,
            "interval": {"start": interval_start.isoformat(), "end": interval_end.isoformat(), "after": str(int(interval_start.timestamp())), "before": str(int(interval_end.timestamp()))},
            "limit_per_page": args.limit_per_query, "pages": 0, "returned": 0,
            "status": "ok", "complete": False, "pagination_truncated": False,
        }
        interval_after = record["interval"]["after"]
        before = record["interval"]["before"]
        while True:
            if args.max_pages is not None and record["pages"] >= args.max_pages:
                record["pagination_truncated"] = True
                break
            try:
                kwargs: dict[str, Any] = {
                    "subreddit": subreddit, "after": interval_after, "before": before,
                    "limit": args.limit_per_query, "sort": "desc", "fields": fields,
                }
                kwargs["query" if kind == "posts" else "body"] = keyword
                response = await asyncio.to_thread(method, **kwargs)
                rows = as_posts(response)
                await asyncio.sleep(REQUEST_DELAY_SECONDS)
            except Exception as exc:
                record.update(status="error", error=str(exc))
                break
            record["pages"] += 1
            record["returned"] += len(rows)
            for row in rows:
                if kind == "posts":
                    identifier = str(row.get("id") or json.dumps(row, sort_keys=True))
                    posts_by_id.setdefault(identifier, row)
                    discovered_via.setdefault(identifier, set()).add("post_search")
                else:
                    link_id = str(row.get("link_id") or "")
                    if link_id.startswith("t3_"):
                        link_id = link_id[3:]
                    if link_id:
                        comment_post_ids.add(link_id)
                        discovered_via.setdefault(link_id, set()).add("comment_search")
            if len(rows) < args.limit_per_query or not rows:
                record["complete"] = True
                break
            timestamps = [timestamp for row in rows if (timestamp := created_timestamp(row)) is not None]
            if not timestamps:
                record["pagination_truncated"] = True
                break
            oldest = min(timestamps)
            if oldest <= float(interval_after):
                record["complete"] = True
                break
            before = str(int(oldest) - 1)
        return record

    interval_start = start
    while interval_start < now:
        interval_end = min(interval_start + timedelta(days=1), now)
        for subreddit, keyword in queries:
            label = f"r/{subreddit}"
            kinds = ("posts", "comments") if args.include_comment_search else ("posts",)
            print(f"Searching {label} {' and '.join(kinds)} for {keyword!r} ({interval_start.date()} … {interval_end.date()}) …")
            for kind in kinds:
                coverage[kind].append(await collect_search(kind, subreddit, keyword, interval_start, interval_end))
        interval_start = interval_end
    unresolved = sorted(comment_post_ids - posts_by_id.keys())
    resolution_error: str | None = None
    if args.include_comment_search and unresolved:
        try:
            resolved = await asyncio.to_thread(client.get_posts_by_ids, ids=unresolved, fields=post_fields)
            for post in as_posts(resolved):
                identifier = str(post.get("id") or "")
                if identifier:
                    posts_by_id.setdefault(identifier, post)
        except Exception as exc:
            resolution_error = str(exc)
    print(f"Found {len(posts_by_id)} unique posts; fetching comment trees (concurrency={CONCURRENCY}) …")
    semaphore = asyncio.Semaphore(CONCURRENCY)
    trees = dict(await asyncio.gather(*(fetch_tree(client, str(post.get("id")), semaphore) for post in posts_by_id.values())))
    qualifying = [item for identifier, post in posts_by_id.items() if (item := extract(post, trees.get(str(post.get("id")), {"error": "missing id"}), discovered_via.get(identifier, set())))]
    qualifying.sort(key=lambda item: (item["post"].get("created_utc") or "", item["post"].get("id") or ""))
    fetched_at = now.isoformat()
    scope_note = (
        "Discovery uses daily paginated post searches over five context terms and full comment trees "
        "for matched posts; it is not exhaustive of comment-only matches."
    )
    if args.include_comment_search:
        scope_note = "Discovery includes daily paginated post searches and opted-in full-text comment searches over five context terms."
    artifact = {"artifact_type": "trade_link_candidates", "note": f"{scope_note} Trade-query validation is required; URL paths alone do not establish a Mercenary Warrant listing.", "fetched_at": fetched_at, "window": {"start": start.isoformat(), "end": now.isoformat()}, "query_coverage": coverage, "posts": qualifying, "summary": {"unique_posts": len(posts_by_id), "qualifying_posts": len(qualifying), "comment_errors": sum(1 for tree in trees.values() if isinstance(tree, dict) and "error" in tree), "comment_post_resolution_error": resolution_error}}
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = now.strftime("%Y-%m-%dT%H%M%SZ")
    json_path, md_path = out_dir / f"mercenary-trade-link-candidates-{stamp}.json", out_dir / f"mercenary-trade-link-candidates-{stamp}.md"
    json_path.write_text(json.dumps(artifact, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    md_path.write_text(markdown(artifact), encoding="utf-8")
    print(f"Done: {len(qualifying)} qualifying posts, {artifact['summary']['comment_errors']} comment errors")
    print(f"JSON: {json_path}\nMarkdown: {md_path}")


def main() -> None:
    started = time.monotonic()
    asyncio.run(run(parser().parse_args()))
    print(f"Elapsed: {time.monotonic() - started:.2f}s")


if __name__ == "__main__":
    main()
