/**
 * Cloudflare Pages Functions API: Categories (Sorigrim 2.0)
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    // 1. Table Sync
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        sort_order INTEGER DEFAULT 0
      )
    `).run();

    // 초기 데이터가 없을 경우 기본값 삽입
    const count = await env.DB.prepare("SELECT COUNT(*) as c FROM sg_categories").first("c");
    if (count === 0) {
      const defaults = ['AI IMAGE', 'AI VIDEO', 'PROMPT', 'AI NEWS'];
      for (const name of defaults) {
        await env.DB.prepare("INSERT INTO sg_categories (name) VALUES (?)").bind(name).run();
      }
    }

    // 2. GET: List Categories
    if (request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM sg_categories ORDER BY sort_order ASC, id ASC").all();
      return Response.json(results);
    }

    // 3. POST: Add or Update Category
    if (request.method === "POST") {
      const data = await request.json();
      if (id) {
        await env.DB.prepare("UPDATE sg_categories SET name = ? WHERE id = ?").bind(data.name, id).run();
        return Response.json({ success: true, action: 'update' });
      } else {
        await env.DB.prepare("INSERT INTO sg_categories (name) VALUES (?)").bind(data.name).run();
        return Response.json({ success: true, action: 'insert' });
      }
    }

    // 3.1 PUT: Update sort_order (New!)
    if (request.method === "PUT") {
      const { items } = await request.json(); // Array of {id, sort_order}
      for (const item of items) {
        await env.DB.prepare("UPDATE sg_categories SET sort_order = ? WHERE id = ?").bind(item.sort_order, item.id).run();
      }
      return Response.json({ success: true });
    }

    // 4. DELETE: Remove Category
    if (request.method === "DELETE") {
      if (!id) return Response.json({ error: "ID required" }, { status: 400 });
      await env.DB.prepare("DELETE FROM sg_categories WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
