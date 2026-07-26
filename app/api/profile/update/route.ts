import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { updateProfile, updateSellerCategories } from "@/lib/queries/profile";

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

    const body = await req.json();

    // Update basic profile
    if (body.name !== undefined || body.companyName !== undefined || body.description !== undefined ||
        body.city !== undefined || body.state !== undefined || body.photoUrl !== undefined) {
      await updateProfile(user.id, {
        name: body.name,
        companyName: body.companyName,
        description: body.description,
        city: body.city,
        state: body.state,
        photoUrl: body.photoUrl,
      });
    }

    // Update categories
    if (Array.isArray(body.categoryIds)) {
      await updateSellerCategories(user.id, body.categoryIds);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
