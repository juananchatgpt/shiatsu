// Verifica la conexión a Postgres. Uso: npm run db:test
import { Client } from 'pg'
import { loadEnvLocal } from './load-env'

async function main(): Promise<void> {
  loadEnvLocal()
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL no está definida (configúrala en .env.local)')
    process.exit(1)
  }
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const { rows } = await client.query('SELECT now() AS server_time, current_database() AS db')
    console.log('✓ Conexión OK:', rows[0])
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('✗ Error de conexión:', error)
  process.exit(1)
})
