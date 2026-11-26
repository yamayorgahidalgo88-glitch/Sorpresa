# Decisiones
## Cerebro
- 2026-11-25: Memoria = `brain/` (Markdown) + `CLAUDE.md`; hooks en `.claude/settings.json` (`brain/hooks/brain.py` captura log, `sync.sh` sube a `main` y rama al cerrar sesión). Al iniciar se carga REGLAS + INDEX + log reciente.
## GREVOS (juego)
- Web estática (three.js 0.160 por importmap, sin build) en `bestiario/`; se despliega en Vercel (proyecto `batalla-de-bestias`) desde la rama `claude/clash-mini-game-design-dleq7j`.
- Modelos: Meshy → `tools/reducir_glb.py` → rig+anim en Blender (`tools/blender/animar.py`, un `*_rig.py` y `*_anim.py` por personaje). Piezas que se mueven solas (guantes, puños, bate, manos) se cortan con SPLITS para no romper la malla.
- Paira: puño+bate en una pieza (batazos parte del modelo). Ayew: balón separado del modelo, flota sobre su mano izquierda y es el proyectil. Orión: rocas del modelo como proyectil (`orion_roca.glb`).
- Diagonales: todos atacan en diagonal salvo los que el usuario prohibió (Wyrex, Ayew, Orión: línea recta) o con zona fija (Jess, Paira). Mory: delante en línea o diagonal.
- Recargas exactas del diseño (PACE = 1, se quitó el ×1,5). El movimiento sigue ralentizado (MOVE_PACE 1,35).
- IA rival (`aiArrange` en game.js): antes de cada combate recoloca sus criaturas según la formación del jugador (búsqueda por puntuación, ~6000 pruebas).
- Mazos: solo se juega/selecciona con 6 bestias. Todos los personajes desbloqueados para pruebas.
- Nombre del juego: GREVOS (logo `assets/logo_grevos.webp`, iconos de app + `manifest.webmanifest`). Moneda nueva: `assets/moneda.webp`.
- Sobres: 3 zarpazos del jugador; el tercero mucho más grande.
- 2026-11-26: Navegación por barra inferior de 5 botones pegados (Tienda, Bestiario, Batalla, Usuario, Ajustes; imágenes en `assets/nav/`, el activo crece). Tienda y Usuario = cartel de madera "cerrado/en mantenimiento". Bestiario = mazos arriba + personajes debajo (los no desbloqueados en gris: se pueden ver con la "i", no elegir). Batalla = inicio con botón ¡Luchar! → pantalla de confirmar. Ajustes: sonido por categorías (general, música, batalla, personajes, interfaz) + silenciar todo + borrar progreso; el altavoz del HUD de batalla se quitó.
- 2026-11-26: la IA rival NO puede ver la colocación del jugador de la ronda en curso. `aiArrange(G.seenP)` usa solo la formación de la ronda anterior (se guarda en `startFight`; ronda 1 sin información). Antes trampeaba mirando las posiciones actuales.
- 2026-11-26: Mory (tanko) y Jess con modelos nuevos del usuario (Drive → Blender). `tools/blender/{mory,jess}_{rig,anim}.py` + `animar.py` (ya compatible con Blender 5 vía `pip install bpy`, sin Blender instalado); `assets/models/{mory,jess}_anim.glb`, registrados en SKIN de models.js. Originales pesados (~40 MB) no se suben al repo.
