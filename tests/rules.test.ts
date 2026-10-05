import test from 'node:test'
import assert from 'node:assert/strict'
import { canCreateEvents, isPublicDirectoryMember } from '../src/lib/access'
import {adminDeleteMemberSchema,adminEventCreateSchema,adminEventUpdateSchema,adminManualMemberSchema,adminMemberProfileSchema, registrationSchema, eventSchema } from '../src/lib/validation'
import {getProfileCompletionIssues} from '../src/features/memberships/profile-completion'

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

test('el pre-registro solo considera completo el perfil con datos privados obligatorios',()=>{
  const complete={firstName:'Ana',lastName:'Pérez',identityDocument:'12345678A',phone:'600000000',address:'Calle Mayor 1',postalCode:'45001',city:'Toledo',province:'Toledo',schoolOrigin:'Escuela Centro',bio:'Profesional formada en shiatsu y terapias manuales.',directoryOptIn:false}
  assert.deepEqual(getProfileCompletionIssues('student',complete),[])
  assert.ok(getProfileCompletionIssues('student',{...complete,address:''}).includes('dirección'))
})

test('si se solicita directorio también son obligatorios los datos públicos esenciales',()=>{
  const base={firstName:'Ana',lastName:'Pérez',identityDocument:'12345678A',phone:'600000000',address:'Calle Mayor 1',postalCode:'45001',city:'Toledo',province:'Toledo',bio:'Profesional formada en shiatsu y terapias manuales.',trainingSchool:'APSE',qualificationSummary:'Formación completa'}
  const issues=getProfileCompletionIssues('professional',{...base,directoryOptIn:true})
  assert.ok(issues.includes('nombre público'))
  assert.equal(getProfileCompletionIssues('professional',{...base,directoryOptIn:false}).length,0)
})

test('la dirección pública requiere autorización expresa para completar sus datos',()=>{
  const base={firstName:'Ana',lastName:'Pérez',identityDocument:'12345678A',phone:'600000000',address:'Calle Mayor 1',postalCode:'45001',city:'Toledo',province:'Toledo',bio:'Profesional formada en shiatsu y terapias manuales.',trainingSchool:'APSE',qualificationSummary:'Formación completa',directoryOptIn:true,publicName:'Ana Shiatsu',publicEmail:'ana@example.com',publicPhone:'600000000'}
  assert.equal(getProfileCompletionIssues('professional',{...base,publicAddressOptIn:false}).length,0)
  assert.ok(getProfileCompletionIssues('professional',{...base,publicAddressOptIn:true}).includes('dirección pública'))
})

test('el borrado administrativo exige confirmación literal',()=>{
  assert.equal(adminDeleteMemberSchema.safeParse({membershipId:'4fda7462-72dc-463c-b7ad-070cab5c7f0b',confirmation:'borrar'}).success,false)
  assert.equal(adminDeleteMemberSchema.safeParse({membershipId:'4fda7462-72dc-463c-b7ad-070cab5c7f0b',confirmation:'BORRAR'}).success,true)
})

test('la edición administrativa de eventos valida ficha y moderación completas',()=>{
  const base={eventId:'4fda7462-72dc-463c-b7ad-070cab5c7f0b',organizerMembershipId:'67dbc9f8-bf06-4b5c-9396-297dd74d571a',title:'Curso de Shiatsu',description:'Descripción suficientemente larga para validar.',startsAt:'2026-09-20T17:00',endsAt:'2026-09-20T18:00',allDay:false,modality:'in_person',isFree:true,featured:false,moderationNotes:''}
  assert.equal(adminEventUpdateSchema.safeParse({...base,status:'approved'}).success,true)
  assert.equal(adminEventUpdateSchema.safeParse({...base,status:'inventado'}).success,false)
})

test('el alta administrativa de eventos exige un organizador válido',()=>{
  const base={title:'Curso de Shiatsu',description:'Descripción suficientemente larga para validar.',startsAt:'2026-09-20T17:00',endsAt:'2026-09-20T18:00',allDay:false,modality:'in_person',isFree:true,status:'approved'}
  assert.equal(adminEventCreateSchema.safeParse({...base,organizerMembershipId:''}).success,false)
  assert.equal(adminEventCreateSchema.safeParse({...base,organizerMembershipId:'67dbc9f8-bf06-4b5c-9396-297dd74d571a'}).success,true)
})
