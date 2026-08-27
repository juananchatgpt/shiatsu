import {mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {Client} from 'pg'
import {loadEnvLocal} from './load-env'
import {isValidImage} from '../src/lib/images'

interface SourceRow{membership_id:string;legacy_source_id:string;cover_file:string}
interface Downloaded extends SourceRow{content:Buffer;mimeType:string}
const MAX_BYTES=5*1024*1024

async function main(){
  loadEnvLocal();if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect()
  try{
    const source=await client.query<SourceRow>(`SELECT m.id membership_id,m.legacy_source_id,m.legacy_data->>'cover_photo' cover_file
      FROM memberships m LEFT JOIN membership_cover_images c ON c.membership_id=m.id
      WHERE m.member_type='school' AND m.legacy_source_id IS NOT NULL
      AND NULLIF(m.legacy_data->>'cover_photo','') IS NOT NULL AND c.membership_id IS NULL ORDER BY m.id`)
    let next=0;const downloaded:Downloaded[]=[];const failed:{membershipId:string;reason:string}[]=[]
    async function worker(){while(next<source.rows.length){const row=source.rows[next++];const url=`https://directorio.shiatsu-apse.es/wp-content/uploads/ultimatemember/${encodeURIComponent(row.legacy_source_id)}/${encodeURIComponent(row.cover_file)}`;try{const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(15000)});if(!response.ok){failed.push({membershipId:row.membership_id,reason:`http_${response.status}`});continue}let mimeType=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(mimeType==='image/jpg')mimeType='image/jpeg';const content=Buffer.from(await response.arrayBuffer());if(!content.length||content.length>MAX_BYTES||!isValidImage(content,mimeType)){failed.push({membershipId:row.membership_id,reason:'invalid_image'});continue}downloaded.push({...row,content,mimeType})}catch{failed.push({membershipId:row.membership_id,reason:'network_error'})}}}
    await Promise.all(Array.from({length:6},worker))
    await client.query('BEGIN')
    try{for(const image of downloaded)await client.query(`INSERT INTO membership_cover_images(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'wordpress') ON CONFLICT(membership_id) DO NOTHING`,[image.membership_id,image.cover_file,image.mimeType,image.content.length,image.content]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}
    const report={candidates:source.rowCount,imported:downloaded.length,failed:failed.length,totalBytes:downloaded.reduce((sum,image)=>sum+image.content.length,0),noEmailsSent:true}
    const directory=resolve(process.cwd(),'migration-reports');mkdirSync(directory,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');const reportPath=resolve(directory,`school-covers-${stamp}.json`);writeFileSync(reportPath,JSON.stringify({...report,failures:failed},null,2),'utf8')
    console.log(JSON.stringify({...report,reportPath},null,2))
  }finally{await client.end()}
}
main().catch(error=>{console.error('Error importando portadas:',error);process.exit(1)})
