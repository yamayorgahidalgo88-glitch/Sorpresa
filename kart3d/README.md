# Kart3D: prototipo (Fase 1)

Juego de carreras arcade 3D en **Godot 4.7.2**. Estado: **prototipo jugable**, no es la versión visual final.

## Cómo jugarlo
1. Descarga Godot 4.7.2 (versión estándar, no .NET) desde godotengine.org.
2. Abre Godot → *Importar* → elige `kart3d/project.godot` → *Ejecutar* (F5).

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

## Provisional (a sustituir en la Fase 2)
- El kart y el piloto son figuras primitivas.
- La pista greybox no tiene decorado.
- La interfaz es texto plano.

## Tests
```bash
godot --headless --path kart3d --import
godot --headless --path kart3d --fixed-fps 60 -s res://tests/run_tests.gd
```
Comprueban las reglas de vueltas, la aceleración, la carga y el turbo del derrape, y que la IA completa la carrera de 3 vueltas.

Captura visual (Linux sin pantalla): `xvfb-run godot --path kart3d --rendering-method gl_compatibility --fixed-fps 60 -s res://tests/capture.gd -- salida.png 6`
