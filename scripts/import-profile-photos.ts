import {mkdirSync,writeFileSync} from 'fs'
import {resolve} from 'path'
import {Client} from 'pg'
import {loadEnvLocal} from './load-env'
import {isValidImage} from '../src/lib/images'

interface SourceRow{membership_id:string;member_type:string;status:string;directory_opt_in:boolean;legacy_source_id:string;photo_url:string}
interface Downloaded extends SourceRow{content:Buffer;mimeType:string}
const MAX_BYTES=5*1024*1024

async function main(){
  loadEnvLocal();if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect()
  try{
    const source=await client.query<SourceRow>(`SELECT m.id membership_id,m.member_type,m.status,m.directory_opt_in,m.legacy_source_id,p.photo_url FROM memberships m JOIN member_profiles p ON p.membership_id=m.id LEFT JOIN membership_profile_photos ph ON ph.membership_id=m.id WHERE NULLIF(p.photo_url,'') IS NOT NULL AND m.legacy_source_id IS NOT NULL AND ph.membership_id IS NULL ORDER BY m.id`)
    let next=0;const downloaded:Downloaded[]=[];const failed:{membershipId:string;reason:string}[]=[]
    async function worker(){while(next<source.rows.length){const row=source.rows[next++];const url=`https://directorio.shiatsu-apse.es/wp-content/uploads/ultimatemember/${encodeURIComponent(row.legacy_source_id)}/${encodeURIComponent(row.photo_url)}`;try{const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(15000)});if(!response.ok){failed.push({membershipId:row.membership_id,reason:`http_${response.status}`});continue}let mimeType=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(mimeType==='image/jpg')mimeType='image/jpeg';const content=Buffer.from(await response.arrayBuffer());if(content.length===0||content.length>MAX_BYTES||!isValidImage(content,mimeType)){failed.push({membershipId:row.membership_id,reason:'invalid_image'});continue}downloaded.push({...row,content,mimeType})}catch{failed.push({membershipId:row.membership_id,reason:'network_error'})}}}
    await Promise.all(Array.from({length:8},worker))
    await client.query('BEGIN')
    try{for(const image of downloaded)await client.query(`INSERT INTO membership_profile_photos(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'wordpress') ON CONFLICT(membership_id) DO NOTHING`,[image.membership_id,image.photo_url,image.mimeType,image.content.length,image.content]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}
    const counts=(await client.query(`SELECT m.member_type,COUNT(*)::int total,COUNT(*) FILTER(WHERE m.status='active' AND m.directory_opt_in=true AND m.member_type IN ('professional','school'))::int public FROM membership_profile_photos ph JOIN memberships m ON m.id=ph.membership_id GROUP BY m.member_type ORDER BY m.member_type`)).rows
    const report={candidates:source.rowCount,imported:downloaded.length,failed,totalBytes:downloaded.reduce((total,image)=>total+image.content.length,0),databaseCounts:counts,noEmailsSent:true}
    const directory=resolve(process.cwd(),'migration-reports');mkdirSync(directory,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');const reportPath=resolve(directory,`profile-photos-${stamp}.json`);writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8')
    console.log(JSON.stringify({...report,failed:failed.length,reportPath},null,2))
  }finally{await client.end()}
}
main().catch(error=>{console.error('Error importando imágenes:',error);process.exit(1)})
