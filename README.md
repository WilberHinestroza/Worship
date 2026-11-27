# WORSHIP — Web Edition

Novela visual RPG en español. La versión 0.1 incluye **Capítulo I · El regreso**, seis recorridos de decisiones y tres desenlaces.

Abre **Laboratorio de personajes** para probar el sistema de memoria, personalidad y conversación variable con Camila, Valeria y Natalia. El laboratorio guarda su sesión automáticamente. La demo del capítulo está disponible desde el mismo menú.

## Jugar en local

Con Node.js 24 y npm, ejecuta desde la raíz del repositorio:

```sh
npm ci
npm run dev
```

Abre la dirección que imprime Vite. Usa **Guardar partida** dentro del capítulo y **Continuar partida** en el menú. El guardado es manual y pertenece a este navegador y origen web.

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

Cada cambio en `main` instala dependencias, ejecuta pruebas y compila el juego. Para publicar, habilita **Settings → Pages → Source → GitHub Actions** y ejecuta manualmente el flujo **GitHub Pages** desde **Actions**. Para publicar también en cada cambio de `main`, crea la variable de repositorio `PAGES_ENABLED` con valor `true` en **Settings → Secrets and variables → Actions → Variables** después de habilitar Pages.

El despliegue publica `dist/`. Vite genera rutas relativas, por lo que funciona bajo el prefijo del repositorio. La partida se ejecuta en el navegador con contenido guionizado y sin servicios externos.

## Documentación

- [Universo y personajes](docs/WORSHIP_BIBLE.md)
- [Reglas del RPG](docs/GAME_DESIGN.md)
- [Dirección de arte](docs/ART_DIRECTION.md)
- [Sistema de personajes](docs/CHARACTER_SYSTEM.md)

El guion está en `src/story.ts`, las transiciones y el formato de guardado en `src/game.ts`, y la interfaz en `src/main.tsx`. Si cambia el texto de una elección, conserva la compatibilidad con el formato anterior mediante una migración o una nueva versión del guardado.
