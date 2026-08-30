const TIME_ZONE = 'Europe/Madrid'

export function madridDateKey(value:string|Date){
  return new Intl.DateTimeFormat('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:TIME_ZONE}).format(new Date(value))
}

export function madridMonth(value:string|Date){
  const parts=new Intl.DateTimeFormat('en',{year:'numeric',month:'numeric',timeZone:TIME_ZONE}).formatToParts(new Date(value))
  return {year:Number(parts.find(part=>part.type==='year')?.value),month:Number(parts.find(part=>part.type==='month')?.value)-1}
}

export function calendarCells(year:number,month:number){
  const leading=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7
  const days=new Date(Date.UTC(year,month+1,0)).getUTCDate()
  return [...Array<null>(leading).fill(null),...Array.from({length:days},(_,index)=>index+1)]
}

export function occursOnDay(startsAt:string|Date,endsAt:string|Date,dayKey:string){
  return madridDateKey(startsAt)<=dayKey&&madridDateKey(endsAt)>=dayKey
}
