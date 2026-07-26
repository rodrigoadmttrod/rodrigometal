# Estado — Ajustes visuais pós-Fase 2 (aprovados pelo usuário) — ATUALIZADO 24/07

## Contexto
- Projeto Next.js em `/home/ubuntu/rodrigometal-next` (App Router, TS, Tailwind 4, Drizzle/MySQL, Vitest).
- Dev server: porta 3001 (`nohup pnpm dev -p 3001`), preview exposto.
- Projeto Vite antigo em `/home/ubuntu/rodrigometal-marketplace` — SERÁ DESCARTADO (frontend); todo.md e docs ficam lá.
- Banco: ainda o gerenciado do Manus (DATABASE_URL em `.env.local`); migração p/ TiDB próprio quando usuário mandar connection string.

## Ajustes pedidos (ordem do usuário)
1. [x] Fotos reais no seed (27 imagens hospedadas — mapa abaixo)
2. [x] Header em 2 linhas (logo+busca+CTA / navegação), sem duplicar "Buscar" — fundo branco, logo azul+laranja
3. [x] Hero reduzido (metade), foto `/seed/galpao-industrial-hero.jpg` + overlay `bg-black/60`
4. [x] Paleta: tokens `--color-accent` / `--color-accent-dark` (laranja vivo ≈ #f97316); `--color-amber-badge` removido; azul escuro só em texto, rodapé e paginação
5. [x] Cards de categoria com foto de fundo + gradiente escuro (mapa abaixo)
6. [x] Card: SoldBadge discreto (`bg-ink/75`, canto inferior esq., sem grayscale na foto); copy "Este já saiu — mas..." já nas descrições do seed; página do item fica p/ Fase 3
7. [x] revalidate home: 300 → 3600
8. [x] Seed ampliado: 30 anúncios (31 no banco), 8 vendedores, 8 cidades (SP, MG, RS, SC, PE, PR) — executado OK
9. [x] Frontend Vite antigo silenciado: `client/src/**/*` removido do include do tsconfig do projeto antigo (arquivos mantidos como referência); health check TS sem erros

## Verificações feitas
- tsc --noEmit (Next): OK · vitest: 9/9 · curl home: 200

## Próximo passo
- Screenshots desktop/mobile da home nova; depois apresentar PLANO DA FASE 3 para aprovação (nenhum código de Fase 3 antes disso)

## Mapa categoria → foto de fundo
- equipamentos-industriais → /seed/motores-galpao-pallets.jpg
- maquinas → /seed/torno-mecanico-oficina.jpg
- sucata-metalica → /seed/sucata-patio-aco.webp

## Manter como está
- Grid 4 colunas desktop, densidade, hierarquia do card (preço destaque, título, cidade, vendedor)

## Imagens hospedadas (usar EXATAMENTE estes paths em src)
- /manus-storage/motor-weg-azul_d2ade156.jpg
- /manus-storage/motor-grande-azul_a505f8ad.jpg
- /manus-storage/motor-trifasico-instalado_018f7fd3.jpg
- /manus-storage/motor-dc-usado_0a7a9b25.jpg
- /manus-storage/motor-azul-linha_071a7f28.webp
- /manus-storage/motores-galpao-pallets_4854cbc1.jpg
- /manus-storage/motoredutor-sew-r37_0a376554.webp
- /manus-storage/motoredutor-sew-vermelho_1b423b21.jpg
- /manus-storage/redutor-gudel-4-1_70327583.jpg
- /manus-storage/redutor-gudel-usado_302b5505.jpg
- /manus-storage/redutor-industrial-grande_223b2db0.png
- /manus-storage/redutor-rosca-sem-fim-azul_5fb4e77f.jpg
- /manus-storage/bomba-centrifuga-grande_c94f884e.jpg
- /manus-storage/bomba-engrenagem-globalgear_8a17ca08.jpg
- /manus-storage/bomba-usada-pallet_ffa2e425.jpg
- /manus-storage/bombas-centrifugas-pallet_5f8d5908.jpg
- /manus-storage/bombas-instaladas-planta_0b2a276d.jpg
- /manus-storage/compressor-parafuso-usado_a4293cd8.webp
- /manus-storage/torno-harrison-azul_b3f1ccc2.jpg
- /manus-storage/torno-mecanico-oficina_c0013aff.jpg
- /manus-storage/fresadora-bridgeport_b4b6a539.jpg
- /manus-storage/fresadora-bridgeport-2_1019bf48.jpg
- /manus-storage/sucata-patio-aco_8a5db978.webp
- /manus-storage/sucata-reciclagem_de1cae56.jpg
- /manus-storage/sucata-garra-guindaste_9efdc617.jpg
- /manus-storage/galpao-industrial-hero_b280f3a2.jpg  ← hero de fundo
- /manus-storage/fabrica-interior_d32e7853.jpg  ← card categoria "Máquinas" ou hero alternativo

## Categorias (slugs reais no banco)
- equipamentos-industriais (motores, redutores, bombas, compressores)
- maquinas (tornos, fresadoras)
- sucata-metalica

## Notas técnicas
- CONFIRMADO: `/manus-storage/...` só resolve via proxy do projeto gerenciado (porta 3000 → 307 → CloudFront assinado). No Next (3001) dá 404. SOLUÇÃO adotada: gravar no seed URLs relativas `/manus-storage/...` no banco (formato definitivo, funcionará quando o site publicar dentro do ecossistema? NÃO — projeto migra p/ Vercel). Melhor solução: criar rewrite no next.config (`/manus-storage/:path*` → `https://3000-.../manus-storage/:path*`) é frágil. DECISÃO FINAL: usar imagens locais servidas pelo próprio Next: copiar as 27 fotos para `public/seed/` do projeto Next e usar `/seed/nome.jpg` no banco. Simples, funciona local e na Vercel (assets pequenos, ~4MB total). Quando R2 entrar (Fase 3+), fotos de anúncios reais irão para R2.
- Seed script: `scripts/seed.mts` (rodar com `pnpm exec tsx --env-file=.env.local scripts/seed.mts`); dedupe de categorias por vendedor já implementado; encerrar pool com `pool.end()`.
- Imagens do seed hoje: placehold.co (substituir).
