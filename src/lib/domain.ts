export const MEMBER_TYPES = ['student', 'professional', 'school'] as const
export type MemberType = (typeof MEMBER_TYPES)[number]

export const MEMBER_STATUSES = ['pending', 'active', 'inactive', 'suspended', 'rejected'] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export const EVENT_STATUSES = ['draft', 'pending_review', 'approved', 'rejected', 'cancelled'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const memberTypeLabels: Record<MemberType, string> = {
  student: 'Alumno', professional: 'Profesional', school: 'Escuela',
}
export const memberStatusLabels: Record<MemberStatus, string> = {
  pending: 'Pendiente', active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido', rejected: 'Rechazado',
}
export const eventStatusLabels: Record<EventStatus, string> = {
  draft: 'Borrador', pending_review: 'Pendiente de revisión', approved: 'Aprobado', rejected: 'Rechazado', cancelled: 'Cancelado',
}

export const FEES_CENTS: Record<MemberType, number> = {
  student: 4000, professional: 9500, school: 9500,
}

export const SPANISH_PROVINCES = [
  'A Coruña','Araba/Álava','Albacete','Alicante/Alacant','Almería','Asturias','Ávila','Badajoz',
  'Barcelona','Bizkaia','Burgos','Cáceres','Cádiz','Cantabria','Castellón/Castelló','Ceuta',
  'Ciudad Real','Córdoba','Cuenca','Gipuzkoa','Girona','Granada','Guadalajara','Huelva','Huesca',
  'Illes Balears','Jaén','La Rioja','Las Palmas','León','Lleida','Lugo','Madrid','Málaga','Melilla',
  'Murcia','Navarra','Ourense','Palencia','Pontevedra','Salamanca','Santa Cruz de Tenerife',
  'Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia/València','Valladolid','Zamora','Zaragoza',
] as const

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function statusTone(status: string) {
  if (status === 'active' || status === 'approved') return 'bg-emerald-100 text-emerald-800'
  if (status === 'pending' || status === 'pending_review') return 'bg-amber-100 text-amber-800'
  if (status === 'rejected' || status === 'suspended') return 'bg-red-100 text-red-800'
  return 'bg-stone-100 text-stone-700'
}
