import test from 'node:test'
import assert from 'node:assert/strict'
import { toPublicEvent } from '../src/features/events/public'
import type { EventRow } from '../src/features/events/service'

test('el evento público no expone moderación ni identificadores internos',()=>{
  const source={id:'event',organizer_membership_id:'private-member',organizer_name:'Escuela',organizer_type:'school',title:'Curso',description:'Descripción',image_url:null,starts_at:'2026-09-01',ends_at:'2026-09-02',all_day:false,modality:'in_person',venue_name:null,address:null,city:'Madrid',province:'Madrid',postal_code:null,country:'España',registration_url:null,public_contact:null,is_free:true,price_cents:null,currency:'EUR',featured:false,status:'approved',moderation_notes:'interno',created_at:'x',updated_at:'x'} satisfies EventRow
  const result=toPublicEvent(source)
  assert.equal(result.id,'event')
  assert.equal('status' in result,false)
  assert.equal('moderation_notes' in result,false)
  assert.equal('organizer_membership_id' in result,false)
})
