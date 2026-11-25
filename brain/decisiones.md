# Decisiones
- 2026-11-25: Memoria = carpeta `brain/` (Markdown) + `CLAUDE.md`. Patrón "second brain" (CLAUDE.md + notas + logs de sesión).
- Captura automática con hooks (`.claude/settings.json`, `brain/hooks/brain.py`): guarda cada mensaje y respuesta en `brain/log/AAAA-MM-DD-<sesion>.md`.
- `brain/hooks/sync.sh` sube el log a `main` y a la rama de sesión al terminar cada respuesta (autor `brain-bot`).
- Al iniciar sesión se cargan REGLAS.md + INDEX.md + últimas ~3500 chars del log.
- `/cerebro` (skill en `.claude/skills/cerebro`) puebla el cerebro desde un chat ya empezado.
- `brain/REGLAS.md`: responder usando lo esencial, hacer solo lo pedido, sin extras.
