# GREVOS (auto-battler tipo Clash Mini)
- Objetivo: juego móvil web con personajes propios del usuario; tablero 5×8, tienda con elíxir, súper/habilidades, sobres de recompensa, bestiario, mazos.
- Estado: publicado en https://batalla-de-bestias.vercel.app (Vercel team `team_AJTr7WqPBL2IVmRDgpky7Ac8`, proyecto `batalla-de-bestias`). Rama de trabajo `claude/clash-mini-game-design-dleq7j`.
- Personajes (16): Bushi, Bolab, Ogul, Rogue, Wyrex(osko), Aly(gloop), Mory(tanko), Lodon(denton), Pomona, Jess, Ayew, Paira, Jaspe, Peipo, Orión, Sevora.
- Archivos clave: `bestiario/js/game.js` (datos CHARS, combate, IA), `bestiario/js/models.js` (SKIN de modelos animados), `bestiario/js/sobre.js` (sobres), `bestiario/index.html`, `bestiario/css/style.css`, `bestiario/assets/models/*.glb`, `tools/blender/*`.
- Despliegue: commit+push a la rama → `mcp__Vercel__create_deployment` (gitSource github, org `yamayorgahidalgo88-glitch`, repo `Sorpresa`, sha) → comprobar con curl.
- Tabla de personajes: `entregables/GREVOS_personajes.xlsx` (16 personajes + hoja Niveles; columna Valoración vacía, el Excel original se perdió). Regenerable leyendo CHARS de `bestiario/js/game.js`.
- Falta: ver `pendientes.md`.
