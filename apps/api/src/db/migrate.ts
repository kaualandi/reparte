import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

import { env } from '../env.ts'

async function main(): Promise<void> {
  const client = postgres(env.DATABASE_URL, { max: 1 })
  const db = drizzle(client)

  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations applied.')

  await client.end()
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
