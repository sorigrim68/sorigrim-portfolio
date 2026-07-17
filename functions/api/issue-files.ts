type Env = {
  BOARD_PIN?: string
  BUCKET: R2Bucket
}

const headers = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers })

function getShareKey(request: Request) {
  const raw = new URL(request.url).searchParams.get('key')?.trim() ?? ''
  return /^[a-zA-Z0-9_-]{12,128}$/.test(raw) ? raw : ''
}

function validPin(request: Request, env: Env) {
  return request.headers.get('x-board-pin') === (env.BOARD_PIN ?? '2580')
}

function safeName(value: string) {
  return value.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 120)
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const shareKey = getShareKey(request)
  if (!shareKey || !validPin(request, env)) return json({ error: 'unauthorized' }, 401)
  const issueId = safeName(url.searchParams.get('issueId') ?? '')
  const fileName = safeName(url.searchParams.get('filename') ?? 'attachment')
  if (!issueId || !request.body) return json({ error: 'invalid_file' }, 400)

  const key = `issues/${shareKey}/${issueId}/${crypto.randomUUID()}-${fileName}`
  const type = request.headers.get('content-type') || 'application/octet-stream'
  const object = await env.BUCKET.put(key, request.body, {
    httpMetadata: { contentType: type },
    customMetadata: { originalName: fileName },
  })
  return json({ fileKey: key, name: fileName, size: object?.size ?? 0, type, url: `/api/issue-files?key=${encodeURIComponent(shareKey)}&fileKey=${encodeURIComponent(key)}` })
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const shareKey = getShareKey(request)
  if (!shareKey || !validPin(request, env)) return json({ error: 'unauthorized' }, 401)
  const fileKey = url.searchParams.get('fileKey') ?? ''
  if (!fileKey.startsWith(`issues/${shareKey}/`)) return json({ error: 'invalid_file_key' }, 400)
  const object = await env.BUCKET.get(fileKey)
  if (!object) return json({ error: 'file_not_found' }, 404)
  const responseHeaders = new Headers()
  object.writeHttpMetadata(responseHeaders)
  responseHeaders.set('cache-control', 'private, no-store')
  return new Response(object.body, { headers: responseHeaders })
}

export const onRequest: PagesFunction<Env> = () =>
  json({ error: 'method_not_allowed' }, 405)
