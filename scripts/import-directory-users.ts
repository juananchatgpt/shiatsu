import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { parse } from 'csv-parse/sync'
import bcrypt from 'bcryptjs'
import { Client } from 'pg'
import { loadEnvLocal } from './load-env'

type Row = Record<string, string>
type Candidate = { row: Row; memberType: 'student' | 'professional' }

const apply = process.argv.includes('--apply')
const argPath = process.argv.find((value) => value.toLowerCase().endsWith('.csv'))
const csvPath = resolve(process.cwd(), argPath ?? '')
if (!argPath || !existsSync(csvPath)) throw new Error('Indica la ruta del export CSV del directorio')
const rows = parse(readFileSync(csvPath), { columns: true, skip_empty_lines: true, bom: true, relax_quotes: true }) as Row[]

const pick = (row: Row, ...keys: string[]) => keys.map((key) => (row[key] ?? '').trim()).find(Boolean) ?? ''
const identityKey = (value: string) => value.toUpperCase().replace(/[^0-9A-Z]/g, '')
const safeLegacyData = (row: Row) => {
  const copy = { ...row }
  for (const key of ['user_pass', 'IBAN', 'iban-escuela-estudiante']) delete copy[key]
  return copy
}

export function classifyCandidate(row: Row): Candidate | null {
  const role = pick(row, 'role')
  const email = pick(row, 'user_email').toLowerCase()
  const identity = identityKey(pick(row, 'nif-nie'))
  const studentSchool = pick(row, 'escuela-estudiante')
  const trainingSchool = pick(row, 'escuela-formacion')
  const testText = `${pick(row, 'display_name', 'first_name')} ${pick(row, 'observaciones')}`
  if (!['um_socio', 'um_socio-administrador'].includes(role) || !email || !identity || /(test|prueba|webmaster)/i.test(testText)) return null
  if (studentSchool && !trainingSchool) return { row, memberType: 'student' }
  if (trainingSchool) return { row, memberType: 'professional' }
  return null
}

async function main() {
  loadEnvLocal()
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está definida')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const existing = await client.query<{ email: string; member_number: string | null; identity_document: string | null }>(
      `SELECT u.email,m.member_number,p.identity_document FROM memberships m
       JOIN users u ON u.id=m.user_id JOIN member_profiles p ON p.membership_id=m.id`,
    )
    const emails = new Set(existing.rows.map((row) => row.email.trim().toLowerCase()))
    const numbers = new Set(existing.rows.map((row) => row.member_number?.trim()).filter(Boolean))
    const identities = new Set(existing.rows.map((row) => identityKey(row.identity_document ?? '')).filter(Boolean))
    const candidates = rows.map(classifyCandidate).filter((candidate): candidate is Candidate => Boolean(candidate))
    const additions = candidates.filter(({ row }) => {
      const email = pick(row, 'user_email').toLowerCase()
      const number = pick(row, 'numero-socio')
      const identity = identityKey(pick(row, 'nif-nie'))
      return !emails.has(email) && (!number || !numbers.has(number)) && !identities.has(identity)
    })
    const summary = {
      csvRows: rows.length,
      eligibleCandidates: candidates.length,
      alreadyPresent: candidates.length - additions.length,
      additions: additions.map(({ row, memberType }) => ({
        email: pick(row, 'user_email').toLowerCase(),
        name: `${pick(row, 'nombre-socio', 'first_name')} ${pick(row, 'apellidos-socio', 'last_name')}`.trim(),
        memberType,
        memberNumber: pick(row, 'numero-socio') || null,
      })),
      statusAssigned: 'inactive',
      directoryOptInAssigned: false,
      noEmailsSent: true,
    }
    console.log(JSON.stringify(summary, null, 2))
    if (!apply) {
      console.log('SIMULACIÓN: no se ha escrito en PostgreSQL. Usa --apply solo tras revisar el resultado.')
      return
    }

    await client.query('BEGIN')
    const unusableHash = await bcrypt.hash(randomBytes(48).toString('hex'), 10)
    try {
      for (const { row, memberType } of additions) {
        const firstName = pick(row, 'nombre-socio', 'first_name') || 'Sin nombre'
        const lastName = pick(row, 'apellidos-socio', 'last_name')
        const email = pick(row, 'user_email').toLowerCase()
        const user = await client.query<{ id: string }>(
          `INSERT INTO users(email,password_hash,full_name,role,password_reset_required,active)
           VALUES($1,$2,$3,'member',true,true) RETURNING id`,
          [email, unusableHash, `${firstName} ${lastName}`.trim()],
        )
        const membership = await client.query<{ id: string }>(
          `INSERT INTO memberships(user_id,member_number,member_type,status,insurance_selected,base_fee_cents,
             insurance_fee_cents,directory_opt_in,privacy_accepted_at,legacy_source_id,legacy_data,internal_notes)
           VALUES($1,$2,$3,'inactive',false,$4,0,false,now(),$5,$6::jsonb,$7) RETURNING id`,
          [user.rows[0].id, pick(row, 'numero-socio') || null, memberType, memberType === 'student' ? 4000 : 9500,
            `directory:${pick(row, 'user_login')}`, JSON.stringify(safeLegacyData(row)), pick(row, 'observaciones') || null],
        )
        const id = membership.rows[0].id
        await client.query(
          `INSERT INTO member_profiles(membership_id,first_name,last_name,identity_document,phone,secondary_phone,address,
             postal_code,city,province,public_name,public_email,public_phone,public_address,public_postal_code,public_city,
             public_province,website,bio,facebook_url,instagram_url,youtube_url,twitter_url)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
          [id, firstName, lastName, pick(row, 'nif-nie'), pick(row, 'telefono-socio') || null,
            pick(row, 'telefono-socio-secundario') || null, pick(row, 'direccion-socio') || null, pick(row, 'cp-socio') || null,
            pick(row, 'municipio-socio') || null, pick(row, 'provincia-socio') || null, null,
            pick(row, 'email-web') || null, pick(row, 'telefono-web') || null, pick(row, 'direccion-web') || null,
            pick(row, 'cp-web') || null, pick(row, 'municipio-web') || null, pick(row, 'provincia-web') || null,
            pick(row, 'user_url') || null, pick(row, 'descripcion-profesional') || null, pick(row, 'facebook') || null,
            pick(row, 'instagram') || null, pick(row, 'youtube') || null, pick(row, 'twitter') || null],
        )
        if (memberType === 'student') {
          await client.query('INSERT INTO student_profiles(membership_id,school_origin) VALUES($1,$2)', [id, pick(row, 'escuela-estudiante')])
        } else {
          const year = Number.parseInt(pick(row, 'inicio-docencia-year-profesor'), 10)
          await client.query(
            `INSERT INTO professional_profiles(membership_id,training_school,qualification_summary,teaching_level,teaching_schools,teaching_since_year)
             VALUES($1,$2,NULL,$3,$4,$5)`,
            [id, pick(row, 'escuela-formacion') || null, pick(row, 'nivel-ensenanza-profesor') || null,
              pick(row, 'escuelas-imparte-profesor') || null, Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null],
          )
        }
        await client.query(
          `INSERT INTO audit_log(action,entity_type,entity_id,details)
           VALUES('membership.directory_imported','membership',$1,$2::jsonb)`,
          [id, JSON.stringify({ source: 'secondary_directory_export', status: 'inactive', noEmailsSent: true })],
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

    const reportsDirectory = resolve(process.cwd(), 'migration-reports')
    mkdirSync(reportsDirectory, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = resolve(reportsDirectory, `directory-import-${stamp}.json`)
    writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8')
    console.log(`IMPORTACIÓN COMPLETADA: ${additions.length} socios inactivos creados. No se ha enviado ningún correo. Informe: ${reportPath}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => { console.error('Error en importación:', error); process.exit(1) })
