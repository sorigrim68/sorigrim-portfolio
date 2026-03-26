/**
 * Cloudflare Pages Functions API: Portfolio (Sorigrim 1.0)
 * Handles data fetching from D1 database.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const category = url.searchParams.get('category');
  const recommended = url.searchParams.get('recommended');

  try {
    // 1. Database Table Sync
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

    // GET Request handling
    if (request.method === "GET") {
      if (id) {
        const item = await env.DB.prepare("SELECT * FROM sg_posts WHERE id = ?").bind(id).first();
        return Response.json(item || { error: "Item not found" });
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

    // POST/DELETE: Simple handling for initial population
    if (request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        "INSERT INTO sg_posts (title, category, image, description, is_recommended, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(data.title, data.category, data.image, data.description, data.is_recommended ? 1 : 0, new Date().toISOString()).run();
      return Response.json({ success: true });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
// Version 1.0.1 - Force Sync
