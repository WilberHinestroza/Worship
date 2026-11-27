import { useEffect, useRef, useState } from 'react'
import { Dossier } from './Dossier.tsx'
import { Overlay } from './Overlay.tsx'
import { art } from './art.ts'
import { CastArt, castName, lineup } from './CastArt.tsx'
import { characterActions } from './characterActions.ts'
import type { CastMember } from './CastArt.tsx'
import { poses, SceneCast } from './SceneCast.tsx'
import type { Pose } from './SceneCast.tsx'
import { intents, people, profiles } from './simulation.ts'
import type { Person } from './simulation.ts'
import type { Intent } from './simulation.ts'
import { createWorld, end, execute, known, loadWorld, saveWorld, shareable, time, waitForEvent } from './world.ts'
import type { Command, World } from './world.ts'

const key = 'worship-web:simulation:v2'
const fresh = () => createWorld(crypto.getRandomValues(new Uint32Array(1))[0])
const displayName = (id: Person | 'marcus') => id === 'marcus' ? 'Marcus' : castName(id)
const indicators = [['trust', 'Confianza'], ['affection', 'Afecto'], ['respect', 'Respeto'], ['resentment', 'Resentimiento']] as const
const panels = ['Escena', 'Sistemas', 'Relaciones', 'Estado', 'Galería', 'Historial', 'Recuerdos'] as const
const illustrations = [
  { file: 'camila', title: 'Camila junto a la puerta' },
  { file: 'seul', title: 'Seúl al anochecer' },
  { file: 'pasillo', title: 'Pasillo del séptimo piso' },
  { file: 'sala', title: 'Sala del apartamento' },
  { file: 'gimnasio', title: 'Gimnasio universitario' },
] as const
const stages: Partial<Record<Person, string>> = { camila: 'pasillo', valeria: 'sala', natalia: 'gimnasio', akira: 'gimnasio', dante: 'gimnasio' }

function load() {
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem('worship-web:simulation') ?? ''
    return loadWorld(raw) ?? fresh()
  } catch { return fresh() }
}

export function Lab() {
  const [world, setWorld] = useState(load)
  const [person, setPerson] = useState<Person>('camila')
  const [companions, setCompanions] = useState<CastMember[]>([])
  const [reactions, setReactions] = useState<Partial<Record<CastMember, Pose>>>({})
  const [directing, setDirecting] = useState<CastMember | null>(null)
  const [commonIntent, setCommonIntent] = useState<Intent>('escuchar')
  const [reference, setReference] = useState('')
  const [notice, setNotice] = useState('')
  const [reset, setReset] = useState(false)
  const [filter, setFilter] = useState<'all' | 'person'>('all')
  const [summary, setSummary] = useState('')
  const [panel, setPanel] = useState<(typeof panels)[number] | null>(null)
  const [faceView, setFaceView] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => { title.current?.focus() }, [])
  const relation = world.relations[person]
  const memories = known(world, person)
  const shareOptions = shareable(world, person)
  const promise = world.promises.find(item => item.person === person)
  const finished = world.slot >= end
  const events = filter === 'all' ? world.events : memories
  const visibleIds = new Set(events.map(event => event.id))
  const latest = memories.at(-1)
  const agenda = world.promises.slice().sort((a, b) => a.due - b.due)
  const onStage = [person, ...companions]
  const directed = directing && onStage.includes(directing) ? directing : person
  const unavailable = (intent: Intent) => (intent === 'cumplir' && !promise) ||
    (intent === 'prometer' && (!!promise || world.slot + 3 >= end))

  function write(next: World) {
    setWorld(next)
    try { localStorage.setItem(key, saveWorld(next)); setNotice('') }
    catch { setNotice('El navegador no pudo guardar esta sesión.') }
  }

  function applyAction(next: World) {
    if (next === world) { setNotice('Esta acción no está disponible en este bloque.'); return }
    const updates = next.events.slice(world.events.length)
    const broken = updates.filter(event => event.kind === 'broken').map(event => event.audience[0])
    if (broken.length) setReactions(current => ({
      ...current,
      ...Object.fromEntries(broken.map(id => [id, 'disappointment'])),
    }))
    const changes = people.flatMap(id => {
      const before = world.relations[id].toMarcus
      const after = next.relations[id].toMarcus
      return indicators.flatMap(([stat, label]) => {
        const delta = after[stat] - before[stat]
        return delta ? [`${displayName(id)} · ${label.toLowerCase()} ${delta > 0 ? '+' : ''}${delta}`] : []
      })
    })
    const milestones = updates.flatMap(event => {
      if (event.kind === 'initiative') return [`${displayName(event.speaker)} tomó la iniciativa`]
      if (event.kind === 'broken') return [`Venció la promesa con ${displayName(event.audience[0])}`]
      return []
    })
    setSummary([`Bloques avanzados: ${next.slot - world.slot}`, ...milestones, ...changes].join(' · '))
    write(next)
    setReference('')
  }
  const act = (command: Command) => {
    const next = execute(world, command)
    if (next !== world && command.type === 'talk') {
      const activityReaction = command.activity === undefined ? undefined : characterActions[command.person][command.activity].reaction
      const pose = next.relations[command.person].tension >= 7 || command.intent === 'presionar' ? 'tension'
        : activityReaction ?? (command.intent === 'cumplir' ? 'pride'
        : ['escuchar', 'disculparse', 'bromear'].includes(command.intent) ? 'warmth' : 'neutral')
      setReactions(current => ({ ...current, [command.person]: pose }))
    }
    applyAction(next)
  }

  return <section className="lab lab-novel">
    <article className="story lab-main">
      <nav className="vn-quick lab-panel-nav" aria-label="Paneles de la partida">
        {panels.map(item => <button key={item} type="button" aria-haspopup="dialog"
          onClick={() => setPanel(item)}>{item}</button>)}
      </nav>
      <div className="vn-stage lab-stage layered-stage" style={{ backgroundImage: `linear-gradient(180deg,#100a19d9,transparent 35%,#120b1c 100%), url("${art(stages[person] ?? 'seul')}")` }}>
        <SceneCast people={onStage} speaker={person} reactions={reactions} />
        <header className="vn-scene-header lab-header">
          <h1 tabIndex={-1} ref={title}>Laboratorio de personajes</h1>
          <time>{finished ? 'Semana terminada' : time(world.slot)}</time>
        </header>
        <section className="vn-dialogue lab-exchange" aria-label="Conversación reciente">
          <strong className="vn-speaker">{latest ? displayName(latest.speaker) : displayName(person)}</strong>
          {reactions[person] && reactions[person] !== 'neutral' &&
            <span className="lab-reaction-label">{poses[reactions[person]]}</span>}
          <p aria-live="polite">{latest?.text ?? 'Elige una acción para iniciar la conversación.'}</p>
          <small className="lab-outcome" role="status">{notice || summary || (finished ? 'Puedes revisar la bitácora o iniciar otra semana.' : '')}</small>
        </section>
      </div>
      <div className="lab-controls">
      <label htmlFor="lab-cast">Hablar con</label>
      <select id="lab-cast" value={person} onChange={event => {
        const next = event.target.value as Person
        setPerson(next)
        setCompanions(current => current.filter(id => id !== next))
        setReference('')
        setNotice('')
      }}>
        {people.map(id => <option key={id} value={id}>{displayName(id)}</option>)}
      </select>
      <section className="lab-reactions" aria-label="Vista previa de reacciones">
        <h2>Reacciones</h2>
        <div className="lab-reaction-options" role="group" aria-label={`Reacciones de ${displayName(person)}`}>
          {(Object.keys(poses) as Pose[]).map(pose => <button key={pose} type="button"
            aria-pressed={(reactions[person] ?? 'neutral') === pose}
            onClick={() => setReactions(current => ({ ...current, [person]: pose }))}>{poses[pose]}</button>)}
        </div>
      </section>
      <section className="lab-stats" aria-label="Estadísticas del personaje">
        <h2>Estadísticas <span>de {displayName(person)}</span></h2>
        <dl>
          {[...indicators.map(([stat, label]) => [label, relation.toMarcus[stat]] as const), ['Tensión', relation.tension] as const]
            .map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}<span>/10</span></dd></div>)}
        </dl>
      </section>
      <fieldset disabled={finished}>
        <legend>Conversación</legend>
        <div className="lab-actions lab-character-actions">
          {([0, 1] as const).map(activity => {
            const option = characterActions[person][activity]
            return <button key={activity} type="button"
              onClick={() => act({ type: 'talk', person, intent: option.intent, activity })}>{option.label}</button>
          })}
        </div>
        <div className="lab-common-actions">
          <select aria-label="Otras acciones" value={commonIntent} onChange={event => setCommonIntent(event.target.value as Intent)}>
            {(Object.keys(intents) as Intent[]).filter(intent => intent !== 'charlar').map(intent =>
              <option key={intent} value={intent} disabled={unavailable(intent)}>{intents[intent]}</option>)}
          </select>
          <button type="button" disabled={unavailable(commonIntent)} onClick={() => act({ type: 'talk', person, intent: commonIntent })}>Hacer</button>
        </div>

        <div className="lab-actions lab-time-actions">
          <button type="button" onClick={() => act({ type: 'wait' })}>Pasar un bloque</button>
          <button type="button" onClick={() => applyAction(waitForEvent(world))}>Esperar al siguiente evento</button>
        </div>
      </fieldset>
      </div>
      {panel && <Overlay title={panel} onClose={() => setPanel(null)}>
      {panel === 'Escena' && <section className="lab-panel lab-companions">
        <h3>Personajes en escena ({onStage.length})</h3>
        <p>Selecciona hasta dos acompañantes para probar la composición.</p>
        <div className="lab-actions">
          {lineup.filter(id => id !== person).map(id => {
            const selected = companions.includes(id)
            return <button key={id} type="button" aria-pressed={selected}
              disabled={companions.length === 2 && !selected}
              onClick={() => setCompanions(current => selected ? current.filter(member => member !== id) : [...current, id])}>
              {castName(id)}
            </button>
          })}
        </div>
        <h3>Emociones y gestos</h3>
        <label htmlFor="direct-character">Personaje en escena</label>
        <select id="direct-character" value={directed} onChange={event => setDirecting(event.target.value as CastMember)}>
          {onStage.map(id => <option key={id} value={id}>{castName(id)}</option>)}
        </select>
        <label htmlFor="direct-pose">Gesto</label>
        <select id="direct-pose" value={reactions[directed] ?? 'neutral'} onChange={event => {
          const pose = event.target.value as Pose
          setReactions(current => ({ ...current, [directed]: pose }))
        }}>
          {(Object.keys(poses) as Pose[]).map(pose => <option key={pose} value={pose}>{poses[pose]}</option>)}
        </select>
      </section>}
      {panel === 'Recuerdos' && (finished ? <p>La semana terminó.</p> : shareOptions.length ? <form onSubmit={event => {
          event.preventDefault()
          if (reference) { act({ type: 'share', person, event: Number(reference) }); setPanel(null) }
        }}>
          <label htmlFor="share-event">Contarle algo que ocurrió</label>
          <select id="share-event" value={reference} onChange={event => setReference(event.target.value)}>
            <option value="">Selecciona un hecho</option>
            {shareOptions.map(event => <option key={event.id} value={event.id}>{displayName(event.speaker)} · {event.text}</option>)}
          </select>{' '}
          <button type="submit" disabled={!reference}>Contar</button>
        </form> : <p>No hay recuerdos nuevos para contarle a {displayName(person)}.</p>)}
      {panel === 'Sistemas' && <Dossier world={world} person={person} />}
      {panel === 'Historial' && <section className="lab-panel" aria-label="Historial">
      <h2>Bitácora ({world.events.length})</h2>
      <label htmlFor="event-filter">Qué mostrar</label>
      <select id="event-filter" value={filter} onChange={event => setFilter(event.target.value === 'all' ? 'all' : 'person')}>
        <option value="all">Todos los hechos</option>
        <option value="person">Lo que sabe {displayName(person)}</option>
      </select>
      <div className="lab-log">
        {events.length === 0 && <p>Todavía no hay hechos registrados.</p>}
        {events.slice().reverse().map(event => <div className="lab-entry" key={event.id}>
          <p><strong>{displayName(event.speaker)}</strong> · {time(event.slot)}{event.kind === 'initiative' ? ' · Iniciativa propia' : ''}</p>
          <p>{event.text}</p>
          {event.reference !== undefined && visibleIds.has(event.reference) &&
            <p>Hecho relacionado: {world.events[event.reference - 1].text}</p>}
          {event.reason && <details><summary>Motivo de la decisión</summary><p>{event.reason}</p></details>}
        </div>)}
      </div>
      </section>}
      {panel === 'Galería' && <section className="lab-panel" aria-label="Galería">
        <h2>Personajes</h2>
        <div className="lab-actions sprite-views" role="group" aria-label="Vista de personajes">
          <button type="button" aria-pressed={!faceView} onClick={() => setFaceView(false)}>Cuerpo completo</button>
          <button type="button" aria-pressed={faceView} onClick={() => setFaceView(true)}>Rostro</button>
        </div>
        <div className="lab-gallery sprite-gallery">
          {lineup.map(id => <figure key={id}>
            <CastArt person={id} portrait={faceView} />
            <figcaption><strong>{castName(id)}</strong><p>{id === 'marcus' ? 'Regresa tras dos años de servicio militar.' : profiles[id].goal}</p></figcaption>
          </figure>)}
        </div>
        <h2>Fondos e ilustraciones</h2>
        <div className="lab-gallery">
        {illustrations.map(({ file, title }) => <figure key={file}>
          <img src={art(file)} alt={title} loading="lazy" width="768" height="432" />
          <figcaption>{title}</figcaption>
        </figure>)}
        </div>
      </section>}
      {panel === 'Relaciones' && <section className="lab-panel" aria-label="Relaciones">
      <h2>{displayName(person)}</h2>
      <p>{profiles[person].goal}</p>
      <table className="relationship"><caption>Relación en ambas direcciones</caption><thead>
        <tr><th scope="col">Indicador</th><th scope="col">De Marcus</th><th scope="col">Hacia Marcus</th></tr>
      </thead><tbody>
        {indicators.map(([stat, label]) =>
          <tr key={stat}><th scope="row">{label}</th><td>{relation.fromMarcus[stat]}/10</td><td>{relation.toMarcus[stat]}/10</td></tr>)}
      </tbody></table>
      </section>}
      {panel === 'Estado' && <section className="lab-panel" aria-label="Estado">
      <h2>Estado de la partida</h2>
      <div className="lab-clock">
        <progress value={world.slot} max={end} aria-label="Progreso de la semana" />
        <span>{world.slot}/{end} bloques</span>
      </div>
      <p>Tensión de {displayName(person)} · {relation.tension}/10</p>
      <p>Hechos conocidos · {memories.length}</p>
      <section className="lab-agenda">
        <h3>Agenda de Marcus</h3>
        {agenda.length ? <ul>{agenda.map(item => <li key={item.event}>
          <strong>{displayName(item.person)}</strong><br />Volver antes de que termine {time(item.due).toLowerCase()}
        </li>)}</ul> : <p>No hay compromisos pendientes.</p>}
      </section>
      {reset ? <div className="lab-actions">
        <button type="button" onClick={() => { write(fresh()); setReset(false); setReactions({}); setReference(''); setSummary('') }}>Borrar sesión e iniciar otra</button>
        <button type="button" onClick={() => setReset(false)}>Cancelar</button>
      </div> : <button type="button" onClick={() => setReset(true)}>Reiniciar simulación</button>}
      </section>}
      </Overlay>}
    </article>
  </section>
}
