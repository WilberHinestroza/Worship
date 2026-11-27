export const art = (file: string) => `${import.meta.env.BASE_URL}art/${file}.webp`

export const sprites = {
  marcus: 'Marcus Salazar',
  camila: 'Camila Ríos',
  valeria: 'Valeria Montes',
  natalia: 'Natalia Ferrer',
} as const

export type Sprite = keyof typeof sprites

export const spriteArt = (sprite: Sprite) => art(`sprites/${sprite}-base`)
