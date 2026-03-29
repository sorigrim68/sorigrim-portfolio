/**
 * Cloudflare Pages Middleware: Admin Protection
 * Protects all files in /admin/*
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. 로그인 페이지 자체는 허용 (무한 루프 방지)
  if (url.pathname === "/admin/login.html") {
    return next();
  }

  // 2. 인증 쿠키 확인
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
  const authToken = cookies["sg_auth_token"];

  // 3. 토큰이 없거나 유효하지 않으면 로그인 페이지로 리다이렉트
  if (!authToken || authToken !== "sorigrim_verified_access") {
    return Response.redirect(new URL("/admin/login.html", url.origin), 302);
  }

  // 4. 인증됨 - 다음 단계로 진행
  return next();
}
