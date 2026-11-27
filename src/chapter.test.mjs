import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceChapter, chapterChoices, chapterPage, loadChapter, saveChapter, selectChapterChoice, startChapter } from './chapter.ts'

function finishReading(chapter) {
  while (chapter.beat < chapterPage(chapter).beats.length - 1) chapter = advanceChapter(chapter)
  return chapter
}

function follow(chapter, ...choices) {
  for (const id of choices) {
    const ready = finishReading(chapter)
    chapter = selectChapterChoice(ready, id)
    assert.notEqual(chapter, ready, id)
  }
  return chapter
}

function afterArrival(arrival, key = 'revocar') {
  return follow(startChapter('Luca'), arrival, 'continuar', 'continuar', key, 'continuar')
}

test('every reachable route, page and ending survives save and load', () => {
  const scenes = new Set()
  const endings = new Set()
  const arrivals = new Set()
  const keys = new Set()

  function visit(chapter) {
    assert.ok(chapter.path.length < 18)
    scenes.add(chapter.scene)
    if (chapter.arrival) arrivals.add(chapter.arrival)
    if (chapter.authorization) keys.add(chapter.authorization)
    if (chapter.ending) endings.add(chapter.ending)

    const ready = finishReading(chapter)
    assert.deepEqual(loadChapter(saveChapter(chapter)), chapter)
    assert.deepEqual(loadChapter(saveChapter(ready)), ready)
    assert.ok(chapterPage(chapter).beats.every(beat => beat.trim()))
    if (chapter.ending) {
      assert.deepEqual(chapter.autonomous, ['C1-03', 'C1-07'])
      assert.deepEqual(chapter.world, { committeeTomorrow: true, posters: { residence: 12, cafe: 8 } })
    }
    for (const { id } of chapterChoices(chapter)) visit(follow(ready, id))
  }

  visit(startChapter('Luca'))
  assert.equal(scenes.size, 18)
  assert.equal(arrivals.size, 5)
  assert.equal(keys.size, 3)
  assert.deepEqual([...endings].sort(), ['distancia', 'puerta', 'rutina'])
})

test('choice gates and player knowledge preserve agency across convergence', () => {
  const opening = startChapter('Luca')
  assert.equal(selectChapterChoice(opening, 'camila'), opening)
  const solo = afterArrival('solo')
  const ids = chapterChoices(solo).map(option => option.id)
  assert.deepEqual(ids, ['preguntar-ficha', 'facultad', 'regresar'])
  assert.ok(chapterChoices(afterArrival('natalia')).some(option => option.id === 'gimnasio'))
  assert.ok(chapterChoices(afterArrival('valeria')).some(option => option.id === 'taller'))
  const abstain = follow(solo, 'regresar', 'continuar', 'continuar')
  assert.ok(abstain.alone)
  assert.equal(abstain.coffee, undefined)
  assert.equal(abstain.appointments.length, 0)
  assert.deepEqual(abstain.autonomous, ['C1-03', 'C1-07'])
  assert.ok(![...abstain.facts, ...abstain.messages].join(' ').match(/Sofía|Mateo/))
  assert.match(chapterPage(follow(solo, 'facultad')).beats.join(' '), /envía a Luca la ubicación/)
})

test('coffee is opt-in at either prompt, and closing preserves every appointment', () => {
  for (const accepted of [true, false]) {
    const asked = follow(afterArrival('solo'), 'preguntar-ficha', accepted ? 'cafe-si' : 'cafe-no', 'continuar')
    const pending = follow(afterArrival('camila'), 'facultad', 'continuar', 'continuar')
    assert.ok(!chapterChoices(pending).some(choice => choice.id === 'rutina'))
    const replied = follow(pending, accepted ? 'cafe-mensaje-si' : 'cafe-mensaje-no')
    for (const chapter of [asked, replied]) {
      assert.equal(chapter.coffee, accepted ? 'aceptado' : 'declinado')
      assert.equal(chapter.appointments.some(item => item.date === '2027-02-24T08:00'), accepted)
      assert.deepEqual(follow(chapter, 'libre').appointments, chapter.appointments)
    }
    assert.ok(asked.facts.some(fact => fact.startsWith('Camila dice')))
    assert.ok(!replied.facts.some(fact => fact.startsWith('Camila dice')))
    assert.match(chapterPage(follow(replied, 'compromiso')).beats.at(-1), /07:40/)
  }
})

test('gym and workshop preserve distinct terms, and invalid saves are rejected', () => {
  const gym = follow(afterArrival('natalia'), 'gimnasio', 'continuar', 'continuar', 'libre')
  const workshop = follow(afterArrival('valeria'), 'taller', 'continuar', 'continuar', 'libre')
  assert.equal(gym.gym, 'visitante')
  assert.equal(gym.appointments[0].date, '2027-02-26T18:00')
  assert.equal(workshop.workshop, 'provisional')
  assert.equal(workshop.appointments[0].date, null)
  for (const [path, beat] of [[['gimnasio'], 0], [['solo', 'rutina'], 0], [[], 100], [[], -1]]) {
    assert.equal(loadChapter(JSON.stringify({ version: 1, name: 'Luca', path, beat })), null)
  }
})
