// Aplica db/schema.sql contra DATABASE_URL.
// Uso: npm run db:apply  (o npx tsx scripts/apply-schema.ts)
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Client } from 'pg'
import { loadEnvLocal } from './load-env'

async function main(): Promise<void> {
  loadEnvLocal()
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL no está definida (configúrala en .env.local)')
    process.exit(1)
  }
  const sql = readFileSync(resolve(process.cwd(), 'db', 'schema.sql'), 'utf8')
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query(sql)
    console.log('Schema aplicado correctamente')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Error aplicando schema:', error)
  process.exit(1)
})
