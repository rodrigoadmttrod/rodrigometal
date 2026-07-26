# Plano da Fase 3 — Camada pública completa (SEO-first)

## Objetivo

Construir todas as páginas públicas que o Google vai indexar e que o comprador vai usar. Ao final da fase, qualquer anúncio do banco terá uma URL permanente, com metadados corretos, dados estruturados e caminho claro até o WhatsApp do vendedor. É a fase que transforma o esqueleto atual em um marketplace navegável de ponta a ponta.

## Entregas

### 3.1 Página do anúncio — `/anuncio/[slug]`

A página mais importante do site, renderizada no servidor com ISR (`revalidate: 3600`, com `revalidatePath` disparado a cada edição do anúncio).

- **Galeria de fotos** com imagem principal grande e miniaturas clicáveis (sem lightbox complexo nesta fase — troca de imagem por clique é suficiente).
- **Bloco de negociação** fixo na coluna direita (desktop) e fixo no rodapé (mobile): preço em destaque, botão WhatsApp verde com mensagem pré-preenchida ("Olá, vi o [título] no Rodrigometal e tenho interesse"), nome do vendedor com link para a vitrine e selo Verificado quando aplicável.
- **Ficha técnica** em tabela (atributos por categoria: potência, tensão, rotação, capacidade etc., vindos do campo JSON de atributos).
- **Descrição** com quebras de linha preservadas.
- **Item vendido — conceito "prova de giro"**: página nunca sai do ar. No lugar do bloco de preço, mensagem "Este já saiu — mas este vendedor trabalha com [categoria] e costuma ter disponível", botão de contato em destaque e grade de similares logo abaixo. HTTP 200 sempre; sem `noindex`.
- **Itens similares**: mesma categoria, priorizando mesmo estado, 4 cards.
- **Registro de clique de contato**: cada clique no WhatsApp grava evento (`listing_id`, timestamp) — base para métricas do painel e para o gatilho do bot da Fase 5 ("alguém te chamou ontem, fechou negócio?").

### 3.2 Vitrine do vendedor — `/vendedor/[slug]`

- Cabeçalho com nome, cidade, selo Verificado, descrição e categorias em que atua.
- Botão WhatsApp de contato geral.
- Grade de anúncios ativos + seção "Vendidos recentemente" (prova de giro pública).

### 3.3 Categoria e busca — `/categoria/[slug]` e `/buscar`

- Listagem paginada (24 por página) com grade de 4 colunas atual.
- Filtros por estado e faixa de preço (query params, estado na URL — links compartilháveis e indexáveis).
- Ordenação: mais recentes (padrão), menor preço, maior preço.
- Busca textual em título + descrição via `LIKE`/fulltext do MySQL (suficiente nesta escala; sem serviço externo).
- Título e descrição da página por categoria, escritos à mão (não gerados), para SEO.

### 3.4 SEO técnico

- **Metadata API** por página: title no formato "Motor WEG 50 cv usado — Guarulhos/SP | Rodrigometal", description com preço e cidade, canonical.
- **JSON-LD `Product`** no anúncio (nome, imagem, preço, availability — `SoldOut` quando vendido, mantendo a página indexada) e **`LocalBusiness`** na vitrine do vendedor.
- **Open Graph / Twitter Card** com a foto principal — o link compartilhado no WhatsApp mostra foto + preço.
- **`sitemap.xml` dinâmico** (anúncios, vendedores, categorias) e **`robots.txt`**.
- **Breadcrumbs** com JSON-LD `BreadcrumbList` (Home → Categoria → Anúncio).

### 3.5 Testes

- Vitest: helpers de slug/URL canônica, montagem da mensagem de WhatsApp, lógica de similares, formatação de preço em JSON-LD.
- Verificação manual: anúncio ativo, anúncio vendido, vendedor, categoria com paginação, busca vazia.

## Fora desta fase

- Painel do vendedor completo (criar/editar anúncio com upload) — **Fase 4**
- Bot de WhatsApp e marcação assistida de vendido — **Fase 5**
- Migração de imagens para R2 e domínio próprio — junto do deploy na Vercel

## Ordem de execução e estimativa

| Etapa | Entrega | Dependência |
|---|---|---|
| 1 | Página do anúncio (ativo + vendido) + registro de clique | — |
| 2 | Vitrine do vendedor | 1 (reusa bloco de contato) |
| 3 | Categoria + busca com filtros e paginação | — |
| 4 | SEO técnico (metadata, JSON-LD, sitemap, OG) | 1–3 |
| 5 | Testes + revisão visual | 1–4 |
