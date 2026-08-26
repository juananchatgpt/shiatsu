import { Pool, type QueryResultRow } from 'pg'

let pool: Pool | null = null

// Lazy singleton: nunca crear el Pool a nivel de módulo (rompe el build de
// Next.js cuando DATABASE_URL aún no existe y multiplica conexiones en serverless).
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return pool
}

// Query parametrizada — ÚNICA forma permitida de pasar valores ($1, $2...).
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { rows } = await getPool().query<T>(sql, params)
  return rows
}

// Transacciones
export async function withTransaction<T>(
  fn: (q: typeof query) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const txQuery = async <R extends QueryResultRow = QueryResultRow>(
      sql: string,
      params: unknown[] = [],
    ): Promise<R[]> => (await client.query<R>(sql, params)).rows
    const result = await fn(txQuery as typeof query)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
