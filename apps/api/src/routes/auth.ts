import { Hono } from "hono";
import type { Bindings, Variables } from "../index";
import { signJwt } from "../lib/jwt";
import { checkRateLimit } from "../lib/rateLimit";

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

authRoutes.get("/callback", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkRateLimit(c.env.DB, ip, "auth", 20))) {
    return c.json({ error: "rate_limited" }, 429);
  }

  const { code, state: codeVerifier } = c.req.query();
  if (!code || !codeVerifier) return c.json({ error: "bad_request" }, 400);

  // Exchange code for access token
  const redirectUri = new URL("/auth/callback", new URL(c.req.url).origin).href;
  const tokenRes = await fetch("https://www.pathofexile.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.env.POE_CLIENT_ID,
      client_secret: c.env.POE_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) return c.json({ error: "oauth_failed" }, 502);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Fetch PoE account profile
  const profileRes = await fetch("https://www.pathofexile.com/api/profile", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) return c.json({ error: "profile_failed" }, 502);
  const { uuid, name } = (await profileRes.json()) as { uuid: string; name: string };

  // Upsert author
  await c.env.DB.prepare(
    `INSERT INTO authors (poe_account_id, display_name, created_at) VALUES (?1, ?2, ?3)
     ON CONFLICT (poe_account_id) DO UPDATE SET display_name = ?2`,
  )
    .bind(uuid, name, Date.now())
    .run();

  const token = await signJwt(uuid, name, c.env.JWT_SECRET);
  return c.redirect(`${c.env.WEBSITE_URL}/auth/success?token=${token}`, 302);
});
