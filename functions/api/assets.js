/**
 * Cloudflare Pages Functions API: Assets (Sorigrim 1.0)
 * Proxies media from R2 bucket with List and Delete support.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');

  // 1. POST: Handle File Uploads (Optimized Stream)
  if (request.method === "POST") {
    try {
      const urlName = url.searchParams.get('name');
      if (!urlName) return new Response("Filename required in query (?name=...)", { status: 400 });

      // Sanitize filename
      const safeName = decodeURIComponent(urlName)
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\s+/g, '-');
      
      const fileName = `${Date.now()}-${safeName}`;
      const contentType = request.headers.get("Content-Type") || 'application/octet-stream';

      // Stream directly to R2
      await env.BUCKET.put(fileName, request.body, {
        httpMetadata: { contentType },
      });

      return Response.json({ success: true, name: fileName, url: `/api/assets?name=${fileName}` });
    } catch (e) { 
      return Response.json({ error: e.message }, { status: 500 }); 
    }
  }

  // 2. DELETE: Remove File from R2
  if (request.method === "DELETE") {
    if (!name) return new Response("Name required", { status: 400 });
    try {
      await env.BUCKET.delete(name);
      return Response.json({ success: true });
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  }

  // 3. GET: Fetch List or Single Asset
  if (!name) {
    // List all assets if no name provided
    try {
      const list = await env.BUCKET.list();
      return Response.json(list.objects.map(obj => ({
        name: obj.key,
        size: obj.size,
        uploaded: obj.uploaded
      })));
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  }

  try {
    const object = await env.BUCKET.get(name);
    if (object === null) return new Response("Object Not Found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("Timing-Allow-Origin", "*");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Vary", "Accept");
    
    return new Response(object.body, { headers });
  } catch (e) { return new Response(e.message, { status: 500 }); }
}
