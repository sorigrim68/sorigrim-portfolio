/**
 * Cloudflare Pages Functions API: Stats
 * Tracks and returns visitor statistics.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // 1. Table Setup
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        ip_hash TEXT,
        userAgent TEXT,
        page TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Track Visitor (POST or simply on any GET hit to stats if called from main.js)
    if (request.method === "POST") {
      const data = await request.json();
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      // Simple hash for privacy
      const ipHash = btoa(ip).slice(0, 16);
      const today = new Date().toISOString().split('T')[0];

      await env.DB.prepare(
        "INSERT INTO sg_stats (date, ip_hash, userAgent, page) VALUES (?, ?, ?, ?)"
      ).bind(today, ipHash, request.headers.get("user-agent"), data.page || "/").run();

      return Response.json({ success: true });
    }

    // 3. GET Stats
    if (request.method === "GET") {
      // Daily Unique Visitors (Last 30 days)
      const dailyUnique = await env.DB.prepare(`
        SELECT date, COUNT(DISTINCT ip_hash) as count 
        FROM sg_stats 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 30
      `).all();

      // Total Page Views
      const totalViews = await env.DB.prepare("SELECT COUNT(*) as count FROM sg_stats").first();
      
      // Top Pages
      const topPages = await env.DB.prepare(`
        SELECT page, COUNT(*) as count 
        FROM sg_stats 
        GROUP BY page 
        ORDER BY count DESC 
        LIMIT 10
      `).all();

      return Response.json({
        dailyUnique: dailyUnique.results,
        totalViews: totalViews.count,
        topPages: topPages.results
      });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
