/**
 * Initial Seed for Sorigrim 1.0
 */

export async function onRequest(context) {
  const { env } = context;

  const news = [
    ['OpenAI Sora: The Future of Video', 'AI NEWS', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', 'Exploring Sora model.', '<h2>Next-gen Video AI</h2>', 1],
    ['Claude 3.5 Sonnet Release', 'AI NEWS', 'https://images.unsplash.com/photo-1677442136019-21780ecad995', 'Benchmark king.', '<h2>Logical reasoning at its best</h2>', 1],
    ['Midjourney v6.1 Artifacts', 'PHOTO WORK', 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e', 'Stunning details.', '<h2>The art of prompts</h2>', 1],
    ['Google DeepMind Agent', 'AI NEWS', 'https://images.unsplash.com/photo-1675271591211-126ad94e495d', 'Visual understanding.', '<h2>AI with eyes</h2>', 1],
    ['Apple Intelligence Arrival', 'AI NEWS', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7', 'Privacy focused.', '<h2>Siri reinvented</h2>', 1]
  ];

  try {
    // 1. Clear existing (to ensure 1.0 feel)
    await env.DB.prepare("DELETE FROM sg_posts").run();

    // 2. Insert
    for (const n of news) {
      await env.DB.prepare(
        "INSERT INTO sg_posts (title, category, image, description, content, is_recommended, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(n[0], n[1], n[2], n[3], n[4], n[5], new Date().toISOString()).run();
    }

    return new Response("Sorigrim 1.0 Seeded.");
  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
