import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { Elysia, t } from 'elysia'

import { authPlugin } from '../auth.ts'
import { db } from '../db/index.ts'
import type { ScanItemRow, ScanRow } from '../db/schema.ts'
import { scanItems, scans } from '../db/schema.ts'
import { computeMonthlyBalance } from '../lib/balance.ts'

function monthRange(month: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) return null
  const year = Number.parseInt(match[1] ?? '', 10)
  const m = Number.parseInt(match[2] ?? '', 10)
  if (m < 1 || m > 12) return null
  const start = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(m === 12 ? year + 1 : year, m === 12 ? 0 : m, 1, 0, 0, 0, 0))
  return { start, end }
}

export const balanceRoutes = new Elysia({ prefix: '/balance' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, set }) => {
      const range = monthRange(query.month)
      if (!range) {
        set.status = 400
        return { error: 'invalid_month', message: 'Use o formato YYYY-MM.' }
      }

      const scanRows = await db
        .select()
        .from(scans)
        .where(and(gte(scans.createdAt, range.start), lt(scans.createdAt, range.end)))
        .orderBy(asc(scans.createdAt))

      const pairs: { scan: ScanRow; items: ScanItemRow[] }[] = []
      for (const scan of scanRows) {
        const items = await db
          .select()
          .from(scanItems)
          .where(eq(scanItems.scanId, scan.id))
        pairs.push({ scan, items })
      }

      return computeMonthlyBalance(query.month, pairs)
    },
    {
      auth: true,
      query: t.Object({
        month: t.String({ pattern: '^\\d{4}-\\d{2}$' }),
      }),
    },
  )
