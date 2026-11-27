import { useState } from 'react'
import { interpret, intents, profiles } from './simulation.ts'
import type { Person } from './simulation.ts'
import { createWorld, end, execute, known, loadWorld, saveWorld, shareable, time } from './world.ts'
import type { Command, World } from './world.ts'

const key = 'worship-web:simulation:v2'
const fresh = () => createWorld(crypto.getRandomValues(new Uint32Array(1))[0])
const names = { marcus: 'Marcus', camila: profiles.camila.name, valeria: profiles.valeria.name, natalia: profiles.natalia.name }

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
  const relation = world.relations[person]
  const memories = known(world, person)
  const shareOptions = shareable(world, person)
  const promise = world.promises.find(item => item.person === person)
  const finished = world.slot >= end
  const events = filter === 'all' ? world.events : memories
  const visibleIds = new Set(events.map(event => event.id))

  function write(next: World) {
    setWorld(next)
    try { localStorage.setItem(key, saveWorld(next)); setNotice('') }
    catch { setNotice('El navegador no pudo guardar esta sesión.') }
  }

  function act(command: Command) {
    const next = execute(world, command)
    if (next === world) { setNotice('Esta acción no está disponible en este bloque.'); return }
    write(next)
    setText('')
    setReference('')
  }

  return <section className="layout lab">
    <article className="story dialogue">
      <p className="eyebrow">WORSHIP · SIMULACIÓN</p>
      <h1 tabIndex={-1} ref={node => { if (node && !node.dataset.entered) { node.dataset.entered = 'true'; node.focus() } }}>Laboratorio de personajes</h1>
      <p><strong>{finished ? 'Semana terminada' : time(world.slot)}</strong> · {world.slot}/{end} bloques transcurridos</p>
      <label htmlFor="person">Personaje</label>
      <select id="person" value={person} onChange={event => {
        setPerson(event.target.value as Person)
        setText('')
        setReference('')
        setNotice('')
      }}>
        {(Object.keys(profiles) as Person[]).map(id => <option key={id} value={id}>{names[id]}</option>)}
      </select>
      <fieldset disabled={finished}>
        <legend>Acciones de Marcus</legend>
        <div className="lab-actions">
          {(Object.keys(intents) as (keyof typeof intents)[]).map(intent =>
            <button key={intent} type="button"
              disabled={(intent === 'cumplir' && !promise) || (intent === 'prometer' && (!!promise || world.slot + 3 >= end))}
              onClick={() => act({ type: 'talk', person, intent })}>{intents[intent]}</button>)}
          <button type="button" className="primary" onClick={() => act({ type: 'wait' })}>Pasar tiempo</button>
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
        {shareOptions.length > 0 && <form onSubmit={event => {
          event.preventDefault()
          if (reference) act({ type: 'share', person, event: Number(reference) })
        }}>
          <label htmlFor="share-event">Contarle algo que ocurrió</label>
          <select id="share-event" value={reference} onChange={event => setReference(event.target.value)}>
            <option value="">Selecciona un hecho</option>
            {shareOptions.map(event => <option key={event.id} value={event.id}>{names[event.speaker]} · {event.text}</option>)}
          </select>{' '}
          <button type="submit" disabled={!reference}>Contar</button>
        </form>}
      </fieldset>
      <p role="status">{finished ? 'Puedes revisar la bitácora o iniciar otra semana.' : notice}</p>
      <label htmlFor="event-filter">Bitácora</label>
      <select id="event-filter" value={filter} onChange={event => setFilter(event.target.value === 'all' ? 'all' : 'person')}>
        <option value="all">Todos los hechos</option>
        <option value="person">Lo que sabe {names[person]}</option>
      </select>
      <div className="lab-log" aria-live="polite">
        {events.length === 0 && <p>Todavía no hay hechos registrados.</p>}
        {events.slice().reverse().map(event => <div className="lab-entry" key={event.id}>
          <p><strong>{names[event.speaker]}</strong> · {time(event.slot)}{event.kind === 'initiative' ? ' · Iniciativa propia' : ''}</p>
          <p>{event.text}</p>
          {event.reference !== undefined && visibleIds.has(event.reference) &&
            <p>Hecho relacionado: {world.events[event.reference - 1].text}</p>}
          {event.reason && <details><summary>Motivo de la decisión</summary><p>{event.reason}</p></details>}
        </div>)}
      </div>
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
        {([['trust', 'Confianza'], ['affection', 'Afecto'], ['respect', 'Respeto'], ['resentment', 'Resentimiento']] as const).map(([stat, label]) =>
          <tr key={stat}><th scope="row">{label}</th><td>{relation.fromMarcus[stat]}/10</td><td>{relation.toMarcus[stat]}/10</td></tr>)}
      </tbody></table>
      {reset ? <div className="lab-actions">
        <button type="button" onClick={() => { write(fresh()); setReset(false); setText(''); setReference('') }}>Borrar sesión e iniciar otra</button>
        <button type="button" onClick={() => setReset(false)}>Cancelar</button>
      </div> : <button type="button" onClick={() => setReset(true)}>Reiniciar simulación</button>}
    </aside>
  </section>
}
