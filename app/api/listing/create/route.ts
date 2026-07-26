import { NextRequest, NextResponse } from "next/server";
import { createListing } from "@/lib/queries/listing-form";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

    const body = await req.json();

    // Validações básicas
    if (!body.title || typeof body.title !== "string" || body.title.trim().length < 5) {
      return NextResponse.json({ ok: false, error: "Título muito curto (mínimo 5 caracteres)" }, { status: 400 });
    }
    if (!body.city || !body.state) {
      return NextResponse.json({ ok: false, error: "Cidade e estado são obrigatórios" }, { status: 400 });
    }

    const result = await createListing(
      user.id,
      {
        title: body.title.trim(),
        description: body.description?.trim() || undefined,
        categoryId: body.categoryId || undefined,
        price: body.price ? Number(body.price) : null,
        priceOnRequest: !!body.priceOnRequest,
        itemCondition: body.itemCondition || "used_good",
        city: body.city.trim(),
        state: body.state.trim().toUpperCase(),
        slug: body.slug?.trim() || undefined,
        status: body.publish ? "active" : "draft",
      },
      Array.isArray(body.images) ? body.images : [],
      Array.isArray(body.specs) ? body.specs : []
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Create listing error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao criar anúncio" }, { status: 500 });
  }
}
