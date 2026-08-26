import { NextRequest, NextResponse } from 'next/server'
import { listPublicDirectory } from '@/features/memberships/service'
import { checkPublicRateLimit } from '@/lib/rate-limit'

export const dynamic='force-dynamic'
export async function GET(req:NextRequest){if(!await checkPublicRateLimit('api-directory',120,10))return NextResponse.json({error:'Demasiadas solicitudes'},{status:429});const s=req.nextUrl.searchParams;const page=Math.max(1,Number(s.get('page')||1)||1);const limit=Math.min(100,Math.max(1,Number(s.get('limit')||24)||24));const type=s.get('type')||undefined;if(type&&!['professional','school'].includes(type))return NextResponse.json({error:'Tipo no válido'},{status:400});const rows=await listPublicDirectory({type,province:s.get('province')||undefined,search:s.get('q')?.slice(0,100)||undefined,limit,offset:(page-1)*limit});return NextResponse.json({data:rows,count:rows.length,page,limit},{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=300','Access-Control-Allow-Origin':'*'}})}
