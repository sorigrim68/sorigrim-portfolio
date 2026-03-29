/**
 * Cloudflare Pages Functions API: Admin Auth
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { password } = await request.json();

    // DB에서 관리자 비밀번호 조회 (기본값 1234)
    const adminPassSetting = await env.DB.prepare("SELECT value FROM sg_settings WHERE key = 'admin_password'").first();
    const correctPassword = adminPassSetting ? adminPassSetting.value : "1234";

    if (password === correctPassword) {
      // 인증 성공: 7일간 유지되는 쿠키 발급
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `sg_auth_token=sorigrim_verified_access; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`
        }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: "비밀번호가 올바르지 않습니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
