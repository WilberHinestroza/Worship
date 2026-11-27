import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, end, execute, known, loadWorld, saveWorld, shareable, waitForEvent } from './world.ts'

const wait = world => execute(world, { type: 'wait' })
const talk = (world, person, intent) => execute(world, { type: 'talk', person, intent })

test('un hecho privado solo se aprende a través de un evento de divulgación', () => {
  const world = talk(createWorld(15), 'camila', 'escuchar')
  assert.deepEqual(known(world, 'natalia'), [])
  assert.equal(shareable(world, 'natalia')[0].id, 1)
  const next = execute(world, { type: 'share', person: 'natalia', event: 1 })
  assert.deepEqual(known(next, 'natalia').map(event => event.id), [1, 3])
  assert.equal(known(next, 'natalia')[1].reference, 1)
  assert.deepEqual(known(next, 'valeria'), [])
  assert.equal(execute(next, { type: 'share', person: 'natalia', event: 1 }), next)
})

test('la promesa tiene una ventana compartida y deja una consecuencia privada', () => {
  let world = talk(createWorld(8), 'camila', 'prometer')
  assert.equal(world.promises[0].due, 3)
  assert.equal(talk(world, 'camila', 'prometer'), world)
  world = talk(talk(world, 'valeria', 'escuchar'), 'natalia', 'escuchar')
  const fulfilled = talk(world, 'camila', 'cumplir')
  assert.equal(fulfilled.relations.camila.toMarcus.respect, 7)
  assert.equal(fulfilled.promises.length, 0)
  const broken = wait(world)
  assert.equal(broken.relations.camila.toMarcus.resentment, 3)
  assert.ok(known(broken, 'camila').some(event => event.kind === 'broken'))
  assert.ok(!known(broken, 'valeria').some(event => event.kind === 'broken'))
  assert.equal(talk(broken, 'camila', 'cumplir'), broken)
})

test('una semana de espera genera iniciativa sin conversación de Marcus y se reproduce al cargar', () => {
  let world = createWorld(29)
  for (let index = 0; index < end; index++) world = wait(world)
  assert.equal(world.slot, 28)
  assert.ok(world.events.some(event => event.kind === 'initiative'))
  assert.ok(world.events.every(event => event.speaker !== 'marcus'))
  assert.equal(wait(world), world)
  assert.deepEqual(loadWorld(saveWorld(world)), world)
  assert.equal(loadWorld('{"version":2,"seed":29,"commands":[{"type":"share","person":"camila","event":1}]}'), null)
})

test('importa acciones del laboratorio anterior al formato semanal', () => {
  const legacy = JSON.stringify({ version: 1, seed: 6, actions: [{ person: 'camila', intent: 'escuchar' }] })
  const imported = loadWorld(legacy)
  assert.equal(imported.slot, 1)
  assert.equal(imported.relations.camila.toMarcus.trust, 6)
})

test('la espera rápida ejecuta los bloques ordinarios hasta el primer evento', () => {
  const promised = talk(createWorld(8), 'camila', 'prometer')
  const next = waitForEvent(promised)
  assert.deepEqual(next, wait(wait(wait(promised))))
  assert.equal(next.events.at(-1).kind, 'broken')
  assert.deepEqual(loadWorld(saveWorld(next)), next)
  let week = next
  while (week.slot < end) week = waitForEvent(week)
  assert.equal(waitForEvent(week), week)
})

test('un personaje incorporado responde y conserva el mensaje libre al cargar', () => {
  const opening = createWorld(21)
  const text = '¿Podemos hablar sobre la universidad?'
  const next = execute(opening, { type: 'talk', person: 'mina', intent: 'charlar', text })
  assert.equal(next.slot, 1)
  assert.equal(known(next, 'mina')[0].text, text)
  assert.equal(known(next, 'mina')[1].speaker, 'mina')
  assert.deepEqual(known(next, 'camila'), [])
  assert.deepEqual(next.relations.mina.toMarcus, opening.relations.mina.toMarcus)
  assert.deepEqual(loadWorld(saveWorld(next)), next)
})
