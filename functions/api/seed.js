/**
 * Cloudflare Pages Functions API: Seed (Sorigrim 1.0)
 * Initializes the database with sample data and critical settings.
 */

export async function onRequest(context) {
  const { env } = context;

  try {
    // 1. Create Tables
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        image TEXT,
        content TEXT,
        description TEXT,
        is_recommended INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT DEFAULT 'sns',
        icon TEXT
      )
    `).run();

    // 2. Insert Default Hero Setting (CRITICAL FIX)
    // If not exists, set a high-quality default image from a reliable CDN
    await env.DB.prepare(`
      INSERT OR IGNORE INTO sg_settings (key, value, type)
      VALUES (?, ?, ?)
    `).bind(
      'landing_hero_video', 
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', 
      'config'
    ).run();

    return Response.json({ success: true, message: "Database seeded and critical settings ensured." });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
