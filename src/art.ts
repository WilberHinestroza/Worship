export const art = (file: string) => `${import.meta.env.BASE_URL}art/${file}.webp`

export const sprites = {
  marcus: 'Marcus Salazar',
  camila: 'Camila Ríos',
  valeria: 'Valeria Montes',
  natalia: 'Natalia Ferrer',
} as const

export type Sprite = keyof typeof sprites

export const castNotes: Record<Sprite, string> = {
  marcus: 'Protagonista. Regresa del servicio militar tras dos años de ausencia.',
  camila: 'Reservada y directa. Quiere saber si puede volver a confiar en Marcus.',
  valeria: 'Atenta y cálida. Procura mantener abierta la comunicación.',
  natalia: 'Atleta y decidida. Prefiere convertir las palabras en acciones.',
}

export const spriteArt = (sprite: Sprite) => art(`sprites/${sprite}-base`)
