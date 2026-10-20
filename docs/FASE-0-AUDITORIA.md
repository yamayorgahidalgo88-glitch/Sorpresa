# Fase 0 · Auditoría y plan técnico

Estado: **borrador pendiente de aprobación**. Fecha: 2026-10-20.

Leyenda de fiabilidad:
- **[Verificado]**: comprobado en este entorno clonando el repositorio y leyendo sus archivos.
- **[Conocimiento]**: dato que no he comprobado en esta sesión. Hay que confirmarlo antes de decidir nada en función de él.

---

## A. Estado actual del repositorio `Sorpresa` [Verificado]

| Ruta | Contenido | Observaciones |
|---|---|---|
| `index.html` | Página "Flores Amarillas" (358 líneas, un solo archivo HTML) | No tiene relación con el juego y no se toca. |
| `sugar-rush/index.html` + `sugar-rush/game.js` | Prototipo web 2D/pseudo-3D (unas 1.150 líneas de JS, Canvas) | Es la versión anterior inspirada en Sugar Rush. Usa nombres de personajes de Disney, así que **no es apto como base de una IP original**. |

- No hay motor, `package.json`, dependencias, pruebas ni recursos 3D.
- Rama de trabajo: `claude/rompe-ralph-movie-nougjm`. Árbol limpio.
- Conclusión: para el proyecto 3D, el repositorio está **efectivamente vacío**. El prototipo web sirve como referencia de diseño de juego (supers, tienda, taller, estadísticas), no de código.

---

## B. Comparativa de los proyectos investigados

Los cinco repositorios se clonaron en modo superficial (`--depth 1`) para leer su contenido. **No se ha copiado nada al proyecto.**

| Proyecto | Motor / lenguaje | Actividad | Qué implementa realmente | Licencia del código | Licencia del arte | Veredicto |
|---|---|---|---|---|---|---|
| **choijunhuk/arcade-kart-racer** | Godot 4 (`config_version=5`; el README dice 4.7) · GDScript | Muy activo (último commit 2026-09-24) | 511 scripts .gd (~69.000 líneas): física de kart separada de la presentación, derrape y turbos, superficies, cámara con anticolisión y FOV dinámico, IA por capas (Sensors→Navigator→Driver→ItemBrain), 9 objetos con *pooling*, Gran Premio, contrarreloj con fantasma, pantalla dividida, red. Tests con GUT. Hecho también con Claude (`CLAUDE.md`). | **Sin archivo LICENSE.** Por defecto, todos los derechos están reservados. **No se puede reutilizar el código.** | Arte procedural propio CC0 1.0 · Kenney Racing Kit CC0 · fuente Chakra Petch OFL 1.1 · audio sintetizado CC0 | **Referencia de arquitectura e ideas, no base.** Su arte CC0 sí es reutilizable. Se podría pedir al autor que publique una licencia. |
| **QueenOfSquiggles/godot-kart-racer** | **Godot 3** (`config_version=4`) · GDScript | Abandonado (último commit 2021-12-16) | 96 scripts (~16.000 líneas): KCC kart, coche físico, IA con máquina de estados, multijugador local básico, pista por mapa de alturas | **Sin LICENSE** → no reutilizable | Sin licencia indicada | **Descartado.** Godot 3 es incompatible con Godot 4 sin migración, y no tiene licencia. |
| **eviltwo/UniKart** | **Unity 6** (6000.0.58f2) · C# | Activo en 2025-26 (último commit 2026-02-20) | 8 scripts (~980 líneas): kart con Rigidbody + SphereCollider, pendientes, salto, derrape, turbo, cámara sin balanceo, BoostPad. Instalable por UPM. | **MIT** ✅ | Solo lo incluido en el repositorio (sin revisar a fondo) | **Base reutilizable si se elige Unity.** Es pequeño: resuelve la conducción, nada más. |
| **Unity-Technologies/ECS-Network-Racing-Sample** | Unity 6 (6000.2.11f1) · DOTS/ECS, Netcode for Entities, Unity Physics, URP | Mantenido (2025-12-03) | Carreras de coches en red con el paquete Vehicles y ECS. Requiere Git LFS (570 MB sin LFS). | **Unity Companion License**: solo se puede usar en proyectos de Unity | Igual | **Descartado como base.** ECS y red añaden muchísima complejidad que no necesitamos. Solo serviría como referencia de URP. |
| **supertuxkart/stk-code** | Motor propio en C++ (derivado de Irrlicht) | Muy activo (2026-10-17) | Juego completo: física, IA, objetos, red, editor de pistas | **GPL v3** (contamina: obligaría a publicar todo nuestro juego como GPL) | Mezcla de licencias por archivo (GPL, CC-BY-SA, CC-BY…) | **Solo como fuente de ideas** de diseño (lógica de checkpoints, *drivelines*). No copiar código ni recursos. |

### Alternativas que todavía no he investigado
No he hecho una búsqueda amplia de otros repositorios. Candidatos que conviene verificar en la siguiente sesión:
- Plugins de vehículos y cámara para Godot 4 (por ejemplo, controladores de *raycast vehicle* con licencia MIT).
- Para Unity: Cinemachine (oficial) y el paquete Vehicles.

---

## C. Recomendación de motor y arquitectura

### Unity 6 frente a Godot 4

| Criterio | Unity 6 | Godot 4 |
|---|---|---|
| Techo visual | Más alto: URP/HDRP, Shader Graph, VFX Graph, ecosistema de *post-processing* | Alto para un estilo de película de animación (Forward+, SDFGI, niebla volumétrica, *toon/rim shaders*). Menos herramientas listas para usar. |
| Animación | Mecanim, Timeline, Animation Rigging, Cinemachine: muy maduros | AnimationTree, AnimationPlayer, retargeting a esqueletos humanoides. Suficiente, pero con menos *tooling*. |
| Importar desde Blender | FBX/glTF, muy probado | glTF 2.0 de primera clase e importación directa de `.blend` |
| Física de kart arcade | UniKart (MIT) da una base inmediata | Hay que escribirla (o adaptarla de un repo con licencia válida). Los patrones son conocidos. |
| Recursos | Asset Store enorme (mucho de pago y con licencias por asiento) | Menor. Depende de recursos CC0 externos (Kenney, Quaternius…) que valen para ambos motores. |
| **Trabajo con Claude Code** | Escenas y prefabs en YAML grande y frágil de editar a mano. **No puedo ejecutar el editor de Unity en este entorno** (requiere licencia y GUI). Todo lo que haga tendrías que probarlo tú. | Escenas `.tscn` y scripts en texto legible y versionable. **Godot puede descargarse y ejecutarse sin interfaz aquí** (el enlace de descarga responde): importar, validar referencias, ejecutar tests y simulaciones. |
| Rendimiento | Excelente, con muchas herramientas de *profiling* | Bueno para la escala prevista (8 karts, 1 circuito a la vez) |
| Licencia y costes [Conocimiento] | Unity Personal gratis por debajo de un umbral de ingresos (200.000 $ anuales); por encima, Pro de pago. *Runtime Fee* cancelada en 2024. **Verificar las condiciones actuales.** | MIT: sin tasas ni royalties |
| Exportar a web y móvil | WebGL y Android/iOS | Web (con el renderizador *Compatibility*, de menor calidad visual) y Android/iOS |
| Ampliación futura | Muy buena | Muy buena; el código fuente del motor está disponible |

### Recomendación: **Godot 4 (versión estable más reciente, fijada al empezar)**

Motivo principal: con Godot puedo **ejecutar y verificar** el proyecto (importación, tests de vueltas, IA y guardado) dentro de este entorno y mantener todo en texto revisable en GitHub. Con Unity escribiría código a ciegas que solo tú podrías abrir, lo que va contra la regla de "no afirmar lo que no se ha verificado".

Lo que sacrificamos frente a Unity: algo de techo visual y menos herramientas de animación y cinemáticas listas para usar. Lo compensamos con un estilo estilizado bien dirigido (*toon shading* con *rim light*, materiales con personalidad, iluminación de estudio en menús), que no depende de la potencia bruta del motor.

Limitación importante: **aquí no hay GPU**. Podré ejecutar Godot sin interfaz y quizá sacar capturas con renderizado por software (de baja calidad y por confirmar), pero **la revisión visual final la tendrás que hacer tú** en tu ordenador.

### Arquitectura propuesta (Godot 4)

```
project/
  autoload/      GameState, SaveService (con versión de esquema), Settings, AudioBus, SceneRouter
  config/        Recursos .tres centralizados: KartTuning, SurfaceTable, CameraProfiles, DifficultyTable
  kart/          KartBody (física arcade; CharacterBody3D + rayos de suelo), DriftController,
                 BoostController, KartInput (interfaz común: jugador e IA), KartVisuals (solo presentación)
  camera/        RaceCamera (muelle + anticolisión + FOV por velocidad), ShowroomCamera
  race/          RaceDirector (estados: intro→cuenta atrás→carrera→meta), LapTracker
                 (checkpoints ordenados + validación de dirección), Standings, RaceTimer
  track/         TrackDefinition (Path3D de la línea ideal, checkpoints, respawns, zonas de superficie)
  ai/            AIDriver (sigue la línea ideal con *look-ahead*; más tarde adelantamientos y objetos)
  items/         ItemDefinition (Resource) + ItemEffect (estrategia); cada objeto nuevo es un archivo
  avatar/        AvatarConfig (Resource serializable), AvatarBuilder (monta piezas modulares
                 sobre un esqueleto común), AvatarCatalog, reglas de incompatibilidad
  garage/        KartConfig, KartPartCatalog (carrocería, ruedas, alerón), StatsCalculator con compromisos
  ui/            Tema propio, pantallas como escenas independientes, HUD
  assets/        Recursos de terceros, cada uno con su archivo LICENSE y su procedencia en ASSETS.md
  tests/         GUT: vueltas, guardado/carga, estadísticas, IA completando el circuito
```

Principios:
- La física es independiente de la orientación visual del modelo.
- Todos los valores de ajuste están en `config/`.
- El guardado lleva número de versión y migraciones.
- Las piezas de avatar y kart se definen por datos, no por código.

---

## D. Sistemas y recursos que podemos reutilizar legalmente

| Recurso | Licencia | Uso |
|---|---|---|
| Arte procedural de arcade-kart-racer (`assets/art`, `previews`, mallas generadas por sus scripts) | CC0 1.0 [Verificado] | Solo los PNG o recursos generados. **Los scripts que los generan no tienen licencia.** |
| Kenney Racing Kit 2.0 (barreras, vallas, gradas, banderas, árboles…) | CC0 [Verificado en el README del repo; descargar desde kenney.nl] | Atrezo provisional de circuito. Su estilo *low-poly* es coherente pero sencillo. |
| Fuente Chakra Petch u otras de Google Fonts | OFL 1.1 | Interfaz |
| UniKart | MIT | Solo si se eligiera Unity |
| SuperTuxKart | GPL v3 / mezcla | **No reutilizar**; solo ideas |
| Código de arcade-kart-racer y godot-kart-racer | Sin licencia | **No reutilizar**; solo ideas de arquitectura |

---

## E. Recursos gráficos que hay que conseguir o producir

Prioridad alta (necesarios para la Fase 2):
1. **Base de avatar modular** con un esqueleto humanoide común: cabezas intercambiables o *blend shapes* de proporciones, ojos, cejas y bocas como texturas o *decals* animables, peinados, prendas superiores, calzado y accesorios. Candidatos [Conocimiento, por verificar]: packs CC0 de Quaternius o KayKit como base y retoque en Blender. **Es el punto más difícil del proyecto**: un editor tipo Mii de calidad requiere arte hecho a medida.
2. **Kart modular**: chasis, 3–4 carrocerías, 3–4 juegos de ruedas, alerones, con materiales de pintura brillante, goma, metal y plástico.
3. **Animaciones del piloto**: reposo, giro, derrape, impacto, celebración y derrota. Mixamo [Conocimiento] permite usarlas en juegos, pero sus condiciones limitan redistribuir los archivos sueltos, y el repositorio es público. **Hay que revisarlo antes de usarlas.**
4. **Un circuito temático** (propuesta: parque de atracciones) con *kit* modular de tramos, rampas, barreras y decoración animada.
5. Efectos: partículas de derrape y turbo, polvo, chispas; *shaders* de contorno y *rim*.
6. Audio: motor, derrape, objetos, interfaz y música original o con licencia CC0/CC-BY.

Política: cada recurso entra con su licencia y procedencia en `assets/ASSETS.md`. Los recursos provisionales se marcan con `PROVISIONAL` y una nota de cómo sustituirlos.

---

## F. Plan de desarrollo por fases

| Fase | Contenido | Criterio de "hecho" verificable |
|---|---|---|
| 0 | Esta auditoría y la estructura del proyecto Godot vacía, con tests | Proyecto que importa sin errores en modo *headless*; CI local con GUT |
| 1 | Prototipo jugable: un kart con física arcade y derrape, cámara, circuito *greybox* con checkpoints, cuenta atrás, 3 vueltas, meta | Test automático: un piloto simulado completa 3 vueltas, y atajar o ir marcha atrás por la meta no cuenta como vuelta. Tú lo conduces y das feedback. |
| 2 | *Vertical slice* visual: un kart y un piloto con buenos materiales, un tramo de circuito iluminado, efectos básicos y HUD coherente | Revisión visual en tu máquina. Capturas comparadas con el objetivo artístico. |
| 3 | Garaje: plataforma giratoria, cámara de exposición, piezas por datos con estadísticas y compromisos | Las estadísticas modifican `KartTuning` y se nota al conducir (test de velocidad máxima y aceleración) |
| 4 | Editor de avatar modular con guardado versionado | Ida y vuelta de guardado y carga en tests; combinaciones incompatibles rechazadas |
| 5 | Carrera completa: 7 rivales IA y 3–4 objetos | Los 8 karts terminan el circuito en una simulación sin interfaz |
| 6 | Contenido: más circuitos, karts, piezas, récords y desbloqueos (sin monetización) | — |
| 7 | Pulido, rendimiento medido y versión distribuible | Objetivo de fps acordado y medido en el hardware de referencia |

---

## G. Riesgos y decisiones

Riesgos técnicos:
1. **Arte del avatar y de los karts**: es el mayor riesgo. Sin un artista 3D (o sin tiempo tuyo en Blender), la calidad de "película de animación" no es alcanzable solo con código y recursos CC0. Mitigación: estilo estilizado y simple, coherente, con buena iluminación.
2. **Verificación visual limitada**: no hay GPU aquí, así que las revisiones visuales dependen de ti.
3. **Sensación de conducción**: requiere muchas iteraciones de ajuste con alguien jugando de verdad.
4. **Plataforma**: si el objetivo principal es el móvil o la web, Godot obliga a usar el renderizador *Compatibility*, que baja la calidad visual. Hay que decidirlo antes de la Fase 2.
5. **Cuota de uso**: es un proyecto de semanas o meses de trabajo. Conviene avanzar en entregas pequeñas.

Decisiones que necesitan tu aprobación:
1. Motor: **Godot 4** (recomendado) o Unity 6.
2. Plataforma objetivo principal: PC (recomendado para la calidad visual), móvil o web.
3. Dónde vive el proyecto: carpeta `kart3d/` en este repositorio o un **repositorio nuevo** (recomendado: el nombre "Sorpresa" y el contenido actual no encajan).
4. Qué hacer con el prototipo `sugar-rush/`: mantenerlo aparte como juego personal (tiene nombres de Disney) o retirarlo.
5. Nombre provisional del juego y de su mundo (IP original).
6. Fuente del arte 3D: ¿hay alguien que modele en Blender o partimos de packs CC0 retocados?
7. Si se usan animaciones de Mixamo, aceptar sus condiciones o buscar alternativas CC0.
