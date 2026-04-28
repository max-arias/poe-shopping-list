import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PublishListBodySchema } from "@poe-sl/schema";
import type { Bindings, Variables } from "../index";
import { checkRateLimit } from "../lib/rateLimit";
import { generateSlug } from "../lib/slug";

const DEV_AUTHOR_ID = "dev";
const DEV_AUTHOR_NAME = "Dev";

export const listsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const CatalogQuerySchema = z.object({
  game: z.enum(["poe1", "poe2"]),
  league: z.string().min(1).max(60),
  cursor: z.coerce.number().int().positive().optional(),
});

const PAGE_SIZE = 25;

listsRoutes.get("/", zValidator("query", CatalogQuerySchema), async (c) => {
  const { game, league, cursor } = c.req.valid("query");

  const rows = await c.env.DB.prepare(
    `SELECT l.id, l.slug, a.display_name AS author_display_name,
            l.game, l.league, l.title, l.ascendancy, l.source_url,
            l.published_at, l.updated_at
     FROM lists l
     JOIN authors a ON a.poe_account_id = l.author_poe_id
     WHERE l.deleted_at IS NULL
       AND l.game = ?1
       AND l.league = ?2
       ${cursor ? "AND l.id < ?3" : ""}
     ORDER BY l.published_at DESC
     LIMIT ${PAGE_SIZE}`,
  )
    .bind(game, league, ...(cursor ? [cursor] : []))
    .all<{
      id: number;
      slug: string;
      author_display_name: string;
      game: string;
      league: string;
      title: string;
      ascendancy: string | null;
      source_url: string | null;
      published_at: number;
      updated_at: number;
    }>();

  const results = rows.results.map((r) => ({
    id: r.id,
    slug: r.slug,
    authorDisplayName: r.author_display_name,
    game: r.game,
    league: r.league,
    title: r.title,
    ascendancy: r.ascendancy,
    sourceUrl: r.source_url,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
  }));

  const nextCursor = results.length === PAGE_SIZE ? results[results.length - 1].id : null;
  return c.json({ results, nextCursor });
});

listsRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const list = await c.env.DB.prepare(
    `SELECT l.id, l.slug, a.display_name AS author_display_name,
            l.game, l.league, l.title, l.ascendancy, l.source_url,
            l.published_at, l.updated_at
     FROM lists l
     JOIN authors a ON a.poe_account_id = l.author_poe_id
     WHERE l.slug = ?1 AND l.deleted_at IS NULL`,
  )
    .bind(slug)
    .first<{
      id: number;
      slug: string;
      author_display_name: string;
      game: string;
      league: string;
      title: string;
      ascendancy: string | null;
      source_url: string | null;
      published_at: number;
      updated_at: number;
    }>();

  if (!list) return c.json({ error: "not_found" }, 404);

  const items = await c.env.DB.prepare(
    `SELECT li.id, li.position, li.kind, li.name, li.base, li.trade_query_json,
            p.listing_url, p.picked_price_value, p.picked_price_currency,
            p.sample_min, p.sample_median, p.sample_avg, p.sample_size, p.captured_at
     FROM list_items li
     LEFT JOIN picks p ON p.id = (
       SELECT id FROM picks WHERE list_item_id = li.id ORDER BY captured_at DESC LIMIT 1
     )
     WHERE li.list_id = ?1
     ORDER BY li.position`,
  )
    .bind(list.id)
    .all<{
      id: number;
      position: number;
      kind: string;
      name: string;
      base: string | null;
      trade_query_json: string;
      listing_url: string | null;
      picked_price_value: number | null;
      picked_price_currency: string | null;
      sample_min: number | null;
      sample_median: number | null;
      sample_avg: number | null;
      sample_size: number | null;
      captured_at: number | null;
    }>();

  return c.json({
    list: {
      id: list.id,
      slug: list.slug,
      authorDisplayName: list.author_display_name,
      game: list.game,
      league: list.league,
      title: list.title,
      ascendancy: list.ascendancy,
      sourceUrl: list.source_url,
      publishedAt: list.published_at,
      updatedAt: list.updated_at,
    },
    items: items.results.map((i) => ({
      id: i.id,
      position: i.position,
      kind: i.kind,
      name: i.name,
      base: i.base,
      tradeQueryJson: JSON.parse(i.trade_query_json),
      pick:
        i.picked_price_value !== null
          ? {
              listingUrl: i.listing_url,
              pickedPriceValue: i.picked_price_value,
              pickedPriceCurrency: i.picked_price_currency,
              sampleMin: i.sample_min,
              sampleMedian: i.sample_median,
              sampleAvg: i.sample_avg,
              sampleSize: i.sample_size,
              capturedAt: i.captured_at,
            }
          : null,
    })),
  });
});

listsRoutes.post("/", zValidator("json", PublishListBodySchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkRateLimit(c.env.DB, ip, "publish", 10))) {
    return c.json({ error: "rate_limited" }, 429);
  }

  const body = c.req.valid("json");
  const authorId = DEV_AUTHOR_ID;
  const now = Date.now();

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO authors (poe_account_id, display_name, created_at) VALUES (?1, ?2, ?3)`,
  )
    .bind(DEV_AUTHOR_ID, DEV_AUTHOR_NAME, now)
    .run();
  const slug = generateSlug();

  const listRow = await c.env.DB.prepare(
    `INSERT INTO lists (slug, author_poe_id, game, league, title, ascendancy, pob_hash, source_url, published_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
     RETURNING id`,
  )
    .bind(
      slug,
      authorId,
      body.game,
      body.league,
      body.title,
      body.ascendancy ?? null,
      body.pobHash ?? null,
      body.sourceUrl ?? null,
      now,
    )
    .first<{ id: number }>();

  if (!listRow) return c.json({ error: "insert_failed" }, 500);
  const listId = listRow.id;

  if (body.items.length > 0) {
    const itemStmts = body.items.map((item) =>
      c.env.DB.prepare(
        `INSERT INTO list_items (list_id, position, kind, name, base, trade_query_json, item_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING id`,
      ).bind(
        listId,
        item.position,
        item.kind,
        item.name,
        item.base ?? null,
        JSON.stringify(item.tradeQueryJson),
        "",
      ),
    );

    const itemResults = await c.env.DB.batch<{ id: number }>(itemStmts);

    const pickStmts = body.items.flatMap((item, idx) => {
      if (!item.pick) return [];
      const itemId = itemResults[idx].results[0]?.id;
      if (!itemId) return [];
      return [
        c.env.DB.prepare(
          `INSERT INTO picks (list_item_id, listing_url, picked_price_value, picked_price_currency,
           sample_min, sample_median, sample_avg, sample_size, raw_samples_json, captured_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        ).bind(
          itemId,
          item.pick.listingUrl ?? null,
          item.pick.pickedPriceValue,
          item.pick.pickedPriceCurrency,
          item.pick.sampleMin,
          item.pick.sampleMedian,
          item.pick.sampleAvg,
          item.pick.sampleSize,
          item.pick.rawSamples ? JSON.stringify(item.pick.rawSamples) : null,
          item.pick.capturedAt,
        ),
      ];
    });

    const buildLinkStmts = (body.buildLinks ?? []).map((bl) =>
      c.env.DB.prepare(
        `INSERT INTO build_links (list_id, site, external_key, created_at) VALUES (?1, ?2, ?3, ?4)`,
      ).bind(listId, bl.site, bl.externalKey, now),
    );

    const followUps = [...pickStmts, ...buildLinkStmts];
    if (followUps.length > 0) await c.env.DB.batch(followUps);
  }

  return c.json({ slug }, 201);
});

listsRoutes.patch("/:slug", zValidator("json", PublishListBodySchema), async (c) => {
  const slug = c.req.param("slug");
  const body = c.req.valid("json");
  const authorId = DEV_AUTHOR_ID;
  const now = Date.now();

  const existing = await c.env.DB.prepare(
    `SELECT id FROM lists WHERE slug = ?1 AND author_poe_id = ?2 AND deleted_at IS NULL`,
  )
    .bind(slug, authorId)
    .first<{ id: number }>();

  if (!existing) return c.json({ error: "not_found" }, 404);
  const listId = existing.id;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE lists SET game=?2, league=?3, title=?4, ascendancy=?5, pob_hash=?6, source_url=?7, updated_at=?8
       WHERE id=?1`,
    ).bind(
      listId,
      body.game,
      body.league,
      body.title,
      body.ascendancy ?? null,
      body.pobHash ?? null,
      body.sourceUrl ?? null,
      now,
    ),
    c.env.DB.prepare(`DELETE FROM list_items WHERE list_id = ?1`).bind(listId),
    c.env.DB.prepare(`DELETE FROM build_links WHERE list_id = ?1`).bind(listId),
  ]);

  if (body.items.length > 0) {
    const itemStmts = body.items.map((item) =>
      c.env.DB.prepare(
        `INSERT INTO list_items (list_id, position, kind, name, base, trade_query_json, item_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING id`,
      ).bind(
        listId,
        item.position,
        item.kind,
        item.name,
        item.base ?? null,
        JSON.stringify(item.tradeQueryJson),
        "",
      ),
    );

    const itemResults = await c.env.DB.batch<{ id: number }>(itemStmts);

    const pickStmts = body.items.flatMap((item, idx) => {
      if (!item.pick) return [];
      const itemId = itemResults[idx].results[0]?.id;
      if (!itemId) return [];
      return [
        c.env.DB.prepare(
          `INSERT INTO picks (list_item_id, listing_url, picked_price_value, picked_price_currency,
           sample_min, sample_median, sample_avg, sample_size, raw_samples_json, captured_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        ).bind(
          itemId,
          item.pick.listingUrl ?? null,
          item.pick.pickedPriceValue,
          item.pick.pickedPriceCurrency,
          item.pick.sampleMin,
          item.pick.sampleMedian,
          item.pick.sampleAvg,
          item.pick.sampleSize,
          item.pick.rawSamples ? JSON.stringify(item.pick.rawSamples) : null,
          item.pick.capturedAt,
        ),
      ];
    });

    const buildLinkStmts = (body.buildLinks ?? []).map((bl) =>
      c.env.DB.prepare(
        `INSERT INTO build_links (list_id, site, external_key, created_at) VALUES (?1, ?2, ?3, ?4)`,
      ).bind(listId, bl.site, bl.externalKey, now),
    );

    const followUps = [...pickStmts, ...buildLinkStmts];
    if (followUps.length > 0) await c.env.DB.batch(followUps);
  }

  return c.json({ updated: true });
});

listsRoutes.delete("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const authorId = DEV_AUTHOR_ID;

  const result = await c.env.DB.prepare(
    `UPDATE lists SET deleted_at = ?3
     WHERE slug = ?1 AND author_poe_id = ?2 AND deleted_at IS NULL`,
  )
    .bind(slug, authorId, Date.now())
    .run();

  if (!result.meta.changes) return c.json({ error: "not_found" }, 404);
  return c.json({ deleted: true });
});
