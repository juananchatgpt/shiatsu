import {NextResponse} from 'next/server'
import {getSessionUser} from '@/lib/auth'
import {query} from '@/lib/db'

interface CoverRow{mime_type:string;content:Buffer}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getSessionUser();const{id}=await params
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Portada no encontrada'},{status:404})
  const rows=await query<CoverRow>(`SELECT ci.mime_type,ci.content FROM membership_cover_images ci
    JOIN memberships m ON m.id=ci.membership_id WHERE ci.membership_id=$1
    AND ((m.status='active' AND m.directory_opt_in=true AND m.member_type='school') OR m.user_id=$2 OR $3='admin') LIMIT 1`,
    [id,user?.id??null,user?.role??null])
  const cover=rows[0];if(!cover)return NextResponse.json({error:'Portada no encontrada'},{status:404})
  return new NextResponse(new Uint8Array(cover.content),{headers:{'Content-Type':cover.mime_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}})
}
