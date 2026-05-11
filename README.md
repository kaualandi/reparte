# Reparte

PWA para dois usuários que escaneia QR Codes de cupons fiscais (NFC-e),
lista os itens e divide a conta — cada item pode ser meu, do meu irmão ou
compartilhado meio a meio.

## Stack

- **Bun** + **Turborepo** + **Bun Workspaces**
- **apps/api** — Elysia + Drizzle + PostgreSQL (schema `reparte`)
- **apps/web** — Vue 3 + Vite + Pinia + Nuxt UI + PWA + `@zxing/browser`
- **packages/types** — tipos TypeScript compartilhados (`@reparte/types`)

A API depende de um serviço Elysia externo (o scraper de NFC-e), que recebe
a URL do QR Code e devolve os itens estruturados.

## Estrutura

```
reparte/
├── apps/
│   ├── web/                  # PWA
│   └── api/                  # API HTTP
├── packages/
│   └── types/                # tipos compartilhados
├── package.json              # workspaces root
└── turbo.json
```

## Pré-requisitos

- Bun >= 1.1
- PostgreSQL acessível (local ou remoto)
- Serviço de scraping rodando e respondendo em `SCRAPER_URL`

## Setup

```bash
# 1) instalar dependências
bun install

# 2) variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# edite apps/api/.env com DATABASE_URL, SCRAPER_URL, JWT_SECRET e PORT

# 3) migrar o banco (cria o schema `reparte` e suas tabelas)
cd apps/api
bun run db:generate       # gera SQL a partir do schema Drizzle (uma vez)
bun run db:migrate        # aplica migrations
cd ../..

# 4) gerar os dois tokens estáticos (rodar uma vez)
bun --cwd apps/api run tokens:generate
# copie cada token para o dispositivo correspondente

# 5) subir tudo em dev
bun run dev
```

A API sobe em `http://localhost:3002` (Swagger UI em `/docs`).
O PWA sobe em `http://localhost:5173`.

## Scripts no root

```bash
bun run dev          # web + api em paralelo (Turborepo)
bun run build        # build de todos os apps
bun run typecheck    # tsc --noEmit em todos os pacotes
```

## Autenticação

Dois tokens JWT estáticos gerados uma vez via `bun run tokens:generate`.
Não há tela de login, não há refresh: o PWA pede o token na primeira
abertura e o guarda no `localStorage`. Toda requisição usa
`Authorization: Bearer <token>`.

## Câmera

`@zxing/browser` precisa de `getUserMedia`, que só funciona em **HTTPS**
ou em `localhost`. Em produção, sirva o PWA via HTTPS (Vercel já faz isso
por padrão).

## Deploy

- **API** — empacotar com `bun build` e rodar na EC2 com `pm2 start`
  apontando para o entry compilado (ou `bun run src/index.ts` direto).
  Garanta que `SCRAPER_URL` aponta para o serviço de scraping interno
  na mesma instância.
- **Web** — Vercel com preset Vite. Definir `VITE_API_URL` apontando
  para a URL pública da API.

## Adicionar um novo estado ao scraper

O scraper de NFC-e mora em outro repositório / serviço Elysia. Para
incluir um novo estado (ex.: SP), implemente o parser correspondente lá
e exponha-o no endpoint `/nfe/scan`. O Reparte não precisa de mudanças
desde que o JSON retornado siga o contrato em
`packages/types/src/index.ts` (`NFeData`).

## O que NÃO fazer no código

- Sem Options API no Vue (apenas Composition API com `<script setup>`).
- Sem Vuex (apenas Pinia).
- Sem `any` em nenhum dos pacotes.
- Sem redefinir tipos que existem em `@reparte/types`.
- Sem hardcodar URL do scraper ou credenciais — tudo via `.env`.
- Sem expor stack traces ou erros internos nas respostas HTTP.
