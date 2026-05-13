type Env = {
  BOARD_PIN?: string
  DB: D1Database
}

type BoardRow = {
  data: string
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
}

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init?.headers,
    },
  })
}

function getKey(request: Request) {
  const url = new URL(request.url)
  return url.searchParams.get('key')?.trim() ?? ''
}

function isValidKey(key: string) {
  return /^[a-zA-Z0-9_-]{12,128}$/.test(key)
}

function isValidPin(request: Request, env: Env) {
  const expectedPin = env.BOARD_PIN ?? '2580'
  return request.headers.get('x-board-pin') === expectedPin
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const key = getKey(request)

  if (!isValidKey(key)) {
    return jsonResponse({ error: 'invalid_key' }, { status: 400 })
  }

  if (!isValidPin(request, env)) {
    return jsonResponse({ error: 'pin_required' }, { status: 401 })
  }

  const row = await env.DB.prepare(
    'SELECT data FROM boards WHERE share_key = ?',
  )
    .bind(key)
    .first<BoardRow>()

  if (!row) {
    const initialData = JSON.stringify({ members: [], tasks: [] })
    await env.DB.prepare(
      'INSERT INTO boards (share_key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    )
      .bind(key, initialData)
      .run()

    return jsonResponse({ members: [], tasks: [] })
  }

  return new Response(row.data, {
    headers: jsonHeaders,
  })
}

export const onRequestPut: PagesFunction<Env> = async ({ env, request }) => {
  const key = getKey(request)

  if (!isValidKey(key)) {
    return jsonResponse({ error: 'invalid_key' }, { status: 400 })
  }

  if (!isValidPin(request, env)) {
    return jsonResponse({ error: 'pin_required' }, { status: 401 })
  }

  const data = await request.json()

  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray((data as { tasks?: unknown }).tasks) ||
    !Array.isArray((data as { members?: unknown }).members)
  ) {
    return jsonResponse({ error: 'invalid_payload' }, { status: 400 })
  }

  await env.DB.prepare(
    `INSERT INTO boards (share_key, data, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(share_key)
     DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(key, JSON.stringify(data))
    .run()

  return jsonResponse({ ok: true })
}

export const onRequest: PagesFunction<Env> = () =>
  jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
