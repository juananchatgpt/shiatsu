import { NextRequest,NextResponse } from 'next/server'
import { listPublicEvents } from '@/features/events/service'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){const rows=await listPublicEvents(req.nextUrl.searchParams.get('from')||undefined);return NextResponse.json({data:rows,count:rows.length},{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=300','Access-Control-Allow-Origin':'*'}})}
