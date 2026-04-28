export async function checkRateLimit(
  db: D1Database,
  ip: string,
  endpoint: string,
  limit: number,
): Promise<boolean> {
  const key = `${ip}:${endpoint}`;
  const windowStart = Math.floor(Date.now() / 3_600_000) * 3_600_000;

  const result = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN window_start = ?2 THEN count + 1 ELSE 1 END,
         window_start = ?2
       RETURNING count`,
    )
    .bind(key, windowStart)
    .first<{ count: number }>();

  return (result?.count ?? 1) <= limit;
}
