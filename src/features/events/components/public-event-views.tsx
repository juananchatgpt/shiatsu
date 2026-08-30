'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatMoney } from '@/lib/domain'
import type { PublicEvent } from '../public'
import { calendarCells, madridMonth, occursOnDay } from '../calendar'

const TIME_ZONE='Europe/Madrid'
const WEEKDAYS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

export function PublicEventViews({events}:{events:PublicEvent[]}){
  const [view,setView]=useState<'list'|'month'>('list')
  return <div>
    <div className="mb-6 flex justify-end"><div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm" aria-label="Vista de eventos">
      <button type="button" onClick={()=>setView('list')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view==='list'?'bg-emerald-950 text-white':'text-stone-600 hover:bg-stone-50'}`} aria-pressed={view==='list'}>Lista</button>
      <button type="button" onClick={()=>setView('month')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view==='month'?'bg-emerald-950 text-white':'text-stone-600 hover:bg-stone-50'}`} aria-pressed={view==='month'}>Mes</button>
    </div></div>
    {view==='list'?<PublicEventList events={events}/>:<MonthCalendar events={events}/>} 
  </div>
}

function PublicEventList({events}:{events:PublicEvent[]}){return <div className="space-y-4">{events.map((event,index)=><article key={event.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex sm:gap-6"><DateBadge value={event.startsAt}/>{event.imageUrl&&<div className="mb-5 shrink-0 overflow-hidden rounded-xl sm:mb-0 sm:w-64 lg:w-80"><Image className="aspect-video h-full w-full object-cover" src={event.imageUrl} alt={`Imagen de ${event.title}`} width={800} height={450} loading={index===0?'eager':'lazy'} unoptimized/></div>}<div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-stone-400">{event.organizerName}</p><h2 className="mt-1 text-xl font-semibold text-emerald-950">{event.title}</h2><p className="mt-2 text-sm text-stone-600">{dateRange(event.startsAt,event.endsAt,event.allDay)} · {modalityLabel(event.modality)}</p>{(event.venueName||event.city)&&<p className="mt-1 text-sm text-stone-500">{[event.venueName,event.city,event.province].filter(Boolean).join(' · ')}</p>}<p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{event.description}</p><div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-emerald-900"><span>{event.isFree?'Gratuito':formatMoney(event.priceCents??0)}</span>{event.registrationUrl&&<a target="_blank" rel="noreferrer" href={event.registrationUrl}>Inscripción ↗</a>}</div></div></article>)}{!events.length&&<EmptyEvents/>}</div>}

function MonthCalendar({events}:{events:PublicEvent[]}){
  const nextEvent=events.reduce<PublicEvent|undefined>((earliest,event)=>!earliest||new Date(event.startsAt)<new Date(earliest.startsAt)?event:earliest,undefined)
  const initial=madridMonth(nextEvent?.startsAt??new Date())
  const [visible,setVisible]=useState(initial)
  const cells=calendarCells(visible.year,visible.month)
  const monthLabel=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(visible.year,visible.month,1)))
  const move=(amount:number)=>{const next=new Date(Date.UTC(visible.year,visible.month+amount,1));setVisible({year:next.getUTCFullYear(),month:next.getUTCMonth()})}
  return <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-4 py-4 sm:px-6"><button type="button" onClick={()=>move(-1)} className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-stone-50" aria-label="Mes anterior">←</button><h2 className="text-center text-xl font-semibold capitalize text-emerald-950">{monthLabel}</h2><button type="button" onClick={()=>move(1)} className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-stone-50" aria-label="Mes siguiente">→</button></div>
    <div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">{WEEKDAYS.map(day=><div key={day} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-stone-500">{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((day,index)=>day===null?<div key={`empty-${index}`} className="min-h-32 border-b border-r border-stone-100 bg-stone-50/50"/>:<CalendarDay key={day} day={day} year={visible.year} month={visible.month} events={events}/>)}</div></div></div>
  </section>
}

function CalendarDay({day,year,month,events}:{day:number;year:number;month:number;events:PublicEvent[]}){
  const key=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const dayEvents=events.filter(event=>occursOnDay(event.startsAt,event.endsAt,key))
  return <div className="min-h-32 border-b border-r border-stone-100 p-2"><span className="text-sm font-semibold text-stone-500">{day}</span><div className="mt-2 space-y-1.5">{dayEvents.map(event=>event.registrationUrl?<a key={event.id} href={event.registrationUrl} target="_blank" rel="noreferrer" className="block rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-semibold leading-4 text-emerald-950 hover:bg-emerald-100"><span className="block font-normal text-emerald-700">{eventTime(event)}</span>{event.title}</a>:<div key={event.id} className="rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-semibold leading-4 text-emerald-950"><span className="block font-normal text-emerald-700">{eventTime(event)}</span>{event.title}</div>)}</div></div>
}

function DateBadge({value}:{value:string}){const date=new Date(value);return <div className="mb-4 w-20 shrink-0 text-center sm:mb-0"><span className="block text-xs font-bold uppercase text-[var(--apse-clay)]">{new Intl.DateTimeFormat('es-ES',{month:'short',timeZone:TIME_ZONE}).format(date)}</span><strong className="block text-3xl text-emerald-950">{new Intl.DateTimeFormat('es-ES',{day:'2-digit',timeZone:TIME_ZONE}).format(date)}</strong></div>}
function EmptyEvents(){return <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">No hay eventos para mostrar.</div>}
function eventTime(event:PublicEvent){return event.allDay?'Todo el día':new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:TIME_ZONE}).format(new Date(event.startsAt))}
function modalityLabel(modality:string){return modality==='online'?'Online':modality==='hybrid'?'Híbrido':'Presencial'}
function dateRange(start:string,end:string,allDay:boolean){const options: Intl.DateTimeFormatOptions=allDay?{dateStyle:'medium',timeZone:TIME_ZONE}:{dateStyle:'medium',timeStyle:'short',timeZone:TIME_ZONE};const formatter=new Intl.DateTimeFormat('es-ES',options);return `${formatter.format(new Date(start))} — ${formatter.format(new Date(end))}`}
