import { test } from 'node:test'
import assert from 'node:assert/strict'
import { choose, decode, encode, start } from './game.ts'
import { scenes } from './story.ts'

function play(...indices) {
  return indices.reduce(choose, start())
}

test('las seis rutas cierran el capítulo con el desenlace y las estadísticas esperadas', () => {
  for (const reply of [0, 1, 2]) {
    const coffee = play(0, reply, 0, 0, 0)
    const training = play(0, reply, 0, 1, 0)
    assert.equal(scenes[coffee.scene].outcome, reply === 0 ? 'puerta' : 'distancia')
    assert.equal(scenes[training.scene].outcome, 'rutina')
    assert.deepEqual(coffee.stats, { trust: [7, 4, 4][reply], tension: [2, 4, 2][reply] })
    assert.deepEqual(training.stats, coffee.stats)
    assert.deepEqual(decode(encode(coffee)), coffee)
    assert.deepEqual(decode(encode(training)), training)
  }
})

test('reconstruye una partida intermedia y preserva las decisiones originales', () => {
  const game = play(0, 1)
  const next = choose(game, 0)
  assert.deepEqual(decode(encode(game)), game)
  assert.equal(game.scene, 'defensa')
  assert.equal(game.history.length, 2)
  assert.equal(next.history.length, 3)
  assert.equal(choose(game, 99), game)
})

test('rechaza archivos inválidos, versiones desconocidas y rutas imposibles', () => {
  for (const raw of ['{', 'null', '{"version":2,"choices":[]}', '{"version":1,"choices":[{"scene":"puerta","label":"Salir al pasillo"}]}']) {
    assert.equal(decode(raw), null)
  }
})
