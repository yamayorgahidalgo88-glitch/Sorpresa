// Catálogo de categorías de PUJAZO.
// Cada objeto se escribe como "emoji Nombre" y se agrupa por nivel:
//   terrible (muy malo) · malo · normal · bueno · brutal (muy bueno / locura)

const TIERS = {
  terrible: { label: 'Muy malo', weight: 15 },
  malo: { label: 'Malo', weight: 20 },
  normal: { label: 'Normal', weight: 25 },
  bueno: { label: 'Bueno', weight: 24 },
  brutal: { label: 'Muy bueno', weight: 16 },
};

const CATEGORIES = {
  jardin: {
    name: 'El jardín ideal',
    emoji: '🌳',
    items: {
      terrible: [
        '🪳 Plaga de cucarachas gigantes', '💩 Jardín lleno de cacas de perro', '🐀 Familia de ratas viviendo bajo el césped',
        '🦟 Nube permanente de mosquitos tigre', '🗑️ Contenedor de basura que nunca recogen', '☢️ Bidón misterioso que brilla en la oscuridad',
        '🕳️ Socavón gigante en medio del césped', '🐍 Nido de serpientes venenosas', '🌵 Césped sustituido por cactus',
        '🧟 Gnomo maldito que se mueve de noche', '🐝 Avispero asesino en el árbol principal', '🦨 Mofeta residente con mal carácter',
        '🚽 Fosa séptica que rebosa', '⚡ Torre de alta tensión zumbando encima', '🏚️ Caseta de herramientas a punto de derrumbarse',
        '🔥 Barbacoa que explota cada vez que la enciendes', '🧱 Muro de hormigón gris sin ventanas alrededor', '🕷️ Arañas del tamaño de una mano',
        '🐌 Invasión de babosas que se comen todo', '🤡 Estatua de payaso terrorífica', '🚧 Obras eternas del vecino justo al lado',
        '🪦 Cementerio de mascotas antiguo', '🌊 Se inunda cada vez que llueve', '🦴 Aparecen huesos cada vez que cavas',
      ],
      malo: [
        '🍂 Hojas secas que nunca dejan de caer', '🌿 Malas hierbas por todas partes', '🐜 Hormiguero gigante en la terraza',
        '🐕 Perro del vecino que ladra 24 horas', '🪨 Suelo lleno de piedras', '🌧️ Charco permanente de barro',
        '🪑 Sillas de plástico rotas', '🧺 Tendedero oxidado en medio', '🐦 Palomas que lo ensucian todo',
        '🍄 Setas venenosas por el césped', '🌳 Árbol seco y medio muerto', '🔦 Farola que parpadea toda la noche',
        '🦗 Grillos que no te dejan dormir', '💨 Desagüe que huele fatal', '🚿 Aspersor roto que moja la casa',
        '🪵 Montaña de leña podrida', '🏗️ Grúa del vecino que tapa el sol', '🐈 Gatos callejeros peleándose cada noche',
        '🪣 Piscina hinchable pinchada', '🚲 Bicicleta oxidada abandonada', '🟢 Césped artificial descolorido',
        '📦 Cajas viejas apiladas al aire libre', '🐞 Pulgón en todas las plantas', '➰ Valla de alambre de espino',
      ],
      normal: [
        '⛲ Fuente decorativa de piedra', '🌷 Parterre de tulipanes', '🪴 Macetas con geranios',
        '🌲 Seto bien recortado', '🪑 Banco de madera', '🏮 Farolillos colgantes',
        '🐟 Estanque pequeño con peces', '🥬 Huerto de tomates y lechugas', '🐦 Casita para pájaros',
        '🛖 Caseta de herramientas bonita', '🧺 Mesa de picnic', '🌻 Fila de girasoles',
        '🪨 Camino de piedras', '💡 Guirnalda de luces', '🍎 Manzano lleno de fruta',
        '🦩 Flamenco de plástico rosa', '🧑‍🌾 Gnomo de jardín simpático', '🌸 Arco con flores trepadoras',
        '⛱️ Sombrilla y tumbonas', '🌿 Jardín de hierbas aromáticas', '🚿 Ducha exterior',
        '🐓 Gallinero con tres gallinas', '🎐 Carillón de viento', '🟩 Césped recién cortado',
      ],
      bueno: [
        '🏊 Piscina', '🛁 Jacuzzi', '🍖 Barbacoa de obra',
        '🛋️ Zona chill out con sofás', '🔥 Hoguera con asientos alrededor', '🌴 Palmeras tropicales',
        '🍹 Barra de bar exterior', '🎾 Pista de pádel', '🏀 Canasta de baloncesto',
        '🌳 Casa del árbol', '🤸 Cama elástica gigante', '🍕 Horno de pizza de leña',
        '🎬 Cine de verano al aire libre', '🌺 Hamaca entre dos palmeras', '🧖 Sauna finlandesa de madera',
        '🌸 Jardín japonés con puente', '🏓 Mesa de ping pong', '⛳ Green de minigolf',
        '🐠 Estanque koi con cascada', '🍇 Pérgola con parra de uvas', '🎯 Zona de dianas y juegos',
        '🛝 Columpios para adultos', '🧘 Plataforma de yoga', '🌊 Piscina desbordante infinita',
      ],
      brutal: [
        '🎢 Mini parque de atracciones privado', '💦 Mini parque acuático con toboganes', '🚁 Helipuerto para tu helicóptero',
        '🛝 Tobogán desde tu habitación a una piscina de bolas', '🦒 Mini zoo con jirafas', '🏰 Castillo hinchable permanente',
        '🎡 Noria privada con vistas', '🏄 Piscina de olas para surfear', '🦖 Dinosaurio animatrónico a tamaño real',
        '🍫 Fuente de chocolate gigante', '🚀 Plataforma de lanzamiento de cohetes', '🏟️ Campo de fútbol con gradas',
        '🐬 Delfinario', '⛷️ Pista de esquí artificial', '🎤 Escenario para conciertos privados',
        '🍦 Máquina de helados infinitos', '🛸 Ovni aparcado de decoración', '🏝️ Playa privada con arena blanca',
        '🎳 Bolera al aire libre', '🌋 Volcán artificial que escupe espuma', '🦄 Establo con unicornios',
        '🏎️ Circuito de karts', '🧗 Rocódromo de 20 metros', '🔭 Observatorio con telescopio gigante',
      ],
    },
  },

  casa: {
    name: 'La casa ideal',
    emoji: '🏠',
    items: {
      terrible: [
        '🐀 Ratas dentro de las paredes', '👻 Fantasma que mueve los muebles de noche', '💧 Gotera justo encima de la cama',
        '🦠 Moho negro en todas las paredes', '🚽 Un único baño y sin puerta', '⚡ Instalación eléctrica que echa chispas',
        '🪳 Cucarachas en la cocina', '🥶 Sin calefacción en invierno', '🥵 Sin aire acondicionado en agosto',
        '🧻 Paredes de papel: lo oyes todo', '🚂 Vía del tren pegada a la ventana', '✈️ Justo debajo de la ruta de los aviones',
        '🐜 Termitas comiéndose el suelo', '🌊 Sótano que se inunda', '🪆 Habitación con muñecas antiguas que te miran',
        '🧊 Ducha que solo saca agua helada', '📵 Sin cobertura ni wifi', '🪜 Escaleras sin barandilla',
        '🏚️ Tejado a punto de caerse', '🦇 Murciélagos en el desván', '👃 Olor a cloaca permanente',
        '🔨 Vecino que hace obras a las 7 de la mañana', '🚪 Puertas que dan portazos solas', '🥛 Nevera que lo congela todo, hasta la leche',
      ],
      malo: [
        '🛏️ Colchón con muelles salidos', '🪟 Ventanas que no cierran bien', '🚰 Grifo que gotea toda la noche',
        '💡 Bombillas que parpadean', '🛋️ Sofá de skay que se pega a la piel', '🧱 Gotelé en todas las paredes',
        '📺 Tele de tubo antigua', '🪑 Muebles de los años 70', '🍳 Cocina con una sola placa',
        '🍄 Plato de ducha con hongos', '🧺 Lavadora que camina al centrifugar', '📦 Casa sin armarios',
        '🌑 Pisos interiores sin luz natural', '🪜 Quinto piso sin ascensor', '🔌 Un solo enchufe por habitación',
        '🐕 Vecino con perro que aúlla', '🎵 Vecina que canta ópera a medianoche', '🧶 Moqueta vieja en toda la casa',
        '🚪 Puerta de entrada que chirría', '🔊 Tuberías que hacen ruidos raros', '🌡️ Radiadores que solo funcionan a tope',
        '🛁 Bañera amarillenta', '🌼 Papel pintado de flores hortera', '🐞 Mariquitas invadiendo la casa',
      ],
      normal: [
        '🛋️ Sofá cómodo', '🍳 Cocina bien equipada', '🛏️ Cama de matrimonio',
        '📺 Smart TV de 50 pulgadas', '🪴 Plantas de interior', '🛁 Baño con bañera',
        '🧺 Lavadora y secadora', '📚 Estantería llena de libros', '🪟 Ventanales con mucha luz',
        '🧥 Armario empotrado', '🍽️ Comedor para seis personas', '🏙️ Balcón con vistas a la calle',
        '🔥 Calefacción central', '❄️ Aire acondicionado', '🖥️ Despacho para teletrabajar',
        '🧸 Cuarto de invitados', '🚗 Plaza de garaje', '🌿 Terraza pequeña',
        '🪞 Vestidor pequeño', '☕ Cafetera de cápsulas', '🤖 Robot aspirador',
        '🖼️ Cuadros bonitos en las paredes', '📦 Trastero', '💡 Luces regulables',
      ],
      bueno: [
        '🛁 Jacuzzi en el baño', '🎮 Sala de videojuegos', '🎬 Cine en casa',
        '🏋️ Gimnasio privado', '🔥 Chimenea de leña', '🌇 Ático con terraza panorámica',
        '🍷 Bodega de vinos', '🍳 Cocina con isla gigante', '🧖 Sauna en casa',
        '👑 Cama king size con dosel', '🎹 Piano de cola en el salón', '🏊 Piscina climatizada interior',
        '📚 Biblioteca con escalera corredera', '🌅 Ventanal de suelo a techo con vistas al mar', '🎱 Sala de billar',
        '📱 Domótica que lo controla todo', '👗 Vestidor enorme de celebrity', '🍸 Bar de cócteles en el salón',
        '🌧️ Ducha efecto lluvia', '🌿 Jardín vertical interior', '🎙️ Estudio de grabación',
        '🐶 Habitación para tu mascota', '🔆 Placas solares y factura cero', '🌱 Invernadero en la azotea',
      ],
      brutal: [
        '🛝 Tobogán del dormitorio al salón', '🐠 Acuario gigante en la pared', '🚪 Pasadizo secreto tras la estantería',
        '🤖 Mayordomo robot', '🎳 Bolera en el sótano', '💎 Piscina de cristal en el tejado',
        '🚁 Helipuerto en la azotea', '🍫 Grifo de chocolate en la cocina', '🪐 Techo planetario con estrellas reales',
        '🎢 Montaña rusa que recorre la casa', '🏰 Torre de castillo con vistas', '🕹️ Sala arcade retro completa',
        '🦈 Suelo de cristal sobre tiburones', '🍿 Cine IMAX privado', '🧊 Habitación de hielo',
        '🎈 Piscina de bolas para adultos', '🛗 Ascensor de cristal panorámico', '☔ Habitación con lluvia artificial para dormir',
        '🏎️ Garaje con 10 deportivos', '🧙 Pasillo mágico con cuadros que se mueven', '🍕 Máquina de pizzas automática 24h',
        '🌊 Casa flotante sobre el mar', '🛸 Búnker futurista con teletransporte', '🧗 Muro de escalada en el salón',
      ],
    },
  },

  parque: {
    name: 'El parque de atracciones ideal',
    emoji: '🎢',
    items: {
      terrible: [
        '⏳ Colas de 4 horas en cada atracción', '🤮 Montaña rusa que te hace vomitar siempre', '🔩 Atracción con tornillos sueltos',
        '🦟 Lago lleno de mosquitos', '🤡 Payasos terroríficos que te persiguen', '⛈️ Tormenta todo el día',
        '🍔 Hamburguesas a 30 euros', '🚽 Baños atascados', '🙃 Montaña rusa que se para boca abajo',
        '💸 Entrada a 200 euros', '🐀 Ratas en la zona de comida', '🔥 Atracción que echa humo',
        '👻 Pasaje del terror demasiado real', '🥵 45 grados sin una sombra', '🎡 Noria que se atasca arriba',
        '🧟 Zombi actor que te muerde de verdad', '🪨 Atracciones sin cinturón de seguridad', '🚑 Ambulancia en la puerta todo el rato',
        '📵 Prohibido el móvil en todo el parque', '🦢 Ocas agresivas sueltas', '🧊 Atracción acuática con agua helada',
        '🐝 Avispas en todas las papeleras', '🔊 Música de feria a todo volumen sin parar', '🎠 Tiovivo con caballos de cara malvada',
      ],
      malo: [
        '🚗 Coches de choque sin batería', '🎈 Globos que explotan solos', '🧸 Peluches imposibles de ganar',
        '🍭 Algodón de azúcar rancio', '🧃 Bebidas calientes y sin hielo', '🪑 Bancos rotos',
        '🗺️ Mapa del parque incomprensible', '🚶 Parque enorme sin trenecito', '🎟️ Cada atracción se paga aparte',
        '🌫️ Máquina de humo que te ahoga', '📢 Megafonía chillona', '🦆 Patos que te roban la comida',
        '🍟 Patatas fritas frías', '🛒 Tienda de souvenirs obligatoria a la salida', '🐣 Montaña rusa infantil para adultos',
        '💦 Atracción de agua que te empapa sin chubasquero', '💤 Espectáculo aburridísimo', '🚧 Atracción cerrada por mantenimiento',
        '☀️ Cero sombras', '😔 Mascota del parque deprimida', '🍦 Helado que se derrite al momento',
        '🪙 Máquinas que se tragan las monedas', '🪞 Laberinto de espejos rotos', '🎯 Tiro al blanco trucado',
      ],
      normal: [
        '🎠 Tiovivo clásico', '🚗 Coches de choque', '🎡 Noria',
        '🍭 Puesto de algodón de azúcar', '🎯 Tiro al blanco', '☕ Tazas giratorias',
        '🚂 Trenecito del parque', '🏴‍☠️ Barco pirata', '🍿 Puesto de palomitas',
        '🎪 Carpa de circo', '🤸 Camas elásticas', '🌭 Puesto de perritos calientes',
        '🧸 Tienda de peluches', '🪞 Casa de los espejos', '🎈 Vendedor de globos',
        '🥤 Granizados de colores', '📸 Fotomatón', '🎭 Desfile de personajes',
        '🐴 Paseo en poni', '🎨 Pintacaras', '🏰 Castillo hinchable',
        '🪵 Troncos acuáticos', '🔫 Láser tag', '🧺 Zona de picnic',
      ],
      bueno: [
        '🎢 Montaña rusa de madera', '🌊 Rápidos en balsa', '🗼 Caída libre de 60 metros',
        '👻 Pasaje del terror', '🌀 Montaña rusa con loopings', '🏎️ Circuito de karts',
        '🎆 Espectáculo de fuegos artificiales', '🤹 Show de acróbatas', '🦖 Zona de dinosaurios',
        '🚀 Simulador espacial', '🎳 Bolera fluorescente', '🕹️ Salón recreativo',
        '🍩 Churros y donuts gigantes', '🏄 Piscina de olas', '🛝 Toboganes acuáticos',
        '🎡 Noria gigante panorámica', '🧗 Rocódromo', '🦜 Show de aves exóticas',
        '🎵 Conciertos en directo', '🪂 Tirolina sobre el lago', '🎟️ Pase VIP sin colas',
        '🌌 Montaña rusa a oscuras', '🎩 Espectáculo de magia', '🐬 Show de delfines',
      ],
      brutal: [
        '🚀 Montaña rusa que sale al espacio', '🐉 Dragón de verdad que te lleva volando', '🌈 Montaña rusa sobre un arcoíris',
        '🍫 Río de chocolate en barca', '⚡ Montaña rusa a 300 km/h', '🦕 Safari con dinosaurios reales',
        '🧙 Castillo con hechizos de verdad', '🦈 Montaña rusa submarina con tiburones', '☁️ Atracción entre las nubes',
        '🎡 Noria de 500 metros', '🛸 Abducción alienígena simulada', '🤖 Robots gigantes pilotables',
        '🕰️ Máquina del tiempo', '🏰 El parque entero solo para ti', '🥽 Videojuego de realidad virtual a tamaño real',
        '🦸 Volar con jetpack como un superhéroe', '🍬 Casa de caramelo comestible', '🐋 Paseo a lomos de una ballena',
        '🌋 Montaña rusa dentro de un volcán', '🎆 Fuegos artificiales con tu nombre', '🧊 Tobogán de hielo de 1 km',
        '🎈 Viaje en globo aerostático', '🌌 Sala de gravedad cero', '🍔 Comida gratis ilimitada todo el día',
      ],
    },
  },

  pizza: {
    name: 'La pizza ideal',
    emoji: '🍕',
    items: {
      terrible: [
        '🐟 Sardinas de lata con espinas', '🧦 Sabor a calcetín sudado', '🪳 ¿Una aceituna... o una cucaracha?',
        '🍫 Chocolate con atún', '🦷 Masa tan dura que rompe dientes', '🔥 Completamente quemada',
        '🧊 Congelada por dentro', '🐌 Caracoles vivos', '🥫 Tomate caducado',
        '💧 Masa empapada y blanda', '🦑 Tinta de calamar con plátano', '🌶️ Picante nivel muerte',
        '🧄 30 dientes de ajo crudo', '🪱 Gusanos crujientes', '🍬 Gominolas fundidas',
        '🧂 Sal a puñados', '🥒 Pepinillos con natillas', '📦 Trozos del cartón pegados',
        '🦴 Huesos de pollo', '🐙 Pulpo crudo entero', '🥚 Huevo podrido',
        '💇 Un pelo larguísimo', '🌱 Hierba del jardín', '🤢 Queso mohoso del malo',
      ],
      malo: [
        '🍍 Piña (polémica asegurada)', '🫒 Aceitunas con hueso', '🧅 Cebolla cruda a montones',
        '🥦 Brócoli hervido', '🥫 Maíz de lata aguado', '🍅 Ketchup en vez de tomate',
        '🐟 Anchoas a montones', '🍄 Champiñones de lata', '🫑 Pimiento verde crudo',
        '🥬 Lechuga caliente', '🧈 Mantequilla a montones', '🍞 Masa de pan de molde',
        '🥕 Zanahoria rallada', '🦐 Gambas congeladas sin descongelar', '🫛 Guisantes',
        '🥚 Huevo duro en rodajas', '🍟 Patatas fritas encima', '🌭 Salchichas de lata',
        '🥜 Cacahuetes', '🍝 Espaguetis encima', '🧀 Queso de sándwich en lonchas',
        '🍯 Miel de más', '🫚 Jengibre a lo bestia', '🥥 Coco rallado',
      ],
      normal: [
        '🍅 Salsa de tomate casera', '🧀 Mozzarella', '🍄 Champiñones frescos',
        '🫒 Aceitunas negras', '🥓 Bacon', '🍖 Jamón york',
        '🧅 Cebolla caramelizada', '🫑 Pimientos asados', '🌿 Orégano',
        '🌽 Maíz dulce', '🍗 Pollo a la plancha', '🥩 Carne picada',
        '🍒 Tomates cherry', '🧄 Ajo asado', '🌶️ Guindilla suave',
        '🍳 Huevo a la plancha', '🐟 Atún', '🍆 Berenjena asada',
        '🥬 Espinacas', '🥔 Patata en láminas', '🧀 Queso cheddar',
        '🍕 Masa clásica', '🫓 Masa fina y crujiente', '🧈 Bordes con mantequilla de ajo',
      ],
      bueno: [
        '🍖 Jamón ibérico', '🧀 Burrata entera en el centro', '🌿 Albahaca fresca',
        '🫒 Aceite de oliva virgen extra', '🧀 Cuatro quesos', '🧀 Bordes rellenos de queso',
        '🥩 Carne de wagyu', '🍕 Pepperoni crujiente', '🍯 Hot honey (miel picante)',
        '🦐 Langostinos al ajillo', '🥑 Guacamole', '🍄 Setas silvestres',
        '🧀 Parmesano recién rallado', '🥓 Pancetta italiana', '🍅 Tomates secos',
        '🐟 Salmón ahumado', '🍐 Pera con gorgonzola', '🌰 Nueces tostadas',
        '🥚 Yema curada', '🧅 Cebolla crujiente', '⏳ Masa napolitana de 48 horas',
        '🔥 Hecha en horno de leña', '🌱 Pesto casero', '📏 Tamaño XXL',
      ],
      brutal: [
        '✨ Láminas de oro comestible', '🦞 Langosta entera', '🍄 Trufa negra rallada',
        '🖤 Caviar', '🧀 Queso que se estira 3 metros', '♾️ Pizza infinita que se regenera',
        '🍫 Borde relleno de Nutella', '👨‍🍳 Hecha por el mejor pizzero de Nápoles', '🍦 Mitad pizza, mitad helado',
        '🌮 Pizza-taco gigante', '🍔 Una hamburguesa entera encima', '🍣 Sushi encima',
        '🥩 Chuletón de 1 kilo', '🍾 Masa hecha con champán', '🦄 Masa arcoíris',
        '🫕 Fondue de queso en el centro', '🍩 Bordes de donut', '🌋 Pizza volcán de queso fundido',
        '🚁 Entregada por dron en 1 minuto', '📐 Pizza de 2 metros', '🤤 Pizza que no engorda',
        '🎁 Pizza gratis de por vida', '🥓 Cascada de bacon', '🍗 Alitas de pollo en los bordes',
      ],
    },
  },

  viaje: {
    name: 'El viaje ideal',
    emoji: '✈️',
    items: {
      terrible: [
        '🛫 Vuelo cancelado y dormir en el aeropuerto', '🧳 Maleta perdida', '🤢 Gastroenteritis el primer día',
        '🛏️ Hotel con chinches', '🌧️ Lluvia todos los días', '🦟 Picaduras de mosquito por todo el cuerpo',
        '🚌 Autobús de 30 horas sin aire', '💸 Te roban la cartera', '🦞 Quemadura solar extrema',
        '🪳 Cucarachas en la habitación', '🛂 Pasaporte caducado en el control', '🔊 Hotel encima de una discoteca',
        '🦈 Playa con aviso de tiburones', '🌪️ Huracán en tu destino', '😤 Compañero de viaje insoportable',
        '🚽 Baño compartido con 40 personas', '🥶 Viaje de playa... a Siberia', '🚩 Guía turístico que te abandona',
        '🪫 Sin batería ni cargador', '🛳️ Crucero con mareo constante', '🐒 Monos que te roban el móvil',
        '⌛ Escala de 18 horas', '🩼 Te rompes una pierna el primer día', '🦪 Intoxicación por marisco',
      ],
      malo: [
        '💺 Asiento del medio en el avión', '👶 Bebé llorando detrás todo el vuelo', '🧱 Habitación con vistas a un muro',
        '🥖 Desayuno de pan duro', '⏰ Excursiones a las 5 de la mañana', '🧳 Maleta con una rueda rota',
        '🗺️ Perderte por culpa del GPS', '🌫️ Niebla en el mirador', '🌿 Playa llena de algas',
        '🚕 Taxi que te timaba', '🍝 Restaurante trampa para turistas', '🎒 Mochila de 20 kilos',
        '📶 Wifi solo en recepción', '🧴 Olvidarte la crema solar', '🪨 Colchón duro como una piedra',
        '🐦 Gaviotas que te roban la comida', '🚶 Hotel a 2 km de la playa', '💶 Todo carísimo',
        '🗣️ Nadie habla tu idioma', '☁️ Nublado justo el día de playa', '🧦 Calcetines mojados todo el viaje',
        '📷 Olvidarte la cámara', '😵 Jet lag brutal', '🛎️ Recepcionista borde',
      ],
      normal: [
        '🏨 Hotel de 3 estrellas', '🏖️ Playa tranquila', '🥐 Desayuno buffet',
        '🚆 Viaje en tren', '🗺️ Visita guiada por la ciudad', '🏛️ Museo interesante',
        '🍝 Restaurante local rico', '🛍️ Mercadillo de recuerdos', '🚲 Ruta en bici',
        '📸 Fotos bonitas para Instagram', '🌅 Atardecer en la playa', '🏞️ Excursión al lago',
        '🍦 Heladería artesana', '🎒 Mochila cómoda', '🚗 Coche de alquiler',
        '⛰️ Senderismo por la montaña', '🏘️ Pueblo con encanto', '🍤 Ruta de tapas',
        '🎡 Feria local', '🏊 Hotel con piscina', '☕ Cafetería con vistas',
        '🛶 Paseo en kayak', '🌤️ Buen tiempo todos los días', '🏯 Visita a un castillo',
      ],
      bueno: [
        '🥂 Vuelo en primera clase', '🏝️ Resort todo incluido', '🤿 Snorkel con tortugas',
        '🏰 Dormir en un castillo', '⭐ Cena en restaurante con estrella Michelin', '🎈 Paseo en globo al amanecer',
        '🏔️ Cabaña en la nieve con chimenea', '🛥️ Excursión en barco privado', '💆 Spa con masajes',
        '🌌 Ver la aurora boreal', '🦁 Safari en África', '🏄 Clases de surf',
        '🌺 Bungalow sobre el agua en Maldivas', '🗽 Viaje a Nueva York', '🐭 Pase VIP en Disney',
        '🗼 Cena en la Torre Eiffel', '🐘 Bañarte con elefantes', '🚂 Tren panorámico por los Alpes',
        '🍷 Ruta de vinos por la Toscana', '🌸 Japón en época de cerezos', '🛶 Góndola en Venecia',
        '🌋 Ver un volcán en Islandia', '🦘 Viaje a Australia', '🎉 Fiesta en Ibiza',
      ],
      brutal: [
        '🚀 Viaje al espacio', '🛩️ Jet privado', '🏝️ Isla privada solo para ti',
        '🐋 Nadar con ballenas', '🚁 Helicóptero sobre Manhattan', '🛳️ Yate de lujo por el Mediterráneo',
        '🕰️ Viaje en el tiempo al Antiguo Egipto', '🐧 Expedición a la Antártida', '🌕 Fin de semana en la Luna',
        '🏆 Viajes pagados de por vida', '🦖 Isla con dinosaurios', '🏰 Dormir en el castillo de Disney',
        '🌊 Hotel submarino', '🔴 Excursión a Marte', '🎤 Conocer a tu cantante favorito',
        '⚽ Final del Mundial en palco VIP', '🏎️ Pilotar un Fórmula 1 en Mónaco', '🐼 Cuidar pandas en China',
        '💎 Suite presidencial en Dubái', '🌍 Vuelta al mundo en 80 días', '❄️ Hotel de hielo en Laponia',
        '🦄 Viaje a un mundo de fantasía', '🏔️ Cima del Everest en helicóptero', '🎆 Nochevieja en Times Square',
      ],
    },
  },
};

// Convierte "emoji Nombre" en objetos con id estable.
function buildCatalog() {
  const catalog = {};
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const list = [];
    for (const tier of Object.keys(TIERS)) {
      cat.items[tier].forEach((raw, i) => {
        const space = raw.indexOf(' ');
        list.push({
          id: `${key}-${tier}-${i}`,
          emoji: raw.slice(0, space),
          name: raw.slice(space + 1),
          tier,
        });
      });
    }
    catalog[key] = { key, name: cat.name, emoji: cat.emoji, items: list };
  }
  return catalog;
}

const PujazoData = { TIERS, CATALOG: buildCatalog() };
if (typeof module === 'object' && module.exports) module.exports = PujazoData;
else window.PujazoData = PujazoData;
