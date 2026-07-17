type Env = {
  BOARD_PIN?: string
  DB: D1Database
}

type IssueRow = {
  data: string
  updated_at: string
}

const headers = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers })

function getKey(request: Request) {
  const raw = new URL(request.url).searchParams.get('key')?.trim() ?? ''
  return /^[a-zA-Z0-9_-]{12,128}$/.test(raw) ? `issue_${raw}` : ''
}

function validPin(request: Request, env: Env) {
  return request.headers.get('x-board-pin') === (env.BOARD_PIN ?? '2580')
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const key = getKey(request)
  if (!key) return json({ error: 'invalid_key' }, 400)
  if (!validPin(request, env)) return json({ error: 'pin_required' }, 401)

  const row = await env.DB.prepare(
    'SELECT data, updated_at FROM boards WHERE share_key = ?',
  ).bind(key).first<IssueRow>()

  if (!row) {
    const data = JSON.stringify({ items: [] })
    await env.DB.prepare(
      'INSERT INTO boards (share_key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    ).bind(key, data).run()
    return json({ items: [], updatedAt: '' })
  }

  const data = JSON.parse(row.data) as { items?: unknown[] }
  return json({ items: Array.isArray(data.items) ? data.items : [], updatedAt: row.updated_at })
}

export const onRequestPut: PagesFunction<Env> = async ({ env, request }) => {
  const key = getKey(request)
  if (!key) return json({ error: 'invalid_key' }, 400)
  if (!validPin(request, env)) return json({ error: 'pin_required' }, 401)

  const data = await request.json() as { items?: unknown[] }
  if (!Array.isArray(data.items)) return json({ error: 'invalid_payload' }, 400)

  const current = await env.DB.prepare(
    'SELECT updated_at FROM boards WHERE share_key = ?',
  ).bind(key).first<{ updated_at: string }>()
  const revision = request.headers.get('x-board-revision') ?? ''
  if (current && revision !== current.updated_at) {
    return json({ error: 'stale_revision' }, 409)
  }

  await env.DB.prepare(`INSERT INTO boards (share_key, data, updated_at)
    VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(share_key) DO UPDATE SET data = excluded.data,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`)
    .bind(key, JSON.stringify({ items: data.items })).run()

  const updated = await env.DB.prepare(
    'SELECT updated_at FROM boards WHERE share_key = ?',
  ).bind(key).first<{ updated_at: string }>()
  return json({ ok: true, updatedAt: updated?.updated_at ?? '' })
}

export const onRequest: PagesFunction<Env> = () =>
  json({ error: 'method_not_allowed' }, 405)
