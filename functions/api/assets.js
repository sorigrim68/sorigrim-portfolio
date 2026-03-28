/**
 * Cloudflare Pages Functions API: Assets (Sorigrim 1.0)
 * Proxies media from R2 bucket with Range Request support for videos.
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
  if (!name) return new Response("Asset name required", { status: 400 });

  try {
    // Handle Range Headers for Video Streaming
    const range = request.headers.get("range");
    const getOptions = range ? { range: request.headers } : {};
    
    const object = await env.BUCKET.get(name, getOptions);

    if (object === null) {
      if (name.endsWith('.mp4')) {
          return Response.redirect("https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-curves-of-light-31758-large.mp4", 302);
      }
      return new Response("Object Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");

    // Important for video playback status codes
    const status = range ? 206 : 200;

    return new Response(object.body, {
      headers,
      status
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
