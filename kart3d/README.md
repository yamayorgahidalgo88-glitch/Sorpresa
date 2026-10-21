# Kart3D: prototipo (Fase 3, garaje)

Juego de carreras arcade 3D en **Godot 4.7.2**. Estado: **prototipo jugable con una primera capa visual**. No es la versión final.

## Cómo jugarlo
1. Descarga Godot 4.7.2 (versión estándar, no .NET) desde godotengine.org.
2. Abre Godot → *Importar* → elige `kart3d/project.godot` → *Ejecutar* (F5).

Al arrancar se abre el **menú principal**: *Carrera* o *Garaje*. En carrera, **Esc** vuelve al menú y **F3** muestra los FPS.

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
