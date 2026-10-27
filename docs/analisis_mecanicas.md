# Análisis de mecánicas — Pokémon Arena

Documento de las fases 1 (entorno y REA) y 2 (mecánicas del juego de referencia).
Cada apartado separa:

- **Hecho**: verificado en una fuente consultada en esta sesión (se cita cuál).
- **Inferencia**: deducido o tomado de fuentes secundarias que no se han podido contrastar con una fuente oficial.
- **Decisión propia**: regla de diseño de Pokémon Arena, independiente del juego de referencia.

No se usan datos internos del juego de referencia: no se ha tenido acceso a su código, binarios ni servidores, y no se ha intentado.

Última actualización: 27-10-2026.

---

## 1. Entorno de trabajo y REA (fase 1)

### 1.1 Entorno comprobado

| Elemento | Estado verificado |
|---|---|
| Repositorio | Solo contenía `index.html` (una página web personal en Three.js, "Flores Amarillas"). **No se ha modificado**; el juego vive en `pokemon-arena/`. |
| Node.js / npm | v22.22.0 / 10.9.4 |
| Python | 3.13 |
| Navegador | Chromium y Playwright preinstalados (usados para las pruebas E2E). |
| Java | Disponible (`/usr/bin/java`); JADX, Ghidra, Hopper e IDA **no** están instalados. |
| Red | Salida HTTPS a través de un proxy; el registro de npm es accesible. |

### 1.2 REA (Reverse Engineer Anything)

Repositorio oficial: <https://github.com/morluto/rea> (clonado y leído: README, `package.json`, `docs/`). Paquete npm: `rea-agents` (versión 6.8.0, licencia MIT).

**Qué es (hecho, según su README):** un servidor MCP y una CLI que conectan un agente con herramientas de análisis de binarios nativos (vía Hopper, Ghidra o IDA), aplicaciones JavaScript/Electron, ensamblados .NET, APK de Android (vía JADX), sitios web (vía Chrome), capturas de red, etc. El análisis es local.

**Qué puede inspeccionar (hecho, según su README) y qué necesita:**

| Objetivo | Requisito | ¿Disponible aquí? |
|---|---|---|
| JavaScript / Electron (estático) | Node.js y `ps` compatible con procps | **Sí, verificado** (ver 1.3) |
| .NET, APK (firmas), PyInstaller, Godot PCK, IL2CPP (metadatos) | Ninguno (análisis estático integrado) | No probado |
| Binarios nativos (pseudocódigo) | Hopper, Ghidra o IDA | **No** |
| APK (código decompilado) | JADX headless + JDK | **No** (falta JADX) |
| Sitios web | Navegador Chrome | Posible (hay Chromium), no probado |

**Comprobaciones realizadas (hechos):**

1. `npx rea-agents@6.8.0 --help` funciona, aunque npm avisa de que el motor no es compatible.
2. `rea doctor` informa `healthy: false` con estos motivos:
   - **Node.js 22.22.0 < 22.23.4 requerido** (`^22.23.4 || ^24.22.1 || >=26.12.1`). Solución: actualizar Node (por ejemplo, `nvm install 24`) y volver a ejecutar `rea doctor`.
   - No hay motor nativo (Hopper/Ghidra/IDA/Kuna) ni JADX configurado. Solo hacen falta para binarios nativos o APK.
   - REA **no está registrado como servidor MCP** en este agente (`registration:claude_code: config_drift`) ni está instalada su skill. Se registraría con `npx rea-agents setup` y reiniciando el agente; no lo he hecho porque modifica la configuración global del agente y no era necesario para avanzar.
3. `rea analyze-javascript-application` sobre un artefacto propio de prueba **funciona**: devuelve un informe de evidencias (`rea.javascript-application-analysis`) con grafo de módulos, estadísticas y limitaciones.

**Autenticación y costes:** REA no necesita API de pago. Ghidra es gratuito; Hopper, IDA y JEB son comerciales y requieren licencia propia. No he solicitado ninguna API ni credencial.

### 1.3 Por qué REA no se ha usado sobre el juego de referencia

- No dispongo de ningún artefacto del juego de referencia obtenido legítimamente (ni APK ni binario) y no lo he descargado.
- El juego de referencia es un servicio en línea comercial. Este tipo de juegos suele prohibir la ingeniería inversa en sus condiciones de uso; habría que revisarlas antes de analizar cualquier artefacto suyo.
- Aunque tuviéramos un APK propio, faltaría JADX (y Node ≥ 22.23.4) para el análisis de código.

**Conclusión:** REA queda verificado y disponible para analizar **artefactos propios o autorizados**, como la compilación de Pokémon Arena. Las mecánicas del juego de referencia se han documentado solo con fuentes públicas.

### 1.4 Plan de trabajo basado en evidencias

1. Documentar las mecánicas con fuentes públicas (este documento).
2. Diseñar las reglas propias (`diseno_juego.md`).
3. Construir primero una simulación determinista sin interfaz, con pruebas automatizadas.
4. Añadir encima la interfaz Phaser, la entrada para móvil y ordenador, y la IA.
5. Validar en un navegador real con pruebas E2E y capturas.
6. Iterar: balance (simulaciones por lotes), contenido y pulido.

---

## 2. Fuentes consultadas (fase 2)

| Fuente | Acceso | Uso |
|---|---|---|
| Notas de versión oficiales de Supercell, "November Update" (supercell.com/en/games/clashroyale/blog/release-notes/november-update) | **Leída** (descargada y analizada) | Duración de la partida y de la prórroga, fases de elixir. |
| Página de soporte oficial "Elixir" (support.clashroyale.com) | **Bloqueada (HTTP 403)**; solo vi el fragmento del buscador | Inferencia. |
| Wiki de fans (clashroyale.fandom.com) | **Bloqueada (HTTP 402/403)**; solo vi el fragmento del buscador | Inferencia. |
| Otras guías y análisis encontrados con el buscador | Solo fragmentos | Inferencia. |
| Observación manual de partidas | **No realizada**: no hay acceso al juego en este entorno | — |
| Proyectos abiertos de referencia | No usados (vi un clon en itch.io, pero no revisé ni copié su código) | — |

---

## 3. Mecánicas

### 3.1 Campo de batalla: dimensiones y organización
- **Inferencia:** campo vertical dividido por un río, con dos puentes y tres torres por bando (dos laterales y una central). Es conocimiento público ampliamente documentado, pero no lo he contrastado con una fuente oficial en esta sesión. La cifra de 18×32 casillas que circula en guías **no está verificada**.
- **Decisión propia:** campo de 18×32 casillas, río en y∈[15,17] y puentes en x∈[2,5] y x∈[13,16]. Ver `diseno_juego.md`.

### 3.2 Torres, objetivos, rutas y zonas de despliegue
- **Inferencia (fragmento del buscador de una nota oficial de diciembre de 2023, no leída completa):** las torres laterales pasaron a ser una carta configurable ("Tower Princess").
- **Inferencia:** la torre del rey empieza inactiva y se activa al recibir daño o al caer una torre lateral. Las tropas avanzan por su carril hacia la torre más cercana. Solo se despliega en el campo propio, y se amplía la zona al destruir una torre rival.
- **Decisión propia:** "torres guardianas" y "base principal" con estas mismas reglas funcionales y cifras propias. La zona de despliegue se amplía 4 filas en la ruta de la torre caída.

### 3.3 Funcionamiento general de las cartas
- **Inferencia:** cada carta tiene un coste de elixir y puede ser una tropa, un hechizo o un edificio.
- **Decisión propia:** cartas de Pokémon (tropas) y hechizos. Los edificios quedan para más adelante.

### 3.4 Coste y regeneración del elixir
- **Hecho (notas oficiales de noviembre):** en el modo con elixir doble/triple, "each minute increases the Elixir generation". En prórroga hay x3 en el último minuto.
- **Inferencia (fragmento de la página oficial de soporte, no leída completa):** x1 los dos primeros minutos, x2 el tercero, x2 en el cuarto (prórroga) y x3 en el quinto.
- **Inferencia (fuentes secundarias coincidentes):** 1 de elixir cada 2,8 s a ritmo x1, máximo 10 y unos 5 al empezar.
- **Decisión propia:** energía máxima 10, inicio con 5 y 1 punto cada 2,8 s a x1. Doble desde el segundo 120. Prórroga de 60 s a x3. Aritmética entera exacta.

### 3.5 Ciclo de cartas y tamaño de la mano
- **Inferencia (conocimiento público):** mazo de 8 cartas, mano de 4 y se muestra la siguiente. La carta jugada vuelve al final de la cola.
- **Decisión propia:** mismo esquema (mazo 8, mano 4, "Siguiente" visible). El orden inicial se baraja con la semilla.

### 3.6 Tipos de unidades y estadísticas
- **Inferencia:** las tropas tienen salud, daño, velocidad de ataque, velocidad de movimiento, alcance y filtro de objetivos (tierra, aire o edificios).
- **Decisión propia:** todos los valores son propios y se configuran en `src/sim/data/cards.ts`.

### 3.7 Movimiento, adquisición de objetivos y alcance
- **Inferencia:** las tropas terrestres cruzan por los puentes y las voladoras por encima del río. Cada tropa ataca al enemigo válido más cercano dentro de su radio de detección o, si no ve ninguno, va a la torre más cercana. Algunas solo atacan edificios.
- **Decisión propia:** reglas explícitas en `targeting.ts` y `navigation.ts`: radio de visión, histéresis de bloqueo de objetivo de 0,5 casillas y desempate por id menor.

### 3.8 Ataques cuerpo a cuerpo y a distancia
- **Inferencia:** los ataques a distancia lanzan proyectiles que viajan; los cuerpo a cuerpo impactan al momento.
- **Decisión propia:** los proyectiles persiguen al objetivo y, si muere, terminan en su última posición. Los de área dañan al llegar igualmente.

### 3.9 Daño, velocidad de ataque, salud y muerte
- **Inferencia:** el daño se resta de la salud; con 0 de salud la unidad muere y algunas tienen efectos al morir.
- **Decisión propia:** daño entero redondeado, la salud nunca baja de 0, cada muerte emite un único evento y las explosiones al morir se resuelven en cascada.

### 3.10 Hechizos y efectos de área
- **Inferencia:** los hechizos se lanzan en cualquier punto, afectan a un radio y hacen daño reducido a las torres.
- **Decisión propia:** Rayo (aturde) y Ventisca (ralentiza), con retardo de impacto y factor de daño a torres configurable.

### 3.11 Condiciones de victoria y derrota
- **Inferencia:** destruir la torre del rey da la victoria inmediata (3 coronas). Al acabar el tiempo gana quien tenga más coronas.
- **Decisión propia:** "medallas" (1 por torre guardiana, 3 por la base).

### 3.12 Duración de la partida y desempates
- **Hecho (notas oficiales de noviembre):** "All games are now 5 MINUTES LONG, instead of 6!" y "Overtime now lasts for 2 minutes instead of 3". Esto refleja el estado en la fecha de esas notas; puede haber cambiado después.
- **Inferencia (fragmento de la wiki):** si nadie destruye una torre en la prórroga, hay un desempate por salud de las torres, y si es idéntica, empate.
- **Decisión propia:** 3 min de tiempo reglamentario y 1 min de prórroga con muerte súbita. Después, desempate por la suma de salud de las torres; si es igual, empate. Todo es determinista.

### 3.13 Interfaz durante el combate
- **Inferencia:** temporizador arriba, mano de cartas y barra de elixir abajo, y coronas de cada bando.
- **Decisión propia:** HUD propio (ver `diseno_juego.md` §7).

### 3.14 Animaciones, efectos visuales y respuesta
- **Inferencia:** hay aparición al desplegar, indicadores de daño, efectos de área y destrucción de torres.
- **Decisión propia:** efectos propios dibujados con primitivas: anillos, números de daño coloreados según la eficacia elemental, descargas, notas musicales y sacudida de cámara.

### 3.15 Progresión, desbloqueos y mejoras
- **Inferencia:** el juego de referencia tiene niveles de carta, cofres y trofeos.
- **Decisión propia:** **fuera del alcance actual**. Solo hay historial de victorias y derrotas y mazo guardado. Ver los pendientes del hito 8.
