import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { RegistrationForm } from '@/features/memberships/components/registration-form'
import type { MemberType } from '@/lib/domain'

const map:Record<string,MemberType>={alumno:'student',profesional:'professional',escuela:'school'}
export default async function RegistrationPage({params}:{params:Promise<{tipo:string}>}){
  const {tipo}=await params; const memberType=map[tipo]; if(!memberType)notFound()
  return <><SiteHeader/><main className="apse-container py-12"><RegistrationForm memberType={memberType}/></main></>
}
