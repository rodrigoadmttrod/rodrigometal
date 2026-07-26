import { describe, it, expect } from "vitest";
import { getSellerBySlug, getAllSellerSlugs } from "@/lib/queries/seller";

describe("getSellerBySlug", () => {
  it("retorna vendedor usinagem-campinas com anúncios ativos e vendidos", async () => {
    const data = await getSellerBySlug("usinagem-campinas");
    expect(data).not.toBeNull();
    expect(data!.seller.companyName).toContain("Rocha");
    expect(data!.active.length).toBeGreaterThan(0);
    expect(data!.sold.length).toBeGreaterThan(0);
    expect(data!.contactCount).toBeGreaterThanOrEqual(0);
    expect(data!.categories.length).toBeGreaterThan(0);
  });

  it("retorna null para slug inexistente", async () => {
    const data = await getSellerBySlug("nao-existe");
    expect(data).toBeNull();
  });

  it("cada anúncio ativo tem coverUrl", async () => {
    const data = await getSellerBySlug("usinagem-campinas");
    for (const l of data!.active) {
      expect(l.coverUrl).not.toBeNull();
    }
  });
});

describe("getAllSellerSlugs", () => {
  it("retorna lista de slugs de vendedores com anúncios", async () => {
    const slugs = await getAllSellerSlugs();
    expect(slugs.length).toBeGreaterThanOrEqual(7);
    expect(slugs).toContain("usinagem-campinas");
    expect(slugs).toContain("motores-nordeste");
  });
});
