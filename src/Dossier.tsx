import { profiles } from './simulation.ts'
import type { Person } from './simulation.ts'
import { end, time } from './world.ts'
import type { World } from './world.ts'
import { scenes } from './story.ts'
import type { Game } from './game.ts'

const sections = [
  ['psychology', 'Psicología', '◈', 'Personalidad, tensión y recuerdos.'],
  ['relationships', 'Relaciones', '♡', 'Confianza, afecto, respeto y resentimiento.'],
  ['research', 'Investigación', '♢', 'GENESIS, EVOLUTION, ASCENSION y ADAM.'],
  ['world', 'Mundo vivo', '◎', 'Iniciativas, compromisos y paso del tiempo.'],
  ['economy', 'Economía', '▤', 'Ingresos, empresas, propiedades y contratos.'],
  ['social', 'Redes sociales', '▣', 'Publicaciones, seguidores y mensajes privados.'],
  ['progress', 'Progresión', '✦', 'Objetivos, capítulos y desenlaces.'],
] as const

const traits = [['trust', 'Confianza'], ['affection', 'Afecto'], ['respect', 'Respeto'], ['resentment', 'Resentimiento']] as const
type Props = { game: Game; world?: never; person?: never } | { game?: never; world: World; person: Person }

export function Dossier({ game, world, person }: Props) {
  const scene = game ? scenes[game.scene] : null
  const profile = person ? profiles[person] : null
  const relationship = world && person ? world.relations[person] : null
  const initiatives = world?.events.filter(event => event.kind === 'initiative') ?? []

  const content: Record<(typeof sections)[number][0], React.ReactNode> = {
    psychology: relationship && profile ? <>
      <p><strong>{profile.name}</strong> · {profile.goal}</p>
      <p>Tensión {relationship.tension}/10 · Cautela {profile.caution}/3 · Calidez {profile.warmth}/3 · Iniciativa {profile.initiative}/3</p>
      <p>Obsesiones, secretos y deterioro psicológico pendientes.</p>
    </> : <>
      <p>Tensión de Marcus · {game?.stats.tension}/10</p>
      <p>Obsesiones, secretos y deterioro psicológico pendientes.</p>
    </>,
    relationships: relationship && profile ? <>
      <p><strong>{profile.name} hacia Marcus</strong></p>
      <ul>{traits.map(([key, label]) => <li key={key}>{label} · {relationship.toMarcus[key]}/10</li>)}</ul>
      <p>Romance, celos, admiración y rivalidades pendientes.</p>
    </> : <>
      <p>Confianza con Camila · {game?.stats.trust}/10</p>
      <p>Romance, celos, admiración y rivalidades pendientes.</p>
    </>,
    research: <>
      <p>Programas del prototipo</p>
      <ul>{['GENESIS', 'EVOLUTION', 'ASCENSION', 'ADAM'].map(name => <li key={name}>{name}</li>)}</ul>
      <p>Investigación jugable pendiente.</p>
    </>,
    world: world ? <>
      <p>{time(world.slot)} · {world.promises.length} compromisos activos · {initiatives.length} iniciativas registradas</p>
      {initiatives.length > 0 && <ul>{initiatives.slice(-3).reverse().map(event =>
        <li key={event.id}>{time(event.slot)} · {event.speaker === 'marcus' ? 'Marcus' : profiles[event.speaker].name} · {event.text}</li>)}</ul>}
    </> : <p>Las iniciativas autónomas y los compromisos con vencimiento se pueden probar en el Laboratorio de personajes.</p>,
    economy: <p>Sistema pendiente. Se contemplan ingresos, empresas, propiedades y contratos.</p>,
    social: <p>Sistema pendiente. Se contemplan publicaciones, seguidores y conversaciones privadas.</p>,
    progress: scene && game ? <>
      <p>Capítulo I · El regreso</p>
      <p>{scene.outcome ? `Desenlace alcanzado · ${scene.name}` : `Escena actual · ${scene.name}`}</p>
      <p>Decisiones registradas · {game.history.length}</p>
    </> : <>
      <p>{world?.slot === end ? 'Objetivo cumplido · Completar una semana' : 'Objetivo · Completar una semana'}</p>
      <progress value={world?.slot ?? 0} max={end} aria-label="Bloques de la semana completados" />
      <p>{world?.slot}/{end} bloques completados</p>
    </>,
  }

  return <section className="dossier" aria-label="Sistemas de WORSHIP">
    <h2>Sistemas de WORSHIP</h2>
    <div className="dossier-grid">
      {sections.map(([id, label, icon, description]) => <details className="dossier-card" key={id}>
        <summary>
          <span className="dossier-icon" aria-hidden="true">{icon}</span>
          <strong>{label}</strong>
          <span className="dossier-description">{description}</span>
        </summary>
        <div className="dossier-content">{content[id]}</div>
      </details>)}
    </div>
  </section>
}
