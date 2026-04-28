import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Bindings, Variables } from "../index";

export const buildLinksRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const LookupQuerySchema = z.object({
  site: z.enum(["pobb", "maxroll", "poeninja", "poedb"]),
  key: z.string().min(1).max(200),
});

buildLinksRoutes.get("/lookup", zValidator("query", LookupQuerySchema), async (c) => {
  const { site, key } = c.req.valid("query");

  const row = await c.env.DB.prepare(
    `SELECT l.slug, l.title, l.game, l.league, a.display_name AS author_display_name, l.updated_at
     FROM build_links bl
     JOIN lists l ON l.id = bl.list_id
     JOIN authors a ON a.poe_account_id = l.author_poe_id
     WHERE bl.site = ?1 AND bl.external_key = ?2 AND l.deleted_at IS NULL
     ORDER BY l.updated_at DESC
     LIMIT 1`,
  )
    .bind(site, key)
    .first<{
      slug: string;
      title: string;
      game: string;
      league: string;
      author_display_name: string;
      updated_at: number;
    }>();

  if (!row) return c.json({ error: "not_found" }, 404);

  return c.json({
    slug: row.slug,
    title: row.title,
    game: row.game,
    league: row.league,
    authorDisplayName: row.author_display_name,
    updatedAt: row.updated_at,
  });
});
