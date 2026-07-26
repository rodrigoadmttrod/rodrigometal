import { NextRequest, NextResponse } from "next/server";
import { updateListing, updateListingStatus, getListingForEdit } from "@/lib/queries/listing-form";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

    const body = await req.json();
    const { listingId, ...data } = body;

    if (!listingId) return NextResponse.json({ ok: false, error: "listingId obrigatório" }, { status: 400 });

    // Valida posse
    const existing = await getListingForEdit(listingId, user.id);
    if (!existing) return NextResponse.json({ ok: false, error: "Anúncio não encontrado" }, { status: 404 });

    if (!data.title || typeof data.title !== "string" || data.title.trim().length < 5) {
      return NextResponse.json({ ok: false, error: "Título muito curto (mínimo 5 caracteres)" }, { status: 400 });
    }

    const result = await updateListing(
      listingId,
      user.id,
      {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        categoryId: data.categoryId || undefined,
        price: data.price ? Number(data.price) : null,
        priceOnRequest: !!data.priceOnRequest,
        itemCondition: data.itemCondition || "used_good",
        city: data.city?.trim() || "",
        state: data.state?.trim().toUpperCase() || "",
        slug: data.slug?.trim() || undefined,
      },
      Array.isArray(data.images) ? data.images : [],
      Array.isArray(data.specs) ? data.specs : []
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Update listing error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao atualizar anúncio" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

    const body = await req.json();
    const { listingId, action } = body;

    if (!listingId || !action) {
      return NextResponse.json({ ok: false, error: "listingId e action obrigatórios" }, { status: 400 });
    }

    // Valida posse
    const existing = await getListingForEdit(listingId, user.id);
    if (!existing) return NextResponse.json({ ok: false, error: "Anúncio não encontrado" }, { status: 404 });

    const statusMap: Record<string, "draft" | "active" | "paused" | "sold" | "archived"> = {
      publish: "active",
      pause: "paused",
      resume: "active",
      mark_sold: "sold",
      archive: "archived",
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json({ ok: false, error: "Ação inválida" }, { status: 400 });
    }

    const result = await updateListingStatus(listingId, user.id, newStatus);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao atualizar status" }, { status: 500 });
  }
}
