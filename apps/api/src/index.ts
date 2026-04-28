import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { listsRoutes } from "./routes/lists";
import { buildLinksRoutes } from "./routes/buildLinks";

export interface Bindings {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_JWT_SECRET: string;
  POE_CLIENT_ID: string;
  POE_CLIENT_SECRET: string;
  WEBSITE_URL: string;
}

export interface Variables {
  poeAccountId: string;
  displayName: string;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const website = c.env?.WEBSITE_URL ?? "http://localhost:4321";
      const allowed = [website, "chrome-extension://"];
      return allowed.some((p) => origin.startsWith(p)) ? origin : website;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.route("/auth", authRoutes);
app.route("/lists", listsRoutes);
app.route("/build-links", buildLinksRoutes);

app.get("/health", (c) => c.json({ ok: true }));

export default app;
