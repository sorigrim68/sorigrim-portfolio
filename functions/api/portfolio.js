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
        if (!item) return Response.json({ error: "Item not found" });

        // Fetch Next & Prev
        const next = await env.DB.prepare("SELECT id, title FROM sg_posts WHERE id > ? ORDER BY id ASC LIMIT 1").bind(id).first();
        const prev = await env.DB.prepare("SELECT id, title FROM sg_posts WHERE id < ? ORDER BY id DESC LIMIT 1").bind(id).first();

        return Response.json({ ...item, next, prev });
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

    // POST Request: Handle INSERT and UPDATE
    if (request.method === "POST") {
      const data = await request.json();

      if (id) {
        // UPDATE
        await env.DB.prepare(
          "UPDATE sg_posts SET title = ?, category = ?, image = ?, description = ?, content = ?, is_recommended = ? WHERE id = ?"
        ).bind(
          data.title, 
          data.category, 
          data.image, 
          data.description, 
          data.content || "", 
          data.is_recommended ? 1 : 0, 
          id
        ).run();
        return Response.json({ success: true, action: "update" });
      } else {
        // INSERT
        await env.DB.prepare(
          "INSERT INTO sg_posts (title, category, image, description, content, is_recommended, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          data.title, 
          data.category, 
          data.image, 
          data.description, 
          data.content || "", 
          data.is_recommended ? 1 : 0, 
          new Date().toISOString()
        ).run();
        return Response.json({ success: true, action: "insert" });
      }
    }

    // DELETE Request: Handle deletion
    if (request.method === "DELETE") {
      if (!id) return Response.json({ error: "ID required for deletion" }, { status: 400 });
      await env.DB.prepare("DELETE FROM sg_posts WHERE id = ?").bind(id).run();
      return Response.json({ success: true, action: "delete" });
    }


  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
// Version 1.0.1 - Force Sync
