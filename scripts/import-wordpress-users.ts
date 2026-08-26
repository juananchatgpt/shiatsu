import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { parse } from 'csv-parse/sync'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { loadEnvLocal } from './load-env'

type Row=Record<string,string>
type MemberType='student'|'professional'|'school'
const argPath=process.argv.find(v=>v.toLowerCase().endsWith('.csv'))
const apply=process.argv.includes('--apply')
const csvPath=resolve(process.cwd(),argPath||'user-export-1-6a8f0eb365dd1.csv')
if(!existsSync(csvPath))throw new Error(`No se encontró el CSV: ${csvPath}`)
const rows=parse(readFileSync(csvPath),{columns:true,skip_empty_lines:true,bom:true,relax_quotes:true}) as Row[]

function typeOf(r:Row):MemberType{if(r.role==='um_escuela')return'school';return /Estudiante/i.test(r['rol-apse']||'')?'student':'professional'}
function statusOf(r:Row){return r.account_status==='approved'?'active':'inactive'}
function pick(r:Row,...keys:string[]){for(const k of keys){const v=(r[k]||'').trim();if(v)return v}return''}
function optedIn(r:Row,t:MemberType){return t!=='student'&&(r.profile_privacy==='Everyone'||!/No deseo/i.test(r['rol-publicitado-fijo']||r['rol-publicitado']||''))}
function privacyDate(r:Row){const raw=pick(r,'timestamp','user_registered');if(/^\d{10}$/.test(raw))return new Date(Number(raw)*1000).toISOString();const date=new Date(raw);return Number.isNaN(date.getTime())?new Date().toISOString():date.toISOString()}
function safeLegacyData(r:Row){const copy={...r};for(const key of ['user_pass','session_tokens','user_activation_key','_wpnonce','_wp_http_referer','g-recaptcha-response','IBAN','iban-escuela-estudiante'])delete copy[key];return copy}

const summary={rows:rows.length,withEmail:0,active:0,inactive:0,student:0,professional:0,school:0,directory:0,duplicateEmails:0,duplicateMemberNumbers:0}
const seen=new Set<string>();const seenNumbers=new Set<string>()
for(const r of rows){const email=(r.user_email||'').trim().toLowerCase();if(email){summary.withEmail++;if(seen.has(email))summary.duplicateEmails++;seen.add(email)}const number=pick(r,'numero-socio');if(number){if(seenNumbers.has(number))summary.duplicateMemberNumbers++;seenNumbers.add(number)}const t=typeOf(r);summary[t]++;summary[statusOf(r)]++;if(optedIn(r,t))summary.directory++}
async function main(){
console.log(JSON.stringify(summary,null,2))
if(!apply){console.log('SIMULACIÓN: no se ha escrito en PostgreSQL. Usa --apply solo tras revisar el mapeo.');return}

loadEnvLocal();if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();await client.query('BEGIN')
try{
  const report:{summary:typeof summary;processed:number;skipped:{sourceUserId:string;reason:string}[];memberNumbersCleared:{sourceUserId:string;memberNumber:string}[];databaseCounts?:unknown}={summary,processed:0,skipped:[],memberNumbersCleared:[]}
  const unusableHash=await bcrypt.hash(randomBytes(48).toString('hex'),10)
  const byIdentity=new Map<string,string>();const pendingSchools:{membershipId:string;row:Row}[]=[];const usedNumbers=new Set<string>()
  for(const r of rows){
    const email=(r.user_email||'').trim().toLowerCase();if(!email)continue
    const existing=await client.query('SELECT 1 FROM memberships WHERE legacy_source_id=$1',[r.source_user_id]);if(existing.rowCount){report.skipped.push({sourceUserId:r.source_user_id,reason:'legacy_source_already_imported'});continue}
    const t=typeOf(r);const first=pick(r,'nombre-socio','first_name','display_name')||'Sin nombre';const last=pick(r,'apellidos-socio','last_name')
    const user=await client.query<{id:string}>(`INSERT INTO users(email,password_hash,full_name,role,password_reset_required,active)
      VALUES($1,$2,$3,'member',true,true) ON CONFLICT(email) DO NOTHING RETURNING id`,[email,unusableHash,`${first} ${last}`.trim()])
    if(!user.rows[0]){report.skipped.push({sourceUserId:r.source_user_id,reason:'email_already_exists'});continue}
    let number=pick(r,'numero-socio')||null;if(number&&usedNumbers.has(number)){report.memberNumbersCleared.push({sourceUserId:r.source_user_id,memberNumber:number});number=null}if(number)usedNumbers.add(number)
    const base=t==='student'?4000:9500
    const membership=await client.query<{id:string}>(`INSERT INTO memberships(user_id,member_number,member_type,status,insurance_selected,base_fee_cents,
      insurance_fee_cents,anniversary_date,directory_opt_in,privacy_accepted_at,legacy_source_id,legacy_data,approved_at)
      VALUES($1,$2,$3,$4,false,$5,0,NULL,$6,COALESCE(NULLIF($7,'')::timestamptz,now()),$8,$9::jsonb,CASE WHEN $4='active' THEN now() END) RETURNING id`,
      [user.rows[0].id,number,t,statusOf(r),base,optedIn(r,t),privacyDate(r),r.source_user_id,JSON.stringify(safeLegacyData(r))])
    const id=membership.rows[0].id;const identity=pick(r,'nif-nie','nif-registrador-escuela')
    await client.query(`INSERT INTO member_profiles(membership_id,first_name,last_name,identity_document,phone,secondary_phone,address,postal_code,city,province,
      public_name,public_email,public_phone,public_address,public_postal_code,public_city,public_province,website,bio,facebook_url,instagram_url,youtube_url,photo_url)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,[id,first,last,identity||null,
      pick(r,'telefono-socio')||null,pick(r,'telefono-socio-secundario')||null,pick(r,'direccion-socio')||null,pick(r,'cp-socio')||null,
      pick(r,'municipio-socio')||null,pick(r,'provincia-socio')||null,pick(r,'nombre-mostrar')||null,pick(r,'email-web')||null,
      pick(r,'telefono-web')||null,pick(r,'direccion-web')||null,pick(r,'cp-web')||null,pick(r,'municipio-web','municipio-directorio')||null,
      pick(r,'provincia-web')||null,pick(r,'user_url')||null,pick(r,'descripcion-profesional','descripcion-profesor','descripcion-escuela')||null,
      pick(r,'facebook')||null,pick(r,'instagram')||null,pick(r,'youtube')||null,pick(r,'profile_photo')||null])
    if(identity)byIdentity.set(identity.toUpperCase().replace(/\s/g,''),id)
    if(t==='student')await client.query('INSERT INTO student_profiles(membership_id,school_origin) VALUES($1,$2)',[id,pick(r,'escuela-estudiante','escuela-formacion')||'Sin especificar'])
    if(t==='professional')await client.query('INSERT INTO professional_profiles(membership_id,training_school,qualification_summary) VALUES($1,$2,$3)',[id,pick(r,'escuela-formacion','escuela-titulacion-profesor')||null,pick(r,'titulacion-profesional','titulacion-profesor')||null])
    if(t==='school')pendingSchools.push({membershipId:id,row:r})
    report.processed++
  }
  for(const s of pendingSchools){const identity=pick(s.row,'nif-registrador-escuela').toUpperCase().replace(/\s/g,'');await client.query(`INSERT INTO school_profiles(membership_id,responsible_professional_membership_id,school_name,description,program_summary,teachers_summary,direction_experience_summary)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,[s.membershipId,byIdentity.get(identity)||null,pick(s.row,'nombre-mostrar','nombre-socio','display_name')||'Escuela sin nombre',pick(s.row,'descripcion-escuela')||null,null,pick(s.row,'formadores')||null,null])}
  await client.query('COMMIT')
  report.databaseCounts=(await client.query(`SELECT member_type,status,COUNT(*)::int count FROM memberships WHERE legacy_source_id IS NOT NULL GROUP BY member_type,status ORDER BY member_type,status`)).rows
  const reportsDirectory=resolve(process.cwd(),'migration-reports');mkdirSync(reportsDirectory,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');const reportPath=resolve(reportsDirectory,`import-${stamp}.json`);writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8')
  console.log(`IMPORTACIÓN COMPLETADA: ${report.processed} altas creadas, ${report.skipped.length} omitidas. Informe: ${reportPath}`)
}catch(error){await client.query('ROLLBACK');throw error}finally{await client.end()}
}
main().catch(error=>{console.error('Error en importación:',error);process.exit(1)})
