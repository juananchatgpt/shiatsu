import { NextRequest,NextResponse } from 'next/server'
import { listPublicEvents } from '@/features/events/service'
import { toPublicEvent } from '@/features/events/public'
import { checkPublicRateLimit } from '@/lib/rate-limit'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){if(!await checkPublicRateLimit('api-events',120,10))return NextResponse.json({error:'Demasiadas solicitudes'},{status:429});const s=req.nextUrl.searchParams;const from=s.get('from')||undefined;if(from&&Number.isNaN(new Date(from).getTime()))return NextResponse.json({error:'Fecha no válida'},{status:400});const page=Math.max(1,Number(s.get('page')||1)||1);const limit=Math.min(100,Math.max(1,Number(s.get('limit')||24)||24));const rows=await listPublicEvents(from,limit,(page-1)*limit);const data=rows.map(toPublicEvent);return NextResponse.json({data,count:data.length,page,limit},{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=300','Access-Control-Allow-Origin':'*'}})}
