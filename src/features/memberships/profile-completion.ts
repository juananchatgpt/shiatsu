import type { MemberType } from '@/lib/domain'

export interface ProfileCompletionData {
  firstName?: string | null
  lastName?: string | null
  identityDocument?: string | null
  phone?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  province?: string | null
  directoryOptIn?: boolean
  publicName?: string | null
  publicEmail?: string | null
  publicPhone?: string | null
  publicAddress?: string | null
  publicPostalCode?: string | null
  publicCity?: string | null
  publicProvince?: string | null
  publicAddressOptIn?: boolean
  bio?: string | null
  homeVisitAvailable?: boolean
  homeVisitNotes?: string | null
  schoolOrigin?: string | null
  trainingSchool?: string | null
  qualificationSummary?: string | null
  schoolName?: string | null
  programSummary?: string | null
  teachersSummary?: string | null
  directionExperienceSummary?: string | null
}

const present = (value: string | null | undefined) => Boolean(value?.trim())

export function getProfileCompletionIssues(memberType: MemberType, data: ProfileCompletionData): string[] {
  const issues: string[] = []
  const require = (value: string | null | undefined, label: string) => { if (!present(value)) issues.push(label) }

  require(data.firstName, 'nombre')
  require(data.lastName, 'apellidos')
  require(data.identityDocument, 'DNI/NIE')
  require(data.phone, 'teléfono')
  require(data.address, 'dirección')
  require(data.postalCode, 'código postal')
  require(data.city, 'municipio')
  require(data.province, 'provincia')
  require(data.bio, 'biografía o presentación')

  if (memberType === 'student') require(data.schoolOrigin, 'escuela de procedencia')
  if (memberType === 'professional') {
    require(data.trainingSchool, 'escuela de formación')
    require(data.qualificationSummary, 'titulación o formación')
  }
  if (memberType === 'school') {
    require(data.schoolName, 'nombre de la escuela')
    require(data.programSummary, 'programa formativo')
    require(data.teachersSummary, 'equipo docente')
    require(data.directionExperienceSummary, 'experiencia de la dirección')
  }

  if (memberType !== 'student' && data.directoryOptIn) {
    require(data.publicName, 'nombre público')
    require(data.publicEmail, 'email público')
    require(data.publicPhone, 'teléfono público')
    if (data.publicAddressOptIn) {
      require(data.publicAddress, 'dirección pública')
      require(data.publicPostalCode, 'código postal público')
      require(data.publicCity, 'municipio público')
      require(data.publicProvince, 'provincia pública')
    }
  }

  return issues
}
