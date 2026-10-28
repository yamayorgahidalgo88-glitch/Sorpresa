# Comparativa de diseño: Clash Royale, Boom Arena y Pokémon Arena

Fecha: 29-10-2026. Este análisis de diseño se basa **solo en información pública**: fichas de las tiendas, artículos, guías y reseñas (ver «Fuentes»). **No se ha hecho ingeniería inversa** de ninguno de los dos juegos comerciales. Sus condiciones de uso la prohíben y el proyecto solo usa fuentes legítimas.

Leyenda:
- **Hecho:** lo dice la fuente citada.
- **Opinión:** lo afirman reseñas de usuarios.
- **Sin datos:** no se ha encontrado una fuente pública.

## 1. Tabla comparativa

| Aspecto | Clash Royale (Supercell) | Boom Arena (Minibox) | Pokémon Arena (este proyecto) |
|---|---|---|---|
| Partida | Hecho: 3 min y prórroga de hasta 2 min. Gana quien derriba la torre del rey o más torres; si no, la torre con menos salud pierde | Sin datos (las reseñas lo describen como «igual que Clash Royale») | 3 min + 1 min de prórroga con muerte súbita; desempate por salud total de las torres |
| Recurso | Hecho: elixir pasivo, máximo 10, x2 en el último minuto y x3 en el último minuto de la prórroga | Opinión: «maná»; un usuario cuenta un fallo en el que no pasaba de 4 | Energía máxima 10, x2 en el último minuto y x3 en la prórroga |
| Mazo | Hecho: 8 cartas, 4 en la mano | Hecho (guías): mazos de 8 | 8 cartas, 4 en la mano y la siguiente visible |
| Tipos de carta | Hecho: tropas, edificios y hechizos | Hecho (guías): tropas, edificios (Cannon, Bomb tower, Mana collector), hechizos (Arrows, Poison, Heal tiny, Ice tiny), generadores (Cemetery, Faun horde) y una carta que copia (Mirror) | Pokémon (tropas), edificios (Magnemite, Voltorb y el recolector Chansey), enjambres y hechizos (Rayo, Ventisca, Poción y Tóxico) |
| Catálogo | Más de 100 cartas en 6 rarezas (de Común a Héroe) | Hecho (ficha): más de 80 cartas gratis | 18 líneas evolutivas (45 especies), Ditto y 4 hechizos con 3 niveles |
| Mejora de cartas | Hecho: copias + oro → nivel; los niveles suben también la «King Level», que fortalece las torres. Desde 2023, «Evoluciones» que se activan **dentro de la partida** tras jugar la carta varias veces | Hecho (ficha): **todas las cartas al mismo nivel**; no hay mejoras | Copias + monedas → evolución permanente (+12 % y +25 %), y evolución **en combate** tras jugar la carta 2 veces |
| Cómo se consiguen cartas | Hecho: cofres, tienda y peticiones al clan. Los temporizadores de cofres se quitaron en abril de 2025 y se cambiaron por «lucky drops» | Hecho: casi todo disponible desde el principio | Pokéballs compradas con monedas o ganadas en el camino de trofeos, abiertas al instante |
| Emparejamiento | Trofeos | Hecho (ficha): por medallas, **no por nivel de cartas**; «juego limpio» | IA cuyas evoluciones aumentan con tus trofeos |
| Modos | Hecho: 1 contra 1, 2 contra 2, desafíos (hasta 3 derrotas, incluido el de draft), guerras de clanes, liga clasificatoria, Merge Tactics y eventos | Hecho: 1 contra 1 en tiempo real. Las notas de versión mencionan chat y **compartir repeticiones** | 1 contra 1 contra la IA (tres dificultades), Desafío (12 victorias / 3 derrotas), Igualado y repeticiones |
| Monetización | Hecho: gratuito con compras, «Pass Royale» mensual y escasez artificial de recursos | Hecho: gemas de 4,99 a 49,99 $, anuncios. Opinión: «no es pagar para ganar», aunque algunos dicen que sin pagar cuesta progresar y que hay demasiados anuncios | Sin dinero real (proyecto de fans) |
| Críticas públicas | Hecho: recepción mixta del emparejamiento y de la escasez de recursos | Opinión: le falta pulido, tiene errores («parse error», el maná se queda bloqueado) y un chat global sin moderar | — |

## 2. Lo que se aprende

1. **Equidad y progresión están en tensión.**
   - Boom Arena gusta precisamente porque todos juegan con las mismas cartas.
   - Clash Royale engancha con la progresión, pero se le critica que pagar ayuda a ganar.
   - Nuestras evoluciones se parecen más a Clash Royale. Para no frustrar, conviene que **el rival se ajuste a la fuerza de tu mazo**, no solo a tus trofeos.
2. **El contenido táctico que nos falta: edificios, generadores y cartas de copia.** Los dos juegos los usan para dar variedad de estrategias (defender con un edificio, presionar con un generador, sorprender con una copia).
3. **Las «Evoluciones» de Clash Royale son de combate.** La carta se transforma tras jugarla varias veces en la misma partida. Encaja de forma natural con Pokémon: evolucionar a mitad del combate.
4. **La estabilidad pesa mucho en las reseñas.** Los fallos de Boom Arena (el maná que se bloquea, errores al cargar) son su crítica principal. Nuestras pruebas automáticas son una ventaja que hay que mantener. Por eso el Hito H (rendimiento en móvil) sigue siendo importante.
5. **Repeticiones y desafíos** dan mucha vida al juego por poco coste. Nuestra simulación ya es determinista y tiene repeticiones (`Battle.replay`); falta mostrarlas.

## 3. Propuestas para Pokémon Arena (por orden de valor y esfuerzo)

Las marcadas con ⚠ cambian decisiones de diseño: necesitan tu visto bueno antes de hacerlas. **Hechas (29-10-2026): todas, de la 1 a la 10.** La 6 usa Rattata ×5 en lugar de ×6, para que encaje en el balance.

| # | Propuesta | Inspiración | Esfuerzo | Encaje Pokémon |
|---|---|---|---|---|
| 1 ✅ | **Ver la repetición** de la última partida desde la pantalla de resultados (la simulación ya la reproduce exacta) | Boom Arena: compartir repeticiones | Bajo | — |
| 2 ✅ | ⚠ **Rival ajustado a tu mazo**: sus evoluciones dependen de la fase media de tu mazo (± margen), no solo de tus trofeos | Emparejamiento justo de Boom Arena | Bajo | — |
| 3 ✅ | **Carta de copia** | Mirror (Boom Arena) | Medio | **Ditto**: copia la última carta que jugaste, por 1 de energía más |
| 4 ✅ | **Edificios** (nuevo tipo de carta: fijo, pierde vida con el tiempo y distrae a las tropas) | Cannon, Bomb tower | Medio-alto | **Magnemite** (torreta eléctrica) y **Voltorb** (explota al ser destruido) |
| 5 ✅ | **Recolector de energía** (edificio que genera energía) | Mana collector, recolector de elixir | Medio | **Chansey**, que pone huevos de energía |
| 6 ✅ | **Enjambre barato** | Faun horde, ejércitos de esqueletos | Bajo | **Rattata ×6** (terrestre) o **Zubat ×4** (volador) |
| 7 ✅ | **Hechizos nuevos**: curación en área y veneno con daño en el tiempo | Heal tiny, Poison | Bajo-medio | **Poción** y **Tóxico** |
| 8 ✅ | ⚠ **Evolución en combate**: tras jugar una carta 2 veces en la partida, la siguiente sale evolucionada | Evoluciones de Clash Royale | Medio | Muy natural en Pokémon |
| 9 ✅ | **Desafío**: racha contra la IA hasta 3 derrotas, con premios por victoria | Desafíos de Clash Royale | Medio | Liga Pokémon / gimnasios |
| 10 ✅ | ⚠ **Modo igualado**: todas las cartas en la misma fase | Boom Arena | Bajo | «Combate de exhibición» |

**No recomendado:**
- Chat global, anuncios y compras con dinero real: es un proyecto de fans sin ánimo de lucro, y son justo los puntos más criticados.
- Temporizadores de espera en los cofres: Clash Royale los quitó en 2025.

## Fuentes

- [Clash Royale — Wikipedia](https://en.wikipedia.org/wiki/Clash_Royale) (leída: partida, elixir, mazo, rarezas, evoluciones, mejoras, modos, monetización).
- [Boom Arena — App Store](https://apps.apple.com/us/app/boom-arena/id6446782218) (leída: más de 80 cartas, mismo nivel, emparejamiento por medallas, compras, notas de versión).
- [Boom Arena — Google Play](https://play.google.com/store/apps/details?id=com.circlebox.boomarena&hl=en_US) (consultada a través de un resumen de búsqueda: valoración y reseñas).
- [Boom Arena — Reseñas en la App Store](https://apps.apple.com/us/app/boom-arena/id6446782218?see-all=reviews&platform=iphone) (consultada a través de un resumen de búsqueda).
- [«Boom Arena, Clash Royale ripoff» — GamerTweak](https://gamertweak.com/boom-arena-clash-royale-ripoff/) (leída).
- [«Los mejores mazos para ganar partidas en Boom Arena» — Androidphoria](https://androidphoria.com/juegos/mejores-mazos-boom-arena) (leída: cartas y mazos de 8).
- Mecánicas de Clash Royale ya documentadas en `analisis_mecanicas.md` (notas oficiales de Supercell).
