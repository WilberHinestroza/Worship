import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Lab } from './Lab.tsx'
import { Dossier } from './Dossier.tsx'
import { Overlay } from './Overlay.tsx'
import { art } from './art.ts'
import { SceneSprite } from './SceneSprite.tsx'
import { choose, decode, encode } from './game.ts'
import { ChapterView } from './ChapterView.tsx'
import { chapterSaveKey, loadChapter, saveChapter, startChapter } from './chapter.ts'
import type { Chapter } from './chapter.ts'
import type { Game } from './game.ts'
import { meters, scenes } from './story.ts'
import type { Meter } from './story.ts'
import './style.css'

const saveKey = 'worship-web:chapter-i'

function readSave() {
  try {
    const raw = localStorage.getItem(saveKey)
    return raw ? decode(raw) : null
  } catch {
    return null
  }
}

function readChapterSave() {
  try {
    return loadChapter(localStorage.getItem(chapterSaveKey) ?? '')
  } catch {
    return null
  }
}

function App() {
  const [savedChapter, setSavedChapter] = useState(readChapterSave)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [playerName, setPlayerName] = useState('Marcus')
  const [saved, setSaved] = useState(readSave)
  const [game, setGame] = useState<Game | null>(null)
  const [lab, setLab] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirmNew, setConfirmNew] = useState(false)
  const [gamePanel, setGamePanel] = useState<'history' | 'status' | 'systems' | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const scene = game ? scenes[game.scene] : null
  const backdrop = game?.scene === 'entreno' ? 'gimnasio'
    : game?.scene === 'cafe' ? 'sala'
      : scene?.art || game?.scene === 'regreso' ? 'pasillo' : 'seul'

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
    setChapter(null)
    setConfirmNew(false)
    setGame(null)
    setLab(false)
    setNotice('')
    setGamePanel(null)
  }

  function storeChapter() {
    if (!chapter) return false
    try {
      localStorage.setItem(chapterSaveKey, saveChapter(chapter))
      setSavedChapter(chapter)
      return true
    } catch {
      return false
    }
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
      {lab ? <Lab /> : chapter ? (
        <ChapterView chapter={chapter} saved={savedChapter} onChange={setChapter} onSave={storeChapter} onMenu={goToMenu} />
      ) : !game || !scene ? (
        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,#100a19 4%,#130b20b8 39%,#100a1933 100%), url("${art('seul')}")` }}>
          <div className="intro">
            <p className="eyebrow">TEMPORADA 1 <span>·</span> CAPÍTULO I</p>
            <h1 ref={heading} tabIndex={-1}>WORSHIP</h1>
            <p className="themes">LOVE · POWER · OBSESSION · TRANSCENDENCE</p>
            <p className="question">¿Hasta dónde llegarías para superar tu propia humanidad?</p>
            <div className="actions">
              <button className="primary" type="button" onClick={() => setConfirmNew(true)}>Nueva partida</button>
              {savedChapter && <button type="button" onClick={() => { setConfirmNew(false); setChapter(savedChapter) }}>Continuar partida</button>}
              {saved && <button type="button" onClick={() => enter(saved)}>Continuar partida de la demo</button>}
              <button type="button" onClick={() => { setConfirmNew(false); setLab(true) }}>Laboratorio de personajes</button>
            </div>
            {confirmNew && <Overlay title="Nueva partida" onClose={() => setConfirmNew(false)}>
              <form className="chapter-name" onSubmit={event => {
                event.preventDefault()
                setChapter(startChapter(playerName))
                setConfirmNew(false)
              }}>
                <label htmlFor="player-name">Nombre del protagonista</label>
                <input id="player-name" value={playerName} maxLength={32} onChange={event => setPlayerName(event.target.value)} />
                {savedChapter && <p>Al guardar, se reemplazará el avance anterior del capítulo.</p>}
                <button className="primary" type="submit">Empezar capítulo I</button>
              </form>
            </Overlay>}
          </div>
        </section>
      ) : (
        <section className="vn-frame" aria-label="Capítulo I">
          <article className="vn-stage layered-stage" style={{ backgroundImage: `linear-gradient(180deg,#0b0712cb,transparent 35%,#0d0814 100%), url("${art(backdrop)}")` }}>
            <SceneSprite character={scene.art ? 'camila' : 'marcus'} />
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
            <button type="button" aria-expanded={gamePanel === 'systems'} onClick={() => setGamePanel(gamePanel === 'systems' ? null : 'systems')}>Sistemas</button>
            <button type="button" aria-expanded={gamePanel === 'history'} onClick={() => setGamePanel(gamePanel === 'history' ? null : 'history')}>Historial</button>
            <button type="button" aria-expanded={gamePanel === 'status'} onClick={() => setGamePanel(gamePanel === 'status' ? null : 'status')}>Estado</button>
            <button type="button" onClick={save}>Guardar partida</button>
            <button type="button" disabled={!saved} onClick={() => { if (saved) enter(saved) }}>Cargar partida</button>
            <button type="button" onClick={goToMenu}>Menú</button>
          </nav>
          <p className="vn-notice" role="status">{notice}</p>
          {gamePanel && <Overlay title={{ systems: 'Sistemas', status: 'Estado de la partida', history: 'Historial de decisiones' }[gamePanel]}
            onClose={() => setGamePanel(null)}>
          {gamePanel === 'systems' && <Dossier game={game} />}
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
              {game.history.length ? <ol>{game.history.map(entry => <li key={entry.scene}>{entry.label}</li>)}</ol> : <p>Aún no hay decisiones.</p>}
          </aside>}
          </Overlay>}
        </section>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
