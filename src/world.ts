import { intents, people, profiles, restore as restoreLegacy } from './simulation.ts'
import type { Intent, Person } from './simulation.ts'

const initialContacts = new Set<Person>(['camila', 'valeria', 'natalia'])
export const blocks = ['08:00', '12:00', '16:00', '20:00']
export const end = blocks.length * 7
export const time = (slot: number) => slot === end
  ? 'Cierre de la semana'
  : `Día ${Math.floor(slot / blocks.length) + 1} · ${blocks[slot % blocks.length]}`
type Actor = Person | 'marcus'
type Meters = { trust: number; affection: number; respect: number; resentment: number }
type Relationship = { fromMarcus: Meters; toMarcus: Meters; tension: number }
type WorldEvent = {
  id: number; slot: number; kind: 'talk' | 'share' | 'promise' | 'fulfilled' | 'broken' | 'initiative'
  speaker: Actor; audience: Actor[]; text: string; reason?: string; reference?: number
}
export type Command =
  | { type: 'talk'; person: Person; intent: Intent; text?: string }
  | { type: 'share'; person: Person; event: number }
  | { type: 'wait' }
type Plan = { slot: number; person: Person; purpose: 'reconnect' | 'followUp' | 'setBoundary' }
type PromiseRecord = { person: Person; event: number; due: number }
export type World = {
  slot: number; seed: number; commands: Command[]; events: WorldEvent[]
  relations: Record<Person, Relationship>; promises: PromiseRecord[]; plans: Plan[]
}

const meters = (): Meters => ({ trust: 5, affection: 4, respect: 5, resentment: 1 })
const relationship = (): Relationship => ({ fromMarcus: meters(), toMarcus: meters(), tension: 2 })
export const createWorld = (seed: number): World => ({
  seed, slot: 0, commands: [], events: [], promises: [], plans: [],
  relations: Object.fromEntries(people.map(person => [person, relationship()])) as Record<Person, Relationship>,
})

export function known(world: World, actor: Actor) {
  const ids = new Set<number>()
  for (const event of world.events) {
    if (event.speaker !== actor && !event.audience.includes(actor)) continue
    ids.add(event.id)
    if (event.reference !== undefined) ids.add(event.reference)
  }
  return world.events.filter(event => ids.has(event.id))
}

export function shareable(world: World, person: Person) {
  const alreadyKnown = new Set(known(world, person).map(event => event.id))
  return known(world, 'marcus').filter(event => event.kind !== 'share' && !alreadyKnown.has(event.id))
}

const changes: Record<Intent, Partial<Meters> & { tension?: number }> = {
  escuchar: { trust: 1, affection: 1, tension: -1 },
  disculparse: { trust: 1, resentment: -1, tension: -1 },
  presionar: { trust: -2, respect: -1, resentment: 2, tension: 3 },
  bromear: { affection: 1, tension: 1 },
  prometer: {},
  cumplir: { trust: 2, respect: 2, resentment: -1, tension: -2 },
  esperar: { resentment: -1, tension: -2 },
  charlar: {},
}
const limit = (n: number) => Math.max(0, Math.min(10, n))
function apply(world: World, person: Person, effect: Partial<Meters> & { tension?: number }, direction: 'fromMarcus' | 'toMarcus') {
  const relation = world.relations[person]
  const current = relation[direction]
  const result: Meters = {
    trust: limit(current.trust + (effect.trust ?? 0)),
    affection: limit(current.affection + (effect.affection ?? 0)),
    respect: limit(current.respect + (effect.respect ?? 0)),
    resentment: limit(current.resentment + (effect.resentment ?? 0)),
  }
  world.relations[person] = { ...relation, [direction]: result, tension: limit(relation.tension + (effect.tension ?? 0)) }
}

function add(world: World, event: Omit<WorldEvent, 'id' | 'slot'>) {
  const id = world.events.length + 1
  world.events.push({ id, slot: world.slot, ...event })
  return id
}

function random(world: World, person: Person, salt: number) {
  let n = world.seed ^ Math.imul(world.slot + 1, 0x9e3779b1) ^ Math.imul(people.indexOf(person) + 1, 0x85ebca6b) ^ salt
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d)
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296
}

function respond(world: World, person: Person, message?: string) {
  const profile = profiles[person]
  const { toMarcus: relation, tension } = world.relations[person]
  const recent = known(world, person).slice(-8)
  const memory = recent.reverse().find(event => event.audience.includes(person) &&
    (event.kind === 'broken' || event.kind === 'fulfilled'))
  const recalled = memory && world.slot - memory.slot <= 8 ? memory : undefined
  const scores = {
    abrir: relation.trust + profile.warmth + relation.affection / 3,
    distancia: tension + profile.caution + relation.resentment / 2,
    preguntar: 6 + profile.caution / 2,
    proponer: 4 + profile.initiative + relation.respect / 2 - tension / 3,
  }
  const options = (Object.keys(scores) as (keyof typeof scores)[]).map((move, i) =>
    ({ move, score: scores[move] + random(world, person, i + 1) * 3 }))
  const move = tension >= 8 ? 'distancia' : message?.includes('?') ? 'preguntar' : options.sort((a, b) => b.score - a.score)[0].move
  const prefix = recalled?.kind === 'broken' ? 'Quedó pendiente lo que prometiste. ' :
    recalled?.kind === 'fulfilled' ? 'Me acuerdo de lo que cumpliste. ' : ''
  const reaction = {
    abrir: { trust: 1 }, distancia: { resentment: 1 }, preguntar: {}, proponer: { respect: 1 },
  }
  apply(world, person, reaction[move], 'fromMarcus')
  add(world, {
    kind: 'talk', speaker: person, audience: ['marcus'],
    text: prefix + profile.lines[move][random(world, person, 51) < .5 ? 0 : 1],
    reason: `${profile.goal}. Eligió ${move} con tensión ${tension}.`,
    reference: recalled?.id,
  })
}

function advance(world: World) {
  world.slot++
  for (const promise of world.promises.filter(item => item.due < world.slot)) {
    apply(world, promise.person, { trust: -2, respect: -1, resentment: 2, tension: 1 }, 'toMarcus')
    add(world, { kind: 'broken', speaker: 'marcus', audience: [promise.person],
      text: 'Venció la promesa de volver.', reference: promise.event })
  }
  world.promises = world.promises.filter(item => item.due >= world.slot)
  if (world.slot === end) return

  for (const plan of world.plans.filter(item => item.slot === world.slot)) {
    const { person } = plan
    const { toMarcus, tension } = world.relations[person]
    const purpose = tension >= 7 || toMarcus.resentment >= 5 ? 'setBoundary' : plan.purpose
    const move = purpose === 'setBoundary' ? 'distancia' : purpose === 'followUp' ? 'preguntar' : 'proponer'
    const profile = profiles[person]
    add(world, {
      kind: 'initiative', speaker: person, audience: ['marcus'],
      text: profile.lines[move][random(world, person, 89) < .5 ? 0 : 1],
      reason: `Iniciativa propia. ${profile.goal}. ${move === 'distancia' ? 'Marcó un límite.' : 'Tenía un contacto programado.'}`,
    })
    apply(world, person, purpose === 'setBoundary' ? { tension: -1 } : { affection: 1 }, 'fromMarcus')
  }
  world.plans = world.plans.filter(item => item.slot > world.slot)

  // Each morning the cast sets plans for different times of day.
  if (world.slot % blocks.length !== 0) return
  for (const person of people) {
    // New contacts take initiative once introduced, including in older saves.
    if (!initialContacts.has(person) && !world.commands.some(command => command.type === 'talk' && command.person === person)) continue
    const { toMarcus, tension } = world.relations[person]
    const profile = profiles[person]
    const roll = random(world, person, 17)
    if (roll > .35 + profile.initiative * .12 + toMarcus.affection * .025) continue
    const purpose = tension >= 7 || toMarcus.resentment >= 5 ? 'setBoundary' :
      world.promises.some(promise => promise.person === person) ? 'followUp' : 'reconnect'
    world.plans.push({ person, slot: world.slot + 1 + Math.floor(random(world, person, 19) * 3), purpose })
  }
}

export function execute(previous: World, command: Command): World {
  if (previous.slot >= end) return previous
  if (command.type === 'share' && !shareable(previous, command.person).some(event => event.id === command.event)) return previous
  if (command.type === 'talk') {
    const pending = previous.promises.some(item => item.person === command.person)
    if (command.intent === 'prometer' && (pending || previous.slot + 3 >= end)) return previous
    if (command.intent === 'cumplir' && !pending) return previous
  }

  const world: World = {
    ...previous, commands: [...previous.commands, command], events: [...previous.events],
    relations: { ...previous.relations }, promises: [...previous.promises], plans: [...previous.plans],
  }
  if (command.type === 'share') {
    add(world, { kind: 'share', speaker: 'marcus', audience: [command.person],
      text: 'Marcus le contó lo que ocurrió.', reference: command.event })
  }
  if (command.type === 'talk') {
    const { person, intent } = command
    const promise = world.promises.find(item => item.person === person)
    const kind = intent === 'prometer' && !promise ? 'promise' : intent === 'cumplir' && promise ? 'fulfilled' : 'talk'
    const id = add(world, { kind, speaker: 'marcus', audience: [person],
      text: command.text || intents[intent], reference: kind === 'fulfilled' ? promise?.event : undefined })
    if (kind === 'promise') world.promises.push({ person, event: id, due: world.slot + 3 })
    if (kind === 'fulfilled') world.promises = world.promises.filter(item => item.person !== person)
    if (intent !== 'cumplir' || promise) apply(world, person, changes[intent], 'toMarcus')
    if (intent === 'escuchar' || intent === 'bromear') apply(world, person, { affection: 1 }, 'fromMarcus')
    respond(world, person, intent === 'charlar' ? command.text : undefined)
  }
  advance(world)
  return world
}

export const saveWorld = (world: World) => JSON.stringify({ version: 2, seed: world.seed, commands: world.commands })

export function waitForEvent(world: World): World {
  let next = world
  while (next.slot < end && next.events.length === world.events.length) {
    next = execute(next, { type: 'wait' })
  }
  return next
}

export function loadWorld(raw: string): World | null {
  try {
    const data = JSON.parse(raw)
    if (data?.version === 1) {
      const old = restoreLegacy(raw)
      if (!old) return null
      return old.log.reduce((world, entry) => execute(world, { type: 'talk', ...entry.action }), createWorld(old.seed))
    }
    if (data?.version !== 2 || !Number.isInteger(data.seed) || data.seed < 0 || data.seed > 0xffffffff ||
      !Array.isArray(data.commands) || data.commands.length > end) return null
    let world = createWorld(data.seed)
    for (const command of data.commands) {
      if (!command || (command.type !== 'wait' && !people.includes(command.person))) return null
      if (command.type === 'talk') {
        if (!Object.hasOwn(intents, command.intent) ||
          (command.text !== undefined && (typeof command.text !== 'string' || command.text.length > 240))) return null
      } else if (command.type === 'share') {
        if (!Number.isInteger(command.event)) return null
      } else if (command.type !== 'wait') return null
      const next = execute(world, command)
      if (next === world) return null
      world = next
    }
    return world
  } catch {
    return null
  }
}
