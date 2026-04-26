/**
 * Cloudflare Pages Functions API: Stats (Advanced)
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
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // A. Detailed Analytics
      const dailyUnique = await env.DB.prepare("SELECT date, COUNT(DISTINCT ip_hash) as count FROM sg_stats GROUP BY date ORDER BY date DESC LIMIT 14").all();
      const totalViews = await env.DB.prepare("SELECT COUNT(*) as count FROM sg_stats").first();
      
      const todayUnique = await env.DB.prepare("SELECT COUNT(DISTINCT ip_hash) as count FROM sg_stats WHERE date = ?").bind(today).first();
      const yesterdayUnique = await env.DB.prepare("SELECT COUNT(DISTINCT ip_hash) as count FROM sg_stats WHERE date = ?").bind(yesterday).first();
      
      // B. Popular Pages with Titles
      const topPagesRaw = await env.DB.prepare(`
        SELECT page, COUNT(*) as count FROM sg_stats GROUP BY page ORDER BY count DESC LIMIT 15
      `).all();

      const topPagesEnriched = [];
      for (const p of topPagesRaw.results) {
        let label = p.page;
        if (p.page.includes('/portfolio/detail.html?id=')) {
          const postId = p.page.split('id=')[1];
          if (postId) {
            const post = await env.DB.prepare("SELECT title FROM sg_posts WHERE id = ?").bind(postId).first();
            if (post) label = `[작품] ${post.title}`;
          }
        } else if (p.page === '/' || p.page === '/index.html') { label = '[메인] 홈 페이지'; }
        else if (p.page.includes('/portfolio/')) { label = '[목록] 아카이브'; }
        else if (p.page.includes('about.html')) { label = '[소개] About'; }
        topPagesEnriched.push({ page: label, count: p.count, rawPath: p.page });
      }

      const topReferrers = await env.DB.prepare(`
        SELECT referrer, COUNT(*) as count FROM sg_stats WHERE referrer != '' AND referrer NOT LIKE '%sorigrim.com%' GROUP BY referrer ORDER BY count DESC LIMIT 10
      `).all();

      // C. Storage Usage
      const r2List = await env.BUCKET.list();
      let r2TotalSize = 0;
      r2List.objects.forEach(obj => r2TotalSize += obj.size);

      return Response.json({
        analytics: {
          dailyUnique: dailyUnique.results.reverse(), // For chart chronological order
          totalViews: totalViews.count,
          todayUnique: todayUnique.count,
          yesterdayUnique: yesterdayUnique.count,
          topPages: topPagesEnriched,
          topReferrers: topReferrers.results
        },
        storage: {
          r2: { used: r2TotalSize, limit: 10 * 1024 * 1024 * 1024, count: r2List.objects.length },
          d1: { 
            posts: await env.DB.prepare("SELECT COUNT(*) as c FROM sg_posts").first("c") || 0,
            categories: await env.DB.prepare("SELECT COUNT(*) as c FROM sg_categories").first("c") || 0,
            statsRows: await env.DB.prepare("SELECT COUNT(*) as c FROM sg_stats").first("c") || 0
          }
        }
      });
    }
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  return new Response("Method not allowed", { status: 405 });
}
