import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'

import { env } from './env.ts'
import { balanceRoutes } from './routes/balance.ts'
import { itemsRoutes } from './routes/items.ts'
import { scansRoutes } from './routes/scans.ts'

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$/,
  /^https?:\/\/(?:[a-z0-9-]+\.)*kaualf\.com(?::\d+)?$/i,
]

const app = new Elysia()
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get('origin')
        if (!origin) return true
        return ALLOWED_ORIGIN_PATTERNS.some((rx) => rx.test(origin))
      },
      credentials: true,
    }),
  )
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Reparte API',
          version: '0.1.0',
          description: 'Divisor de contas de supermercado via NFC-e.',
        },
      },
    }),
  )
  .get('/health', () => ({ ok: true }))
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'validation', message: 'Invalid request body or params' }
    }
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'not_found', message: 'Resource not found' }
    }
    const message = error instanceof Error ? error.message : 'Internal error'
    if (message === 'Missing bearer token' || message === 'Invalid token') {
      set.status = 401
      return { error: 'unauthorized', message }
    }
    console.error('[api error]', error)
    set.status = 500
    return { error: 'internal', message: 'Internal server error' }
  })
  .use(scansRoutes)
  .use(itemsRoutes)
  .use(balanceRoutes)
  .listen(env.PORT)

console.log(`Reparte API listening on http://localhost:${env.PORT}`)
console.log(`Swagger UI at http://localhost:${env.PORT}/docs`)

export type App = typeof app
