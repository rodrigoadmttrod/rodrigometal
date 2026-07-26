import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPainelPublic =
    pathname === "/painel/entrar" || pathname === "/painel/cadastro";
  if (isPainelPublic) return;
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/painel/entrar", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
    return;
  }
  if (!req.auth) {
    const loginUrl = new URL("/painel/entrar", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});
export const config = {
  matcher: ["/painel/:path*", "/admin/:path*"],
};
