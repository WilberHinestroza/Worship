import { art } from './art.ts'
import { profiles } from './simulation.ts'
import type { Person } from './simulation.ts'

const sheets = [
  ['marcus', 'camila', 'valeria'],
  ['natalia', 'helena', 'sofia'],
  ['isabella', 'akira', 'evelyn'],
  ['mina', 'adrian', 'dante'],
  ['viktor', 'leon', 'cassandra'],
] as const

export type CastMember = Person | 'marcus'
export const lineup = sheets.flat()
export const castName = (person: CastMember) => person === 'marcus' ? 'Protagonista' : profiles[person].name

export function CastArt({ person, portrait = false }: { person: CastMember; portrait?: boolean }) {
  const index = lineup.indexOf(person)
  const sheet = art(`elenco/${Math.floor(index / 3) + 1}`)
  return <div className={`cast-art${portrait ? ' cast-art-face' : ''}`}
    role="img" aria-label={`${portrait ? 'Rostro' : 'Cuerpo completo'} de ${castName(person)}`}>
    <div className="cast-art-column">
      <img src={sheet} alt="" loading="lazy" style={{ left: `${-100 * (index % 3)}%` }} />
    </div>
  </div>
}
