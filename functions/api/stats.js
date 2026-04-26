/**
 * Cloudflare Pages Functions API: Stats (Hyper-Advanced)
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    if (request.method === "POST") {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sg_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          hour INTEGER,
          ip_hash TEXT,
          userAgent TEXT,
          page TEXT,
          referrer TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Ensure 'hour' column exists (Migration)
      try { await env.DB.prepare("ALTER TABLE sg_stats ADD COLUMN hour INTEGER").run(); } catch(e) {}

      const data = await request.json();
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const ipHash = btoa(ip).slice(0, 16);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours();

      await env.DB.prepare(
        "INSERT INTO sg_stats (date, hour, ip_hash, userAgent, page, referrer) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(today, hour, ipHash, request.headers.get("user-agent"), data.page || "/", data.referrer || "").run();

      return Response.json({ success: true });
    }

    if (request.method === "GET") {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // 1. Basic Counts
      const totalViews = await env.DB.prepare("SELECT COUNT(*) as count FROM sg_stats").first();
      const todayUnique = await env.DB.prepare("SELECT COUNT(DISTINCT ip_hash) as count FROM sg_stats WHERE date = ?").bind(today).first();
      const yesterdayUnique = await env.DB.prepare("SELECT COUNT(DISTINCT ip_hash) as count FROM sg_stats WHERE date = ?").bind(yesterday).first();

      // 2. Daily Trend (14 days)
      const dailyUnique = await env.DB.prepare("SELECT date, COUNT(DISTINCT ip_hash) as count FROM sg_stats GROUP BY date ORDER BY date DESC LIMIT 14").all();

      // 3. Today's Hourly Trend
      const hourlyToday = await env.DB.prepare("SELECT hour, COUNT(*) as count FROM sg_stats WHERE date = ? GROUP BY hour ORDER BY hour ASC").bind(today).all();

      // 4. Browser & OS Stats (Parsed from UA)
      const uaRaw = await env.DB.prepare("SELECT userAgent FROM sg_stats ORDER BY id DESC LIMIT 500").all();
      const browserMap = {};
      const osMap = {};
      
      uaRaw.results.forEach(r => {
        const ua = r.userAgent || "";
        // Simple OS Detection
        let os = "Other";
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac OS")) os = "MacOS";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
        else if (ua.includes("Linux")) os = "Linux";
        osMap[os] = (osMap[os] || 0) + 1;

        // Simple Browser Detection
        let br = "Other";
        if (ua.includes("Whale")) br = "Whale";
        else if (ua.includes("Edg")) br = "Edge";
        else if (ua.includes("Chrome")) br = "Chrome";
        else if (ua.includes("Safari")) br = "Safari";
        else if (ua.includes("Firefox")) br = "Firefox";
        browserMap[br] = (browserMap[br] || 0) + 1;
      });

      // 5. Popular Content (Detailed)
      const topPagesRaw = await env.DB.prepare("SELECT page, COUNT(*) as count FROM sg_stats GROUP BY page ORDER BY count DESC LIMIT 15").all();
      const topPagesEnriched = [];
      for (const p of topPagesRaw.results) {
        let label = p.page;
        if (p.page.includes('id=')) {
          const postId = p.page.split('id=')[1]?.split('&')[0];
          const post = await env.DB.prepare("SELECT title FROM sg_posts WHERE id = ?").bind(postId).first();
          if (post) label = `[작품] ${post.title}`;
        } else if (p.page === '/' || p.page === '/index.html') label = '[메인] 홈';
        topPagesEnriched.push({ label, count: p.count });
      }

      // 6. Recent Logs (Last 30)
      const recentLogs = await env.DB.prepare("SELECT createdAt, page, referrer, ip_hash FROM sg_stats ORDER BY id DESC LIMIT 30").all();

      return Response.json({
        analytics: {
          totalViews: totalViews.count,
          todayUnique: todayUnique.count,
          yesterdayUnique: yesterdayUnique.count,
          dailyUnique: dailyUnique.results.reverse(),
          hourlyToday: hourlyToday.results,
          os: osMap,
          browsers: browserMap,
          topPages: topPagesEnriched,
          recentLogs: recentLogs.results,
          topReferrers: (await env.DB.prepare("SELECT referrer, COUNT(*) as count FROM sg_stats WHERE referrer != '' AND referrer NOT LIKE '%sorigrim.com%' GROUP BY referrer ORDER BY count DESC LIMIT 10").all()).results
        },
        storage: {
          r2: { used: (await env.BUCKET.list()).objects.reduce((s,o)=>s+o.size,0), limit: 10*1024*1024*1024 },
          d1: { posts: (await env.DB.prepare("SELECT COUNT(*) as c FROM sg_posts").first("c")), statsRows: (await env.DB.prepare("SELECT COUNT(*) as c FROM sg_stats").first("c")) }
        }
      });
    }
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  return new Response("Method not allowed", { status: 405 });
}
