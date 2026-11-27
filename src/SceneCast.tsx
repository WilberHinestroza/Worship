import { art } from './art.ts'
import { castName } from './CastArt.tsx'
import type { CastMember } from './CastArt.tsx'
import type { Person } from './simulation.ts'

export function SceneCast({ people, speaker }: { people: readonly CastMember[]; speaker: Person }) {
  return <div className="scene-cast" role="group" aria-label="Personajes en escena">
    {people.map(person => <img key={person} src={art(`elenco/sprites/${person}`)}
      className={person === speaker ? 'current-speaker' : undefined}
      alt={castName(person)} />)}
  </div>
}
