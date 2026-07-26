import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/queries/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, companyName, email, password, phone, city, state } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ ok: false, error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }

    const result = await createUser({ name, companyName, email, password, phone, city, state });

    if (!result.ok) {
      const status = result.code === "PHONE_EXISTS" ? 409 : 409;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }
}
