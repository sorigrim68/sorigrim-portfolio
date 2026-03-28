/**
 * Cloudflare Pages Functions: Dynamic sitemap.xml
 */

export async function onRequest(context) {
  const { env } = context;
  const baseUrl = "https://sorigrim.com";

  // 1. Fetch all posts for URLs
  const { results } = await env.DB.prepare("SELECT id, createdAt FROM sg_posts ORDER BY id DESC").all();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/portfolio/</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  ${results.map(post => `
  <url>
    <loc>${baseUrl}/portfolio/detail.html?id=${post.id}</loc>
    <lastmod>${post.createdAt ? post.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
