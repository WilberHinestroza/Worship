# Motor de personajes de WORSHIP

El laboratorio simula siete días con cuatro bloques por día. Hablar, contar un hecho y pasar el tiempo consumen un bloque. La demo del capítulo I usa su propio guion y guardado.

La agenda muestra las promesas activas de Marcus. La espera rápida ejecuta los bloques ordinarios hasta la primera iniciativa o el primer vencimiento, o hasta el cierre de la semana si no sucede nada. El resumen de la última acción muestra cuánto tiempo pasó y los cambios hacia Marcus.

## Estado y reglas

- El registro de hechos identifica al emisor, al público y, cuando corresponde, al hecho que se recordó o divulgó. Un hecho privado pasa a otra persona al contárselo explícitamente. La bitácora permite examinar el conocimiento de cada personaje.
- Las relaciones mantienen confianza, afecto, respeto y resentimiento en ambas direcciones. Una respuesta puede modificar la percepción de Marcus, y sus acciones modifican la percepción del personaje. La tensión del encuentro y la personalidad influyen en la reacción.
- Una promesa de volver se puede cumplir durante los tres bloques siguientes. Vence al terminar el tercero, hayan hablado o no. Su desenlace afecta la relación y vuelve a aparecer en conversaciones posteriores.
- A partir del segundo día, cada personaje evalúa por la mañana si planifica tomar la iniciativa. Su objetivo, la relación y el estado actual pueden llevarlo a retomar una conversación, hacer una propuesta o marcar un límite. La decisión se ejecuta al llegar su bloque aunque Marcus solo haya esperado.
- Se puede conversar con los 14 personajes no jugables establecidos. Camila, Valeria y Natalia pueden tomar la iniciativa desde el principio. El resto puede hacerlo después de la primera conversación. La Galería muestra al elenco completo, incluido el protagonista.
- El Laboratorio permite colocar al interlocutor y hasta dos acompañantes sobre el mismo fondo. La selección de acompañantes prueba la composición visual. Los mensajes se dirigen al interlocutor seleccionado.
- Cada personaje tiene sus sprites de saludo, tensión y sorpresa. Usa **Escena** para probarlos. Algunas acciones de conversación cambian el gesto del interlocutor automáticamente.
- La vista de escritorio coloca diálogo, controles y estadísticas en el mismo espacio. Los paneles largos se abren como ventanas superpuestas con su propio desplazamiento.
- La entrada acepta mensajes de hasta 240 caracteres. Las expresiones reconocibles como «Te escucho» o «Prometo volver» conservan sus efectos. Los demás mensajes quedan en la memoria como conversación neutral y reciben una respuesta guionizada. Las respuestas usan reglas locales y varían según el personaje y su estado.

## Persistencia y pruebas

Las sesiones se guardan de forma automática en el navegador. El formato 2 reconstruye el estado desde la semilla y las acciones. Si cambia una regla de simulación, conserva el motor de reproducción anterior o añade una migración antes de reutilizar el formato. El laboratorio importa acciones válidas de sesiones de la primera versión dentro de la capacidad de una semana. Las respuestas y el reloj de una sesión importada se calculan con las reglas nuevas. El guardado anterior conserva su clave original.

`src/world.ts` administra el reloj, los hechos, las relaciones y las decisiones. `src/simulation.ts` contiene los perfiles, las intenciones y el formato anterior. `src/Lab.tsx` muestra las acciones y el motivo de cada respuesta. Los perfiles y los valores iniciales son provisionales y podrán ajustarse sin escribir capítulos.
