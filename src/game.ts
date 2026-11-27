import { meters, scenes } from './story.ts'
import type { Meter } from './story.ts'

export type Game = {
  scene: string
  stats: Record<Meter, number>
  history: { scene: string; label: string }[]
}

export const start = (): Game => ({
  scene: 'regreso',
  stats: { trust: 4, tension: 4 },
  history: [],
})

export function choose(game: Game, index: number): Game {
  const choice = scenes[game.scene]?.choices?.[index]
  if (!choice) return game
  const stats = { ...game.stats }
  for (const key of Object.keys(meters) as Meter[]) {
    stats[key] = Math.max(0, Math.min(10, stats[key] + (choice.change?.[key] ?? 0)))
  }
  const scene = choice.to === 'cierre'
    ? (stats.trust >= 6 ? 'puerta' : 'distancia')
    : choice.to
  return { scene, stats, history: [...game.history, { scene: game.scene, label: choice.label }] }
}

export function encode(game: Game): string {
  return JSON.stringify({ version: 1, choices: game.history.map(({ scene, label }) => ({ scene, label })) })
}

export function decode(raw: string): Game | null {
  try {
    const save = JSON.parse(raw)
    if (save?.version !== 1 || !Array.isArray(save.choices) || save.choices.length > Object.keys(scenes).length) return null
    let game = start()
    for (const entry of save.choices) {
      if (entry?.scene !== game.scene) return null
      const index = scenes[game.scene].choices?.findIndex(choice => choice.label === entry.label) ?? -1
      if (index < 0) return null
      game = choose(game, index)
    }
    return game
  } catch {
    return null
  }
}
