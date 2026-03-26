export async function onRequest(context) {
  const { env } = context;
  const tables = ['posts', 'sg_posts', 'sg_settings', 'settings', 'sessions'];
  for (const t of tables) { await env.DB.prepare(`DROP TABLE IF EXISTS ${t}`).run(); }
  return new Response("D1 Tables Dropped.");
}
