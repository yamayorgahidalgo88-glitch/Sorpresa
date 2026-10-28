# Sorpresa · Pokémon Arena

Este repositorio contiene dos proyectos independientes:

| Ruta | Qué es |
|---|---|
| `index.html` | Página web "Flores Amarillas" (Three.js). Está tal cual estaba: el juego no la modifica. |
| `pokemon-arena/` | **Pokémon Arena**: juego de estrategia en tiempo real con cartas y Pokémon (Phaser 3 + TypeScript). |
| `docs/` | Documentación del juego. |

## Pokémon Arena

Batallas de 3 minutos (más 1 de prórroga) contra una IA en un campo con dos rutas, un río con puentes, dos torres guardianas y una base por bando. Se despliegan Pokémon y hechizos gastando energía que se regenera; la mano tiene 4 cartas de un mazo de 8. Hay un sistema de tipos con ventajas y desventajas.

### Ejecutar en local

Requisitos: Node.js 22 o superior y npm.

```bash
cd pokemon-arena
npm install
npm run dev          # abre http://localhost:5173 (herramientas: /referencia.html y /galeria.html)
```

- Compilación de producción: `npm run build` (genera `pokemon-arena/dist/`, servible como web estática; `npm run preview` la sirve en local).
- Partida reproducible: añade `?seed=1234` a la URL. Vista 2D de respaldo: `?vista=2d` (se usa sola si no hay WebGL).
- La batalla se dibuja en 3D con los Pokémon en estilo vóxel. En el constructor de mazo y en la colección, al tocar una carta se abre su ficha: vida, daño, daño por segundo, velocidad de ataque, velocidad, alcance, objetivos, habilidad y tipos.
- Controles: toca o haz clic en una carta y después en el campo, o arrastra la carta. Teclas 1-4 para elegir carta y Esc para cancelar.

### Pruebas

```bash
npm test             # 116 pruebas unitarias y de simulación
npm run typecheck
npm run test:e2e     # navegador real: escritorio (ratón) y móvil (táctil) en 3D, y escritorio en 2D
npm run simulate -- 50 normal   # partidas IA contra IA
npm run balance -- 600 normal   # informe de balance por carta
```

### Documentación

- [Análisis de mecánicas y entorno (REA)](docs/analisis_mecanicas.md)
- [Diseño del juego](docs/diseno_juego.md)
- [Arquitectura](docs/arquitectura.md)
- [Pruebas](docs/pruebas.md)
- [Dirección artística y salto visual 3D](docs/direccion_artistica.md) · [capturas antes/después](docs/capturas/comparacion_antes_despues.jpg)

### Estado por hitos

| Hito | Estado |
|---|---|
| 1. Documento de diseño y arquitectura | ✅ |
| 2. Campo de batalla y torres | ✅ |
| 3. Movimiento, objetivos y combate | ✅ |
| 4. Cartas, mazo y energía | ✅ |
| 5. Interfaz y efectos visuales | ✅ Prototipo: menú, batalla, resultados, mazo y colección con gráficos vectoriales originales |
| 6. IA del oponente | ✅ Tres dificultades, sin información oculta |
| 7. Balance, pruebas y optimización | ✅ Herramienta de balance por carta; todas las cartas entre 45 % y 55 % |
| 8. Persistencia, progresión y pulido | ✅ Trofeos, rangos y desbloqueo de cartas (sin niveles de carta, a propósito); ajustes, mazo e historial guardados |

### Pendientes

- **Balance:** el mazo por defecto del jugador gana ≈47–50 % (normal) y ≈33–43 % (difícil) frente al de la IA en IA contra IA. La IA usa poco los tanques y Ventisca. Falta probar con personas.
- **Contenido:** solo hay 11 Pokémon y 2 hechizos, a propósito, para validar el sistema antes de ampliarlo. Faltan edificios.
- **Gráficos:** la batalla jugable ya es 3D. Los 11 Pokémon tienen modelo vóxel y las torres dejan ruinas (hito F terminado). Las cartas y la ficha usan retratos vóxel. Faltan el marco definitivo de las cartas y el HUD (resto del hito G) y la optimización medida en móviles reales (hito H). También faltan música y accesibilidad (daltonismo, tamaño de texto).
- **REA:** Node 22.22 está por debajo del mínimo (22.23.4) y el servidor MCP no está registrado en el agente (`npx rea-agents setup`). Ver `docs/analisis_mecanicas.md`.

### Aviso

Proyecto de fans sin ánimo de lucro. Pokémon y los nombres de las especies son marcas de sus respectivos propietarios. No se usan sprites, sonidos ni recursos de juegos comerciales: los gráficos son vectoriales y los sonidos se sintetizan en el navegador.
