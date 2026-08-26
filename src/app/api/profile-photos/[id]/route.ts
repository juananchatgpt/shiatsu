import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

interface PhotoRow{mime_type:string;content:Buffer}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getSessionUser();const{id}=await params
  const rows=await query<PhotoRow>(`SELECT ph.mime_type,ph.content FROM membership_profile_photos ph JOIN memberships m ON m.id=ph.membership_id WHERE ph.membership_id=$1 AND ((m.status='active' AND m.directory_opt_in=true AND m.member_type IN ('professional','school')) OR m.user_id=$2 OR $3='admin') LIMIT 1`,[id,user?.id??null,user?.role??null])
  const photo=rows[0];if(!photo)return NextResponse.json({error:'Imagen no encontrada'},{status:404})
  return new NextResponse(new Uint8Array(photo.content),{headers:{'Content-Type':photo.mime_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}})
}
