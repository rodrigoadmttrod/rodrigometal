import { db } from "../lib/db/client";
import { categories, categorySpecs } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import dicionario from "./dicionario-categorias.json";

async function seedDicionario() {
  console.log("=== Seeding Dicionário de Categorias e Specs ===\n");

  // Buscar categorias existentes
  const existingCats = await db.select().from(categories);
  const existingBySlug = new Map(existingCats.map((c) => [c.slug, c]));
  console.log(`Categorias existentes: ${existingCats.length}`);

  // Mapear slugs antigos para novos quando necessário
  const slugRemap: Record<string, string> = {
    "redutores": "redutores-e-motorredutores",
    "maquinas": "maquinas-operatrizes",
    "ventiladores": "ventiladores-e-exaustores",
    "caldeiras": "caldeiras-vasos-tanques",
    "rolamentos": "rolamentos-transmissao",
    "equipamentos-industriais": "lotes-e-desmonte",
  };

  let catsCreated = 0;
  let catsUpdated = 0;
  let specsCreated = 0;

  for (const catData of dicionario.categorias) {
    const targetSlug = catData.slug;
    
    // Verificar se já existe (pelo slug direto ou pelo slug antigo remapeado)
    let existing = existingBySlug.get(targetSlug);
    if (!existing) {
      // Procurar por slug antigo
      for (const [oldSlug, newSlug] of Object.entries(slugRemap)) {
        if (newSlug === targetSlug) {
          existing = existingBySlug.get(oldSlug);
          if (existing) {
            // Atualizar slug da categoria existente
            await db.update(categories)
              .set({ slug: targetSlug, name: catData.nome, description: catData.descricao })
              .where(eq(categories.id, existing.id));
            console.log(`  Renomeada: ${oldSlug} → ${targetSlug} (${catData.nome})`);
            catsUpdated++;
            break;
          }
        }
      }
    }

    if (!existing) {
      // Criar nova categoria
      const newId = randomUUID();
      await db.insert(categories).values({
        id: newId,
        name: catData.nome,
        slug: targetSlug,
        description: catData.descricao,
        isActive: true,
      });
      console.log(`  Nova categoria: ${catData.nome} (${targetSlug})`);
      catsCreated++;
      existing = { id: newId, name: catData.nome, slug: targetSlug, description: catData.descricao, parentId: null, icon: null, isActive: true, createdAt: new Date() };
    } else if (!slugRemap[existing.slug]) {
      // Já existe com o slug certo — só atualizar nome/descrição se necessário
      if (existing.name !== catData.nome || existing.description !== catData.descricao) {
        await db.update(categories)
          .set({ name: catData.nome, description: catData.descricao })
          .where(eq(categories.id, existing.id));
        console.log(`  Atualizada: ${catData.nome}`);
        catsUpdated++;
      }
    }

    // Inserir specs da categoria
    const existingSpecs = await db.select().from(categorySpecs).where(eq(categorySpecs.categoryId, existing.id));
    const existingSpecKeys = new Set(existingSpecs.map((s) => s.specKey));

    for (let i = 0; i < catData.specs.length; i++) {
      const spec = catData.specs[i];
      if (existingSpecKeys.has(spec.key)) continue; // não duplicar

      await db.insert(categorySpecs).values({
        id: randomUUID(),
        categoryId: existing.id,
        specKey: spec.key,
        label: spec.label,
        unit: spec.unit || null,
        isRequired: false, // SEMPRE opcional por padrão
        sortOrder: i,
      });
      specsCreated++;
    }
    console.log(`    Specs: ${catData.specs.length} specs (${existingSpecs.length} já existiam, ${catData.specs.length - [...existingSpecKeys].filter(k => catData.specs.some(s => s.key === k)).length} novas)`);
  }

  console.log(`\n=== Resumo ===`);
  console.log(`Categorias criadas: ${catsCreated}`);
  console.log(`Categorias atualizadas: ${catsUpdated}`);
  console.log(`Specs criadas: ${specsCreated}`);

  // Verificar total
  const allCats = await db.select().from(categories);
  const allSpecs = await db.select().from(categorySpecs);
  console.log(`\nTotal no banco: ${allCats.length} categorias, ${allSpecs.length} specs`);

  process.exit(0);
}

seedDicionario().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
