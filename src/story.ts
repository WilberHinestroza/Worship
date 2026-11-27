export const meters = {
  trust: 'Confianza con Camila',
  tension: 'Tensión de Marcus',
} as const

export type Meter = keyof typeof meters
export type Outcome = 'puerta' | 'distancia' | 'rutina'
type Choice = { label: string; to: string; change?: Partial<Record<Meter, number>> }
type Scene = {
  name: string
  speaker: string
  time: string
  text: string
  art?: 'camila'
  choices?: Choice[]
  outcome?: Outcome
}

export const scenes: Record<string, Scene> = {
  regreso: {
    name: 'Séptimo piso', speaker: 'Marcus Salazar', time: '18:30',
    text: 'El ascensor se detiene. Marcus ajusta la correa de la bolsa con un gesto que se le quedó del servicio militar. Dos años fuera, y todavía recuerda el sonido que hace el piso frente a la puerta de Camila.',
    choices: [{ label: 'Salir al pasillo', to: 'reencuentro' }],
  },
  reencuentro: {
    name: 'El reencuentro', speaker: 'Camila Ríos', time: '18:31', art: 'camila',
    text: 'Camila permanece junto a la puerta, con los brazos cruzados. Durante unos segundos, su expresión distante parece quebrarse.\n\n—Dos años, Marcus. Espero que tengas algo mejor que un simple «hola».',
    choices: [
      { label: 'Admitir que debí escribirle', to: 'disculpa', change: { trust: 2, tension: -1 } },
      { label: 'Preguntarle por qué sigue esperando', to: 'defensa', change: { trust: -1, tension: 2 } },
      { label: 'Pedirle un momento para ordenar mis ideas', to: 'pausa', change: { tension: -1 } },
    ],
  },
  disculpa: {
    name: 'Lo que queda por decir', speaker: 'Camila Ríos', time: '18:33', art: 'camila',
    text: '—Una carta me habría bastado.\n\nCamila baja los brazos. Marcus encuentra al fin dónde dejar la bolsa, pero sigue de pie junto a ella.',
    choices: [{ label: 'Dejar que Camila termine', to: 'umbral', change: { trust: 1 } }],
  },
  defensa: {
    name: 'Lo que queda por decir', speaker: 'Camila Ríos', time: '18:33', art: 'camila',
    text: '—¿Esperando? Oí el ascensor.\n\nCamila vuelve a sujetar el picaporte. Marcus recupera la correa de la bolsa antes de que toque el suelo.',
    choices: [{ label: 'Reconocer que la pregunta fue injusta', to: 'umbral', change: { trust: 1, tension: -1 } }],
  },
  pausa: {
    name: 'Lo que queda por decir', speaker: 'Marcus Salazar', time: '18:33', art: 'camila',
    text: 'Marcus apoya la bolsa contra la pared y se permite respirar. Camila mira el contador del ascensor hasta que él levanta la vista.',
    choices: [{ label: 'Volver a la conversación', to: 'umbral' }],
  },
  umbral: {
    name: 'El umbral', speaker: 'Camila Ríos', time: '18:36', art: 'camila',
    text: '—Puedo ponerte un café. Si tienes que irte, dímelo ahora.\n\nMarcus mira hacia la puerta entreabierta. Ya no hay una hora marcada para regresar a ningún cuartel.',
    choices: [
      { label: 'Aceptar el café', to: 'cafe', change: { tension: -1 } },
      { label: 'Despedirme y hacer mi rutina de entrenamiento', to: 'entreno', change: { tension: -1 } },
    ],
  },
  cafe: {
    name: 'Sobre la mesa', speaker: 'Marcus Salazar', time: '18:42', art: 'camila',
    text: 'Marcus deja el móvil boca abajo y toma la taza con ambas manos. Camila se queda frente a él. El vapor se disipa antes de que alguno vuelva a hablar.',
    choices: [{ label: 'Cerrar el capítulo', to: 'cierre' }],
  },
  entreno: {
    name: 'La primera rutina', speaker: 'Marcus Salazar', time: '19:10',
    text: 'Después del entrenamiento, Marcus anota la sesión en su libreta. En la página siguiente escribe «Camila» y deja espacio debajo.',
    choices: [{ label: 'Cerrar el capítulo', to: 'rutina' }],
  },
  puerta: {
    name: 'Una puerta abierta', speaker: 'Fin del capítulo I', time: '18:55', outcome: 'puerta',
    text: '—Puedes tocar mañana —dice Camila cuando él recoge la bolsa.\n\nEsta vez Marcus se atreve a poner una hora.',
  },
  distancia: {
    name: 'Una taza vacía', speaker: 'Fin del capítulo I', time: '18:55', outcome: 'distancia',
    text: 'Camila lleva las tazas al fregadero. Marcus se despide desde el pasillo. Al llegar al ascensor, todavía puede oír el agua correr.',
  },
  rutina: {
    name: 'La libreta', speaker: 'Fin del capítulo I', time: '19:15', outcome: 'rutina',
    text: 'Marcus cierra la libreta. Deja una alarma para el día siguiente y una pregunta sin responder.',
  },
}
