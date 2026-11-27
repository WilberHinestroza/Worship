import { chapterText } from './chapterText.ts'
import type { CastMember } from './CastArt.tsx'

type PageId = keyof typeof chapterText
type SceneId = PageId | 'C1-04R' | 'C1-FIN'
type Arrival = 'grupo' | 'camila' | 'natalia' | 'valeria' | 'solo'
type Authorization = 'revocada' | 'suspendida' | 'en revisión'
type Coffee = 'pendiente' | 'aceptado' | 'declinado'
type Closing = 'rutina' | 'puerta' | 'distancia'
type EventId = 'C1-03' | 'C1-07'
type Appointment = { date: string | null; label: string }
type Effect = Partial<Pick<Chapter, 'arrival' | 'authorization' | 'coffee' | 'gym' | 'workshop' | 'faculty' | 'ending' | 'alone'>> & {
  facts?: string[]; appointments?: Appointment[]
}
type Choice = { id: string; label: string; to: SceneId; effect?: Effect }

export type Chapter = {
  name: string; scene: SceneId; beat: number; path: { id: string; label: string }[]
  arrival?: Arrival; authorization?: Authorization; coffee?: Coffee
  gym?: 'pendiente' | 'visitante'; workshop?: 'pendiente' | 'provisional'
  faculty?: 'confirmada'; ending?: Closing; alone?: boolean
  appointments: Appointment[]; facts: string[]; messages: string[]; autonomous: EventId[]
  world: { posters?: { residence: number; cafe: number }; committeeTomorrow?: boolean }
}

export function startChapter(name: string): Chapter {
  return { name: name.trim().slice(0, 32) || 'Marcus', scene: 'C1-01', beat: 0, path: [], appointments: [], facts: [], messages: [], autonomous: [], world: {} }
}

const choice = (id: string, label: string, to: SceneId, effect?: Effect): Choice => ({ id, label, to, effect })
const next = (to: SceneId) => [choice('continuar', 'Continuar', to)]
const coffeeChoice = (id: string, label: string, to: SceneId, accepted: boolean) => choice(id, label, to, {
  coffee: accepted ? 'aceptado' : 'declinado',
  appointments: accepted ? [{ date: '2027-02-24T08:00', label: 'Café con Camila' }] : [],
})
const keyFact = 'La autorización de emergencia del 701 estaba a favor de Camila Ríos.'
const keyResponses: Record<Authorization, string> = {
  revocada: 'Yuna cruza el renglón y le estampa la fecha. «El original queda en el archivo. Te entrego las dos llaves».',
  suspendida: '«Tienes hasta mañana al mediodía para ratificarla. Mientras tanto, queda suspendida». Yuna guarda la segunda llave en sobre sellado.',
  'en revisión': 'Yuna revisa la ficha del 701. «Esta autorización lleva tu firma. La solicitud retirada corresponde al 702. Puedo tramitar una revisión de ambos registros si vienen las personas titulares». Yuna deja ambas llaves del 701 con {playerName} e invalida el acceso hasta revisión.',
}
const sceneFacts: Partial<Record<SceneId, string>> = {
  'C1-06A': 'Camila dice que la autorización se firmó durante la mudanza y que llamó dos veces al número antiguo después de la partida.',
  'C1-08': 'El tablón anunció turnos de bienvenida, una convocatoria y trabajos en el ascensor.',
}

export function chapterChoices(chapter: Chapter): Choice[] {
  switch (chapter.scene) {
    case 'C1-01': return [
      choice('grupo', 'Entrar y saludar a las tres', 'C1-02A', { arrival: 'grupo' }),
      choice('camila', 'Camila, ¿podemos hablar a solas?', 'C1-02B', { arrival: 'camila', coffee: 'pendiente' }),
      choice('natalia', '¿Dónde quieres poner la mesa, Natalia?', 'C1-02C', { arrival: 'natalia', gym: 'pendiente' }),
      choice('valeria', 'Valeria, ¿en qué estás trabajando?', 'C1-02D', { arrival: 'valeria', workshop: 'pendiente' }),
      choice('solo', 'Voy a instalarme. Nos vemos luego', 'C1-02E', { arrival: 'solo' }),
    ]
    case 'C1-02A': case 'C1-02B': case 'C1-02C': case 'C1-02D': case 'C1-02E': return next('C1-03')
    case 'C1-03': return next('C1-04')
    case 'C1-04': return [
      choice('revocar', 'Invalida la autorización, por favor', 'C1-04R', { authorization: 'revocada', facts: [keyFact] }),
      choice('suspender', 'Deja la autorización por ahora. Quiero confirmarlo con ella', 'C1-04R', { authorization: 'suspendida', facts: [keyFact] }),
      choice('revisar', '¿Puedes decirme de quién es la letra sin mostrarme la hoja?', 'C1-04R', { authorization: 'en revisión', facts: [keyFact, 'Según Yuna, la autorización lleva la firma del protagonista y la solicitud retirada corresponde al 702.'] }),
    ]
    case 'C1-04R': return next('C1-05')
    case 'C1-05': {
      const options = [
        choice('preguntar-ficha', 'Preguntar a Camila por la ficha del 701', 'C1-06A'),
        choice('facultad', 'Aceptar ver a Adrián en la facultad mañana', 'C1-06B', {
          faculty: 'confirmada', appointments: [{ date: '2027-02-24T07:40', label: 'Facultad con Adrián' }],
        }),
      ]
      if (chapter.arrival === 'natalia') options.push(choice('gimnasio', 'Confirmar que iré a ver la prueba', 'C1-06C', {
        gym: 'visitante', appointments: [{ date: '2027-02-26T18:00', label: 'Prueba de Natalia · visitante' }],
      }))
      if (chapter.arrival === 'grupo' || chapter.arrival === 'valeria') options.push(choice('taller',
        chapter.arrival === 'grupo' ? 'Enviarle a Valeria un mensaje sobre la maqueta' : 'Pedirle que me avise cuándo montan la maqueta', 'C1-06D',
        { workshop: 'provisional', appointments: [{ date: null, label: 'Taller de Valeria · hora por confirmar' }] }))
      options.push(choice('regresar', 'Volver al 701 y dejar los mensajes para mañana', 'C1-06E', { alone: true }))
      return options
    }
    case 'C1-06A': return [
      coffeeChoice('cafe-si', 'Nos vemos mañana a las ocho', 'C1-07', true),
      coffeeChoice('cafe-no', 'Prefiero que por ahora quede ahí', 'C1-07', false),
    ]
    case 'C1-06B': case 'C1-06C': case 'C1-06D': case 'C1-06E': return next('C1-07')
    case 'C1-07': return next('C1-08')
    case 'C1-08': {
      if (chapter.coffee === 'pendiente') return [
        coffeeChoice('cafe-mensaje-si', 'Puedo a las ocho', 'C1-08', true),
        coffeeChoice('cafe-mensaje-no', 'Por ahora prefiero dejarlo ahí', 'C1-08', false),
      ]
      const hasMorning = chapter.faculty === 'confirmada' || chapter.coffee === 'aceptado'
      return [
        choice('rutina', 'Poner la alarma para los trámites de mañana', 'C1-FIN', { ending: 'rutina' }),
        ...(hasMorning ? [choice('compromiso', 'Fijar mi primer compromiso de mañana', 'C1-FIN', { ending: 'puerta' })] : []),
        choice('libre', hasMorning ? 'Dejar libre el resto de la mañana' : 'Dejar libre la mañana', 'C1-FIN', { ending: 'distancia' }),
      ]
    }
    case 'C1-FIN': return []
  }
}

const stage: Partial<Record<SceneId, readonly CastMember[]>> = {
  'C1-01': ['valeria', 'natalia', 'camila'], 'C1-02A': ['valeria', 'natalia', 'camila'],
  'C1-02B': ['camila', 'valeria'], 'C1-02C': ['natalia', 'camila'], 'C1-02D': ['valeria', 'camila'],
  'C1-02E': ['camila'], 'C1-03': ['sofia'], 'C1-04': ['adrian'], 'C1-04R': ['adrian'],
  'C1-05': ['adrian'], 'C1-06A': ['camila'], 'C1-06B': ['adrian'], 'C1-06C': ['natalia'], 'C1-06D': ['valeria'], 'C1-07': ['sofia'],
}
const background: Record<SceneId, string> = {
  'C1-01': 'pasillo', 'C1-02A': 'sala', 'C1-02B': 'pasillo', 'C1-02C': 'sala', 'C1-02D': 'sala', 'C1-02E': 'sala',
  'C1-03': 'sala', 'C1-04': 'pasillo', 'C1-04R': 'pasillo', 'C1-05': 'seul', 'C1-06A': 'pasillo',
  'C1-06B': 'seul', 'C1-06C': 'seul', 'C1-06D': 'seul', 'C1-06E': 'sala', 'C1-07': 'sala', 'C1-08': 'sala', 'C1-FIN': 'seul',
}
const panels: Partial<Record<SceneId, string>> = {
  'C1-01': 'apertura', 'C1-02A': 'maqueta', 'C1-02D': 'maqueta', 'C1-03': 'creditos',
  'C1-06A': 'lavanderia', 'C1-06D': 'maqueta', 'C1-07': 'creditos', 'C1-FIN': 'cierre',
}
const messages: Record<Arrival, string[]> = {
  camila: ['Camila · «El café queda en pie. Confírmame antes de las diez si quieres que te espere».'],
  natalia: ['Natalia · «La prueba es el viernes a las seis. Si vas, avísame. Necesito saber cuántas sillas pedir».'],
  valeria: ['Valeria · «La maqueta entró a revisión. Mañana me confirman el taller. ¿Te aviso?».'],
  grupo: ['Chat del 702 · Foto del pan y la maqueta junto al cuarto plato. El agua caliente se corta a las diez.'],
  solo: ['Chat del 702 · Foto del pan desde el pasillo, con la puerta entreabierta. El agua caliente se corta a las diez.'],
}
const finalText = 'En el 702, Valeria apaga la luz de la cocina. En el 701, la placa nueva espera sobre el escritorio. Las dos ventanas miran al mismo patio. Desde arriba, con el cristal reflejando las luces de Seonghwa, cuesta ver cuál sigue encendida.'
const coffeeReplies = {
  aceptado: 'Camila · «A las ocho. Voy a pedir lo de siempre, si todavía lo tienen».',
  declinado: 'Camila · «Entendido. Que descanses».',
}

export function chapterPage(chapter: Chapter) {
  const id = chapter.scene
  const page = id === 'C1-04R' ? { ...chapterText['C1-04'], text: keyResponses[chapter.authorization ?? 'revocada'] }
    : id === 'C1-FIN' ? { name: 'Fin del capítulo I', at: '22:00', place: 'Residencia Seonghwa', text: finalText }
    : chapterText[id]
  const beats = page.text.split(/\n\n+/).map(line => line.replace(/\{playerName\}|\bMarcus\b/g, () => chapter.name))
  if (id === 'C1-05' && chapter.arrival) beats.push(...messages[chapter.arrival])
  if (id === 'C1-08') {
    if (chapter.coffee && chapter.coffee !== 'pendiente') beats.push(coffeeReplies[chapter.coffee])
    if (chapter.coffee === 'pendiente') beats.push('La invitación de Camila sigue pendiente.')
    if (chapter.faculty) beats.push('El pin de Adrián está fijado a la conversación.')
    if (chapter.gym === 'visitante') beats.push('Prueba de Natalia · viernes, 18:00.')
    if (chapter.workshop === 'provisional') beats.push('Taller de Valeria · hora por confirmar.')
  }
  if (id === 'C1-FIN' && chapter.ending === 'puerta') {
    const first = chapter.appointments.filter(item => item.date?.startsWith('2027-02-24'))
      .sort((a,b) => (a.date ?? '').localeCompare(b.date ?? ''))[0]
    if (first) beats.push(`Primer compromiso · ${first.label} · ${first.date?.slice(11)}.`)
  }
  return { ...page, beats, cast: stage[id] ?? [], backdrop: background[id], panel: panels[id], interlude: id === 'C1-03' || id === 'C1-07' }
}

export function advanceChapter(chapter: Chapter): Chapter {
  return chapter.beat + 1 < chapterPage(chapter).beats.length ? { ...chapter, beat: chapter.beat + 1 } : chapter
}

export function selectChapterChoice(chapter: Chapter, id: string): Chapter {
  if (chapter.beat + 1 < chapterPage(chapter).beats.length) return chapter
  const selected = chapterChoices(chapter).find(item => item.id === id)
  if (!selected) return chapter
  const { facts = [], appointments = [], ...state } = selected.effect ?? {}
  const scene = selected.to
  const coffee = state.coffee ?? chapter.coffee
  const incoming = scene === 'C1-05' && chapter.arrival ? messages[chapter.arrival]
    : scene === 'C1-08' && coffee && coffee !== 'pendiente' ? [coffeeReplies[coffee]]
    : []
  const fact = sceneFacts[scene]
  const autonomous = scene === 'C1-03' || scene === 'C1-07' ? [...new Set([...chapter.autonomous, scene])] : chapter.autonomous
  return {
    ...chapter, ...state, scene, beat: scene === chapter.scene ? 1 : 0,
    facts: [...new Set([...chapter.facts, ...facts, ...(fact ? [fact] : [])])],
    appointments: [...chapter.appointments, ...appointments.filter(item => !chapter.appointments.some(existing => existing.label === item.label))],
    messages: [...new Set([...chapter.messages, ...incoming])],
    world: {
      ...chapter.world,
      ...(scene === 'C1-07' ? { committeeTomorrow: true } : {}),
      ...(scene === 'C1-FIN' ? { posters: { residence: 12, cafe: 8 } } : {}),
    },
    autonomous, path: [...chapter.path, { id, label: id === 'continuar' ? '' : selected.label }],
  }
}

export const chapterSaveKey = 'worship-web:season-1-chapter-1'
export const saveChapter = (chapter: Chapter) => JSON.stringify({
  version: 1, name: chapter.name, beat: chapter.beat, path: chapter.path.map(entry => entry.id),
})

export function loadChapter(raw: string): Chapter | null {
  try {
    const save = JSON.parse(raw)
    if (!save || save.version !== 1 || typeof save.name !== 'string' || save.name.length > 32 ||
      !Array.isArray(save.path) || save.path.length > 24 || !Number.isInteger(save.beat) || save.beat < 0) return null
    let chapter = startChapter(save.name)
    for (const id of save.path) {
      if (typeof id !== 'string') return null
      const ready = { ...chapter, beat: chapterPage(chapter).beats.length - 1 }
      const advanced = selectChapterChoice(ready, id)
      if (advanced === ready) return null
      chapter = advanced
    }
    return save.beat < chapterPage(chapter).beats.length ? { ...chapter, beat: save.beat } : null
  } catch {
    return null
  }
}
