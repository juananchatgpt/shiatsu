import { createHash } from 'crypto'
import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { Client } from 'pg'
import { loadEnvLocal } from './load-env'

async function main(){
  loadEnvLocal()
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
  const directory=resolve(process.cwd(),'db','migrations')
  const files=readdirSync(directory).filter(file=>/^\d+_.+\.sql$/.test(file)).sort()
  const client=new Client({connectionString:process.env.DATABASE_URL})
  await client.connect()
  try{
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations(name TEXT PRIMARY KEY,checksum TEXT NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    for(const name of files){
      const sql=readFileSync(resolve(directory,name),'utf8')
      const checksum=createHash('sha256').update(sql).digest('hex')
      const previous=await client.query<{checksum:string}>('SELECT checksum FROM _migrations WHERE name=$1',[name])
      if(previous.rows[0]){
        if(previous.rows[0].checksum!==checksum)throw new Error(`La migración aplicada ${name} fue modificada. Crea una migración nueva.`)
        continue
      }
      await client.query('BEGIN')
      try{
        await client.query(sql)
        await client.query('INSERT INTO _migrations(name,checksum) VALUES($1,$2)',[name,checksum])
        await client.query('COMMIT')
        console.log(`Migración aplicada: ${name}`)
      }catch(error){await client.query('ROLLBACK');throw error}
    }
    console.log('Migraciones verificadas')
  }finally{await client.end()}
}
main().catch(error=>{console.error('Error de migración:',error);process.exit(1)})
