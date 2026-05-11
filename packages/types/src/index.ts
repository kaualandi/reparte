export type ItemOwner = 'user1' | 'user2' | 'shared' | 'unassigned'
export type Scanner = 'user1' | 'user2'

export interface NFeItem {
  nome: string
  quantidade: number
  unidade: string
  valorUnitario: number
  valorTotal: number
}

export interface NFeEmitente {
  nome: string
  cnpj: string
  endereco?: string
}

export interface NFeData {
  emitente: NFeEmitente
  itens: NFeItem[]
  total: number
  desconto: number
  dataEmissao: string
  chaveAcesso?: string
}

export interface ScraperResponse {
  success: true
  data: NFeData
  _html?: string
}

export interface ScraperErrorResponse {
  success: false
  error: string
  detail?: string
}

export interface Scan {
  id: string
  createdAt: string
  emitente: string
  cnpj: string
  total: string
  dataEmissao: string
  qrCodeUrl: string
  scannedBy: Scanner
  paidBy: Scanner
}

export interface ScanItem {
  id: string
  scanId: string
  nome: string
  quantidade: string
  unidade: string
  valorUnitario: string
  valorTotal: string
  owner: ItemOwner
}

export interface ScanWithItems extends Scan {
  items: ScanItem[]
}

export interface ScanListEntry extends Scan {
  itemCount: number
}

export interface Split {
  scanId: string
  totalUser1: number
  totalUser2: number
  totalShared: number
  deveUser1: number
  deveUser2: number
}

export interface ScanCreateRequest {
  qrCodeUrl: string
  scannedBy: Scanner
  paidBy?: Scanner
}

export interface ScanUpdateRequest {
  paidBy?: Scanner
}

export interface ItemUpdateRequest {
  owner: ItemOwner
}

export interface ScanBalance {
  scanId: string
  emitente: string
  createdAt: string
  total: string
  paidBy: Scanner
  scannedBy: Scanner
  ownOfPayer: number
  ownOfOther: number
  sharedTotal: number
  unassignedTotal: number
  otherOwesPayer: number
}

export interface MonthlyBalance {
  month: string
  scans: ScanBalance[]
  user1OwesUser2: number
  user2OwesUser1: number
  netDebtor: Scanner | null
  netCreditor: Scanner | null
  netAmount: number
}

export interface ApiErrorResponse {
  error: string
  message: string
}

export interface AggregatedItem extends ScanItem {
  scanEmitente: string
  scanCreatedAt: string
  scanScannedBy: Scanner
  scanPaidBy: Scanner
}

export interface MonthSummary {
  month: string
  items: AggregatedItem[]
}

export interface JwtPayload {
  sub: 'user1' | 'user2'
  iat?: number
}
