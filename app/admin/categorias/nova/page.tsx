import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink mb-6">Nova categoria</h1>
      <CategoryForm mode="create" />
    </div>
  );
}
