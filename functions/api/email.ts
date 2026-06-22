type Env = {
  CRM_PIN?: string
  BOARD_PIN?: string
  RESEND_API_KEY?: string
  CRM_FROM_EMAIL?: string
  DB: D1Database
}

const headers = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers })

function getKey(request: Request) {
  const raw = new URL(request.url).searchParams.get('key')?.trim() ?? ''
  return /^[a-zA-Z0-9_-]{12,128}$/.test(raw) ? `crm_${raw}` : ''
}

function validPin(request: Request, env: Env) {
  return request.headers.get('x-crm-pin') === (env.CRM_PIN ?? env.BOARD_PIN ?? '2580')
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char)
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const key = getKey(request)
  if (!key) return json({ error: 'invalid_key' }, 400)
  if (!validPin(request, env)) return json({ error: 'pin_required' }, 401)

  const board = await env.DB.prepare('SELECT share_key FROM boards WHERE share_key = ?').bind(key).first()
  if (!board) return json({ error: 'crm_not_found' }, 404)
  if (!env.RESEND_API_KEY) return json({ error: 'email_not_configured' }, 503)

  const payload = await request.json() as Record<string, unknown>
  const to = String(payload.to ?? '').trim()
  const subject = String(payload.subject ?? '').trim().slice(0, 180)
  const body = String(payload.body ?? '').trim().slice(0, 10000)
  if (!/^\S+@\S+\.\S+$/.test(to) || !subject || !body) return json({ error: 'invalid_payload' }, 400)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CRM_FROM_EMAIL ?? 'xconda CRM <crm@sorigrim.com>',
      to: [to],
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#172821;white-space:pre-wrap">${escapeHtml(body)}</div>`,
    }),
  })
  const result = await response.json()
  if (!response.ok) return json({ error: 'provider_error', detail: result }, 502)
  return json({ ok: true, id: (result as { id?: string }).id ?? '' })
}

export const onRequest: PagesFunction<Env> = () => json({ error: 'method_not_allowed' }, 405)
