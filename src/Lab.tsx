import { useState } from 'react'
import { createSimulation, interact, interpret, intents, profiles, restore, serialize, turnLimit } from './simulation.ts'
import type { Intent, Person, Simulation } from './simulation.ts'

const labKey = 'worship-web:simulation'
const fresh = () => createSimulation(crypto.getRandomValues(new Uint32Array(1))[0])
function load(): Simulation {
  try { return restore(localStorage.getItem(labKey) ?? '') ?? fresh() }
  catch { return fresh() }
}

export function Lab() {
  const [sim, setSim] = useState(load)
  const [person, setPerson] = useState<Person>('camila')
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [reset, setReset] = useState(false)
  const profile = profiles[person]
  const character = sim.cast[person]
  const log = sim.log.filter(entry => entry.action.person === person)
  const limitReached = sim.log.length >= turnLimit

  function write(next: Simulation) {
    setSim(next)
    try { localStorage.setItem(labKey, serialize(next)); setNotice('') }
    catch { setNotice('El navegador no pudo guardar esta sesión.') }
  }
  function act(intent: Intent, line?: string) {
    write(interact(sim, { person, intent, text: line }))
    setText('')
  }

  return <section className="layout lab">
    <article className="story dialogue">
      <p className="eyebrow">WORSHIP · SIMULACIÓN</p>
      <h1>Laboratorio de personajes</h1>
      <label htmlFor="person">Personaje</label>
      <select id="person" value={person} onChange={event => { setPerson(event.target.value as Person); setText('') }}>
        {(Object.keys(profiles) as Person[]).map(id => <option key={id} value={id}>{profiles[id].name}</option>)}
      </select>
      <div className="lab-log" aria-live="polite" aria-relevant="additions text">
        {log.length === 0 && <p>Elige una acción para iniciar la conversación.</p>}
        {log.slice(-8).map(({ action, response }, index) => <div className="lab-entry" key={log.length - Math.min(log.length, 8) + index}>
          <p><strong>Marcus</strong> · {action.text || intents[action.intent]}</p>
          <p><strong>{profile.name}</strong> · {response}</p>
        </div>)}
      </div>
      <div className="lab-actions">
        {(Object.keys(intents) as Intent[]).map(intent => <button key={intent} type="button" disabled={limitReached} onClick={() => act(intent)}>{intents[intent]}</button>)}
      </div>
      <form onSubmit={event => {
        event.preventDefault()
        if (limitReached) return
        const intent = interpret(text)
        if (intent) act(intent, text.trim())
        else setNotice('No reconocí la acción. Usa un botón o empieza con «Te escucho», «Perdón» o «Prometo volver».')
      }}>
        <label htmlFor="free-action">Acción escrita</label>
        <input id="free-action" value={text} maxLength={240} onChange={event => setText(event.target.value)} placeholder="Te escucho" />
        <button type="submit" disabled={limitReached || !text.trim()}>Enviar</button>
      </form>
      <p role="status">{limitReached ? 'La sesión llegó a 200 turnos. Puedes iniciar otra.' : notice}</p>
    </article>
    <aside className="sidebar">
      <h2>{profile.name}</h2>
      <p>{profile.goal}</p>
      <dl>
        <dt>Confianza</dt><dd>{character.trust}/10</dd>
        <dt>Tensión</dt><dd>{character.stress}/10</dd>
        <dt>Recuerdos registrados</dt><dd>{character.memories.length}</dd>
        <dt>Promesa pendiente</dt><dd>{character.due === null ? 'Ninguna' : `Hasta el turno ${character.due}`}</dd>
      </dl>
      <details>
        <summary>Memoria reciente</summary>
        <ol>{character.memories.slice(-8).reverse().map(memory =>
          <li key={`${memory.turn}-${memory.event}`}>Turno {memory.turn} · {memory.event === 'incumplir' ? 'Promesa incumplida' : intents[memory.event]}</li>)}</ol>
      </details>
      {reset ? <div className="lab-actions">
        <button type="button" onClick={() => { write(fresh()); setReset(false); setText('') }}>Borrar sesión e iniciar otra</button>
        <button type="button" onClick={() => setReset(false)}>Cancelar</button>
      </div> : <button type="button" onClick={() => setReset(true)}>Reiniciar simulación</button>}
    </aside>
  </section>
}
