import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { Elysia, t } from 'elysia'

import type { AggregatedItem, ItemOwner, Scanner } from '@reparte/types'

import { authPlugin } from '../auth.ts'
import { db } from '../db/index.ts'
import { scanItems, scans } from '../db/schema.ts'

const ownerValues: readonly ItemOwner[] = ['user1', 'user2', 'shared', 'unassigned']

function isOwner(value: string): value is ItemOwner {
  return (ownerValues as readonly string[]).includes(value)
}

function isScanner(value: string): value is Scanner {
  return value === 'user1' || value === 'user2'
}

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

export const itemsRoutes = new Elysia({ prefix: '/items' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, set }) => {
      const range = monthRange(query.month)
      if (!range) {
        set.status = 400
        return { error: 'invalid_month', message: 'Use o formato YYYY-MM.' }
      }

      const rows = await db
        .select({
          id: scanItems.id,
          scanId: scanItems.scanId,
          nome: scanItems.nome,
          quantidade: scanItems.quantidade,
          unidade: scanItems.unidade,
          valorUnitario: scanItems.valorUnitario,
          valorTotal: scanItems.valorTotal,
          owner: scanItems.owner,
          scanEmitente: scans.emitente,
          scanCreatedAt: scans.createdAt,
          scanScannedBy: scans.scannedBy,
          scanPaidBy: scans.paidBy,
        })
        .from(scanItems)
        .innerJoin(scans, eq(scans.id, scanItems.scanId))
        .where(and(gte(scans.createdAt, range.start), lt(scans.createdAt, range.end)))
        .orderBy(asc(scans.createdAt), asc(scanItems.nome))

      const items: AggregatedItem[] = rows.map((r) => ({
        id: r.id,
        scanId: r.scanId,
        nome: r.nome,
        quantidade: r.quantidade,
        unidade: r.unidade,
        valorUnitario: r.valorUnitario,
        valorTotal: r.valorTotal,
        owner: isOwner(r.owner) ? r.owner : 'unassigned',
        scanEmitente: r.scanEmitente,
        scanCreatedAt: r.scanCreatedAt.toISOString(),
        scanScannedBy: isScanner(r.scanScannedBy) ? r.scanScannedBy : 'user1',
        scanPaidBy: isScanner(r.scanPaidBy) ? r.scanPaidBy : 'user1',
      }))

      return { month: query.month, items }
    },
    {
      auth: true,
      query: t.Object({
        month: t.String({ pattern: '^\\d{4}-\\d{2}$' }),
      }),
    },
  )
