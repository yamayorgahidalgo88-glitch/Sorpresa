# Kart3D: prototipo (Fase 4, editor de personaje)

Juego de carreras arcade 3D en **Godot 4.7.2**. Estado: **prototipo jugable con una primera capa visual**. No es la versión final.

## Cómo jugarlo
1. Descarga Godot 4.7.2 (versión estándar, no .NET) desde godotengine.org.
2. Abre Godot → *Importar* → elige `kart3d/project.godot` → *Ejecutar* (F5).

Al arrancar se abre el **menú principal**: *Carrera*, *Garaje* o *Personaje*. En carrera, **Esc** vuelve al menú y **F3** muestra los FPS.

Controles: **W/↑** acelerar · **S/↓** frenar y marcha atrás · **A/D o ←/→** girar ·
**Espacio/Mayús** derrapar (mantén durante la curva y suelta para el mini-turbo) · **R** volver a la pista.
Mando: A acelerar, B frenar, RB derrapar, Y volver a la pista, stick izquierdo para girar.

## Qué hay implementado
- Física arcade del kart (`kart/kart_body.gd`) separada de la presentación (`kart/kart_visuals.gd`).
- Derrape con dos niveles de mini-turbo, penalización fuera de pista y choques con muros.
- Todos los parámetros de conducción están centralizados en `config/kart_tuning.gd`.
- Circuito *greybox* generado a partir de puntos de control (`track/track_builder.gd`).
- Vueltas por checkpoints ordenados (`race/lap_tracker.gd`): no cuentan cruces de meta al revés, idas y vueltas sobre la línea ni atajos que se salten tramos.
- Cuenta atrás, 3 vueltas, meta, reaparición en pista y HUD básico.
- Cámara de seguimiento con FOV dinámico.
- IA básica que sigue la línea central (`ai/ai_input.gd`). De momento solo se usa en los tests.

## Fase 2 (vertical slice visual)
- Kart y piloto con modelos Kenney (CC0): el piloto lleva la animación de conducción y celebra al llegar a la meta.
- Ruedas que giran y viran, inclinación en curvas y derrapes, y suspensión con vibración fuera de pista.
- Partículas: chispas de derrape (azul en el nivel 1, naranja en el nivel 2), humo y llamas de turbo.
- Materiales con luz de borde (rim) para separar al kart del fondo. Iluminación con AgX, SSAO, glow y sombras.
- Circuito decorado: arco de meta, árboles (MultiMesh), conos, gradas, colinas y nubes pastel, suelo con textura y línea central.
- Cámara con barrido de presentación antes de la salida y órbita en meta.
- HUD con identidad propia: píldoras redondeadas, tipografía Fredoka, medidor de mini-turbo y mensajes animados.

## Fase 3 (garaje)
- Menú principal y garaje con plató 3D: plataforma giratoria (se puede girar arrastrando), iluminación de tres puntos y destello al cambiar pieza.
- Piezas definidas por datos en `kart/kart_catalog.gd`: 3 carrocerías (Chispa, Clásico, Cohete), 3 ruedas (Ágiles, Estándar, Todoterreno) y 3 pinturas.
- Las estadísticas (`kart/kart_config.gd`) se traducen en parámetros reales de conducción: punta, aceleración, giro, derrape, choques y agarre fuera de pista. Un test comprueba que ninguna carrocería supera a otra en todo.
- Guardado versionado en `user://save.json` (`autoload/game_state.gd`) con migración y tolerancia a piezas desconocidas.
- Transiciones con fundido entre pantallas (`autoload/scene_router.gd`).

## Fase 4 (editor de personaje)
- Avatar modular (`avatar/`): la cabeza de un modelo y el cuerpo de otro se combinan sobre el mismo esqueleto, así que no hace falta un modelo por combinación.
- Opciones: 12 cabezas (peinado y rostro), 11 conjuntos de ropa, 4 tonos de piel, 9 colores de pelo, 10 colores de ropa, accesorio (gafas o gafas de sol), tamaño de cabeza, altura y nombre.
- Recoloreado mediante un shader que redirige celdas de la paleta (`avatar/palette_remap.gdshader`), sin texturas nuevas.
- Validación de combinaciones incompatibles: las cabezas que ya llevan gafas no admiten otras gafas, y el botón se desactiva con su motivo.
- El avatar se guarda (guardado versión 2, con migración desde la 1) y es quien conduce en las carreras.
- Preprocesado reproducible de las cabezas (`tools/split_hair_uv.py`), que separa el pelo de los ojos en la paleta.

## Prueba de estilo dulce (en curso)
El estilo dulce está activo por defecto, y el botón **Estilo** del menú permite volver al estilo anterior para comparar. Todo se genera por código, sin modelos externos:
- **Kart de golosina** (`art/candy_kart.gd`): bizcocho de fresa, barquillo o tableta de chocolate; ruedas de donut, galleta o caramelo de menta; alerón de piruletas, bastones o barquillo. Las piezas del garaje se traducen a estas versiones.
- **Piloto de cabeza grande** (`art/chibi.gd`): la cara se dibuja con un shader (`art/face.gdshader`), así que ojos, cejas y boca son parámetros independientes. Peinados y gorros de dulce. **Todavía no está conectado al editor de personaje**, que sigue editando el avatar anterior.
- **Circuito de dulces** (`track/candy_scenery.gd`): pista amarilla con fideos, arco de bastón de caramelo, piruletas gigantes, bastones, gominolas, gradas de chocolate y montañas de chocolate con nata.
- Materiales de golosina procedurales en `art/candy.gdshader`: espiral, rayas, pepitas, barquillo y fideos.
- Ficha visual para revisar el estilo: `tests/dev/candy_sheet.tscn` (argumentos: `<salida.png> pilotos|karts`).

## Rendimiento
- Interpolación de física activada: elimina los tirones cuando la pantalla va a más de 60 Hz (la física sigue a 60 Hz).
- SSAO desactivado, FXAA en lugar de MSAA y mapa de sombras de 2048 px.
- Pulsa **F3** para ver los FPS. Si sigue yendo a tirones, dime qué cifra aparece.

Recursos y licencias: [`assets/ASSETS.md`](assets/ASSETS.md), donde también figuran los elementos todavía provisionales.

## Tests
```bash
godot --headless --path kart3d --import
godot --headless --path kart3d --fixed-fps 60 -s res://tests/run_tests.gd
```
Comprueban las reglas de vueltas, la aceleración, la carga y el turbo del derrape, y que la IA completa la carrera de 3 vueltas.

Captura visual (Linux sin pantalla): `xvfb-run godot --path kart3d --rendering-method gl_compatibility --fixed-fps 60 -s res://tests/capture.gd -- salida.png 6`
