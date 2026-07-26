import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Middleware com validação JWT real via Auth.js authorized callback.
 * O authConfig.callbacks.authorized verifica se auth.user existe (sessão válida).
 * Não importa db — edge-safe.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Painel público (login e cadastro)
  const isPainelPublic =
    pathname === "/painel/entrar" || pathname === "/painel/cadastro";
  if (isPainelPublic) return;

  // Rotas /admin/* exigem login (role check fica no admin layout server-side)
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/painel/entrar", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
    return;
  }

  // Rotas /painel/* protegidas (qualquer usuário logado)
  if (!req.auth) {
    const loginUrl = new URL("/painel/entrar", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/painel/:path*", "/admin/:path*"],
};
