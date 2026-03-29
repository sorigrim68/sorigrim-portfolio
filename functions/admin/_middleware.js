/**
 * Cloudflare Pages Middleware: Admin Protection (Robust Version)
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. 로그인 페이지와 정적 자산(CSS 등)은 통과
  if (url.pathname === "/admin/login.html" || url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    return next();
  }

  // 2. 쿠키 확인 로직 강화
  const cookieHeader = request.headers.get("Cookie") || "";
  const hasAuth = cookieHeader.includes("sg_auth_token=sorigrim_verified_access");

  // 3. 인증되지 않은 경우 로그인 페이지로 이동
  if (!hasAuth) {
    return Response.redirect(new URL("/admin/login.html", url.origin), 302);
  }

  // 4. 인증 성공
  return next();
}
