import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Lab } from './Lab.tsx'
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
  const [lab, setLab] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirmNew, setConfirmNew] = useState(false)
  const [gamePanel, setGamePanel] = useState<'history' | 'status' | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const scene = game ? scenes[game.scene] : null

  useEffect(() => {
    heading.current?.focus()
  }, [game?.scene, lab])

  function enter(next: Game) {
    setGame(next)
    setGamePanel(null)
    setConfirmNew(false)
    setNotice('')
  }

  function goToMenu() {
    setGame(null)
    setLab(false)
    setNotice('')
    setGamePanel(null)
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
        <button className="brand" type="button" onClick={goToMenu} aria-label="WORSHIP, menú principal">
          <span aria-hidden="true">◇</span> WORSHIP
        </button>
        <small>WEB EDITION · 2.0</small>
      </header>
      {lab ? <Lab /> : !game || !scene ? (
        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,#100a19 4%,#130b20b8 39%,#100a1933 100%), url("${art('seul')}")` }}>
          <div className="intro">
            <p className="eyebrow">CAPÍTULO I <span>·</span> EL REGRESO</p>
            <h1 ref={heading} tabIndex={-1}>WORSHIP</h1>
            <p className="themes">LOVE · POWER · OBSESSION · TRANSCENDENCE</p>
            <p className="question">¿Hasta dónde llegarías para superar tu propia humanidad?</p>
            <div className="actions">
              <button className="primary" type="button" onClick={() => saved ? setConfirmNew(true) : enter(start())}>Nueva partida</button>
              {saved && <button type="button" onClick={() => enter(saved)}>Continuar partida</button>}
              <button type="button" onClick={() => { setConfirmNew(false); setLab(true) }}>Laboratorio de personajes</button>
            </div>
            {confirmNew && <div className="confirm" role="group" aria-label="Confirmar nueva partida">
              <p>Al guardar una nueva partida, se reemplazará el avance anterior.</p>
              <button type="button" onClick={() => enter(start())}>Empezar desde el capítulo I</button>{' '}
              <button type="button" onClick={() => setConfirmNew(false)}>Cancelar</button>
            </div>}
          </div>
        </section>
      ) : (
        <section className="vn-frame" aria-label="Capítulo I">
          <article className="vn-stage" style={{ backgroundImage: `linear-gradient(180deg,#0b0712cb,transparent 35%,#0d0814 100%), url("${art(scene.art ?? (game.scene === 'regreso' ? 'pasillo' : 'seul'))}")` }}>
            <header className="vn-scene-header">
              <div>
                <p className="eyebrow">CAPÍTULO I · EL REGRESO</p>
                <h1 ref={heading} tabIndex={-1}>{scene.name}</h1>
              </div>
                <time dateTime={`2027-02-23T${scene.time}`}>23 FEB 2027 · {scene.time}</time>
            </header>
            <div className="vn-turn">
              {scene.choices && scene.choices.length > 1 && <div className="vn-options" aria-label="Decisiones">
                {scene.choices?.map((choice, index) => (
                  <button type="button" key={choice.label} onClick={() => enter(choose(game, index))}>{choice.label}</button>
                ))}
              </div>}
              <div className="vn-dialogue" aria-live="polite">
                <strong className="vn-speaker">{scene.speaker}</strong>
                {scene.text.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {scene.choices?.length === 1 && <button className="vn-advance" type="button" onClick={() => enter(choose(game, 0))}>{scene.choices[0].label}</button>}
                {scene.outcome && <button type="button" className="vn-advance" onClick={goToMenu}>Volver al menú</button>}
              </div>
            </div>
          </article>
          <nav className="vn-quick" aria-label="Controles de partida">
            <button type="button" aria-expanded={gamePanel === 'history'} onClick={() => setGamePanel(gamePanel === 'history' ? null : 'history')}>Historial</button>
            <button type="button" aria-expanded={gamePanel === 'status'} onClick={() => setGamePanel(gamePanel === 'status' ? null : 'status')}>Estado</button>
            <button type="button" onClick={save}>Guardar partida</button>
            <button type="button" disabled={!saved} onClick={() => { if (saved) enter(saved) }}>Cargar partida</button>
            <button type="button" onClick={goToMenu}>Menú</button>
          </nav>
          <p className="vn-notice" role="status">{notice}</p>
          {gamePanel === 'status' && <aside className="vn-panel" aria-label="Estado de la partida">
            <h2>Estado de Marcus</h2>
            {(Object.keys(meters) as Meter[]).map(key => (
              <div className="stat" key={key}>
                <div><span>{meters[key]}</span><span>{game.stats[key]}/10</span></div>
                <meter min={0} max={10} value={game.stats[key]} aria-label={meters[key]} />
              </div>
            ))}
          </aside>}
          {gamePanel === 'history' && <aside className="vn-panel" aria-label="Historial de decisiones">
              <h2>Historial de decisiones</h2>
              {game.history.length ? <ol>{game.history.map(entry => <li key={entry.scene}>{entry.label}</li>)}</ol> : <p>Aún no hay decisiones.</p>}
          </aside>}
        </section>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
