/**
 * Cloudflare Pages Middleware: Admin Protection
 * Location: functions/admin/_middleware.js
 * Protects everything inside /admin/*
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 인증 쿠키 확인
  const cookieHeader = request.headers.get("Cookie") || "";
  const isAuthorized = cookieHeader.includes("sg_auth_token=sorigrim_verified_access");

  // 인증되지 않은 경우 '루트'에 있는 login.html로 이동
  // login.html이 /admin 폴더 밖에 있으므로 리다이렉트 루프가 절대 발생하지 않습니다.
  if (!isAuthorized) {
    return Response.redirect(new URL("/login.html", url.origin), 302);
  }

  // 인증된 경우 정상 진행
  return next();
}
