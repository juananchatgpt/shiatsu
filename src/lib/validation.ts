import { z } from 'zod'
import { EVENT_STATUSES, MEMBER_STATUSES, MEMBER_TYPES } from './domain'

const optionalText = z.string().trim().max(500).optional().or(z.literal(''))
const optionalUrl = z.string().trim().url('URL no válida').optional().or(z.literal(''))
const optionalSocial = z.string().trim().max(500).optional().or(z.literal(''))

export const registrationSchema = z.object({
  memberType: z.enum(MEMBER_TYPES),
  firstName: z.string().trim().min(2, 'Indica el nombre').max(100),
  lastName: z.string().trim().max(150).default(''),
  identityDocument: z.string().trim().min(5, 'Indica el DNI/NIE').max(30),
  phone: z.string().trim().min(6, 'Indica el teléfono').max(30),
  email: z.string().trim().toLowerCase().email('Email no válido').max(254),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  privacyAccepted: z.literal('on', { errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }) }),
  schoolOrigin: optionalText,
  trainingSchool: optionalText,
  qualificationSummary: z.string().trim().max(2500).optional().or(z.literal('')),
  responsibleMemberNumber: optionalText,
  schoolName: optionalText,
  schoolDescription: z.string().trim().max(2500).optional().or(z.literal('')),
  programSummary: z.string().trim().max(5000).optional().or(z.literal('')),
  teachersSummary: z.string().trim().max(5000).optional().or(z.literal('')),
  directionExperienceSummary: z.string().trim().max(5000).optional().or(z.literal('')),
  insuranceSelected: z.boolean().default(false),
  directoryOptIn: z.boolean().default(false),
  publicName: optionalText,
  publicEmail: z.string().trim().email('Email público no válido').optional().or(z.literal('')),
  publicPhone: optionalText,
  publicProvince: optionalText,
  publicCity: optionalText,
  website: optionalUrl,
  bio: z.string().trim().max(2500).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.memberType === 'student' && !data.schoolOrigin) ctx.addIssue({ code: 'custom', path: ['schoolOrigin'], message: 'Indica la escuela de procedencia' })
  if (data.memberType === 'professional') {
    if (!data.trainingSchool) ctx.addIssue({ code: 'custom', path: ['trainingSchool'], message: 'Indica la escuela de formación' })
    if (!data.qualificationSummary) ctx.addIssue({ code: 'custom', path: ['qualificationSummary'], message: 'Resume tu titulación o formación' })
  }
  if (data.memberType === 'school') {
    if (!data.schoolName) ctx.addIssue({ code: 'custom', path: ['schoolName'], message: 'Indica el nombre de la escuela' })
    if (!data.responsibleMemberNumber) ctx.addIssue({ code: 'custom', path: ['responsibleMemberNumber'], message: 'Indica el número del profesional responsable' })
    if (!data.programSummary) ctx.addIssue({ code: 'custom', path: ['programSummary'], message: 'Resume el programa formativo' })
    if (!data.teachersSummary) ctx.addIssue({ code: 'custom', path: ['teachersSummary'], message: 'Indica el equipo docente' })
    if (!data.directionExperienceSummary) ctx.addIssue({ code: 'custom', path: ['directionExperienceSummary'], message: 'Indica la experiencia de la dirección' })
  }
})

export const profileSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254), firstName: z.string().trim().min(2).max(100),
  currentPassword: z.string().max(128).optional().or(z.literal('')),
  lastName: z.string().trim().max(150), identityDocument: z.string().trim().max(30).optional().or(z.literal('')),
  phone: optionalText, secondaryPhone: optionalText, address: optionalText, postalCode: optionalText,
  city: optionalText, province: optionalText, directoryOptIn: z.boolean(), publicName: optionalText,
  publicEmail: z.string().trim().email().optional().or(z.literal('')), publicPhone: optionalText,
  publicAddress: optionalText, publicPostalCode: optionalText, publicCity: optionalText,
  publicProvince: optionalText, website: optionalUrl, bio: z.string().trim().max(2500).optional().or(z.literal('')),
  facebookUrl: optionalSocial, instagramUrl: optionalSocial, youtubeUrl: optionalSocial, twitterUrl: optionalSocial,
  insuranceSelected: z.boolean(), schoolOrigin: optionalText, trainingSchool: optionalText,
  qualificationSummary: z.string().trim().max(2500).optional().or(z.literal('')),
  teachingLevel: optionalText, teachingSchools: z.string().trim().max(2500).optional().or(z.literal('')),
  teachingSinceYear: z.union([z.literal(''), z.coerce.number().int().min(1900).max(2100)]).optional(),
  schoolName: optionalText, schoolDescription: z.string().trim().max(2500).optional().or(z.literal('')),
  centerType: optionalText, languages: optionalText,
  programSummary: z.string().trim().max(5000).optional().or(z.literal('')),
  teachersSummary: z.string().trim().max(5000).optional().or(z.literal('')),
  directionExperienceSummary: z.string().trim().max(5000).optional().or(z.literal('')),
})

export const eventSchema = z.object({
  title: z.string().trim().min(4, 'El título debe tener al menos 4 caracteres').max(180, 'El título no puede superar los 180 caracteres'),
  description: z.string().trim().min(20, 'La descripción debe tener al menos 20 caracteres').max(10000, 'La descripción es demasiado larga'),
  startsAt: z.string().datetime({ local: true, message: 'Indica una fecha y hora de inicio válidas' }),
  endsAt: z.string().datetime({ local: true, message: 'Indica una fecha y hora de fin válidas' }),
  allDay: z.boolean(), modality: z.enum(['in_person', 'online', 'hybrid']), venueName: optionalText,
  address: optionalText, city: optionalText, province: optionalText, postalCode: optionalText,
  registrationUrl: optionalUrl, publicContact: optionalText, isFree: z.boolean(),
  priceEuros: z.coerce.number().min(0).max(100000).optional(), imageUrl: optionalUrl,
}).refine((data) => new Date(data.endsAt) >= new Date(data.startsAt), { path: ['endsAt'], message: 'La fecha final debe ser posterior a la fecha de inicio' })

export const adminEventUpdateSchema = eventSchema.and(z.object({
  eventId: z.string().uuid('Evento no válido'),
  organizerMembershipId: z.string().uuid('Selecciona un organizador válido'),
  status: z.enum(EVENT_STATUSES),
  moderationNotes: z.string().trim().max(5000, 'Las notas no pueden superar los 5.000 caracteres').optional().or(z.literal('')),
  featured: z.boolean(),
}))

export const adminEventCreateSchema = eventSchema.and(z.object({
  organizerMembershipId: z.string().uuid('Selecciona el profesional o escuela que organiza el evento'),
  status: z.enum(['draft','pending_review','approved']),
}))

export const membershipStatusSchema = z.object({
  membershipId: z.string().uuid(), status: z.enum(MEMBER_STATUSES), reason: z.string().trim().max(1000).optional(),
})

export const adminDeleteMemberSchema = z.object({
  membershipId: z.string().uuid(),
  confirmation: z.literal('BORRAR', { errorMap: () => ({ message: 'Escribe BORRAR para confirmar' }) }),
})

export const adminMemberProfileSchema = profileSchema.extend({
  membershipId:z.string().uuid(),memberNumber:z.string().trim().max(50).optional().or(z.literal('')),
  anniversaryDate:z.string().date().optional().or(z.literal('')),internalNotes:z.string().trim().max(5000).optional().or(z.literal('')),
  responsibleMemberNumber:optionalText,newPassword:z.string().max(128).optional().or(z.literal('')),
  confirmPassword:z.string().max(128).optional().or(z.literal('')),
}).superRefine((data,ctx)=>{
  if(data.newPassword&&data.newPassword.length<8)ctx.addIssue({code:'custom',path:['newPassword'],message:'La nueva contraseña debe tener al menos 8 caracteres'})
  if(data.newPassword!==data.confirmPassword)ctx.addIssue({code:'custom',path:['confirmPassword'],message:'Las contraseñas no coinciden'})
})

export const adminManualMemberSchema=z.object({
  memberType:z.enum(MEMBER_TYPES),status:z.enum(MEMBER_STATUSES),email:z.string().trim().toLowerCase().email().max(254),
  password:z.string().min(8,'La contraseña debe tener al menos 8 caracteres').max(128),
  firstName:z.string().trim().min(2,'Indica el nombre').max(100),lastName:z.string().trim().max(150),
  memberNumber:z.string().trim().max(50).optional().or(z.literal('')),anniversaryDate:z.string().date().optional().or(z.literal('')),
  identityDocument:z.string().trim().max(30).optional().or(z.literal('')),phone:optionalText,city:optionalText,province:optionalText,
  directoryOptIn:z.boolean(),insuranceSelected:z.boolean(),schoolOrigin:optionalText,trainingSchool:optionalText,
  qualificationSummary:z.string().trim().max(2500).optional().or(z.literal('')),schoolName:optionalText,
  responsibleMemberNumber:optionalText,publicName:optionalText,publicEmail:z.string().trim().email().optional().or(z.literal('')),
  publicPhone:optionalText,publicCity:optionalText,publicProvince:optionalText,website:optionalUrl,bio:z.string().trim().max(2500).optional().or(z.literal('')),
}).superRefine((data,ctx)=>{
  if(data.memberType==='school'&&!data.schoolName)ctx.addIssue({code:'custom',path:['schoolName'],message:'Indica el nombre de la escuela'})
})
