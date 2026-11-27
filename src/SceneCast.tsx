import { art } from './art.ts'
import { castName } from './CastArt.tsx'
import type { CastMember } from './CastArt.tsx'
import type { Person } from './simulation.ts'
import type { CSSProperties } from 'react'

export const poses = {
  neutral: 'Neutral',
  warmth: 'Feliz',
  sadness: 'Triste',
  disappointment: 'Decepción',
  pride: 'Orgullo',
  strength: 'Fuerza',
  tension: 'Tensión',
  surprise: 'Sorpresa',
} as const
export type Pose = keyof typeof poses
const stageHeight: Record<CastMember, number> = {
  marcus: 183, camila: 170, valeria: 163, natalia: 178, helena: 185, sofia: 168,
  isabella: 174, akira: 180, evelyn: 172, mina: 160, adrian: 176,
  dante: 190, viktor: 180, leon: 182, cassandra: 176,
}

export function SceneCast({ people, speaker, reactions }: {
  people: readonly CastMember[]
  speaker?: Person
  reactions: Partial<Record<CastMember, Pose>>
}) {
  return <div className="scene-cast" role="group" aria-label="Personajes en escena">
    {people.map(person => {
      const pose = reactions[person] ?? 'neutral'
      const neutral = art(`elenco/sprites/${person}`)
      return <img key={`${person}-${pose}`}
        style={{ '--actor-scale': stageHeight[person] / 190 } as CSSProperties}
        src={pose === 'neutral' ? neutral : `${art(`elenco/gestos/${person}-${pose}`)}?v=2`}
        onError={event => {
          if (event.currentTarget.getAttribute('src') !== neutral) event.currentTarget.src = neutral
        }}
        className={person === speaker ? 'current-speaker' : undefined}
        alt={`${castName(person)} · ${poses[pose]}`} />
    })}
  </div>
}
