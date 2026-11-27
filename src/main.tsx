import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { choose, decode, encode, start } from './game.ts'
import type { Game } from './game.ts'
import { meters, scenes } from './story.ts'
import type { Meter } from './story.ts'
import './style.css'

const saveKey = 'worship-web:chapter-i'
const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`

function readSave() {
  try {
    const raw = localStorage.getItem(saveKey)
    return raw ? decode(raw) : null
  } catch {
    return null
  }
}

function App() {
  const [saved, setSaved] = useState(readSave)
  const [game, setGame] = useState<Game | null>(null)
  const [notice, setNotice] = useState('')
  const [confirmNew, setConfirmNew] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const scene = game ? scenes[game.scene] : null

  useEffect(() => {
    heading.current?.focus()
  }, [game?.scene])

  function enter(next: Game) {
    setGame(next)
    setConfirmNew(false)
    setNotice('')
  }

  function save() {
    if (!game) return
    try {
      localStorage.setItem(saveKey, encode(game))
      setSaved(game)
      setNotice('Partida guardada en este navegador.')
    } catch {
      setNotice('El navegador no pudo guardar la partida.')
    }
  }

  return (
    <main>
      <header className="top">
        <button className="brand" type="button" onClick={() => { setGame(null); setNotice('') }} aria-label="WORSHIP, menú principal">
          <span aria-hidden="true">◇</span> WORSHIP
        </button>
        {game && <button className="quiet" type="button" onClick={save}>Guardar partida</button>}
        {!game && <small>WEB EDITION · 2.0</small>}
      </header>
      {!game || !scene ? (
        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,#100a19 4%,#130b20b8 39%,#100a1933 100%), url("${art('seul')}")` }}>
          <div className="intro">
            <p className="eyebrow">CAPÍTULO I <span>·</span> EL REGRESO</p>
            <h1 ref={heading} tabIndex={-1}>WORSHIP</h1>
            <p className="themes">LOVE · POWER · OBSESSION · TRANSCENDENCE</p>
            <p className="question">¿Hasta dónde llegarías para superar tu propia humanidad?</p>
            <div className="actions">
              <button className="primary" type="button" onClick={() => saved ? setConfirmNew(true) : enter(start())}>Nueva partida</button>
              {saved && <button type="button" onClick={() => enter(saved)}>Continuar partida</button>}
            </div>
            {confirmNew && <div className="confirm" role="group" aria-label="Confirmar nueva partida">
              <p>Al guardar una nueva partida, se reemplazará el avance anterior.</p>
              <button type="button" onClick={() => enter(start())}>Empezar desde el capítulo I</button>{' '}
              <button type="button" onClick={() => setConfirmNew(false)}>Cancelar</button>
            </div>}
          </div>
        </section>
      ) : (
        <div className="layout">
          <article className="story">
            <div className="scene-art" style={{ backgroundImage: `linear-gradient(0deg,#130e1c 0%,transparent 55%), url("${art(scene.art ?? 'seul')}")` }}>
              <p className="eyebrow">CAPÍTULO I <span>·</span> EL REGRESO</p>
              <h1 ref={heading} tabIndex={-1}>{scene.name}</h1>
            </div>
            <div className="dialogue">
              <div className="scene-meta">
                <strong>{scene.speaker}</strong>
                <time dateTime={`2027-02-23T${scene.time}`}>23 FEB 2027 · {scene.time}</time>
              </div>
              {scene.text.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              <div className="choices">
                {scene.choices?.map((choice, index) => (
                  <button className="choice" type="button" key={choice.label} onClick={() => enter(choose(game, index))}>{choice.label}</button>
                ))}
                {scene.outcome && <button type="button" className="primary" onClick={() => { setGame(null); setNotice('') }}>Volver al menú</button>}
              </div>
            </div>
          </article>
          <aside className="sidebar" aria-label="Estado de la partida">
            <h2>Estado de Marcus</h2>
            {(Object.keys(meters) as Meter[]).map(key => (
              <div className="stat" key={key}>
                <div><span>{meters[key]}</span><span>{game.stats[key]}/10</span></div>
                <meter min={0} max={10} value={game.stats[key]} aria-label={meters[key]} />
              </div>
            ))}
            <details>
              <summary>Historial de decisiones ({game.history.length})</summary>
              {game.history.length ? <ol>{game.history.map(entry => <li key={entry.scene}>{entry.label}</li>)}</ol> : <p>Aún no hay decisiones.</p>}
            </details>
            <p className="notice" role="status">{notice}</p>
          </aside>
        </div>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
