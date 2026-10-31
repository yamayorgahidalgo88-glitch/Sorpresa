# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Delegada: el usuario dejó la elección a Claude. Como las reservas se quedan en Booksy (decisión del usuario), no hace falta base de datos: web estática en HTML/CSS/JS sin compilación y una función serverless (`api/try-on.js`, Vercel) para la prueba de corte con IA. Si más adelante se hace la app del peluquero: PWA y avisos por Telegram o WhatsApp.

## Users
- **Clientes** de una peluquería de barrio (el barrio del usuario), que quieren reservar cita desde el móvil y ver cómo les quedaría un corte antes de decidirse.
- **El peluquero**, Ayoub (el dueño; usuario principal de la app de gestión, que comparte local con un segundo barbero), que necesita ver sus citas del día, con hora y cliente, y recibir un aviso unos 30 minutos antes de cada una.

## Product Purpose
Una web de reservas para una peluquería real, más una aplicación privada para el peluquero que guarda y calendariza las reservas y le avisa antes de cada cita. Éxito: el peluquero deja la libreta y los clientes reservan sin llamar.

## Positioning
Un apartado donde el cliente sube una foto, la web analiza la forma de su rostro, le recomienda cortes (con o sin degradado, pelo más largo, etc.) y le muestra una vista previa realista de sí mismo con ese corte, sin que la cara cambie. Se plantea como un asesor de imagen para esa peluquería.

## Operating Context
- Móvil como dispositivo principal, tanto para clientes como para el peluquero.
- La web de reservas y la app del peluquero comparten los datos de las citas.
- El análisis de rostro se haría en el navegador (MediaPipe). La vista previa del peinado usaría un modelo de edición de imagen por API; el usuario tiene claves de NVIDIA Build (plan gratuito, pensado para prototipos).

## Capabilities and Constraints
- Reservas: se hacen en Booksy, que ya usa Ayoub; la web enlaza a su ficha (decisión del usuario). La app propia de agenda queda aparcada.
- Fase 2: análisis de forma de rostro y recomendación de cortes.
- Fase 3: vista previa del corte sobre la foto del cliente, en 2D.
- Fase 4 (opcional): varios ángulos o 3D real; sin garantía de fidelidad desde una sola foto.
- Las fotos de rostro son datos biométricos: hace falta consentimiento claro, borrado tras la sesión y aviso si se envían a una API externa (RGPD).
- Las claves de API van solo en variables de entorno del servidor, nunca en el código ni en el repositorio.
- Hay un límite de pruebas de peinado por visita para controlar el coste.
- **Negocio (según su ficha pública de Booksy, consultada el 31-10-2026; pendiente de confirmar con el dueño):** Ayoub Lahmany Barber Shop. Dueño: Ayoub. Calle Princesa Doña Sofía Posterior 1, local 9B, 28924 Alcorcón (Madrid). Dos barberos, según el usuario. Valoración 5,0 con 131 reseñas en Booksy. Horario visto un día: 10:00–14:00 y 15:00–21:00 (falta el horario semanal completo).
- **Servicios (Booksy, pendiente de confirmar):**

  | Servicio | Precio | Duración |
  |---|---|---|
  | Corte caballero | 11 € | 20 min |
  | Corte + Barba | 16 € | 30 min |
  | Arreglo Barba | 5 € | 10 min |
  | Corte Niños hasta 12 años | 9 € | 20 min |
  | Corte Jubilado | 7 € | 15 min |
  | Corte + Barba + Limpieza Facial Básica | 23 € | 55 min |
  | Corte + Barba + Higiene Facial Profunda | 34 € | 1 h 10 min |
  | Corte + Limpieza Facial Básica | 19 € | 45 min |
  | Corte + Limpieza Facial Profunda | 29 € | 1 h |
  | Limpieza Facial Básica | 10 € | 25 min |
  | Limpieza Facial Profunda | 20 € | 40 min |

- **Ya usa Booksy** para reservas online. Decidido: la web enlaza a Booksy para reservar y se centra en el asesor de cortes.
- **Sin decidir:** el horario semanal, si cada cliente elige barbero, el dominio, y si mantiene el servicio a domicilio que menciona la ficha.

## Brand Commitments
Nombre (según Booksy): Ayoub Lahmany Barber Shop. Faltan logotipo, colores y voz.

## Evidence on Hand
- Ficha pública en Booksy con precios, duraciones y 131 reseñas: https://booksy.com/es-es/86074_ayoub-lahmany-barber-shop_barberia_52935_alcorcon. La ficha enlaza a un Instagram y a una web que aún no se han revisado. Cualquier reseña que usemos debe ser real y citada tal cual, con permiso.
- No hay fotos ni logotipo. No se deben inventar.
- Ojo: hay otros negocios parecidos que no son este, como «Peluquería Ayoub» (peluqueriaayoub.es, en Parla/Illescas) o un empleado llamado Ayoub en X-Barber (Alcorcón).
- `index.html` en la raíz es una experiencia 3D no relacionada («Flores Amarillas · Mi Universo · V6»). Decisión del usuario: moverla a otra carpeta sin tocarla cuando se construya la web de la peluquería.

## Product Principles
- La reserva es lo primero: debe funcionar bien y rápido antes que cualquier función de IA.
- La app del peluquero se diseña con él y para su uso diario; si no la usa, el proyecto falla.
- La vista previa del corte debe respetar la identidad del cliente; si no puede garantizarlo, lo dice.
- Las fotos de los clientes se tratan como datos sensibles.
- Cada fase tiene que servir por sí sola.

## Accessibility & Inclusion
Texto en español. No se estableció ningún requisito específico más allá del uso cómodo en móvil.
