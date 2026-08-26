import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

interface StoredDocument{original_name:string;mime_type:string;content:Buffer}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getSessionUser();if(!user)return NextResponse.json({error:'No autenticado'},{status:401})
  const{id}=await params
  const rows=await query<StoredDocument>(`SELECT d.original_name,d.mime_type,d.content FROM membership_documents d JOIN memberships m ON m.id=d.membership_id WHERE d.id=$1 AND d.content IS NOT NULL AND (m.user_id=$2 OR $3='admin') LIMIT 1`,[id,user.id,user.role])
  const document=rows[0];if(!document)return NextResponse.json({error:'Documento no encontrado'},{status:404})
  const encoded=encodeURIComponent(document.original_name)
  return new NextResponse(new Uint8Array(document.content),{headers:{'Content-Type':document.mime_type,'Content-Disposition':`attachment; filename="documento"; filename*=UTF-8''${encoded}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
}
