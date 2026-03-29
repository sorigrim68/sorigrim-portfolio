/**
 * Cloudflare Pages Functions API: Stats
 * Tracks visitor statistics and provides Storage (R2/D1) usage info.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // --- 1. Visitor Stats Tracking (POST) ---
    if (request.method === "POST") {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sg_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          ip_hash TEXT,
          userAgent TEXT,
          page TEXT,
          referrer TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const data = await request.json();
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const ipHash = btoa(ip).slice(0, 16);
      const today = new Date().toISOString().split('T')[0];

      await env.DB.prepare(
        "INSERT INTO sg_stats (date, ip_hash, userAgent, page, referrer) VALUES (?, ?, ?, ?, ?)"
      ).bind(today, ipHash, request.headers.get("user-agent"), data.page || "/", data.referrer || "").run();

      return Response.json({ success: true });
    }

    // --- 2. GET Stats & Storage Usage ---
    if (request.method === "GET") {
      // A. Visitor Analytics
      const dailyUnique = await env.DB.prepare("SELECT date, COUNT(DISTINCT ip_hash) as count FROM sg_stats GROUP BY date ORDER BY date DESC LIMIT 30").all();
      const totalViews = await env.DB.prepare("SELECT COUNT(*) as count FROM sg_stats").first();
      const topPages = await env.DB.prepare("SELECT page, COUNT(*) as count FROM sg_stats GROUP BY page ORDER BY count DESC LIMIT 10").all();
      const topReferrers = await env.DB.prepare("SELECT referrer, COUNT(*) as count FROM sg_stats WHERE referrer != '' AND referrer NOT LIKE '%sorigrim.com%' GROUP BY referrer ORDER BY count DESC LIMIT 10").all();

      // B. Storage Usage (R2)
      // Note: Iterating all objects might be slow if there are thousands, but for portfolio it's fine.
      const r2List = await env.BUCKET.list();
      let r2TotalSize = 0;
      r2List.objects.forEach(obj => r2TotalSize += obj.size);
      const r2Count = r2List.objects.length;

      // C. Database Metrics (D1 Row Counts as proxy for size)
      const postCount = await env.DB.prepare("SELECT COUNT(*) as c FROM sg_posts").first("c") || 0;
      const catCount = await env.DB.prepare("SELECT COUNT(*) as c FROM sg_categories").first("c") || 0;
      const statsRowCount = await env.DB.prepare("SELECT COUNT(*) as c FROM sg_stats").first("c") || 0;

      return Response.json({
        analytics: {
          dailyUnique: dailyUnique.results,
          totalViews: totalViews.count,
          topPages: topPages.results,
          topReferrers: topReferrers.results
        },
        storage: {
          r2: {
            used: r2TotalSize,
            limit: 10 * 1024 * 1024 * 1024, // 10GB Free Tier Limit
            count: r2Count
          },
          d1: {
            posts: postCount,
            categories: catCount,
            statsRows: statsRowCount,
            limit: 5 * 1024 * 1024 * 1024 // 5GB D1 Limit
          }
        }
      });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return new Response("Method not allowed", { status: 405 });
}
