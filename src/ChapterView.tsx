import { useEffect, useRef, useState } from 'react'
import { art } from './art.ts'
import { Overlay } from './Overlay.tsx'
import { SceneCast } from './SceneCast.tsx'
import { advanceChapter, chapterChoices, chapterPage, selectChapterChoice } from './chapter.ts'
import type { Chapter } from './chapter.ts'

type Panel = 'Diario' | 'Historial' | 'Interludios'

export function ChapterView({ chapter, saved, onChange, onSave, onMenu }: {
  chapter: Chapter; saved: Chapter | null
  onChange: (next: Chapter) => void; onSave: () => boolean; onMenu: () => void
}) {
  const [panel, setPanel] = useState<Panel | null>(null)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const page = chapterPage(chapter)
  const last = chapter.beat + 1 === page.beats.length
  const options = last ? chapterChoices(chapter) : []
  const vignette = page.panel && chapter.beat === 0 ? page.panel : undefined
  const background = art(vignette ? `capitulo1/${vignette}` : page.backdrop)

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [chapter.scene])

  function go(next: Chapter) {
    setNotice('')
    onChange(next)
  }
  function save() {
    const stored = onSave()
    setNotice(stored ? 'Partida guardada.' : 'No se pudo guardar en este navegador.')
    return stored
  }

  return <section className="vn-frame chapter-frame" aria-label="Temporada 1, capítulo I">
    <article className="vn-stage layered-stage chapter-stage" style={{ backgroundImage:
      `linear-gradient(180deg,#0b0712c9,transparent 38%,#0d0814e8 100%), url("${background}")` }}>
      {!vignette && page.cast.length > 0 && <SceneCast people={page.cast} reactions={{}} />}
      <header className="vn-scene-header">
        <div>
          <p className="eyebrow">{page.interlude ? 'INTERLUDIO · POV EXTERNO' : 'TEMPORADA 1 · CAPÍTULO I'}</p>
          <h1 ref={heading} tabIndex={-1}>{page.name}</h1>
        </div>
        <time dateTime={`2027-02-23T${page.at}`}>{page.place} · {page.at}</time>
      </header>
      <div className="vn-turn">
        <div className="vn-dialogue chapter-dialogue">
          <p aria-live="polite">{page.beats[chapter.beat]}</p>
          {!last && <button className="vn-advance" type="button" onClick={() => go(advanceChapter(chapter))}>Continuar</button>}
          {last && options.length === 1 &&
            <button className="vn-advance" type="button" onClick={() => go(selectChapterChoice(chapter, options[0].id))}>{options[0].label}</button>}
          {last && chapter.ending && <button className="vn-advance" type="button" onClick={() => { if (save()) onMenu() }}>Guardar y volver al menú</button>}
        </div>
        {options.length > 1 && <div className="vn-options chapter-choices" aria-label="Decisiones">
          {options.map(option => <button key={option.id} type="button"
            onClick={() => go(selectChapterChoice(chapter, option.id))}>{option.label}</button>)}
        </div>}
      </div>
    </article>
    <nav className="vn-quick" aria-label="Controles de partida">
      {(['Diario', 'Historial', 'Interludios'] as const).map(item => <button key={item} type="button" aria-haspopup="dialog" onClick={() => setPanel(item)}>{item}</button>)}
      <button type="button" onClick={save}>Guardar partida</button>
      <button type="button" disabled={!saved} onClick={() => { if (saved) go(saved) }}>Cargar partida</button>
      <button type="button" onClick={onMenu}>Menú</button>
    </nav>
    <p className="vn-notice" role="status">{notice}</p>
    {panel && <Overlay title={panel} onClose={() => setPanel(null)}>
      {panel === 'Diario' && <>
        {chapter.authorization && <p>Autorización del 701 · {chapter.authorization}</p>}
        <h3>Compromisos</h3>
        {chapter.appointments.length ? <ul>{chapter.appointments.map(item =>
          <li key={item.label}>{item.label}{item.date && ` · ${item.date.slice(8, 10)}/02 · ${item.date.slice(11)}`}</li>)}</ul> : <p>Aún no hay compromisos registrados.</p>}
        <h3>Hechos conocidos por {chapter.name}</h3>
        {chapter.facts.length ? <ul>{chapter.facts.map(fact => <li key={fact}>{fact}</li>)}</ul> : <p>Aún no hay anotaciones.</p>}
        {chapter.messages.length > 0 && <>
          <h3>Mensajes</h3>
          <ul>{chapter.messages.map(message => <li key={message}>{message}</li>)}</ul>
        </>}
      </>}
      {panel === 'Historial' && (chapter.path.some(entry => entry.label)
        ? <ol>{chapter.path.map((entry, index) => entry.label && <li key={index}>{entry.label}</li>)}</ol>
        : <p>Aún no has tomado decisiones.</p>)}
      {panel === 'Interludios' && (chapter.autonomous.length ? <ol>{chapter.autonomous.map(id =>
        <li key={id}>{id === 'C1-03' ? '18:42 · Créditos' : '20:04 · El margen'}</li>)}</ol> : <p>Aún no hay interludios registrados.</p>)}
    </Overlay>}
  </section>
}
