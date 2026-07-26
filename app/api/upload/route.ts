import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Upload de fotos do anúncio.
 * Se R2 estiver configurado (env vars presentes), faz upload para o R2.
 * Senão (dev sem credenciais), salva localmente em /home/ubuntu/webdev-static-assets/
 * e retorna uma URL local para preview.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

    // Valida tipo
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "Tipo não permitido. Use JPG, PNG ou WebP." }, { status: 400 });
    }

    // Valida tamanho (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Arquivo muito grande. Máximo 8MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());

    // Tenta R2 primeiro
    if (isR2Configured) {
      const url = await uploadToR2(buffer, file.type, ext);
      if (url) {
        return NextResponse.json({ ok: true, url });
      }
    }

    // Fallback: salva localmente para dev
    const filename = `${randomUUID()}.${ext}`;
    const localDir = "/home/ubuntu/webdev-static-assets";
    await mkdir(localDir, { recursive: true });
    await writeFile(join(localDir, filename), buffer);

    // Retorna URL relativa que o Next dev server pode servir
    return NextResponse.json({ ok: true, url: `/dev-uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: "Erro no upload" }, { status: 500 });
  }
}
