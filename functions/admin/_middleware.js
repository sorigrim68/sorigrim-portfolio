/**
 * Cloudflare Pages Middleware: Admin Protection (No-Loop Version)
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. 로그인 페이지 및 필수 자산(CSS, JS, 이미지)은 인증 없이 허용
  // 'login.html'이 경로에 포함되어 있으면 무조건 통과시켜 리다이렉트 루프를 방지합니다.
  if (
    path.includes("login.html") || 
    path.endsWith(".css") || 
    path.endsWith(".js") || 
    path.endsWith(".png") || 
    path.endsWith(".jpg") || 
    path.endsWith(".ico")
  ) {
    return next();
  }

  // 2. 인증 쿠키 확인
  const cookieHeader = request.headers.get("Cookie") || "";
  const isAuthorized = cookieHeader.includes("sg_auth_token=sorigrim_verified_access");

  // 3. 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthorized) {
    // 절대 경로를 사용하여 리다이렉트 위치를 명확히 합니다.
    return Response.redirect(new URL("/admin/login.html", url.origin), 302);
  }

  // 4. 인증된 경우 정상 진행
  return next();
}
