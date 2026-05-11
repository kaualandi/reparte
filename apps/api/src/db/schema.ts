import { sql } from 'drizzle-orm'
import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const repartSchema = pgSchema('reparte')

export const scans = repartSchema.table('scans', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  kind: text('kind').notNull().default('nfce'),
  emitente: text('emitente').notNull(),
  cnpj: text('cnpj'),
  total: text('total').notNull(),
  dataEmissao: text('data_emissao').notNull(),
  qrCodeUrl: text('qr_code_url'),
  scannedBy: text('scanned_by').notNull(),
  paidBy: text('paid_by').notNull(),
})

export const scanItems = repartSchema.table('scan_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  scanId: uuid('scan_id')
    .notNull()
    .references(() => scans.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  quantidade: text('quantidade').notNull(),
  unidade: text('unidade').notNull(),
  valorUnitario: text('valor_unitario').notNull(),
  valorTotal: text('valor_total').notNull(),
  owner: text('owner').notNull().default('unassigned'),
})

export type ScanRow = typeof scans.$inferSelect
export type ScanInsert = typeof scans.$inferInsert
export type ScanItemRow = typeof scanItems.$inferSelect
export type ScanItemInsert = typeof scanItems.$inferInsert
