/**
 * Cloudflare Pages Functions API: Site Settings (SNS & Config)
 * Supports Batch Update and Single Update.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    // Table Ensure
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        icon TEXT,
        type TEXT DEFAULT 'sns'
      )
    `).run();

    if (request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM sg_settings ORDER BY id ASC").all();
      return Response.json(results);
    }

    if (request.method === "POST") {
      const data = await request.json();
      
      // Handle Array (Batch Update)
      if (Array.isArray(data)) {
        const statements = data.map(item => 
          env.DB.prepare("INSERT INTO sg_settings (key, value, type) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, type=excluded.type")
          .bind(item.key, item.value, item.type || 'profile')
        );
        await env.DB.batch(statements);
        return Response.json({ success: true, count: data.length });
      } 
      
      // Handle Single Object
      await env.DB.prepare(
        "INSERT INTO sg_settings (key, value, icon, type) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, icon=excluded.icon, type=excluded.type"
      ).bind(data.key, data.value, data.icon || null, data.type || 'sns').run();
      
      return Response.json({ success: true });
    }

    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM sg_settings WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  return new Response("Method not allowed", { status: 405 });
}
