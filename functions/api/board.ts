type Env = {
  BOARD_PIN?: string
  DB: D1Database
}

type BoardRow = {
  data: string
  updated_at: string
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

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidDateInput(value: unknown) {
  if (!value || typeof value !== 'string') return false

  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

function normalizeDateInput(value: unknown, fallback: unknown) {
  if (isValidDateInput(value)) return value as string
  if (isValidDateInput(fallback)) return fallback as string
  return toDateInputValue(new Date())
}

function normalizeBoardData(data: { members: unknown[]; tasks: unknown[] }) {
  const tasks = data.tasks.map((task) => {
    if (!task || typeof task !== 'object') return task

    const record = task as Record<string, unknown>
    const startDate = normalizeDateInput(record.startDate, record.dueDate)
    const dueDate = normalizeDateInput(record.dueDate, startDate)

    return {
      ...record,
      dueDate,
      startDate,
    }
  })

  return {
    ...data,
    tasks,
  }
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
    'SELECT data, updated_at FROM boards WHERE share_key = ?',
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

    return jsonResponse({ members: [], tasks: [], updatedAt: '' })
  }

  const data = JSON.parse(row.data) as { members: unknown[]; tasks: unknown[] }
  return jsonResponse({ ...normalizeBoardData(data), updatedAt: row.updated_at })
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

  const currentRow = await env.DB.prepare(
    'SELECT updated_at FROM boards WHERE share_key = ?',
  )
    .bind(key)
    .first<{ updated_at: string }>()

  if (currentRow) {
    const clientRevision = request.headers.get('x-board-revision') ?? ''
    if (!clientRevision || clientRevision !== currentRow.updated_at) {
      return jsonResponse({ error: 'stale_board_revision' }, { status: 409 })
    }
  }

  const normalizedData = normalizeBoardData(data as { members: unknown[]; tasks: unknown[] })

  await env.DB.prepare(
    `INSERT INTO boards (share_key, data, updated_at)
     VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(share_key)
     DO UPDATE SET data = excluded.data,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  )
    .bind(key, JSON.stringify(normalizedData))
    .run()

  const updatedRow = await env.DB.prepare(
    'SELECT updated_at FROM boards WHERE share_key = ?',
  )
    .bind(key)
    .first<{ updated_at: string }>()

  return jsonResponse({ ok: true, updatedAt: updatedRow?.updated_at ?? '' })
}

export const onRequest: PagesFunction<Env> = () =>
  jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
