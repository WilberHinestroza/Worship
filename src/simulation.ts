export const intents = {
  escuchar: 'Escuchar', disculparse: 'Disculparse', presionar: 'Presionar',
  bromear: 'Bromear', prometer: 'Prometer volver', cumplir: 'Cumplir la promesa', esperar: 'Dar espacio',
} as const
export type Intent = keyof typeof intents
export const profiles = {
  camila: { name: 'Camila Ríos', caution: 3, warmth: 0, initiative: 1, goal: 'Comprobar si puede confiar',
    lines: { abrir: ['Te escucho. Pero quiero que seas concreto.', 'Está bien. Podemos hablar un rato.'], distancia: ['Necesito un poco de espacio.', 'Voy a dejar esto aquí por ahora.'], preguntar: ['¿Y qué esperas de mí?', '¿Qué estás intentando decirme?'], proponer: ['¿Seguimos hablando otro día?', 'Tengo tiempo. Siéntate.'] } },
  valeria: { name: 'Valeria Montes', caution: 0, warmth: 3, initiative: 2, goal: 'Mantener abierta la comunicación',
    lines: { abrir: ['Gracias por contar conmigo.', 'Puedes tomarte tu tiempo.'], distancia: ['Hablemos cuando estemos más tranquilos.', 'Prefiero parar un momento.'], preguntar: ['¿Cómo te hizo sentir eso?', '¿Quieres que te escuche o que opine?'], proponer: ['Podemos salir a caminar y hablar.', '¿Te parece si buscamos un lugar tranquilo?'] } },
  natalia: { name: 'Natalia Ferrer', caution: 1, warmth: 1, initiative: 3, goal: 'Convertir las palabras en acciones',
    lines: { abrir: ['Bien. Ahora dime qué vas a hacer.', 'Eso sí me queda claro.'], distancia: ['Daremos por terminada la conversación.', 'Avísame cuando quieras hablar en serio.'], preguntar: ['¿Cuál es el siguiente paso?', '¿Qué parte depende de ti?'], proponer: ['Hagamos algo concreto. ¿Qué propones?', 'Fija una hora y vemos si funciona.'] } },
} as const
export type Person = keyof typeof profiles
type Move = keyof typeof profiles.camila.lines
export type Action = { person: Person; intent: Intent; text?: string }
type Memory = { turn: number; event: Intent | 'incumplir'; impact: number }
type Character = { trust: number; stress: number; due: number | null; memories: Memory[] }
type Entry = { action: Action; move: Move; response: string }
export type Simulation = { seed: number; cast: Record<Person, Character>; log: Entry[] }

const initial = (): Character => ({ trust: 5, stress: 2, due: null, memories: [] })
export const createSimulation = (seed: number): Simulation => ({
  seed, cast: { camila: initial(), valeria: initial(), natalia: initial() }, log: [],
})
const clamp = (value: number) => Math.max(0, Math.min(10, value))
const effects: Record<Intent, [number, number]> = {
  escuchar: [1, -1], disculparse: [1, -1], presionar: [-2, 3], bromear: [0, 1],
  prometer: [0, 0], cumplir: [2, -2], esperar: [0, -2],
}

export function interpret(text: string): Intent | null {
  const input = text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
  const patterns: [Intent, RegExp][] = [
    ['disculparse', /^(perdon|lo siento|me disculpo)\b/],
    ['escuchar', /^(te escucho|quiero escuchar)\b/],
    ['presionar', /^(exijo|te exijo|dime ahora)\b/],
    ['bromear', /^(bromeo|era una broma)\b/],
    ['prometer', /^(prometo volver|te prometo que volvere)\b/],
    ['cumplir', /^(cumplo mi promesa|volvi como prometi)\b/],
    ['esperar', /^(te doy espacio|espero|doy un paso atras)\b/],
  ]
  return patterns.find(([, pattern]) => pattern.test(input))?.[0] ?? null
}

function random(seed: number, turn: number, salt: number) {
  let value = seed ^ Math.imul(turn, 0x9e3779b1) ^ salt
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296
}

export const turnLimit = 200
export function interact(sim: Simulation, action: Action): Simulation {
  if (sim.log.length >= turnLimit) return sim
  const turn = sim.log.length + 1
  const profile = profiles[action.person]
  const cast = { ...sim.cast }
  for (const person of Object.keys(profiles) as Person[]) {
    const current = cast[person]
    if (current.due === null || turn <= current.due) continue
    cast[person] = {
      trust: clamp(current.trust - 2), stress: clamp(current.stress + 2), due: null,
      memories: [...current.memories, { turn, event: 'incumplir', impact: -3 }],
    }
  }
  const previous = cast[action.person]
  const [trust, stress] = action.intent === 'cumplir' && previous.due === null ? [0, 0] : effects[action.intent]
  const repeatedPressure = previous.memories.slice(-3).some(memory => memory.event === 'presionar')
  const character: Character = {
    trust: clamp(previous.trust + trust),
    stress: clamp(previous.stress + stress + (action.intent === 'presionar' && repeatedPressure ? 1 : 0)),
    due: action.intent === 'prometer' ? (previous.due ?? turn + 3) : action.intent === 'cumplir' ? null : previous.due,
    memories: [...previous.memories, { turn, event: action.intent, impact: trust }],
  }
  cast[action.person] = character
  const recalled = previous.memories.slice(-8).reverse().find(memory =>
    ['incumplir', 'presionar', 'cumplir'].includes(memory.event) && memory.impact !== 0)
  const residue = recalled && turn - recalled.turn <= 8 ? Math.sign(recalled.impact) : 0
  const scores: Record<Move, number> = {
    abrir: character.trust + profile.warmth + residue,
    distancia: character.stress + profile.caution - residue,
    preguntar: 5 + profile.caution / 2,
    proponer: 3 + profile.initiative + character.trust / 2 - character.stress / 2,
  }
  // The random variation is bounded so a character under intense pressure can disengage.
  const moves = Object.keys(scores) as Move[]
  const ranked = moves.map((move, index) => ({ move, score: scores[move] + random(sim.seed, turn, index + 1) * 4 }))
  const move = character.stress >= 9 ? 'distancia' : ranked.sort((a, b) => b.score - a.score)[0].move
  const recall = residue === 0 ? '' : recalled?.event === 'incumplir' ? 'Dijiste que volverías. Me acuerdo. ' :
    recalled?.event === 'presionar' ? 'La última vez también me presionaste. ' : 'Volviste cuando dijiste que lo harías. '
  const variant = random(sim.seed, turn, 5) < 0.5 ? 0 : 1
  const response = recall + profile.lines[move][variant]
  return { seed: sim.seed, cast, log: [...sim.log, { action, move, response }] }
}

export const serialize = (sim: Simulation) => JSON.stringify({
  version: 1, seed: sim.seed, actions: sim.log.map(entry => entry.action),
})

export function restore(raw: string): Simulation | null {
  try {
    const save = JSON.parse(raw)
    if (save?.version !== 1 || !Number.isInteger(save.seed) || save.seed < 0 || save.seed > 0xffffffff ||
      !Array.isArray(save.actions) || save.actions.length > turnLimit) return null
    let sim = createSimulation(save.seed)
    for (const action of save.actions) {
      if (!action || !Object.hasOwn(profiles, action.person) || !Object.hasOwn(intents, action.intent) ||
        (action.text !== undefined && (typeof action.text !== 'string' || action.text.length > 240))) return null
      sim = interact(sim, { person: action.person, intent: action.intent, text: action.text })
    }
    return sim
  } catch {
    return null
  }
}
