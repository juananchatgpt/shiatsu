import { Client } from 'pg'
import { loadEnvLocal } from './load-env'

async function main(){
  loadEnvLocal();if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect()
  try{
    const migrations=await client.query<{name:string}>('SELECT name FROM _migrations ORDER BY name')
    const admins=await client.query<{count:number}>(`SELECT COUNT(*)::int count FROM users WHERE role='admin' AND active=true`)
    const contentColumn=await client.query(`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='membership_documents' AND column_name='content'`)
    const photos=await client.query<{total:number;public:number}>(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE m.status='active' AND m.directory_opt_in=true AND m.member_type IN ('professional','school'))::int public FROM membership_profile_photos ph JOIN memberships m ON m.id=ph.membership_id`)
    console.log(JSON.stringify({migrations:migrations.rows.map(row=>row.name),activeAdmins:admins.rows[0].count,documentStorageReady:contentColumn.rowCount===1,profilePhotos:photos.rows[0]},null,2))
  }finally{await client.end()}
}
main().catch(error=>{console.error('Verificación de BBDD fallida:',error);process.exit(1)})
