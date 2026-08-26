import { NextResponse } from 'next/server'
export function GET(){return NextResponse.json({ok:true,service:'apse-socios',buildTime:process.env.BUILD_TIME??null,time:new Date().toISOString()})}
