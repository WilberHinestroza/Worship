import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSimulation, interact, interpret, restore, serialize } from './simulation.ts'

const act = (sim, person, intent) => interact(sim, { person, intent })
test('cada personaje mantiene su memoria y las promesas vencen aunque Marcus hable con otro', () => {
  let sim = act(createSimulation(6), 'camila', 'prometer')
  for (let i = 0; i < 4; i++) sim = act(sim, 'valeria', 'escuchar')
  assert.equal(sim.cast.camila.trust, 3)
  assert.equal(sim.cast.camila.due, null)
  assert.equal(sim.cast.camila.memories.at(-1).event, 'incumplir')
  assert.deepEqual(sim.cast.natalia.memories, [])
  sim = act(sim, 'camila', 'esperar')
  assert.match(sim.log.at(-1).response, /Dijiste que volverías/)
})
test('cumplir a tiempo cambia la confianza y vuelve a aparecer en la conversación', () => {
  let sim = act(createSimulation(6), 'natalia', 'prometer')
  sim = act(sim, 'natalia', 'cumplir')
  sim = act(sim, 'natalia', 'escuchar')
  assert.equal(sim.cast.natalia.due, null)
  assert.equal(sim.cast.natalia.trust, 8)
  assert.match(sim.log.at(-1).response, /Volviste cuando dijiste/)
})
test('la personalidad y la semilla varían las respuestas, el guardado las reproduce', () => {
  const replies = new Set()
  for (let seed = 0; seed < 30; seed++) {
    const camila = act(createSimulation(seed), 'camila', 'bromear')
    const natalia = act(createSimulation(seed), 'natalia', 'bromear')
    assert.notEqual(camila.log[0].response, natalia.log[0].response)
    assert.equal(camila.log[0].response, restore(serialize(camila)).log[0].response)
    replies.add(camila.log[0].move)
  }
  assert.ok(replies.size > 1)
  assert.equal(restore('{"version":1,"seed":9,"actions":[{"person":"nadie","intent":"esperar"}]}'), null)
})
test('reconoce acciones explícitas y rechaza frases fuera de su vocabulario', () => {
  assert.equal(interpret('Volví como prometí.'), 'cumplir')
  assert.equal(interpret('Perdón por ayer.'), 'disculparse')
  assert.equal(interpret('No te escucho.'), null)
})
