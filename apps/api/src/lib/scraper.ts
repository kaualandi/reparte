import type { NFeData, ScraperErrorResponse, ScraperResponse } from '@reparte/types'

import { env } from '../env.ts'

export type ScraperFailureKind = 'unreachable' | 'upstream_error' | 'invalid_payload' | 'rejected'

export class ScraperError extends Error {
  override readonly name = 'ScraperError'
  constructor(
    readonly publicMessage: string,
    readonly kind: ScraperFailureKind,
    readonly status?: number,
    readonly internalDetail?: string,
  ) {
    super(internalDetail ?? publicMessage)
  }
}

function logInternal(err: ScraperError): void {
  console.error(
    `[scraper] ${err.kind}${err.status ? ` (status ${err.status})` : ''}: ${err.internalDetail ?? err.publicMessage}`,
  )
}

function mapStatus(status: number): ScraperFailureKind {
  if (status === 400 || status === 422) return 'rejected'
  return 'upstream_error'
}

function isErrorBody(value: unknown): value is ScraperErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: unknown }).success === false &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  )
}

function isScraperResponse(value: unknown): value is ScraperResponse {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as { success?: unknown; data?: unknown }
  if (obj.success !== true) return false
  const data = obj.data
  if (typeof data !== 'object' || data === null) return false
  const d = data as Partial<NFeData>
  return (
    !!d.emitente &&
    typeof d.emitente.nome === 'string' &&
    typeof d.emitente.cnpj === 'string' &&
    Array.isArray(d.itens) &&
    typeof d.total === 'number' &&
    typeof d.dataEmissao === 'string'
  )
}

export async function scrapeNFe(qrCodeUrl: string): Promise<NFeData> {
  let response: Response
  try {
    response = await fetch(`${env.SCRAPER_URL}/nfe/scan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ qrCodeUrl }),
    })
  } catch (err) {
    const error = new ScraperError(
      'Não foi possível processar a nota agora. Tente novamente em instantes.',
      'unreachable',
      undefined,
      err instanceof Error ? err.message : String(err),
    )
    logInternal(error)
    throw error
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (err) {
    const error = new ScraperError(
      'Resposta inesperada ao processar a nota.',
      'invalid_payload',
      response.status,
      err instanceof Error ? err.message : String(err),
    )
    logInternal(error)
    throw error
  }

  if (!response.ok) {
    const status = response.status
    const kind = mapStatus(status)
    const upstreamError = isErrorBody(body) ? body.error : null
    const detail = isErrorBody(body)
      ? `${body.error}${body.detail ? `: ${body.detail}` : ''}`
      : `HTTP ${status}`

    const fallback =
      kind === 'rejected'
        ? 'Não foi possível ler essa nota. Confira se o link é de uma NFC-e válida.'
        : 'Não foi possível processar a nota agora. Tente novamente em instantes.'
    const publicMessage = upstreamError ? `${upstreamError}. Tente novamente em instantes.` : fallback

    const error = new ScraperError(publicMessage, kind, status, detail)
    logInternal(error)
    throw error
  }

  if (!isScraperResponse(body)) {
    const error = new ScraperError(
      'Resposta inesperada ao processar a nota.',
      'invalid_payload',
      response.status,
      'Payload did not match ScraperResponse schema',
    )
    logInternal(error)
    throw error
  }

  return body.data
}
