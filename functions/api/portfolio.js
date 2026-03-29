/**
 * Cloudflare Pages Functions API: Portfolio (Sorigrim 2.0)
 * Handles data fetching, searching, and engagement (likes/views).
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const category = url.searchParams.get('category');
  const recommended = url.searchParams.get('recommended');
  const isHeroParam = url.searchParams.get('is_hero');
  const search = url.searchParams.get('search'); // Search query
  const tag = url.searchParams.get('tag'); // Tag filter
  const adminMode = url.searchParams.get('admin') === 'true';

  try {
    // 1. Table & Migration
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
        is_hero INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        prompt TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `).run();

    // Ensure all columns exist
    const columns = ['is_hero', 'is_published', 'views', 'prompt', 'likes', 'tags'];
    for (const col of columns) {
      try { 
        if (col === 'views' || col === 'likes') {
          await env.DB.prepare(`ALTER TABLE sg_posts ADD COLUMN ${col} INTEGER DEFAULT 0`).run();
        } else if (col === 'prompt' || col === 'tags') {
          await env.DB.prepare(`ALTER TABLE sg_posts ADD COLUMN ${col} TEXT`).run();
        } else {
          await env.DB.prepare(`ALTER TABLE sg_posts ADD COLUMN ${col} INTEGER DEFAULT 1`).run(); 
        }
      } catch (e) {}
    }

    // Engagement: POST to /api/portfolio?id=X&action=like
    if (request.method === "POST" && id && url.searchParams.get('action') === 'like') {
      await env.DB.prepare("UPDATE sg_posts SET likes = likes + 1 WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

    // GET Request handling
    if (request.method === "GET") {
      if (isHeroParam === 'true') {
        const hero = await env.DB.prepare("SELECT * FROM sg_posts WHERE is_hero = 1 AND is_published = 1 ORDER BY id DESC LIMIT 1").first();
        return Response.json(hero || {});
      }

      if (id) {
        if (!adminMode) await env.DB.prepare("UPDATE sg_posts SET views = views + 1 WHERE id = ?").bind(id).run();
        const item = await env.DB.prepare("SELECT * FROM sg_posts WHERE id = ?").bind(id).first();
        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        
        const visibilityFilter = adminMode ? "" : "AND is_published = 1";
        const next = await env.DB.prepare(`SELECT id, title FROM sg_posts WHERE id > ? AND (category != 'HERO_CONFIG' OR category IS NULL) ${visibilityFilter} ORDER BY id ASC LIMIT 1`).bind(id).first();
        const prev = await env.DB.prepare(`SELECT id, title FROM sg_posts WHERE id < ? AND (category != 'HERO_CONFIG' OR category IS NULL) ${visibilityFilter} ORDER BY id DESC LIMIT 1`).bind(id).first();
        return Response.json({ ...item, next, prev });
      }

      let query = "SELECT * FROM sg_posts WHERE (category != 'HERO_CONFIG' OR category IS NULL)"; 
      let params = [];
      if (!adminMode) query += " AND is_published = 1";

      if (recommended === 'true') {
        query += " AND is_recommended = 1";
      } else if (category && category !== 'all') {
        query += " AND category = ?";
        params.push(category);
      }

      if (search) {
        query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (tag) {
        query += " AND tags LIKE ?";
        params.push(`%${tag}%`);
      }

      query += " ORDER BY id DESC";
      const { results } = await env.DB.prepare(query).bind(...params).all();
      return Response.json(results);
    }

    // POST Request: Save Post
    if (request.method === "POST") {
      const data = await request.json();
      const isHero = data.is_hero ? 1 : 0;
      const isRec = data.is_recommended ? 1 : 0;
      const isPub = data.is_published !== undefined ? (data.is_published ? 1 : 0) : 1;

      if (isHero === 1) await env.DB.prepare("UPDATE sg_posts SET is_hero = 0").run();

      if (id) {
        await env.DB.prepare(
          "UPDATE sg_posts SET title = ?, category = ?, image = ?, description = ?, content = ?, is_recommended = ?, is_hero = ?, is_published = ?, prompt = ?, tags = ? WHERE id = ?"
        ).bind(
          data.title, data.category, data.image, data.description, data.content || "", isRec, isHero, isPub, data.prompt || "", data.tags || "", id
        ).run();
        return Response.json({ success: true, action: "update" });
      } else {
        await env.DB.prepare(
          "INSERT INTO sg_posts (title, category, image, description, content, is_recommended, is_hero, is_published, prompt, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          data.title, data.category, data.image, data.description, data.content || "", isRec, isHero, isPub, data.prompt || "", data.tags || "", new Date().toISOString()
        ).run();
        return Response.json({ success: true, action: "insert" });
      }
    }

    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM sg_posts WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
  return new Response("Method not allowed", { status: 405 });
}
