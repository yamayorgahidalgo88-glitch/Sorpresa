# Ajustes Neptune 3 Pro

App web (100 % en el navegador, sin servidor) que analiza tu modelo y te da el perfil de laminado
para imprimirlo en una **Elegoo Neptune 3 Pro**.

## Cómo usarla

1. Abre `neptune3pro/index.html` a través de un servidor web (GitHub Pages, o en local:
   `cd neptune3pro && python3 -m http.server` → http://localhost:8000).
2. **Archivo 3D (recomendado):** sube el STL, 3MF u OBJ. La app:
   - repara normales invertidas, comprueba si la malla es estanca y si cabe (225 × 225 × 280 mm, 5 mm de margen);
   - prueba varias orientaciones y recomienda la que minimiza voladizos y altura (gira 45° si solo así cabe);
   - mide voladizos (ángulo desde la vertical), distingue **puentes** (apoyados en dos lados) de **ménsulas**,
     comprueba si cada zona ve la cama, mide el grosor mínimo de pared con rayos, el área de apoyo y si el
     centro de masas cae dentro de la huella;
   - colorea la pieza en el visor 3D y permite descargar el STL ya orientado y centrado en la cama.
3. **Fotos (hasta 5):** introduce las medidas reales y responde 4 preguntas (o deja que Claude las rellene
   con tu clave de API). Da un perfil conservador marcado como *confianza baja*.
4. Elige material (PLA, PETG, TPU 95A, ABS, ASA), boquilla (0,2–0,8), uso y prioridad.
5. En **Mi impresora** guarda tus calibraciones (caudal máximo, K de Linear Advance, flow ratio,
   temperatura y retracción por material, firmware). Mandan sobre los valores base.
6. Exporta: JSON de proceso y de filamento para **ElegooSlicer / OrcaSlicer**, `.ini` de **PrusaSlicer**,
   lista de ajustes para **Cura** y el G-code de inicio recomendado.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/knowledge.js` | Datos de la impresora, materiales, boquillas, usos, velocidades, G-code de inicio, problemas → solución |
| `js/analyzer.js` | Análisis geométrico puro (sin dependencias): soldadura de vértices, estanqueidad, BVH + rayos, voladizos, puentes, paredes finas, estabilidad, orientación |
| `js/rules.js` | Motor de reglas: métricas → perfil completo + explicación de cada ajuste + avisos |
| `js/exporters.js` | Orca/Elegoo JSON, Prusa .ini, Cura, STL binario |
| `js/viewer.js` | Visor three.js con la cama y el volumen de impresión |
| `js/app.js` | Interfaz |

Las reglas siguen el documento técnico de la Neptune 3 Pro: capa del 25–75 % de la boquilla y múltiplo de
0,04 mm (paso del husillo Z), 500 mm/s² de aceleración con Marlin de serie, caudal máximo de 11 mm³/s hasta
calibrar (hotend con PTFE), retracción corta de extrusor directo, umbral de soporte 50° (PLA) / 45° (PETG/TPU/ABS)
convertido a la convención de cada laminador, borde si el apoyo es < 3 cm² o la pieza es esbelta, etc.

Comprueba siempre la vista previa por capas del laminador antes de imprimir.
