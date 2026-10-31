# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Delegada: el usuario dejó la elección a Claude. Recomendación: Next.js + Supabase (base de datos y reservas), con la agenda del peluquero como PWA instalable en el móvil. Avisos por Telegram o WhatsApp.

## Users
- **Clientes** de una peluquería de barrio (el barrio del usuario), que quieren reservar cita desde el móvil y ver cómo les quedaría un corte antes de decidirse.
- **El peluquero** (un único usuario de la app de gestión), que necesita ver sus citas del día, con hora y cliente, y recibir un aviso unos 30 minutos antes de cada una.

## Product Purpose
Una web de reservas para una peluquería real, más una aplicación privada para el peluquero que guarda y calendariza las reservas y le avisa antes de cada cita. Éxito: el peluquero deja la libreta y los clientes reservan sin llamar.

## Positioning
Un apartado donde el cliente sube una foto, la web analiza la forma de su rostro, le recomienda cortes (con o sin degradado, pelo más largo, etc.) y le muestra una vista previa realista de sí mismo con ese corte, sin que la cara cambie. Se plantea como un asesor de imagen para esa peluquería.

## Operating Context
- Móvil como dispositivo principal, tanto para clientes como para el peluquero.
- La web de reservas y la app del peluquero comparten los datos de las citas.
- El análisis de rostro se haría en el navegador (MediaPipe). La vista previa del peinado usaría un modelo de edición de imagen por API; el usuario tiene claves de NVIDIA Build (plan gratuito, pensado para prototipos).

## Capabilities and Constraints
- Fase 1: reservas de cliente, agenda del peluquero, avisos 30 min antes por Telegram o WhatsApp (confirmado).
- Fase 2: análisis de forma de rostro y recomendación de cortes.
- Fase 3: vista previa del corte sobre la foto del cliente, en 2D.
- Fase 4 (opcional): varios ángulos o 3D real; sin garantía de fidelidad desde una sola foto.
- Las fotos de rostro son datos biométricos: hace falta consentimiento claro, borrado tras la sesión y aviso si se envían a una API externa (RGPD).
- Las claves de API van solo en variables de entorno del servidor, nunca en el código ni en el repositorio.
- Hay un límite de pruebas de peinado por visita para controlar el coste.
- **Sin decidir:** número de barberos (se asume uno, sin confirmar), lista de servicios y duraciones, horario, nombre de la peluquería y dominio.

## Brand Commitments
Ninguno confirmado. Faltan nombre, logotipo y voz de la peluquería.

## Evidence on Hand
- No hay fotos, textos, precios ni testimonios reales de la peluquería. No se deben inventar.
- `index.html` en la raíz es una experiencia 3D no relacionada («Flores Amarillas · Mi Universo · V6»). Decisión del usuario: moverla a otra carpeta sin tocarla cuando se construya la web de la peluquería.

## Product Principles
- La reserva es lo primero: debe funcionar bien y rápido antes que cualquier función de IA.
- La app del peluquero se diseña con él y para su uso diario; si no la usa, el proyecto falla.
- La vista previa del corte debe respetar la identidad del cliente; si no puede garantizarlo, lo dice.
- Las fotos de los clientes se tratan como datos sensibles.
- Cada fase tiene que servir por sí sola.

## Accessibility & Inclusion
Texto en español. No se estableció ningún requisito específico más allá del uso cómodo en móvil.
