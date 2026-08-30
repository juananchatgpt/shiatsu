import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarCells, occursOnDay } from '../src/features/events/calendar'

test('el calendario mensual comienza en lunes y contiene todos los días',()=>{
  const cells=calendarCells(2026,8)
  assert.equal(cells[0],null)
  assert.equal(cells[1],1)
  assert.equal(cells.at(-1),30)
})

test('un evento de varios días aparece en cada fecha comprendida',()=>{
  assert.equal(occursOnDay('2026-09-10T08:00:00+02:00','2026-09-12T18:00:00+02:00','2026-09-11'),true)
  assert.equal(occursOnDay('2026-09-10T08:00:00+02:00','2026-09-12T18:00:00+02:00','2026-09-13'),false)
})
