import test from 'node:test'
import assert from 'node:assert/strict'
import { canCreateEvents, isPublicDirectoryMember } from '../src/lib/access'
import {adminDeleteMemberSchema,adminManualMemberSchema,adminMemberProfileSchema, registrationSchema, eventSchema } from '../src/lib/validation'

test('un alumno nunca es publicable',()=>{assert.equal(isPublicDirectoryMember('student','active',true),false)})
test('solo profesional/escuela activos y con opt-in son publicables',()=>{
  assert.equal(isPublicDirectoryMember('professional','active',true),true)
  assert.equal(isPublicDirectoryMember('school','inactive',true),false)
  assert.equal(isPublicDirectoryMember('professional','active',false),false)
})
test('solo profesional o escuela activa crea eventos',()=>{
  assert.equal(canCreateEvents({membership_id:'1',member_type:'professional',status:'active',directory_opt_in:false,member_number:null}),true)
  assert.equal(canCreateEvents({membership_id:'1',member_type:'student',status:'active',directory_opt_in:false,member_number:null}),false)
  assert.equal(canCreateEvents({membership_id:'1',member_type:'school',status:'pending',directory_opt_in:false,member_number:null}),false)
})
test('alta de escuela exige profesional responsable',()=>{
  const result=registrationSchema.safeParse({memberType:'school',firstName:'María',lastName:'',identityDocument:'12345678A',phone:'600000000',email:'maria@example.com',password:'segura123',privacyAccepted:'on',insuranceSelected:false,directoryOptIn:false,schoolName:'Escuela Norte',responsibleMemberNumber:''})
  assert.equal(result.success,false)
})
test('un evento no puede terminar antes de comenzar',()=>{
  const result=eventSchema.safeParse({title:'Curso de Shiatsu',description:'Descripción suficientemente larga para validar.',startsAt:'2026-09-20T18:00',endsAt:'2026-09-20T17:00',allDay:false,modality:'in_person',isFree:true})
  assert.equal(result.success,false)
})

test('la descripción corta del evento devuelve un mensaje claro en español',()=>{
  const result=eventSchema.safeParse({title:'Curso de Shiatsu',description:'Muy breve',startsAt:'2026-09-20T17:00',endsAt:'2026-09-20T18:00',allDay:false,modality:'in_person',isFree:true})
  assert.equal(result.success,false)
  if(!result.success)assert.equal(result.error.issues[0]?.message,'La descripción debe tener al menos 20 caracteres')
})

test('el administrador debe repetir correctamente la nueva contraseña',()=>{
  const result=adminMemberProfileSchema.safeParse({membershipId:'67dbc9f8-bf06-4b5c-9396-297dd74d571a',email:'socio@example.com',firstName:'Socio',lastName:'APSE',directoryOptIn:false,insuranceSelected:false,newPassword:'segura123',confirmPassword:'distinta123'})
  assert.equal(result.success,false)
})

test('el alta manual de escuela exige nombre del centro',()=>{
  const result=adminManualMemberSchema.safeParse({memberType:'school',status:'active',email:'escuela@example.com',password:'segura123',firstName:'Escuela',lastName:'',directoryOptIn:false,insuranceSelected:false,schoolName:''})
  assert.equal(result.success,false)
})

test('el borrado administrativo exige confirmación literal',()=>{
  assert.equal(adminDeleteMemberSchema.safeParse({membershipId:'4fda7462-72dc-463c-b7ad-070cab5c7f0b',confirmation:'borrar'}).success,false)
  assert.equal(adminDeleteMemberSchema.safeParse({membershipId:'4fda7462-72dc-463c-b7ad-070cab5c7f0b',confirmation:'BORRAR'}).success,true)
})
