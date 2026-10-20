# Recursos de terceros

Cada recurso incluido en el proyecto, con su licencia y su procedencia. No se añade nada sin registrarlo aquí.

| Recurso | Ruta | Licencia | Fuente | Uso |
|---|---|---|---|---|
| Kenney Toy Car Kit (subconjunto: 5 vehículos, arco de meta, cono, árboles, caja, moneda, humo, texturas de color) | `kenney/toy-car-kit/` | CC0 1.0 (`License.txt`) | https://kenney.nl/assets/toy-car-kit | Karts y decorado |
| Kenney Mini Characters (12 personajes, gafas) | `kenney/mini-characters/` | CC0 1.0 (`License.txt`) | https://kenney.nl/assets/mini-characters | Pilotos (animación `drive`, `emote-yes`…). Cabeza y cuerpo son mallas separadas sobre un esqueleto común: base para el editor de avatares. |
| Fredoka SemiBold | `fonts/Fredoka-SemiBold.ttf` | SIL OFL 1.1 (`fonts/OFL.txt`) | Google Fonts | Interfaz |

## Recursos generados por código (propios)
- Pista, pianos, muros, gradas, colinas y nubes: `track/track_builder.gd`, `track/track_scenery.gd`.
- Partículas de derrape, humo y turbo: `kart/kart_visuals.gd`.

## Provisionales que hay que sustituir
- **Gradas**: cajas de color (geometría propia). Sustituir por un modelo modular del mismo estilo.
- **Pista**: tira de malla generada sin textura de asfalto ni relieve.
- **Kart**: el Speedster de Kenney lleva un casco integrado en la malla, oculto bajo el piloto. Para la personalización (Fase 3) hace falta un chasis propio con asiento y piezas intercambiables.
