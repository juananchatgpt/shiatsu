import { eventStatusLabels, memberStatusLabels, statusTone, type EventStatus, type MemberStatus } from '@/lib/domain'

export function StatusBadge({status}:{status:MemberStatus|EventStatus}){
  const label=(memberStatusLabels as Record<string,string>)[status]??(eventStatusLabels as Record<string,string>)[status]??status
  return <span className={`apse-pill ${statusTone(status)}`}>{label}</span>
}
