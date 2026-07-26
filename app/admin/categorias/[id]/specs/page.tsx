import { db } from "@/lib/db/client";
import { categories, categorySpecs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SpecManager } from "@/components/admin/SpecManager";

export const dynamic = "force-dynamic";

export default async function CategorySpecsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!cat) notFound();

  const specs = await db
    .select()
    .from(categorySpecs)
    .where(eq(categorySpecs.categoryId, id))
    .orderBy(categorySpecs.sortOrder);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/categorias" className="text-sm text-ink-muted hover:text-ink transition-colors">
          ← Voltar para categorias
        </Link>
        <h1 className="font-heading text-2xl font-bold text-ink mt-2">
          Specs: {cat.name}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {specs.length} especificações definidas. Todas são opcionais por padrão.
        </p>
      </div>

      <SpecManager categoryId={cat.id} initialSpecs={specs} />
    </div>
  );
}
