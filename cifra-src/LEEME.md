# Banco de preguntas de CIFRA

Las preguntas están en `preguntas/*.js`, separadas por temas. El juego (`../cifra/index.html`) las lleva incrustadas: después de tocar cualquier archivo de aquí hay que regenerarlo.

```sh
node cifra-src/tools/check-hints.js   # pistas y fichas sin cifras
node cifra-src/tools/entities.js      # toda pregunta tiene algo subrayado
node cifra-src/tools/check-dups2.js   # posibles preguntas repetidas
python3 cifra-src/tools/build.py      # inserta el banco en cifra/index.html
```

## Formato

```js
N('¿Pregunta de cifra?', respuesta, 'unidad', 'Pista sin cifras', {s:'fuente', ap:true, d:2, n:'Nota al revelar'})
Y('¿En qué año…?', año, 'Pista sin cifras', {s:'fuente'})
```

- La pista (4.º campo de N, 3.º de Y) se guarda pero ahora mismo el juego no la muestra.
- `s`: clave de `SOURCES` (en `00-base.js`). Si se omite, se usa la del bloque `add(...)`.
- `ap`: la cifra es aproximada (se muestra «≈»).
- `d`: número de decimales de la respuesta.
- `n`: nota que aparece junto a la fuente al revelar el dato.

Las fichas de los nombres subrayados están en `9x-fichas-*.js` (`CONTEXT_INFO`). Una clave que empieza por mayúscula solo se subraya si aparece escrita igual.
