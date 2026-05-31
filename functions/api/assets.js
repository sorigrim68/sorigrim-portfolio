/**
 * Cloudflare Pages Functions API: Assets (Sorigrim 1.0)
 * Proxies media from R2 bucket with List and Delete support.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');

  // 0. POST cleanup: 어떤 게시글/설정도 참조하지 않는 미사용(고아) 파일 정리
  if (request.method === "POST" && url.searchParams.get('action') === 'cleanup') {
    try {
      // (1) 참조 중인 파일명 집합 구성
      const referenced = new Set();
      const collect = (str) => {
        if (!str) return;
        const re = /name=([^"'\s&>\\]+)/g; let m;
        while ((m = re.exec(str)) !== null) {
          referenced.add(m[1]);
          try { referenced.add(decodeURIComponent(m[1])); } catch (e) {}
        }
      };

      // 게시글: content + image + attachments
      try {
        const posts = await env.DB.prepare("SELECT content, image, attachments FROM sg_posts").all();
        for (const p of (posts.results || [])) {
          collect(p.image); collect(p.content); collect(p.attachments);
          if (p.attachments) { try { const arr = JSON.parse(p.attachments); if (Array.isArray(arr)) arr.forEach(a => { if (a && a.serverName) referenced.add(a.serverName); }); } catch (e) {} }
        }
      } catch (e) {}

      // 설정: 프로필 이미지 등 settings 값 내 참조
      try {
        const settings = await env.DB.prepare("SELECT value FROM sg_settings").all();
        for (const s of (settings.results || [])) collect(s.value);
      } catch (e) {}

      // (2) R2 전체 목록과 대조하여 미참조 파일 삭제
      const list = await env.BUCKET.list();
      const deleted = [];
      for (const obj of list.objects) {
        const key = obj.key;
        let used = referenced.has(key);
        if (!used) { try { used = referenced.has(encodeURIComponent(key)); } catch (e) {} }
        if (!used) { try { used = referenced.has(decodeURIComponent(key)); } catch (e) {} }
        if (!used) {
          try { await env.BUCKET.delete(key); deleted.push(key); } catch (e) {}
        }
      }
      return Response.json({ success: true, deletedCount: deleted.length, keptCount: list.objects.length - deleted.length, deleted });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

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
