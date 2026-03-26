/**
 * Cloudflare Pages Functions API: Site Settings (SNS & Config)
 * Path: /api/settings
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    // Ensure Settings Table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'sns'
      )
    `).run();

    // GET: Fetch all settings
    if (request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM sg_settings ORDER BY id ASC").all();
      return Response.json(results);
    }

    // POST: Add or Update
    if (request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        "INSERT INTO sg_settings (key, value, type) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
      ).bind(data.key, data.value, data.type || 'sns').run();
      return Response.json({ success: true });
    }

    // DELETE: Remove setting
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM sg_settings WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
