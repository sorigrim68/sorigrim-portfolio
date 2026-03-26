/**
 * Cloudflare Pages Functions API: Portfolio (Sorigrim 5.0)
 * Logic: Simplified, Robust, No Auth for this phase.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const category = url.searchParams.get('category');
  const recommended = url.searchParams.get('recommended');

  try {
    // 1. Ensure Table Exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        image TEXT,
        video_url TEXT,
        description TEXT,
        content TEXT,
        tags TEXT,
        is_recommended INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `).run();

    // GET: Fetch
    if (request.method === "GET") {
      if (id) {
        const item = await env.DB.prepare("SELECT * FROM sg_posts WHERE id = ?").bind(id).first();
        return Response.json(item || { error: "Not found" });
      }

      let query = "SELECT * FROM sg_posts";
      let params = [];
      if (recommended === 'true') {
        query += " WHERE is_recommended = 1";
      } else if (category && category !== 'all') {
        query += " WHERE category = ?";
        params.push(category);
      }
      query += " ORDER BY id DESC";

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return Response.json(results);
    }

    // POST: Create (Open for Initial Setup)
    if (request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        "INSERT INTO sg_posts (title, category, image, description, is_recommended, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(data.title, data.category, data.image, data.description, data.is_recommended ? 1 : 0, new Date().toISOString()).run();
      return Response.json({ success: true });
    }

    // DELETE
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM sg_posts WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
