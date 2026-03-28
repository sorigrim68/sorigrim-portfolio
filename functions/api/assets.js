/**
 * Cloudflare Pages Functions API: Assets (Sorigrim 1.0)
 * Proxies media from R2 bucket.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');

  // POST: Handle File Uploads to R2
  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) return new Response("No file uploaded", { status: 400 });

      const fileName = `${Date.now()}-${file.name}`;
      await env.BUCKET.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      return Response.json({ 
        success: true, 
        name: fileName, 
        url: `/api/assets?name=${fileName}` 
      });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // GET: Serve Assets from R2
  if (!name) {
    return new Response("Asset name required", { status: 400 });
  }

  try {
    const object = await env.BUCKET.get(name);

    if (object === null) {
      // Fallback to a placeholder if the object is missing in R2
      // For now, return a 404 or a reliable external placeholder if it's an image
      if (name.endsWith('.mp4')) {
          // If it's a video and missing, maybe return a static image placeholder or a known public video
          return Response.redirect("https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-curves-of-light-31758-large.mp4", 302);
      }
      return new Response("Object Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // Explicitly set content-type for videos to ensure playback
    if (name.endsWith('.mp4')) {
      headers.set("content-type", "video/mp4");
      headers.set("accept-ranges", "bytes");
    }

    return new Response(object.body, {
      headers,
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
