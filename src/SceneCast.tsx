import { art } from './art.ts'
import { castName } from './CastArt.tsx'
import type { CastMember } from './CastArt.tsx'
import type { Person } from './simulation.ts'

export const poses = { neutral: 'Neutral', warmth: 'Sonríe y saluda', tension: 'Cruza los brazos', surprise: 'Se sorprende y retrocede' } as const
export type Pose = keyof typeof poses

export function SceneCast({ people, speaker, reactions }: {
  people: readonly CastMember[]
  speaker: Person
  reactions: Partial<Record<CastMember, Pose>>
}) {
  return <div className="scene-cast" role="group" aria-label="Personajes en escena">
    {people.map(person => {
      const pose = reactions[person] ?? 'neutral'
      const neutral = art(`elenco/sprites/${person}`)
      return <img key={`${person}-${pose}`}
        src={pose === 'neutral' ? neutral : art(`elenco/gestos/${person}-${pose}`)}
        onError={event => {
          if (event.currentTarget.getAttribute('src') !== neutral) event.currentTarget.src = neutral
        }}
        className={person === speaker ? 'current-speaker' : undefined}
        alt={`${castName(person)} · ${poses[pose]}`} />
    })}
  </div>
}
