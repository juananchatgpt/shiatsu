import { NextRequest, NextResponse } from 'next/server'
import { listPublicDirectory } from '@/features/memberships/service'

export const dynamic='force-dynamic'
export async function GET(req:NextRequest){const s=req.nextUrl.searchParams;const rows=await listPublicDirectory({type:s.get('type')||undefined,province:s.get('province')||undefined,search:s.get('q')||undefined});return NextResponse.json({data:rows,count:rows.length},{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=300','Access-Control-Allow-Origin':'*'}})}
