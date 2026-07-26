# Plano da Fase 4 — Painel do Vendedor

## Contexto

A camada pública está completa (home, anúncio, vendedor, categoria, busca, SEO). A Fase 4 entrega o painel que permite ao vendedor cadastrar e gerenciar anúncios sem script, sem depender de credencial externa (CNPJ, WhatsApp Business API, Stripe).

## Escopo

| Rota | Função | noindex |
|---|---|---|
| `/painel` | Dashboard: lista de anúncios do vendedor com status, visualizações e contatos recebidos | sim |
| `/painel/anunciar` | Criar anúncio: fotos, ficha técnica (`listing_specs`), categoria, preço, cidade | sim |
| `/painel/anuncio/[id]/editar` | Editar, pausar, marcar como vendido | sim |
| `/painel/perfil` | Editar dados da empresa, foto, descrição, categorias que trabalha | sim |
| `/painel/entrar` | Login (e-mail + senha) | sim |
| `/painel/cadastro` | Cadastro de novo vendedor | sim |

## Etapas

### 4.1 — Autenticação (e-mail + senha)

**Stack:** `next-auth` v5 (Auth.js) com Credentials provider + `bcryptjs` para hash de senha. Sessão JWT em cookie httpOnly.

**Por que não magic link agora:** o magic link por WhatsApp depende da API do WhatsApp Business (Fase 5). E-mail/senha é a via secundária da seção 7.4 da spec e funciona hoje sem credencial externa.

**Fluxo:**
1. `/painel/cadastro` — formulário com nome, empresa, e-mail, senha, telefone (E.164), cidade, estado. Cria `users` com `passwordHash = bcrypt.hash(senha)`, `role = seller`, `slug` gerado do nome da empresa.
2. `/painel/entrar` — formulário com e-mail + senha. Auth.js Credentials valida `bcrypt.compare` e retorna o `userId`.
3. `middleware.ts` — protege `/painel/*` (exceto `/painel/entrar` e `/painel/cadastro`): redireciona para `/painel/entrar` se não houver sessão.
4. Sessão JWT contém `userId`, `role`, `companyName`. Cookie httpOnly, `sameSite: lax`, expira em 30 dias.

**Dependências a instalar:** `next-auth@beta`, `bcryptjs`, `@types/bcryptjs`.

**Schema:** a tabela `users` já tem `email` (unique) e `passwordHash` (varchar 255). Nenhuma migração necessária.

### 4.2 — Dashboard `/painel`

**Server component** que lê a sessão e busca:
- Anúncios do vendedor ordenados por `createdAt DESC` (todos os status: active, draft, sold, paused)
- Soma de `viewCount` e `contactCount` por anúncio
- Totais: anúncios ativos, pausados, vendidos, rascunhos

**Layout:** tabela responsiva com colunas: foto (thumbnail), título, status (badge colorido), preço, views, contatos, data. Botão "Anunciar grátis" em destaque. Link para editar cada item.

**Interface grande e óbvia:** botões grandes, labels claras, sem jargão. Quem entra aqui pode não ter familiaridade com formulário web.

### 4.3 — Criar anúncio `/painel/anunciar`

**Formulário (client component) com:**
- **Fotos:** upload de até 6 imagens. Cada foto vai para S3 via `storagePut()` do webdev (ou upload local para `/public/seed/` em dev). Preview com drag-to-reorder. Primeira foto = capa.
- **Título:** input texto, máx 300 chars. Gera slug automaticamente.
- **Descrição:** textarea, máx 2000 chars.
- **Categoria:** select das categorias existentes.
- **Preço:** input number + checkbox "Preço a combinar" (desabilita o input de preço).
- **Condição:** select (Novo, Usado — bom, Usado — regular, Sucata/peças).
- **Cidade + Estado:** inputs texto (estado = select de UFs).
- **Ficha técnica (`listing_specs`):** formulário dinâmico de pares chave/valor/unidade. Ex: Potência = 50 / cv; Tensão = 220/380 / V; Rotação = 1800 / RPM. Botão "adicionar especificação". Mínimo 0, máximo 15.
- **Status:** salva como `draft` por padrão. Botão "Publicar" muda para `active`.

**Ao salvar/publicar:**
- Insere em `listings`, `listing_images` (ordenadas por `sortOrder`), `listing_specs`
- `revalidatePath('/')` — home (anúncios recentes)
- `revalidatePath('/categoria/[slug]')` — categoria do anúncio
- `revalidatePath('/buscar')` — busca
- Se cidade: `revalidatePath('/categoria/[slug]/[cidade]')`

### 4.4 — Editar anúncio `/painel/anuncio/[id]/editar`

**Mesmo formulário da 4.3 pré-preenchido**, mais:
- **Ações de status:**
  - Pausar (`active` → `paused`): anúncio sai da listagem pública mas não é apagado
  - Reativar (`paused` → `active`)
  - Marcar como vendido (`active` → `sold`, grava `soldAt`): dispara `revalidatePath` do anúncio e da home
  - Excluir: `DELETE` de `listings`, `listing_images`, `listing_specs` (hard delete — confirmar com dialog)
- **Validação de posse:** só o `userId` dono do anúncio pode editar. Server-side check.
- `revalidatePath` das rotas afetadas em cada ação.

### 4.5 — Editar perfil `/painel/perfil`

**Formulário com:**
- Foto da empresa: upload single, preview circular
- Nome da empresa, nome do contato
- Descrição (textarea, máx 500 chars)
- Cidade, estado, área de atendimento
- Telefone (E.164) — com validação de formato
- E-mail
- Categorias que trabalha: checkboxes das categorias existentes → `seller_categories` (insert/delete diff)
- Slug: read-only (gerado automaticamente, não editável para preservar SEO)

**Ao salvar:** `revalidatePath('/vendedor/[slug]')` da vitrine do vendedor.

### 4.6 — Testes e verificação

- **Vitest:** testes de auth (hash/compare), queries do painel (dashboard, criar, editar, perfil), validação de posse
- **TypeScript:** `tsc --noEmit` com 0 erros
- **Screenshots:** desktop e mobile de cada tela do painel
- **Fluxo manual:** cadastro → login → criar anúncio → publicar → ver na home → editar → pausar → reativar → marcar vendido → ver tratamento na página pública

## Decisões técnicas

| Decisão | Razão |
|---|---|
| Auth.js v5 (Credentials) | Funciona sem credencial externa; magic link entra na Fase 5 |
| bcryptjs (não argon2) | Simples, sem dependência nativa, suficiente para e-mail/senha |
| Upload de fotos via S3 | `storagePut()` do webdev em produção; dev usa `/public/seed/` |
| Slug read-only no perfil | Preserva links indexados pelo Google |
| Hard delete de anúncio | Marketplace de usado — não há razão para soft delete de rascunho |
| `revalidatePath` em cada mutação | ISR funciona com invalidação sob demanda (spec 4.3) |
| Interface grande | Persona: vendedor pode não ter familiaridade com web (spec 3.3) |

## O que NÃO entra nesta fase

- Magic link por WhatsApp (Fase 5, com o bot)
- Bot de WhatsApp (Fase 5)
- Auto-post em redes sociais (Fase 6)
- Google Indexing API (Fase 6)
- ADM com 17 seções (Fase 7)
- Blog com geração automática (Fase 7)
- Stripe / monetização (Fase 8, depende de CNPJ)

## Ordem de execução

4.1 (auth) → 4.2 (dashboard) → 4.3 (criar) → 4.4 (editar) → 4.5 (perfil) → 4.6 (testes)

Uma etapa por vez, apresentando ao final de cada.
