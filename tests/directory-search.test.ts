import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDirectorySearch } from '../src/features/memberships/directory-search'

test('la búsqueda del directorio ignora mayúsculas y acentos',()=>{
  assert.equal(normalizeDirectorySearch('  ÁGATA  '),'agata')
  assert.equal(normalizeDirectorySearch('Sònia Giménez'),'sonia gimenez')
  assert.equal(normalizeDirectorySearch('Muñoz'),'munoz')
})
