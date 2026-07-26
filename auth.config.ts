import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe (sem imports de db) — usada no middleware para validação JWT.
 * A configuração completa com Credentials provider fica em lib/auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/painel/entrar",
  },
  providers: [], // preenchido em lib/auth.ts
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/painel/entrar" || pathname === "/painel/cadastro";
      if (isPublic) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
