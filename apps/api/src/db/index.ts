import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '../env.ts'
import * as schema from './schema.ts'

const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
})

export const db = drizzle(client, { schema })
export { schema }
