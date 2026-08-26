import { z } from 'zod'
import { MEMBER_STATUSES, MEMBER_TYPES } from './domain'

const optionalText = z.string().trim().max(500).optional().or(z.literal(''))
const optionalUrl = z.string().trim().url('URL no válida').optional().or(z.literal(''))

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
  responsibleMemberNumber: optionalText,
  schoolName: optionalText,
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
  if (data.memberType === 'school') {
    if (!data.schoolName) ctx.addIssue({ code: 'custom', path: ['schoolName'], message: 'Indica el nombre de la escuela' })
    if (!data.responsibleMemberNumber) ctx.addIssue({ code: 'custom', path: ['responsibleMemberNumber'], message: 'Indica el número del profesional responsable' })
  }
})

export const profileSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254), firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().max(150), identityDocument: z.string().trim().max(30).optional().or(z.literal('')),
  phone: optionalText, secondaryPhone: optionalText, address: optionalText, postalCode: optionalText,
  city: optionalText, province: optionalText, directoryOptIn: z.boolean(), publicName: optionalText,
  publicEmail: z.string().trim().email().optional().or(z.literal('')), publicPhone: optionalText,
  publicAddress: optionalText, publicPostalCode: optionalText, publicCity: optionalText,
  publicProvince: optionalText, website: optionalUrl, bio: z.string().trim().max(2500).optional().or(z.literal('')),
  facebookUrl: optionalUrl, instagramUrl: optionalUrl, youtubeUrl: optionalUrl,
})

export const eventSchema = z.object({
  title: z.string().trim().min(4).max(180), description: z.string().trim().min(20).max(10000),
  startsAt: z.string().datetime({ local: true }), endsAt: z.string().datetime({ local: true }),
  allDay: z.boolean(), modality: z.enum(['in_person', 'online', 'hybrid']), venueName: optionalText,
  address: optionalText, city: optionalText, province: optionalText, postalCode: optionalText,
  registrationUrl: optionalUrl, publicContact: optionalText, isFree: z.boolean(),
  priceEuros: z.coerce.number().min(0).max(100000).optional(), imageUrl: optionalUrl,
}).refine((data) => new Date(data.endsAt) >= new Date(data.startsAt), { path: ['endsAt'], message: 'La fecha final debe ser posterior' })

export const membershipStatusSchema = z.object({
  membershipId: z.string().uuid(), status: z.enum(MEMBER_STATUSES), reason: z.string().trim().max(1000).optional(),
})
