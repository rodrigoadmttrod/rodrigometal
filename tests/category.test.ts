import { describe, it, expect } from "vitest";
import { getCategoryBySlug, getCategoryListings, searchListings } from "@/lib/queries/category";

describe("getCategoryBySlug", () => {
  it("retorna categoria equipamentos-industriais", async () => {
    const cat = await getCategoryBySlug("equipamentos-industriais");
    expect(cat).not.toBeNull();
    expect(cat!.slug).toBe("equipamentos-industriais");
    expect(cat!.name).toBe("Equipamentos Industriais");
  });

  it("retorna null para slug inexistente", async () => {
    const cat = await getCategoryBySlug("nao-existe");
    expect(cat).toBeNull();
  });
});

describe("getCategoryListings", () => {
  it("lista anúncios ativos de equipamentos-industriais com paginação 20", async () => {
    const data = await getCategoryListings({ categorySlug: "equipamentos-industriais" });
    expect(data.category).not.toBeNull();
    expect(data.total).toBeGreaterThan(0);
    expect(data.listings.length).toBeGreaterThan(0);
    expect(data.listings.length).toBeLessThanOrEqual(20);
    expect(data.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("filtra por estado SP", async () => {
    const data = await getCategoryListings({ categorySlug: "equipamentos-industriais", state: "SP" });
    for (const l of data.listings) {
      expect(l.state).toBe("SP");
    }
  });

  it("filtra por preço máximo", async () => {
    const data = await getCategoryListings({ categorySlug: "equipamentos-industriais", maxPrice: 10000 });
    for (const l of data.listings) {
      if (l.price && !l.priceOnRequest) {
        expect(Number(l.price)).toBeLessThanOrEqual(10000);
      }
    }
  });

  it("retorna vazio para categoria inexistente", async () => {
    const data = await getCategoryListings({ categorySlug: "nao-existe" });
    expect(data.category).toBeNull();
    expect(data.listings).toEqual([]);
    expect(data.total).toBe(0);
  });
});

describe("searchListings", () => {
  it("busca por 'motor' retorna resultados", async () => {
    const data = await searchListings({ q: "motor" });
    expect(data.total).toBeGreaterThan(0);
    expect(data.listings.length).toBeGreaterThan(0);
    expect(data.listings.length).toBeLessThanOrEqual(20);
  });

  it("busca por termo inexistente retorna vazio", async () => {
    const data = await searchListings({ q: "xyzqwerty" });
    expect(data.total).toBe(0);
    expect(data.listings).toEqual([]);
  });

  it("busca com filtro de estado", async () => {
    const data = await searchListings({ q: "motor", state: "SP" });
    for (const l of data.listings) {
      expect(l.state).toBe("SP");
    }
  });
});
