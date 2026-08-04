import { describe, expect, it } from "vitest";
import { renderOverviewMarkdown } from "./overview-markdown";

describe("overview Markdown renderer", () => {
  it("renders restricted inline Markdown and safe HTTP links", () => {
    const html = renderOverviewMarkdown("**Strong** and *emphasis* with [a guide](https://example.com/guide).");

    expect(html).toContain("<strong>Strong</strong>");
    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain('<a href="https://example.com/guide">a guide</a>');
  });

  it("does not create a live link for javascript URLs", () => {
    const html = renderOverviewMarkdown("[unsafe](javascript:alert(1))");

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("href=");
  });

  it("does not render raw HTML", () => {
    const html = renderOverviewMarkdown('<img src="https://evil.example/x" onerror="alert(1)">safe');

    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).toContain("safe");
  });
});
