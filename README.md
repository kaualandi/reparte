# Reparte

PWA para dois usuários que escaneia QR Codes de cupons fiscais (NFC-e),
lista itens e divide a conta — cada item pode ser meu, do meu irmão ou
compartilhado meio a meio. Compras avulsas (sem NFC-e) também podem ser
lançadas manualmente.

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
│   ├── web/                  # PWA (deploy Vercel)
│   └── api/                  # API HTTP (deploy EC2)
├── packages/
│   └── types/                # tipos compartilhados
├── package.json              # workspaces root
└── turbo.json
```

## Pré-requisitos

- Bun >= 1.1
- PostgreSQL acessível (local ou remoto)
- Serviço de scraping rodando e respondendo em `SCRAPER_URL`

## Setup local

```bash
# 1) instalar dependências
bun install

# 2) variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# edite apps/api/.env com DATABASE_URL, SCRAPER_URL, JWT_SECRET e PORT

# 3) criar o database (se ainda não existir)
psql -h <host> -U postgres -c "CREATE DATABASE reparte;"

# 4) migrar (cria o schema `reparte` e suas tabelas)
cd apps/api
bun run db:migrate
cd ../..

# 5) gerar os dois tokens estáticos (rodar uma vez)
bun --cwd apps/api run tokens:generate
# copie cada token para o dispositivo correspondente

# 6) subir tudo em dev
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

---

## Deploy

### Frontend (Vercel)

O [`apps/web/vercel.json`](apps/web/vercel.json) já cobre Bun + Vite + PWA + SPA rewrites.
O `installCommand` sobe pra raiz pra resolver os workspaces (`@reparte/types`),
e o build roda dentro de `apps/web`.

**Setup na Vercel (uma vez):**

1. Criar novo projeto importando o repositório.
2. **Settings → General → Root Directory** → `apps/web`
3. **Settings → General → Build & Development Settings**:
   - "Override" desligado (deixe que o `vercel.json` cuide)
   - Se aparecer Framework Preset, "Vite"
4. **Settings → Environment Variables**:
   - `VITE_API_URL` = URL pública da sua API (ex.: `https://reparte-api.kaualf.com`)
5. Deploy.

> Não deixe a Vercel "Detected Turbo" assumir o controle — o
> `vercel.json` em `apps/web` + Root Directory corretamente apontado
> evitam isso. Se ver `Detected Turbo. Adjusting default settings...` no
> log seguido de comandos com `--filter`, é sinal de que o Root
> Directory ficou vazio/raiz — corrija na UI.

**Via CLI:**

```bash
cd apps/web
vercel --prod
```

O domínio do Reparte deve estar coberto pelo CORS allowlist da API
(`/^https?:\/\/(?:[a-z0-9-]+\.)*kaualf\.com(?::\d+)?$/i` — ajuste em
[`apps/api/src/index.ts`](apps/api/src/index.ts) se for outro).

### Backend (EC2)

A API roda o TypeScript direto via Bun + PM2 (sem build step), no mesmo
padrão do scraper.

**Preparação do EC2 (uma vez):**

```bash
# 1) instalar Bun (se ainda não tiver)
curl -fsSL https://bun.sh/install | bash

# 2) clonar e instalar dependências
cd ~ && git clone <repo-url> reparte
cd reparte && bun install --frozen-lockfile

# 3) configurar .env da API
cp apps/api/.env.example apps/api/.env
nano apps/api/.env   # DATABASE_URL, SCRAPER_URL, JWT_SECRET, PORT

# 4) migrar banco
bun --cwd apps/api run db:migrate

# 5) subir via PM2
cd apps/api
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # siga o comando que ele imprime para auto-start no boot
```

> Equivalente sem o ecosystem (one-liner, igual ao scraper):
> ```bash
> pm2 start --interpreter ~/.bun/bin/bun --name reparte-api src/index.ts
> ```

**Atualizações (deploy de nova versão):**

```bash
cd ~/reparte
git pull
bun install --frozen-lockfile
bun --cwd apps/api run db:migrate   # se houver migrations novas
pm2 restart reparte-api
```

**Logs:**

```bash
pm2 logs reparte-api          # ao vivo
pm2 logs reparte-api --lines 200
pm2 monit                     # CPU/RAM
```

### Nginx + HTTPS

A API escuta em `127.0.0.1:3002`; coloque o nginx na frente para fazer
TLS e expor publicamente.

```bash
sudo cp apps/api/deploy/nginx.conf.example /etc/nginx/sites-available/reparte-api
sudo ln -s /etc/nginx/sites-available/reparte-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.kaualf.com
```

### Scraper de NFC-e

Mora em outro repositório/serviço Elysia. Para incluir um novo estado
(ex.: SP), implemente o parser correspondente lá e exponha no endpoint
`POST /nfe/scan`. O Reparte não precisa de mudanças desde que o JSON
retornado siga o contrato em [`packages/types/src/index.ts`](packages/types/src/index.ts) (`NFeData`).

---

## O que NÃO fazer no código

- Sem Options API no Vue (apenas Composition API com `<script setup>`).
- Sem Vuex (apenas Pinia).
- Sem `any` em nenhum dos pacotes.
- Sem redefinir tipos que existem em `@reparte/types`.
- Sem hardcodar URL do scraper ou credenciais — tudo via `.env`.
- Sem expor stack traces ou erros internos nas respostas HTTP.
