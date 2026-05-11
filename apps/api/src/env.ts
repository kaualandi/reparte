function required(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  SCRAPER_URL: required('SCRAPER_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  PORT: Number.parseInt(process.env.PORT ?? '3002', 10),
} as const
