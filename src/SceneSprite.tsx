import { spriteArt } from './art.ts'
import type { Sprite } from './art.ts'

export function SceneSprite({ character }: { character: Sprite }) {
  return <img className="scene-sprite" src={spriteArt(character)} alt="" />
}
