# Sistema de personajes

El laboratorio permite probar el motor sin avanzar la historia. Los perfiles psicológicos de Camila, Valeria y Natalia son valores de prueba pendientes de validar con el canon de WORSHIP 2.0.

Cada personaje conserva por separado su confianza, tensión, promesa activa y memoria de interacciones. La conversación registra el turno, la intención y su impacto. Repetir presión empeora la reacción. Presiones recientes y promesas cumplidas o incumplidas pueden reaparecer en una respuesta. Una promesa puede cumplirse durante los siguientes tres turnos globales. En el cuarto vence, incluso si Marcus habla con otra persona.

En cada turno el personaje decide si se abre, se distancia, pregunta o propone algo. La puntuación usa su cautela, calidez e iniciativa, además de la confianza, tensión y recuerdos. Con tensión alta se distancia. Una semilla de sesión introduce variación acotada, tanto en la decisión como en su redacción. Al recargar se reconstruye la misma conversación a partir de la semilla y las acciones guardadas.

El motor utiliza respuestas y reglas locales. La entrada escrita interpreta fórmulas explícitas, como «Te escucho», «Perdón», «Exijo», «Bromeo», «Prometo volver», «Volví como prometí» y «Te doy espacio». Para incorporar lenguaje abierto más adelante, el intérprete tendría que producir acciones validadas que este mismo motor pueda aplicar. La ficción dinámica de esta versión cubre intercambios entre Marcus y un personaje por turno.

La sesión se guarda automáticamente en el navegador, en un espacio independiente de la demo. El límite actual es de 200 turnos por sesión. `src/simulation.ts` contiene el motor y los perfiles. `src/Lab.tsx` proporciona la interfaz de pruebas. Los cambios en las reglas de decisión deben considerar migrar el formato de guardado para conservar la reproducción de sesiones anteriores.
