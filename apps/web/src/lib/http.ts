import { API_URL } from '../config'
import { useAuthStore } from '../stores/auth'

export class HttpError extends Error {
  override readonly name = 'HttpError'
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message)
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  body?: unknown
  signal?: AbortSignal
}

async function request<TResponse>(path: string, opts: RequestOptions = {}): Promise<TResponse> {
  const auth = useAuthStore()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  })

  if (res.status === 401) {
    auth.clear()
    throw new HttpError('Unauthorized', 401, null)
  }

  if (res.status === 204) {
    return undefined as TResponse
  }

  const contentType = res.headers.get('content-type') ?? ''
  const data: unknown = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${res.status}`
    throw new HttpError(message, res.status, data)
  }

  return data as TResponse
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
