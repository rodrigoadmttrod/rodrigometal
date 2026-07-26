# Estado da Fase 3 — notas de progresso (atualizar a cada etapa)

Projeto Next.js: `/home/ubuntu/rodrigometal-next` (dev na porta 3001, `pnpm dev` já rodando).
Projeto Manus (todo.md + checkpoints): `/home/ubuntu/rodrigometal-marketplace`.
Preview exposto: https://3001-irlvhn7kl17irgigjyz01-3c2d8d14.us2.manus.computer
Regra: NUNCA publicar. Entregar etapa por etapa. Screenshots via chromium headless
(`chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --screenshot=/tmp/x.png URL`).

## Aprovação do usuário (24/07)
Fase 3 aprovada na ordem 3.1 → 3.2 → 3.3 → 3.4, com 4 ajustes:
1. Ficha técnica via tabela `listing_specs` (spec_key, value, unit) — NÃO JSON (filtro por spec depois).
2. Paginação **20 por página** (spec 6.5), não 24.
3. Rota `/categoria/[slug]/[cidade]` deve estar explícita no escopo (SEO geográfico). Decidi: entra na 3.3.
4. `contact_events` grava `seller_id` (obrigatório) + listing_id + timestamp. route.ts já faz certo.
Selo vendido em duas camadas aprovado (card discreto + página com mensagem completa).
Usuário pediu ainda: avaliar preview com fotos reais e dizer se "sensação de site velho" passou;
se ainda incomodar, atacar paleta ou tipografia especificamente.

## Etapa 3.1 — página do anúncio (CONCLUÍDA, aguardando entrega)
Arquivos novos:
- `lib/queries/listing.ts` — getListingBySlug (draft→null/404; sold/paused/expired sempre renderizam),
  getSimilarListings (mesma categoria, prioriza mesmo estado), getSellerOtherListings, incrementViewCount.
- `components/Gallery.tsx` — galeria client com miniaturas.
- `components/Breadcrumbs.tsx`.
- `app/anuncio/[slug]/page.tsx` — revalidate 900, generateMetadata (title com preço/Vendido, OG image),
  grid 3fr/2fr, ficha técnica via SpecTable (dados de listing_specs), WhatsAppButton fixedOnMobile
  com sellerId+listingId+sourcePage, bloco vendedor com link p/ /vendedor/[slug].
  Vendido: caixa laranja "Este já saiu — mas {vendedor} trabalha com {categoria} e costuma ter disponível"
  + contagem de anúncios ativos + seção "Disponíveis agora com {vendedor}" + "Similares em {categoria}".
  waMessage diferente p/ vendido ("Vocês têm outro parecido?").
- `scripts/sold-slugs.mts` — util para achar slugs vendidos.

Verificado: tsc exit 0; ativo HTTP 200 (R$ 6.800, ficha, WhatsApp); vendido HTTP 200 com copy completa
e 4 ativos do vendedor; slug inexistente → 404. Dedup aplicado: similares excluem itens já mostrados
em "Disponíveis agora com {vendedor}" (busca 4+N e filtra). Screenshots verificados (desktop/mobile/full).
9/9 testes vitest. Screenshots em /home/ubuntu/entregas/anuncio-*.png.
Slugs úteis: ativo `motor-eletrico-weg-w22-50-cv-4-polos-220-380v-usado-revisado-385aa4`;
vendido `fresadora-universal-veker-fu-2-mesa-1-325-mm-531aec`.
Pendências 3.1: screenshots desktop+mobile, atualizar todo.md, checkpoint, entregar com avaliação visual.

## Próximas etapas
- 3.2 `/vendedor/[slug]`: vitrine, ativos + "vendidos recentemente", bloco contato reusado, contatos recebidos.
- 3.3 `/categoria/[slug]`, `/categoria/[slug]/[cidade]`, `/buscar` — filtros estado/preço na URL, paginação 20 (`<a href="?p=N">`).
- 3.4 SEO: Metadata API, JSON-LD Product (SoldOut p/ vendidos), OG, sitemap dinâmico, breadcrumbs JSON-LD, testes.

## Fatos do projeto
- Schema em `lib/db/schema.ts`: users (slug, phone_e164, company_name, is_verified), categories,
  listings (status enum draft/active/sold/paused/expired, view_count, contact_count), listing_specs,
  listing_images, contact_events (seller_id NOT NULL), whatsapp_messages, magic_links, social_posts_log.
- DB atual: 31 listings, 168 specs, 31 imagens, 9 users, 0 contact_events.
- Home: revalidate 3600. Paleta: laranja `--color-accent` oklch(0.7 0.19 45); tokens brand-*/ink/line/surface.
- Componentes: ListingCard/Grid (grid xl 4 col), SpecTable, SellerCard, WhatsAppButton (sendBeacon /api/contato),
  badges (SoldBadge discreto, VerifiedBadge, ConditionBadge), Header 2 linhas, Footer.
- Testes: tests/format.test.ts, tests/site.test.ts (9 testes). Rodar: `npx vitest run` (pnpm test ficou mudo antes).
- Bot Fase 5 (futuro): gatilho "fechou negócio?" no dia seguinte a clique de contato.
