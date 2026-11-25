// Lo que hay dentro de cada casita (1..24), en orden.
// Cada ticket tiene un título y una lista de "bloques" que se muestran uno debajo de otro:
//   {texto:'…'}                     párrafo de texto
//   {vale:'…'}                      ticket dibujado "VALE POR …"   ({vale:'…', arriba:'¡PREMIO!'} cambia el encabezado)
//   {carta:'…', despedida, firma}   la carta (párrafos separados por una línea en blanco)
//   {calendario:3, id:'…'}          elegir hasta 3 días de las vacaciones; hasta confirmar no sigue
//   {juego:'subway'}                minijuego (pendiente); hasta ganar no sigue
//   {desliza:[…]}                   tarjetas para deslizar a izquierda/derecha (tipo Tinder)
//   {elige:[[a,b],…]}               rondas de "elige una de dos"
//   {clave:'sha256…'}               contraseña para poder ver lo que viene después
// Lo marcado como PENDIENTE está esperando imágenes / juegos / textos.

export const TICKETS = [
  /* 1 */ {titulo: 'Te quiero', bloques: [
    {carta: "No sé muy bien cómo empezar esto, pero tengo claro que te tengo que decir tantas cosas. Este primer regalo es simple, pero seguro que lo sabes valorar bien. Quiero abrirme contigo, aunque ya lo haya hecho más veces. Quiero que cuando te encuentres mal, triste o de bajón leas esta carta y sientas mis brazos arropándote y mi boca dándote besos por toda la cara hasta hacerte reír.\n\nMi vida es perfecta desde que tú estás conmigo. Y dirás: ¿y la rodilla?, ¿y la universidad?, ¿y el deporte? Y yo te respondería que tienes razón, pero que esas cosas en ningún momento me han podido quitar la felicidad que tengo solo de pensar que estoy un día más a tu lado, en la suerte que tengo de levantarme y ver un «Buenos días, cielo» tuyo. Me siento feliz, me siento en casa contigo. Eres lo mejor de mi vida.\n\nMe acuerdo de cuando nos conocimos. Quién diría que estudiar me iba a brindar la oportunidad de conocer a una chica tan agradable, tan graciosa, tan risueña, tan preciosa. Nunca podré borrar el primer momento en el que te vi, porque ese momento ha significado que haya encontrado el amor de mi vida. Tuvo que pasar un tiempo hasta darnos cuenta de que sí, que era real que estábamos destinados a estar juntos, y estoy seguro de que nuestros abuelos nos cogieron las manos y las juntaron. Y desde ese momento nunca se han separado de nosotros, mientras nos ven juntos desde el cielo, sonriendo.\n\nExisten palabras que pueden intentar expresar lo que siento por ti, pero siento que siempre se quedan cortas. Digamos que la única que está más próxima es: inefable. Eres una persona maravillosa, un apoyo incondicional para mí y para todos, una sonrisa cuando estás triste, un abrazo cuando no puedes más, una chica que se esfuerza día a día en ser mejor y que lo consigue, te lo puedo asegurar. Y por supuesto, una chica hermosa por dentro y por fuera, perfecta tal y como es. En resumen, cuando te digo «te quiero, mi vida 💚», es porque eres mi vida de verdad.\n\nA lo mejor no es el primer «regalo» que esperabas, pero espero, y vuelvo a recalcar, que cuando creas que no puedes más y estés triste, leas esto y me sientas a tu lado. Te quiero, mi vida. Quiero casarme contigo, viajar contigo, formar una familia contigo y envejecer contigo. Todo contigo.",
     despedida: 'Por otras Navidades juntos 💚', firma: 'Tu chico 💕'},
  ]},
  /* 2 */ {titulo: 'Nuestra Navidad', bloques: [
    {texto: 'Elige hasta 3 días de las vacaciones de Navidad 🎄'},
    {calendario: 3, id: 'cita2'},
    {texto: '¡Has confirmado una cita conmigo en la Ciudad de la Navidad! 🎅'},
    {vale: 'Entrada gratis a la Ciudad de la Navidad', arriba: 'Entrada', pendiente: 'imagen'},
  ]},
  /* 3 */ {titulo: 'Sorpresa. Bueno... O no tanto', bloques: [
    {texto: 'Se está muy cómodo entre tantos personajes conocidos... Pero más cómodo es estar en tu habitación jeje.'},
  ]},
  /* 4 */ {titulo: 'Japón', bloques: [
    {texto: 'Ojalá poder irnos a Japón, pero todavía no doy para tanto... Por lo menos te ofrezco algo típico de allí.'},
    {vale: '10 minutos de masaje'},
  ]},
  /* 5 */ {titulo: 'Caliente caliente', bloques: [
    {texto: 'Elige un día, ponemos música y, mientras hablamos... 🔥 Te hago unas tortitas.'},
    {vale: 'unas tortitas'},
  ]},
  /* 6 */ {titulo: 'Mala idea', bloques: [
    {texto: 'Me arrepentiré de esto, y mucho, pero bueno...'},
    {vale: 'quitar pelos negros'},
    {texto: 'Sin resistirme....'},
  ]},
  /* 7 */ {titulo: 'Top Secret', bloques: [
    {texto: 'Tendrás que verme en persona para averiguarlo.'},
  ]},
  /* 8 */ {titulo: 'Lady madrizz', bloques: [
    {texto: 'Elige hasta 3 días de las vacaciones de Navidad 🎄'},
    {calendario: 3, id: 'cita8'},
    {juego: 'subway'},
    {vale: 'Te has ganado unos churros con chocolate caliente', arriba: '¡Premio!'},
    {texto: 'Me apetece ver las luces por Madrid, ¿Y a ti? Anda, si ya has escogido día 😉'},
  ]},
  /* 9 */ {titulo: 'Importante', bloques: [
    {texto: '¿Hay algo que te apetezca muchísimo hacer? Lo haremos juntos 💚'},
    {vale: '«tu plan»'},
  ]},
  /* 10 */ {titulo: 'Siempre igual', bloques: [
    {texto: 'Esto no puede ser, siempre pasa lo mismo: que no nos hacemos fotos 🫥. Así que me comprometo a encontrar un sitio precioso para sacarnos fotos. Y esto estará para que me lo recuerdes:'},
    {vale: 'una sesión de fotos'},
  ]},
  /* 11 */ {titulo: 'Sí quiero 💍', bloques: [
    {texto: 'Aprovéchalo, que esto es oro.'},
    {vale: 'un día diciendo a todo que sí'},
  ]},
  /* 12 */ {titulo: 'No pega mucho pero...', bloques: [
    {vale: 'un helado'},
  ]},
  /* 13 */ {titulo: 'TikTok', bloques: [
    {texto: 'Desliza a la derecha lo que te guste y a la izquierda lo que no 👉👈'},
    {desliza: ['Receta 1', 'Receta 2', 'Receta 3', 'Receta 4', 'Receta 5'], pendiente: 'imágenes'},
    {texto: 'Mucha carpeta de recetitas, pero está cogiendo polvo...'},
    {vale: 'comida casera'},
  ]},
  /* 14 */ {titulo: 'Piojos', bloques: [
    {texto: 'Uy, me equivoqué con el título, quería decir "antojos" jejeje. ¿Qué quieres? ¿Pipas, chuches, eneryeti, napolitana del DIA, ...? Tú solo pídemelo. Pero aprovecha, que solo tienes uno.'},
    {vale: 'unos antojos'},
  ]},
  /* 15 */ {titulo: 'Maratón', bloques: [
    {texto: 'Pero no solo de capítulos.'},
    {vale: 'un episodio con cosquillas'},
  ]},
  /* 16 */ {titulo: 'Futuro', bloques: [
    {texto: 'Todavía queda, pero: Marta Ruiz Buendía, ¿quieres... que te invite a comer en nuestra escapada de mayo? ¿Sí? Perfecto entonces.'},
    {vale: 'comida gratis'},
  ]},
  /* 17 */ {titulo: 'Subidón', bloques: [
    {texto: 'No me las has pedido, pero te las voy a dar. Ah, no, que ya están en tu habitación.'},
    {texto: '🔎 Pista: hay muchas cosas que te atan, pero no te gusta librarte de ellas.', pista: true},
  ]},
  /* 18 */ {titulo: 'Bajón', bloques: [
    {texto: 'Vaya, no acerté con las chuches que querías... Menos mal que me cubrí las espaldas. Te toca buscar de nuevo por tu habitación jeje.'},
    {texto: '🔎 Pista: (muy pronto)', pista: true, pendiente: 'pista'},
  ]},
  /* 19 */ {titulo: 'Inicio', bloques: [
    {texto: 'Escríbeme hoy, cuadramos un día y recreamos el día que todo empezó. Vamos al 100 Montaditos y damos una vuelta por el Parque de los Castillos, o Parque M&Y ahora.'},
  ]},
  /* 20 */ {titulo: 'Estética', bloques: [
    {texto: 'Sé que la estética de tu habitación es intocable, pero bueno, aunque sea para que lo guardes. Habla conmigo 😉'},
  ]},
  /* 21 */ {titulo: 'Arroz con voces', bloques: [
    {clave: '907d29f538c8673e48411cac69619d84107c79713fcb32f32fa028703a15e287'},
    {texto: 'Hoy vuelvo cenado a casa, pero es que era Black y también era Friday, y al final...'},
  ]},
  /* 22 */ {titulo: 'Chao', bloques: [
    {texto: 'Es bastante vergonzoso la verdad, pero aquí la tienes, cielo. Espero que te guste. Habla conmigo ☺️'},
  ]},
  /* 23 */ {titulo: 'Brindis', bloques: [
    {texto: 'Este no va con un "Vale", pero espero que se pueda. Ya que no estás en "tarde buena", vamos a quedar y te invito a una cerveza 🍻'},
  ]},
  /* 24 */ {titulo: 'Tu día', bloques: [
    {texto: 'Elige una de cada dos 👇'},
    {elige: [['Desayuno en casa', 'Desayuno fuera'], ['Playa', 'Montaña'], ['Película', 'Serie'], ['Dulce', 'Salado'], ['Paseo', 'Siesta']], pendiente: 'tarjetas'},
    {texto: 'Tú solo vístete y yo organizo un plan para pasar el día entero juntos.'},
    {vale: 'un día con todo hecho'},
  ]},
];

// Días que se pueden elegir en los calendarios (vacaciones de Navidad)
export const VACACIONES = {desde: '2026-12-18', hasta: '2027-01-07'};
