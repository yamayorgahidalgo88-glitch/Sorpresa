# Estudio de Clash Mini: base para nuestro juego

> Objetivo: entender a fondo cómo funcionaba Clash Mini (Supercell) —mecánicas, ritmo, economía, diseño visual y por qué fracasó— para crear **nuestro propio juego** de ese género con tu estilo.
>
> **Regla del proyecto:** copiamos *ideas de género y mecánicas* (eso es libre), **no** su nombre, personajes, arte, música ni aspecto. Nuestro juego tendrá nombre, mundo, personajes y estética propios. Así además podremos publicarlo sin problemas.

Leyenda de fiabilidad: ✅ confirmado por varias fuentes · ⚠️ una sola fuente o versión antigua · ❓ no verificado.

---

## 1. Ficha rápida

| | |
|---|---|
| Género | *Auto-battler* (auto-chess) por turnos de colocación, 1 contra 1 |
| Desarrollador | Supercell (universo Clash of Clans / Clash Royale) |
| Historia | Anunciado en 2021, beta en pocos países; nunca tuvo lanzamiento global ✅ |
| Cierre | Desarrollo cancelado el 14-mar-2024, servidores cerrados el 25-abr-2024 ✅ |
| Motivo oficial | "Un buen juego, pero no el que cumpliría nuestro sueño"; no alcanzaban su listón de calidad ✅ |
| Legado | Su experiencia se iba a integrar en Clash Royale ✅ |
| Plataforma | Móvil, vertical, partidas cortas |

---

## 2. El bucle de una partida

Cada partida se divide en **rondas**. Cada ronda tiene dos fases ✅:

1. **Fase de estrategia (planificación)**
   - Recibes elíxir, 1 *re-roll* gratis y una tienda nueva con **3 minis** ✅.
   - Compras minis y los colocas en tu mitad del tablero, o mejoras los que ya tienes.
   - Ambos jugadores planifican a la vez (sin ver el movimiento del rival en ese momento).
2. **Fase de combate (Clash)**
   - El combate se resuelve **solo**. Las unidades no se pueden mover una vez empieza la batalla ✅.
   - Las unidades avanzan **casilla a casilla, como piezas de ajedrez**, no en movimiento libre ⚠️.
   - Gana la ronda quien deja en pie a sus unidades / derrota al ejército rival.

**Número de rondas:** las fuentes no coinciden. Duelos y Raids de 3 a 5 rondas; Rumble siempre 5 ⚠️. El duelo se describía como "al mejor de 5" ⚠️.

---

## 3. El tablero

- Rejilla de **8 × 5** (5 columnas/"carriles" × 8 filas en total) ⚠️ → cada jugador controla su mitad: **5 columnas × 4 filas** ❓ (deducido).
- Solo puedes colocar en la zona no roja (tu mitad) ✅.
- Lo estratégico es formar **líneas equilibradas de ataque y defensa**: tanques delante, tiradores detrás, controlar los flancos ⚠️.
- Aspecto: diorama de mesa, como un tablero físico con figuritas pintadas encima.

---

## 4. Economía de elíxir (el corazón del juego)

| Regla | Valor |
|---|---|
| Elíxir por ronda | **6** ✅ |
| El que gana la ronda recibe | 6 |
| El que pierde la ronda recibe | **9** (mecánica de remontada) ✅ |
| Elíxir sobrante | **Se guarda** para la siguiente ronda ✅ |
| Coste de los minis | **2, 3 o 4** ✅ |
| Re-roll | 1 gratis por ronda ✅ (coste de los extra ❓) |
| Tienda | 3 minis aleatorios de tu mazo por ronda ✅ |

**La decisión clave de cada ronda:** ¿gasto en mejorar lo que tengo, en añadir unidades nuevas, o ahorro para una jugada grande la próxima ronda? ✅

---

## 5. Mejoras dentro de la partida (estrellas)

- Mejoras un mini comprando **otra copia** y soltándola encima (fusión) ✅.
- Cada mejora cuesta lo mismo que el coste del mini ✅ → los minis baratos suben de nivel antes ✅.
- Subir de nivel aumenta estadísticas y desbloquea **mejoras de estrella**: variantes de la habilidad que eliges y desbloqueas fuera de partida ⚠️.

---

## 6. Tipos de habilidad

Cada mini tiene una de estas habilidades ✅:

| Tipo | Cuándo se activa | Ejemplo de idea |
|---|---|---|
| **Clash** | Al empezar el combate | Un lanzador que dispara al inicio |
| **Super** | Cuando su barra de energía se llena (al golpear o recibir golpes) | Golpe giratorio, curación en área |
| **Pasiva** | Inicio o fin de ronda, o cuando se cumple una condición | Gana escudo si está junto a un aliado |

---

## 7. Héroes

- **1 héroe por mazo**, siempre presente en el tablero; es tu pieza central ✅.
- Más fuerte que los minis y con una **Super** muy potente que mejora al subir de nivel ✅.
- Algunos podías elegir para defender solos, otros para dar apoyo a los minis ⚠️.
- Consejo de la comunidad: empieza con un héroe que aguante el tablero solo ⚠️.

---

## 8. Mazo

- **1 héroe + 5 minis** (versión 2022) ⚠️. Con un mazo tan pequeño, la tienda aleatoria sigue siendo predecible.
- Había unos 26-27 minis en 2022, repartidos por coste ⚠️:
  - **2 de elíxir**: unidades básicas (caballero, arquero, minero, magos sencillos...)
  - **3 de elíxir**: especialistas (sanador, gigante, lanzador de bolas...)
  - **4 de elíxir**: piezas fuertes (caballero pesado, bruja, mago eléctrico...)

### Arquetipos que debemos cubrir con personajes propios

| Rol | Función en el tablero | Coste típico |
|---|---|---|
| Tanque | Aguanta en primera fila | 2–4 |
| Luchador cuerpo a cuerpo | Daño en primera línea | 2–3 |
| Tirador | Daño a distancia desde atrás | 2–3 |
| Mago de área | Daño a varios objetivos | 3–4 |
| Sanador / apoyo | Cura y mejora a aliados | 3–4 |
| Asesino / flanqueador | Salta o se mueve a la retaguardia | 3 |
| Invocador | Crea unidades extra | 4 |
| Control | Congela, ralentiza, empuja | 2–3 |

---

## 9. Modos de juego

| Modo | Formato |
|---|---|
| **Duelo** | 1v1, varias rondas contra el mismo rival ✅ |
| **Rumble** | 8 jugadores en 2 grupos de 4, luego semifinal y final ⚠️ (más tarde 6 jugadores con *draft*) ⚠️ |
| **Raid / jefe de clan** | Cooperativo, de 1 a 10 jugadores, 48 h ⚠️ |
| Casual / Clasificatoria | Duelo y Rumble tenían ambas versiones ⚠️ |

---

## 10. Progresión y meta (fuera de la partida)

- Pestañas: **Tienda · Colección · Batalla · Camino de trofeos · Clan** ⚠️.
- **Fragmentos** de mini/héroe para subir niveles y estrellas (≈11 fragmentos hasta el máximo de estrellas) ⚠️.
- Monedas: Oro (fragmentos de mini), Gemas (fragmentos de héroe), una moneda de cosméticos (*skins*) ⚠️.
- Camino de trofeos por temporada, pase de temporada, misiones diarias ⚠️.

---

## 11. Diseño visual y sensación (descrito, no copiado)

- **Estilo "figuritas de juguete":** personajes cabezones (*chibi*) en 3D, como miniaturas pintadas a mano sobre peanas.
- **Tablero diorama:** mesa de juego temática con bordes decorados, casillas claras, colores muy saturados.
- **Lectura inmediata:** silueta y color de cada unidad reconocibles desde lejos; barras de vida pequeñas encima.
- **Interfaz:** cartas de tienda abajo, contador de elíxir grande, botón de listo, pocos textos.
- **Feedback "jugoso":** rebotes al soltar unidades, destellos al fusionar, cámara que tiembla en las Super.

👉 Nosotros mantendremos esa *claridad y jugosidad*, pero con **tu propia estética** (ver §14).

---

## 12. Por qué fracasó: lecciones para el nuestro

| Problema detectado | Lo que haremos distinto |
|---|---|
| El posicionamiento importaba al principio, pero desde la ronda 3 el combate parecía decidido por niveles, no por colocación ⚠️ | Que la colocación importe siempre: sinergias por **adyacencia**, casillas especiales, efectos de fila/columna |
| No poder reaccionar durante el combate ⚠️ | Un recurso de "intervención" limitado (p. ej. 1 hechizo o 1 movimiento por ronda) |
| Una vez colocado y mejorado, el tablero se volvía estático ⚠️ | Unidades que se pueden **recolocar** gratis entre rondas, eventos de ronda |
| Progresión de pago que desequilibra | Juego justo: progreso cosmético o de colección, no de poder |
| Falta de identidad propia frente a otros Clash | Mundo y estilo **tuyos** desde el primer día |

---

## 13. Dudas todavía sin verificar

- Tamaño exacto de la mitad de cada jugador y si el héroe ocupa casilla fija.
- Condición exacta de victoria de la partida (rondas ganadas vs. barra de vida que baja según unidades supervivientes).
- Duración de la fase de estrategia (temporizador).
- Coste de los re-rolls extra y si el sobrante de elíxir tiene límite.
- Cuántas copias exactas hace falta por nivel en las versiones finales.

No hacen falta para empezar: son valores que **vamos a decidir nosotros** y ajustar probando.

---

## 14. Propuesta inicial para nuestro juego (borrador para decidir juntos)

**Núcleo que conservamos:** rondas de planificar + combate automático, tablero pequeño de casillas, elíxir con arrastre y remontada, tienda de 3 con re-roll, fusión de copias, un héroe central con Super.

**Nuestro giro (ideas):**
- Sinergias por **adyacencia** (unidades que se potencian si están juntas).
- 1 "carta de intervención" por ronda durante el combate.
- Casillas especiales en el tablero que cambian cada ronda.

**Primer prototipo jugable (MVP):**
1. Un solo archivo `HTML + JavaScript` (como tu proyecto actual), vertical y pensado para móvil.
2. Tablero 5 × 8, un héroe y 6 minis propios con formas simples.
3. Duelo contra una IA sencilla, al mejor de 5 rondas.
4. Elíxir, tienda, re-roll, fusión a nivel 2 y 3.
5. Después: arte, sonido, más unidades, modos y progresión.

### Preguntas para ti
1. **Nombre y mundo:** ¿qué temática te gusta? (fantasía, espacio, flores/naturaleza como tu proyecto actual, animales, comida...)
2. **Estilo visual:** ¿2D dibujado, *pixel art*, figuritas 3D *low-poly*?
3. **Plataforma:** ¿solo navegador del móvil o también quieres que acabe en tiendas de apps?
4. **Multijugador:** ¿empezamos contra la IA y luego online?

---

## Fuentes

- [GamingonPhone – Clash Mini Beginners Guide and Tips](https://gamingonphone.com/guides/clash-mini-beginners-guide-and-tips/)
- [Clash Mini Wiki – Round](https://clashmini.fandom.com/wiki/Round) · [Elixir](https://clashmini.fandom.com/wiki/Elixir) · [Duels](https://clashmini.fandom.com/wiki/Duels) · [Minis](https://clashmini.fandom.com/wiki/Minis)
- [LDPlayer – Beginner's Guide to Battle System, Minis, Upgrades and Placements](https://www.ldplayer.net/blog/clash-mini-beginners-guide.html)
- [Softonic – How to play Clash Mini](https://en.softonic.com/articles/how-to-play-clash-mini)
- [The Why of Play – Clash Mini early review](https://thewhyofplay.com/2021/11/28/clash-mini-early-review/)
- [PlayTested – Review: Clash Mini](https://8fc642ed.playtested.pages.dev/article/2023-12-12-for-auto-chess-lovers-and-clash-of-clans-fans-alike-review-clash-mini/)
- [Pocket Gamer – Clash Mini is discontinuing](https://www.pocketgamer.com/clash-mini/is-discontinuing-but-also-coming-to-clash-royale)
- [Game World Observer – Clash Mini shutdown](https://gameworldobserver.com/2024/03/15/clash-mini-shutdown-supercell-no-new-games-in-five-years)
- [GamingonPhone – Server shutdown late April 2024](https://gamingonphone.com/news/clash-mini-discontinues-development-server-shut-down-to-begin-in-late-april-2024)
- [mobilematters.gg – Release date, minis, gameplay](https://mobilematters.gg/gaming/clash-mini-release-date-pre-registration-minis-gameplay-more)
- Opiniones de jugadores en r/ClashMini (críticas sobre el posicionamiento)
