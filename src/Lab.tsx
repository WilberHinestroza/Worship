import { useEffect, useRef, useState } from 'react'
import { interpret, intents, profiles } from './simulation.ts'
import type { Person } from './simulation.ts'
import { createWorld, end, execute, known, loadWorld, saveWorld, shareable, time, waitForEvent } from './world.ts'
import type { Command, World } from './world.ts'

const key = 'worship-web:simulation:v2'
const fresh = () => createWorld(crypto.getRandomValues(new Uint32Array(1))[0])
const names = { marcus: 'Marcus', camila: profiles.camila.name, valeria: profiles.valeria.name, natalia: profiles.natalia.name }
const indicators = [['trust', 'Confianza'], ['affection', 'Afecto'], ['respect', 'Respeto'], ['resentment', 'Resentimiento']] as const

function load() {
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem('worship-web:simulation') ?? ''
    return loadWorld(raw) ?? fresh()
  } catch { return fresh() }
}

export function Lab() {
  const [world, setWorld] = useState(load)
  const [person, setPerson] = useState<Person>('camila')
  const [text, setText] = useState('')
  const [reference, setReference] = useState('')
  const [notice, setNotice] = useState('')
  const [reset, setReset] = useState(false)
  const [filter, setFilter] = useState<'all' | 'person'>('all')
  const [summary, setSummary] = useState('')
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

  function write(next: World) {
    setWorld(next)
    try { localStorage.setItem(key, saveWorld(next)); setNotice('') }
    catch { setNotice('El navegador no pudo guardar esta sesión.') }
  }

  function applyAction(next: World) {
    if (next === world) { setNotice('Esta acción no está disponible en este bloque.'); return }
    const updates = next.events.slice(world.events.length)
    const changes = (Object.keys(profiles) as Person[]).flatMap(id => {
      const before = world.relations[id].toMarcus
      const after = next.relations[id].toMarcus
      return indicators.flatMap(([stat, label]) => {
        const delta = after[stat] - before[stat]
        return delta ? [`${names[id]} · ${label.toLowerCase()} ${delta > 0 ? '+' : ''}${delta}`] : []
      })
    })
    const milestones = updates.flatMap(event => {
      if (event.kind === 'initiative') return [`${names[event.speaker]} tomó la iniciativa`]
      if (event.kind === 'broken') return [`Venció la promesa con ${names[event.audience[0]]}`]
      return []
    })
    setSummary([`Bloques avanzados: ${next.slot - world.slot}`, ...milestones, ...changes].join(' · '))
    write(next)
    setText('')
    setReference('')
  }
  const act = (command: Command) => applyAction(execute(world, command))

  return <section className="layout lab">
    <header className="lab-header">
      <p className="eyebrow">WORSHIP · SIMULACIÓN</p>
      <h1 tabIndex={-1} ref={title}>Laboratorio de personajes</h1>
      <div className="lab-clock">
        <strong>{finished ? 'Semana terminada' : time(world.slot)}</strong>
        <progress value={world.slot} max={end} aria-label="Progreso de la semana" />
        <span>{world.slot}/{end} bloques</span>
      </div>
    </header>
    <article className="story dialogue lab-main">
      <div className="lab-cast" role="group" aria-label="Personaje">
        {(Object.keys(profiles) as Person[]).map(id => <button key={id} type="button" aria-pressed={person === id} onClick={() => {
        setPerson(id)
        setText('')
        setReference('')
        setNotice('')
        }}>{names[id]}</button>)}
      </div>
      <section className="lab-exchange" aria-label="Conversación reciente">
        <p className="eyebrow">{latest ? names[latest.speaker] : names[person]}</p>
        <p>{latest?.text ?? 'Elige una acción para iniciar la conversación.'}</p>
      </section>
      <fieldset disabled={finished}>
        <legend>Acciones de Marcus</legend>
        <div className="lab-actions">
          {(Object.keys(intents) as (keyof typeof intents)[]).map(intent =>
            <button key={intent} type="button"
              disabled={(intent === 'cumplir' && !promise) || (intent === 'prometer' && (!!promise || world.slot + 3 >= end))}
              onClick={() => act({ type: 'talk', person, intent })}>{intents[intent]}</button>)}
        </div>
        <form onSubmit={event => {
          event.preventDefault()
          const intent = interpret(text)
          if (intent) act({ type: 'talk', person, intent, text: text.trim() })
          else setNotice('¿Qué quieres hacer? Prueba «Te escucho», «Perdón» o una de las acciones disponibles.')
        }}>
          <label htmlFor="free-action">Acción escrita</label>
          <input id="free-action" value={text} maxLength={240} onChange={event => setText(event.target.value)} placeholder="Te escucho" />
          <button type="submit" disabled={!text.trim()}>Enviar</button>
        </form>
        {shareOptions.length > 0 && <details className="lab-share"><summary>Compartir un recuerdo</summary><form onSubmit={event => {
          event.preventDefault()
          if (reference) act({ type: 'share', person, event: Number(reference) })
        }}>
          <label htmlFor="share-event">Contarle algo que ocurrió</label>
          <select id="share-event" value={reference} onChange={event => setReference(event.target.value)}>
            <option value="">Selecciona un hecho</option>
            {shareOptions.map(event => <option key={event.id} value={event.id}>{names[event.speaker]} · {event.text}</option>)}
          </select>{' '}
          <button type="submit" disabled={!reference}>Contar</button>
        </form></details>}
        <div className="lab-actions lab-time-actions">
          <button type="button" onClick={() => act({ type: 'wait' })}>Pasar un bloque</button>
          <button type="button" onClick={() => applyAction(waitForEvent(world))}>Esperar al siguiente evento</button>
        </div>
      </fieldset>
      <p className="lab-outcome" role="status">{notice || summary || (finished ? 'Puedes revisar la bitácora o iniciar otra semana.' : '')}</p>
      <details className="lab-history"><summary>Bitácora ({world.events.length})</summary>
      <label htmlFor="event-filter">Qué mostrar</label>
      <select id="event-filter" value={filter} onChange={event => setFilter(event.target.value === 'all' ? 'all' : 'person')}>
        <option value="all">Todos los hechos</option>
        <option value="person">Lo que sabe {names[person]}</option>
      </select>
      <div className="lab-log">
        {events.length === 0 && <p>Todavía no hay hechos registrados.</p>}
        {events.slice().reverse().map(event => <div className="lab-entry" key={event.id}>
          <p><strong>{names[event.speaker]}</strong> · {time(event.slot)}{event.kind === 'initiative' ? ' · Iniciativa propia' : ''}</p>
          <p>{event.text}</p>
          {event.reference !== undefined && visibleIds.has(event.reference) &&
            <p>Hecho relacionado: {world.events[event.reference - 1].text}</p>}
          {event.reason && <details><summary>Motivo de la decisión</summary><p>{event.reason}</p></details>}
        </div>)}
      </div>
      </details>
    </article>
    <aside className="sidebar">
      <h2>{names[person]}</h2>
      <p>{profiles[person].goal}</p>
      <p>Tensión: {relation.tension}/10</p>
      <p>Hechos conocidos: {memories.length}</p>
      <p>Promesa pendiente: {promise ? time(promise.due) : 'Ninguna'}</p>
      <table className="relationship"><caption>Relación en ambas direcciones</caption><thead>
        <tr><th scope="col">Indicador</th><th scope="col">De Marcus</th><th scope="col">Hacia Marcus</th></tr>
      </thead><tbody>
        {indicators.map(([stat, label]) =>
          <tr key={stat}><th scope="row">{label}</th><td>{relation.fromMarcus[stat]}/10</td><td>{relation.toMarcus[stat]}/10</td></tr>)}
      </tbody></table>
      <section className="lab-agenda">
        <h3>Agenda de Marcus</h3>
        {agenda.length ? <ul>{agenda.map(item => <li key={item.event}>
          <strong>{names[item.person]}</strong><br />Volver antes de que termine {time(item.due).toLowerCase()}
        </li>)}</ul> : <p>No hay compromisos pendientes.</p>}
      </section>
      {reset ? <div className="lab-actions">
        <button type="button" onClick={() => { write(fresh()); setReset(false); setText(''); setReference(''); setSummary('') }}>Borrar sesión e iniciar otra</button>
        <button type="button" onClick={() => setReset(false)}>Cancelar</button>
      </div> : <button type="button" onClick={() => setReset(true)}>Reiniciar simulación</button>}
    </aside>
  </section>
}
