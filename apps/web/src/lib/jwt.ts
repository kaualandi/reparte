import type { JwtPayload } from '@reparte/types'

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    '=',
  )
  return atob(padded)
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const payload = parts[1]
  if (!payload) return null
  try {
    const decoded = base64urlDecode(payload)
    const parsed: unknown = JSON.parse(decoded)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'sub' in parsed &&
      (parsed.sub === 'user1' || parsed.sub === 'user2')
    ) {
      return parsed as JwtPayload
    }
    return null
  } catch {
    return null
  }
}
