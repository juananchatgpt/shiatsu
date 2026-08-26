import { Client } from 'pg'
import { loadEnvLocal } from './load-env'

async function main(){
  loadEnvLocal();if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect()
  try{
    const migrations=await client.query<{name:string}>('SELECT name FROM _migrations ORDER BY name')
    const admins=await client.query<{count:number}>(`SELECT COUNT(*)::int count FROM users WHERE role='admin' AND active=true`)
    const contentColumn=await client.query(`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='membership_documents' AND column_name='content'`)
    console.log(JSON.stringify({migrations:migrations.rows.map(row=>row.name),activeAdmins:admins.rows[0].count,documentStorageReady:contentColumn.rowCount===1},null,2))
  }finally{await client.end()}
}
main().catch(error=>{console.error('Verificación de BBDD fallida:',error);process.exit(1)})
