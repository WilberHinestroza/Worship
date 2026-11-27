import type { Intent, Person } from './simulation.ts'

type Reaction = 'warmth' | 'sadness' | 'disappointment' | 'pride' | 'strength' | 'surprise'
type CharacterAction = { label: string; intent: Intent; reply: string; reaction?: Reaction }
const action = (label: string, intent: Intent, reply: string, reaction?: Reaction): CharacterAction => ({ label, intent, reply, reaction })

export const characterActions: Record<Person, readonly [CharacterAction, CharacterAction]> = {
  camila: [
    action('Preguntar qué quedó pendiente', 'charlar', 'Hay cosas que no dije cuando te fuiste. Si hablamos, quiero que sea en serio.'),
    action('Escucharla sin pedir explicaciones', 'escuchar', 'Gracias por dejarme terminar. Necesitaba decirlo a mi manera.'),
  ],
  valeria: [
    action('Pedirle que muestre un boceto', 'charlar', 'Hay uno que todavía no he enseñado. Me gustaría saber qué te transmite.', 'pride'),
    action('Escuchar su idea para la exposición', 'escuchar', 'Quiero que se sienta como volver a casa, aunque al principio no se entienda por qué.'),
  ],
  natalia: [
    action('Aceptar un reto amistoso', 'charlar', 'Trato hecho. Elegimos la prueba entre los dos y acordamos las reglas antes.', 'strength'),
    action('Escuchar su plan de entrenamiento', 'escuchar', 'Me interesa la constancia. Prefiero que acordemos algo que podamos sostener.'),
  ],
  helena: [
    action('Consultar por una práctica', 'charlar', 'Trae una pregunta concreta y la vemos en horario de consulta.'),
    action('Escuchar los criterios de la práctica', 'escuchar', 'Empieza por justificar el método. Luego revisaremos qué resultados puedes defender.'),
  ],
  sofia: [
    action('Proponer una historia para el club', 'charlar', '¿Y si la contamos desde la perspectiva de alguien a quien nunca entrevistan?', 'surprise'),
    action('Escuchar su idea de documental', 'escuchar', 'Quiero seguir a una persona por un día. El campus cambia según quién lo recorre.'),
  ],
  isabella: [
    action('Preguntar qué decide guardar en privado', 'charlar', 'Hay cosas que pierden sentido en cuanto las conviertes en contenido.'),
    action('Escuchar qué piensa de su imagen pública', 'escuchar', 'La gente ve una parte de mi vida. A veces me cuesta recordar que yo puedo elegir cuál.'),
  ],
  akira: [
    action('Proponer comparar rutinas', 'charlar', 'Podemos comparar lo que hacemos. Quiero saber qué intentas mejorar.', 'strength'),
    action('Escuchar su criterio sobre disciplina', 'escuchar', 'El progreso se nota cuando puedes repetir un buen día sin depender de la motivación.'),
  ],
  evelyn: [
    action('Preguntar por su proyecto', 'charlar', 'La idea todavía es provisional. Lo que más me interesa es lo que podría hacerla fallar.'),
    action('Escuchar sus dudas sobre el trabajo', 'escuchar', 'A veces me cuesta cerrar el cuaderno aunque ya haya terminado el día.'),
  ],
  mina: [
    action('Invitarla a conversar en la biblioteca', 'charlar', 'Me gusta la mesa del fondo. Da menos pena hablar cuando nadie te está mirando.'),
    action('Dejar que cuente lo que le inquieta', 'escuchar', 'Gracias por darme tiempo. Todavía estoy intentando ponerlo en palabras.'),
  ],
  adrian: [
    action('Proponer ponerse al día con un café', 'charlar', 'Sí. Hay demasiado que contar para hacerlo de pie en el pasillo.', 'warmth'),
    action('Escuchar cómo le fue en biotecnología', 'escuchar', 'Me costó pedir ayuda al principio. El semestre mejoró cuando empecé a hacerlo.'),
  ],
  dante: [
    action('Pedirle una meta realista para el gimnasio', 'charlar', 'Primero dime qué puedes mantener toda la semana. Empezamos por ahí.'),
    action('Escuchar sus consejos sobre técnica', 'escuchar', 'Ve despacio y repite el movimiento con control. Después hablamos de subir el peso.'),
  ],
  viktor: [
    action('Preguntar por las prioridades del laboratorio', 'charlar', 'Este semestre necesito proyectos bien acotados. El tiempo de equipo es limitado.'),
    action('Escuchar su evaluación de una propuesta', 'escuchar', 'La pregunta es viable. Quiero que expliques cómo vas a reconocer un resultado ambiguo.'),
  ],
  leon: [
    action('Proponer un desafío entre iguales', 'charlar', 'Me interesa. Acordemos primero qué cuenta como ganar.'),
    action('Escuchar qué quiere demostrar', 'escuchar', 'Quiero que mi trabajo sea suficiente para que me tomen en serio.'),
  ],
  cassandra: [
    action('Presentarle una idea de colaboración', 'charlar', 'Antes de hablar de recursos, dime quién se beneficia y quién hace el trabajo.'),
    action('Escuchar qué busca al apoyar un proyecto', 'escuchar', 'Gente que sepa decirme qué puede cumplir y qué todavía está por descubrir.'),
  ],
}
