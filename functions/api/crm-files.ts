type Env = {
  CRM_PIN?: string
  BOARD_PIN?: string
  DB: D1Database
  BUCKET: R2Bucket
}

const headers = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers })

function getShareKey(request: Request) {
  const raw = new URL(request.url).searchParams.get('key')?.trim() ?? ''
  return /^[a-zA-Z0-9_-]{12,128}$/.test(raw) ? raw : ''
}

function validPin(request: Request, env: Env) {
  return request.headers.get('x-crm-pin') === (env.CRM_PIN ?? env.BOARD_PIN ?? '2580')
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9가-힣._-]/g, '_').slice(0, 120)
}

async function authorized(request: Request, env: Env, shareKey: string) {
  if (!shareKey || !validPin(request, env)) return false
  return Boolean(await env.DB.prepare('SELECT share_key FROM boards WHERE share_key = ?').bind(`crm_${shareKey}`).first())
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const shareKey = getShareKey(request)
  if (!await authorized(request, env, shareKey)) return json({ error: 'unauthorized' }, 401)
  const companyId = safeName(url.searchParams.get('companyId') ?? '')
  const fileName = safeName(url.searchParams.get('filename') ?? 'document')
  const size = Number(request.headers.get('content-length') ?? 0)
  if (!companyId || size > 10 * 1024 * 1024) return json({ error: 'invalid_file' }, 400)

  const key = `crm/${shareKey}/${companyId}/${crypto.randomUUID()}-${fileName}`
  const bytes = await request.arrayBuffer()
  if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) return json({ error: 'invalid_file' }, 400)
  const type = request.headers.get('content-type') || 'application/octet-stream'
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type }, customMetadata: { originalName: fileName } })
  return json({ key, name: fileName, size: bytes.byteLength, type })
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const shareKey = getShareKey(request)
  if (!await authorized(request, env, shareKey)) return json({ error: 'unauthorized' }, 401)
  const fileKey = url.searchParams.get('fileKey') ?? ''
  if (!fileKey.startsWith(`crm/${shareKey}/`)) return json({ error: 'invalid_file_key' }, 400)
  await env.BUCKET.delete(fileKey)
  return json({ ok: true })
}

export const onRequest: PagesFunction<Env> = () => json({ error: 'method_not_allowed' }, 405)
