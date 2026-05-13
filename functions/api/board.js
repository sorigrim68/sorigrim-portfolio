const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

function jsonResponse(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init?.headers,
    },
  });
}

function getKey(request) {
  const url = new URL(request.url);
  return url.searchParams.get('key')?.trim() ?? '';
}

function isValidKey(key) {
  return /^[a-zA-Z0-9_-]{12,128}$/.test(key);
}

async function ensureBoardTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS boards (
      share_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(
    'CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON boards(updated_at)',
  ).run();
}

export async function onRequest(context) {
  const { env, request } = context;
  const key = getKey(request);

  if (!isValidKey(key)) {
    return jsonResponse({ error: 'invalid_key' }, { status: 400 });
  }

  try {
    await ensureBoardTable(env);

    if (request.method === 'GET') {
      const row = await env.DB.prepare(
        'SELECT data FROM boards WHERE share_key = ?',
      )
        .bind(key)
        .first();

      if (!row) {
        const initialData = JSON.stringify({ members: [], tasks: [] });
        await env.DB.prepare(
          'INSERT INTO boards (share_key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        )
          .bind(key, initialData)
          .run();

        return jsonResponse({ members: [], tasks: [] });
      }

      return new Response(row.data, {
        headers: jsonHeaders,
      });
    }

    if (request.method === 'PUT') {
      const data = await request.json();

      if (
        !data ||
        typeof data !== 'object' ||
        !Array.isArray(data.tasks) ||
        !Array.isArray(data.members)
      ) {
        return jsonResponse({ error: 'invalid_payload' }, { status: 400 });
      }

      await env.DB.prepare(
        `INSERT INTO boards (share_key, data, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(share_key)
         DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
      )
        .bind(key, JSON.stringify(data))
        .run();

      return jsonResponse({ ok: true });
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }

  return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
}
