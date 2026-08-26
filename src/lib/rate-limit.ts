import {createHash}from'crypto'
import{headers}from'next/headers'
import{query}from'./db'
export async function checkPublicRateLimit(scope:string,limit:number,minutes:number){const h=await headers();const ip=(h.get('x-forwarded-for')||h.get('x-real-ip')||'unknown').split(',')[0].trim();const salt=process.env.RATE_LIMIT_SALT||'development-only';const key=scope+':'+createHash('sha256').update(`${salt}:${ip}`).digest('hex');await query('DELETE FROM request_rate_limits WHERE expires_at<now()-interval \'1 day\'');const rows=await query<{count:number}>(`INSERT INTO request_rate_limits(key,count,expires_at) VALUES($1,1,now()+($2||' minutes')::interval)
ON CONFLICT(key) DO UPDATE SET count=CASE WHEN request_rate_limits.expires_at<now() THEN 1 ELSE request_rate_limits.count+1 END,
expires_at=CASE WHEN request_rate_limits.expires_at<now() THEN now()+($2||' minutes')::interval ELSE request_rate_limits.expires_at END RETURNING count`,[key,String(minutes)]);return(rows[0]?.count??1)<=limit}
