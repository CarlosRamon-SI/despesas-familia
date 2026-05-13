# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (porta 3000)
npm run build        # Build de produção
npm test             # Vitest em modo watch
npm run test:run     # Vitest uma vez (CI)
npm run lint         # ESLint

npm run whatsapp     # Inicia cliente WhatsApp standalone (gera QR Code)

npm run db:migrate   # Roda migrations Prisma
npm run db:seed      # Popula categorias fixas
npm run db:generate  # Regenera Prisma Client
npm run db:studio    # Abre Prisma Studio (UI do banco)
```

Para rodar um teste específico:
```bash
npx vitest run lib/whatsapp/parser.test.ts
```

## Arquitetura

### Stack
- **Next.js 16** (App Router) — frontend + API routes + Server Actions
- **PostgreSQL + Prisma** — banco de dados
- **whatsapp-web.js** — cliente WhatsApp (Puppeteer/Chromium)
- **Vitest + Testing Library** — testes

### Estrutura principal

```
lib/
  prisma.ts              # Singleton do PrismaClient
  whatsapp/
    parser.ts            # Parsing de mensagens (puro, testável)
    parser.test.ts       # Testes TDD do parser
    responses.ts         # Formatação das respostas para o WhatsApp
    handler.ts           # Orquestra parser → DB → resposta
    client.ts            # Inicialização do cliente wwebjs
prisma/
  schema.prisma          # Models: User, Category, Expense
  seed.ts                # Popula categorias fixas domésticas
scripts/
  whatsapp.ts            # Entrypoint standalone do bot WhatsApp
app/                     # Next.js App Router (dashboard web)
```

### Fluxo WhatsApp
`client.ts` (evento `message`) → `handler.ts` → `parser.ts` (identifica comando) → operação no banco via Prisma → `responses.ts` (formata resposta) → `message.reply()`

O cliente WhatsApp roda como processo **separado** do Next.js (`npm run whatsapp`). Em produção na Oracle Cloud, ambos são gerenciados via PM2.

### Módulo parser (TDD)
`lib/whatsapp/parser.ts` é intencionalmente puro (sem I/O): recebe string, devolve `ParsedCommand`. Os testes cobrem todos os padrões de mensagem. Ao adicionar novos padrões de frase, adicione o teste primeiro.

### Categorias
Fixas, definidas em `prisma/seed.ts`. Cada categoria tem `keywords[]` usados por `guessCategory()` para inferir a categoria automaticamente da descrição da despesa.

### Deploy (Oracle Cloud Free Tier — Ubuntu ARM)
O Puppeteer/Chromium precisa de dependências extras no ARM:
```bash
sudo apt install -y chromium-browser
```
E configurar `executablePath: '/usr/bin/chromium-browser'` no cliente wwebjs.
Usar PM2 para gerenciar os dois processos (Next.js + WhatsApp).
