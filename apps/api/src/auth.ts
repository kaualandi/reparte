import jwt from '@elysiajs/jwt'
import { Elysia } from 'elysia'

import type { ItemOwner } from '@reparte/types'

import { env } from './env.ts'

interface AuthUser {
  id: Exclude<ItemOwner, 'shared'>
}

function isValidUserId(value: unknown): value is AuthUser['id'] {
  return value === 'user1' || value === 'user2'
}

export const authPlugin = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
    }),
  )
  .macro({
    auth: {
      resolve: async ({ jwt, headers, set }) => {
        const header = headers.authorization
        if (!header || !header.toLowerCase().startsWith('bearer ')) {
          set.status = 401
          throw new Error('Missing bearer token')
        }
        const token = header.slice(7).trim()
        const payload = await jwt.verify(token)
        if (!payload || !isValidUserId(payload.sub)) {
          set.status = 401
          throw new Error('Invalid token')
        }
        return { user: { id: payload.sub } satisfies AuthUser }
      },
    },
  })
