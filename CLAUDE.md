# Sorpresa

La memoria se captura y se carga automáticamente con hooks (`.claude/settings.json`). No releas chats antiguos.
Abre otros archivos de `brain/` únicamente si el INDEX indica que son relevantes para la tarea.

(El INDEX y la memoria reciente se cargan automáticamente por hook al iniciar sesión.)

## Reglas del cerebro
1. Antes de terminar una tarea importante: añade una nota en `brain/sesiones/AAAA-MM-DD.md` (qué se hizo, decisiones, pendientes; máx. 15 líneas).
2. Si aprendes algo duradero (preferencia del usuario, decisión, dato del proyecto), guárdalo en el archivo temático correspondiente y actualiza `brain/INDEX.md` (una línea por archivo).
3. Mantén cada archivo corto. Resume y reemplaza lo obsoleto; no acumules.
4. No guardes secretos (claves, contraseñas).
5. Responde en español y sigue `brain/REGLAS.md` (se carga solo al iniciar). Para activar el cerebro en un chat ya empezado, usa `/cerebro`.
6. Archivos generados para el usuario (Excel, PDF…) van en `entregables/` y se listan en el INDEX.
