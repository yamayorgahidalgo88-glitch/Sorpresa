---
name: cerebro
description: Activa el cerebro en un chat ya empezado. Lee toda la conversación una sola vez, extrae lo esencial y lo guarda en brain/ para no tener que releerla después.
---
# /cerebro — activar y poblar el cerebro

Haz esto UNA vez, ahora:
1. Recorre toda la conversación actual (tu contexto). Si está compactada o incompleta, lee el transcript cuyo ruta está en `brain/.transcript` (archivo JSONL; lee solo líneas `user`/`assistant`).
2. Extrae solo lo esencial y escríbelo, corto y sin duplicar lo que ya exista:
   - `brain/usuario.md`: quién es el usuario, preferencias, cómo quiere que trabajes.
   - `brain/decisiones.md`: decisiones tomadas y su porqué (una línea cada una).
   - `brain/proyectos/<nombre>.md`: objetivo, estado actual, archivos clave, qué falta.
   - `brain/pendientes.md`: tareas abiertas.
3. Reescribe `brain/INDEX.md`: una línea por archivo y un resumen de máx. 8 líneas del estado actual.
4. Termina con 3-5 líneas diciendo qué guardaste. No muestres los archivos completos.
Desde ese momento, trabaja siguiendo `brain/REGLAS.md` y no vuelvas a leer el chat.
