import { sign, verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import type { Bindings, Variables } from "../index";

export interface JwtPayload {
  poe_account_id: string;
  display_name: string;
  exp: number;
}

export async function signJwt(
  poeAccountId: string,
  displayName: string,
  secret: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 86_400; // 24 h
  return sign({ poe_account_id: poeAccountId, display_name: displayName, exp }, secret);
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  return (await verify(token, secret, "HS256")) as unknown as JwtPayload;
}

export const requireAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) return c.json({ error: "unauthorized" }, 401);
    try {
      const payload = await verifyJwt(auth.slice(7), c.env.JWT_SECRET);
      c.set("poeAccountId", payload.poe_account_id);
      c.set("displayName", payload.display_name);
      await next();
    } catch {
      return c.json({ error: "unauthorized" }, 401);
    }
  },
);
