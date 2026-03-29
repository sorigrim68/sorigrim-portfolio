/**
 * Cloudflare Pages Functions API: Admin Auth (Robust Version)
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { password } = await request.json();

    // 1. 필수 테이블 존재 확인 (없으면 생성)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sg_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        icon TEXT,
        type TEXT
      )
    `).run();

    // 2. 비밀번호 조회
    const adminPassSetting = await env.DB.prepare("SELECT value FROM sg_settings WHERE key = 'admin_password'").first();
    const correctPassword = adminPassSetting ? adminPassSetting.value : "1234";

    if (password === correctPassword) {
      // 3. 성공: 쿠키 설정 (Path=/ 설정으로 /admin/* 하위 모든 경로 적용)
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
    console.error("Auth Error:", e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
