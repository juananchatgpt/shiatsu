// La contraseña se lee de ADMIN_PASSWORD para no exponerla en el historial ni en la lista de procesos.
// Uso: ADMIN_PASSWORD=... npm run user:create -- <email> [full_name] [role]
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import { loadEnvLocal } from './load-env'

async function main(): Promise<void> {
  loadEnvLocal()
  const [email, fullName, role] = process.argv.slice(2)
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Uso: define ADMIN_PASSWORD y ejecuta npm run user:create -- <email> [full_name] [role]')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('ERROR: el password debe tener al menos 8 caracteres')
    process.exit(1)
  }
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL no está definida (configúrala en .env.local)')
    process.exit(1)
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const count = await client.query<{ count: string }>('SELECT COUNT(*)::text count FROM users')
    const selectedRole = role || (Number(count.rows[0].count) === 0 ? 'admin' : 'member')
    if (!['admin', 'member'].includes(selectedRole)) throw new Error('role debe ser admin o member')
    const result = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role`,
      [email.trim().toLowerCase(), passwordHash, fullName || null, selectedRole],
    )
    const user = result.rows[0]
    console.log(`Usuario creado: ${user.email} (id: ${user.id}, role: ${user.role})`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('duplicate key')) {
      console.error(`ERROR: ya existe un usuario con email ${email}`)
    } else {
      console.error('Error creando usuario:', message)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
