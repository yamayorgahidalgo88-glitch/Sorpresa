# Calendario Docente

App móvil (Expo / React Native, iOS y Android) con:

- Calendario mensual con festivos **nacionales**, de la **Comunidad de Madrid** y de **Madrid capital**.
- ~50 días de **docencia y educación** (Día Mundial de los Docentes, Autismo, Libro, Alfabetización, Dislexia…).
- **Notas y adjuntos** (fotos y archivos) en cada día, y eventos propios.
- **Notificaciones**: aviso el mismo día (por categoría o por evento) y, por evento, aviso 1, 2, 3 días, 1 o 2 semanas antes. Hora configurable.

Los festivos de 2026 y 2027 de Madrid son los oficiales (BOCM). Otros años se estiman (Jueves Santo, 2 de mayo, traslado de domingos) y se marcan "(estimado)".
Los festivos locales de Madrid capital (San Isidro, Almudena) son orientativos: el Ayuntamiento fija cada año los suyos.

## Probar en el móvil
```bash
npm install
npx expo start      # escanea el QR con Expo Go
```

## Instalar como app (APK Android)
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview   # genera un APK instalable
```
iOS requiere cuenta de Apple Developer (`eas build -p ios`).

## Notas técnicas
- Los avisos son locales (sin servidor). iOS admite 64 pendientes, así que se programan los 60 siguientes y se renuevan al abrir la app.
- Datos en `AsyncStorage`; adjuntos copiados a la carpeta de documentos de la app.
