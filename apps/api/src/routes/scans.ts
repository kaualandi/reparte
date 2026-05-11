import { desc, eq, sql } from 'drizzle-orm'
import { Elysia, t } from 'elysia'

import type {
  ItemOwner,
  Scan,
  ScanItem,
  ScanKind,
  ScanListEntry,
  ScanWithItems,
} from '@reparte/types'

import { authPlugin } from '../auth.ts'
import { db } from '../db/index.ts'
import type { ScanItemRow, ScanRow } from '../db/schema.ts'
import { scanItems, scans } from '../db/schema.ts'
import { numberToBRL, parseBRL, quantityToBRL } from '../lib/money.ts'
import { ScraperError, scrapeNFe } from '../lib/scraper.ts'
import { computeSplit } from '../lib/split.ts'

const ownerValues = ['user1', 'user2', 'shared', 'unassigned'] as const
type Scanner = 'user1' | 'user2'

function isOwner(value: string): value is ItemOwner {
  return (ownerValues as readonly string[]).includes(value)
}

function isScanner(value: string): value is Scanner {
  return value === 'user1' || value === 'user2'
}

function isScanKind(value: string): value is ScanKind {
  return value === 'nfce' || value === 'manual'
}

function rowToScan(row: ScanRow): Scan {
  if (!isScanner(row.scannedBy)) {
    throw new Error(`Invalid scannedBy value in DB: ${row.scannedBy}`)
  }
  if (!isScanner(row.paidBy)) {
    throw new Error(`Invalid paidBy value in DB: ${row.paidBy}`)
  }
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    kind: isScanKind(row.kind) ? row.kind : 'nfce',
    emitente: row.emitente,
    cnpj: row.cnpj,
    total: row.total,
    dataEmissao: row.dataEmissao,
    qrCodeUrl: row.qrCodeUrl,
    scannedBy: row.scannedBy,
    paidBy: row.paidBy,
  }
}

function rowToItem(row: ScanItemRow): ScanItem {
  const owner: ItemOwner = isOwner(row.owner) ? row.owner : 'unassigned'
  return {
    id: row.id,
    scanId: row.scanId,
    nome: row.nome,
    quantidade: row.quantidade,
    unidade: row.unidade,
    valorUnitario: row.valorUnitario,
    valorTotal: row.valorTotal,
    owner,
  }
}

const ownerSchema = t.Union([
  t.Literal('user1'),
  t.Literal('user2'),
  t.Literal('shared'),
  t.Literal('unassigned'),
])

const scannerSchema = t.Union([t.Literal('user1'), t.Literal('user2')])

export const scansRoutes = new Elysia({ prefix: '/scans' })
  .use(authPlugin)
  .get(
    '/',
    async (): Promise<ScanListEntry[]> => {
      const rows = await db
        .select({
          scan: scans,
          itemCount: sql<number>`count(${scanItems.id})::int`,
        })
        .from(scans)
        .leftJoin(scanItems, eq(scanItems.scanId, scans.id))
        .groupBy(scans.id)
        .orderBy(desc(scans.createdAt))

      return rows.map((r) => ({
        ...rowToScan(r.scan),
        itemCount: r.itemCount ?? 0,
      }))
    },
    { auth: true },
  )
  .get(
    '/:id',
    async ({ params, set }): Promise<ScanWithItems | { error: string; message: string }> => {
      const scan = await db.query.scans.findFirst({ where: eq(scans.id, params.id) })
      if (!scan) {
        set.status = 404
        return { error: 'not_found', message: 'Scan not found' }
      }
      const items = await db
        .select()
        .from(scanItems)
        .where(eq(scanItems.scanId, params.id))

      return {
        ...rowToScan(scan),
        items: items.map(rowToItem),
      }
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  )
  .post(
    '/',
    async ({ body, set }) => {
      let nfe
      try {
        nfe = await scrapeNFe(body.qrCodeUrl)
      } catch (err) {
        if (err instanceof ScraperError) {
          set.status = err.kind === 'rejected' ? 422 : 502
          return { error: err.kind, message: err.publicMessage }
        }
        console.error('[scans.post] unexpected', err)
        set.status = 500
        return { error: 'internal', message: 'Erro interno ao processar a nota.' }
      }

      const inserted = await db.transaction(async (tx) => {
        const [scan] = await tx
          .insert(scans)
          .values({
            kind: 'nfce',
            emitente: nfe.emitente.nome,
            cnpj: nfe.emitente.cnpj,
            total: numberToBRL(nfe.total),
            dataEmissao: nfe.dataEmissao,
            qrCodeUrl: body.qrCodeUrl,
            scannedBy: body.scannedBy,
            paidBy: body.paidBy ?? body.scannedBy,
          })
          .returning()
        if (!scan) throw new Error('Insert returned no row')

        if (nfe.itens.length > 0) {
          await tx.insert(scanItems).values(
            nfe.itens.map((it) => ({
              scanId: scan.id,
              nome: it.nome,
              quantidade: quantityToBRL(it.quantidade),
              unidade: it.unidade,
              valorUnitario: numberToBRL(it.valorUnitario),
              valorTotal: numberToBRL(it.valorTotal),
            })),
          )
        }

        const items = await tx
          .select()
          .from(scanItems)
          .where(eq(scanItems.scanId, scan.id))

        return { scan, items }
      })

      const result: ScanWithItems = {
        ...rowToScan(inserted.scan),
        items: inserted.items.map(rowToItem),
      }
      set.status = 201
      return result
    },
    {
      auth: true,
      body: t.Object({
        qrCodeUrl: t.String({ minLength: 10 }),
        scannedBy: scannerSchema,
        paidBy: t.Optional(scannerSchema),
      }),
    },
  )
  .post(
    '/manual',
    async ({ body, set }) => {
      const total = body.items.reduce((acc, it) => acc + parseBRL(it.valorTotal), 0)
      const now = new Date()
      const dataEmissao =
        body.dataEmissao && body.dataEmissao.trim().length > 0
          ? body.dataEmissao
          : now.toLocaleString('pt-BR')

      const inserted = await db.transaction(async (tx) => {
        const [scan] = await tx
          .insert(scans)
          .values({
            kind: 'manual',
            emitente: body.emitente.trim(),
            cnpj: null,
            total: numberToBRL(total),
            dataEmissao,
            qrCodeUrl: null,
            scannedBy: body.scannedBy,
            paidBy: body.paidBy ?? body.scannedBy,
          })
          .returning()
        if (!scan) throw new Error('Insert returned no row')

        if (body.items.length > 0) {
          await tx.insert(scanItems).values(
            body.items.map((it) => {
              const qtyStr = (it.quantidade ?? '').trim()
              const qtyNum = parseBRL(qtyStr.length > 0 ? qtyStr : '1') || 1
              const valor = parseBRL(it.valorTotal)
              return {
                scanId: scan.id,
                nome: it.nome.trim(),
                quantidade: qtyStr.length > 0 ? qtyStr : '1',
                unidade: (it.unidade ?? 'UN').trim() || 'UN',
                valorUnitario: numberToBRL(qtyNum > 0 ? valor / qtyNum : valor),
                valorTotal: numberToBRL(valor),
                owner: it.owner ?? 'unassigned',
              }
            }),
          )
        }

        const items = await tx
          .select()
          .from(scanItems)
          .where(eq(scanItems.scanId, scan.id))

        return { scan, items }
      })

      const result: ScanWithItems = {
        ...rowToScan(inserted.scan),
        items: inserted.items.map(rowToItem),
      }
      set.status = 201
      return result
    },
    {
      auth: true,
      body: t.Object({
        emitente: t.String({ minLength: 1 }),
        dataEmissao: t.Optional(t.String()),
        scannedBy: scannerSchema,
        paidBy: t.Optional(scannerSchema),
        items: t.Array(
          t.Object({
            nome: t.String({ minLength: 1 }),
            quantidade: t.Optional(t.String()),
            unidade: t.Optional(t.String()),
            valorTotal: t.String({ minLength: 1 }),
            owner: t.Optional(ownerSchema),
          }),
          { minItems: 1 },
        ),
      }),
    },
  )
  .patch(
    '/:id',
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(scans)
        .set({ paidBy: body.paidBy })
        .where(eq(scans.id, params.id))
        .returning()
      if (!updated) {
        set.status = 404
        return { error: 'not_found', message: 'Scan not found' }
      }
      return rowToScan(updated)
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        paidBy: scannerSchema,
      }),
    },
  )
  .patch(
    '/:id/items/:itemId',
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(scanItems)
        .set({ owner: body.owner })
        .where(eq(scanItems.id, params.itemId))
        .returning()

      if (!updated || updated.scanId !== params.id) {
        set.status = 404
        return { error: 'not_found', message: 'Item not found in this scan' }
      }
      return rowToItem(updated)
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ format: 'uuid' }),
        itemId: t.String({ format: 'uuid' }),
      }),
      body: t.Object({
        owner: ownerSchema,
      }),
    },
  )
  .get(
    '/:id/split',
    async ({ params, set }) => {
      const exists = await db.query.scans.findFirst({ where: eq(scans.id, params.id) })
      if (!exists) {
        set.status = 404
        return { error: 'not_found', message: 'Scan not found' }
      }
      const items = await db
        .select()
        .from(scanItems)
        .where(eq(scanItems.scanId, params.id))
      return computeSplit(params.id, items)
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  )
  .delete(
    '/:id',
    async ({ params, set }) => {
      const result = await db.delete(scans).where(eq(scans.id, params.id)).returning()
      if (result.length === 0) {
        set.status = 404
        return { error: 'not_found', message: 'Scan not found' }
      }
      set.status = 204
      return null
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  )
