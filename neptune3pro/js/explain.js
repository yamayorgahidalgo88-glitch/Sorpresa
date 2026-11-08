// Explicaciones detalladas de cada aviso: qué pasa, por qué, qué ocurrirá si imprimes igual
// y cómo arreglarlo paso a paso. Se muestran al pulsar el aviso.

const n = v => String(v).replace('.', ',');

const EXPLAIN = {
  no_fit: d => ({
    title: 'La pieza no cabe en la impresora',
    what: `Con la orientación elegida la pieza mide ${d.dims.map(n).join(' × ')} mm (X × Y × Z). El volumen que se puede usar con seguridad en la Neptune 3 Pro es ${d.usable.join(' × ')} mm: los 225 × 225 × 280 mm oficiales menos 5 mm de margen para la línea de purga, el borde y las tolerancias de la cama.`,
    why: 'Se ha probado a girarla en todas las orientaciones razonables y también 45° sobre la cama (la diagonal es más larga que el lado), y en ninguna cabe.',
    risk: 'El laminador no te dejará imprimirla, o el cabezal chocará con los topes de los ejes.',
    fix: [
      'Prueba otra opción del desplegable «Orientación»: a veces tumbada sí entra.',
      'Reduce la escala (campo «Escala %») hasta que desaparezca el aviso, si el tamaño exacto no es imprescindible.',
      'Divide la pieza en partes (Orca/Elegoo: botón derecho → «Cortar») con pasadores o cola de milano, e imprímelas por separado.',
    ],
  }),

  not_watertight: d => ({
    title: 'La malla tiene huecos (no es estanca)',
    what: `Un modelo para imprimir debe ser una superficie cerrada, como un globo sin agujeros. En este archivo hay ${d.open} aristas abiertas${d.nonManifold ? ` y ${d.nonManifold} aristas compartidas por más de dos caras (no-manifold)` : ''}.`,
    why: 'Pasa mucho con modelos exportados desde programas de diseño o escultura, piezas hechas uniendo varios cuerpos sin fusionarlos, o descargas de mala calidad.',
    risk: 'El laminador no sabe qué es «dentro» y qué es «fuera»: pueden faltar capas, aparecer huecos en las paredes, relleno donde no toca o trozos que desaparecen. Además, las medidas de voladizos y paredes de esta app son menos fiables, por eso baja la confianza.',
    fix: [
      'En ElegooSlicer/OrcaSlicer: botón derecho sobre la pieza → «Reparar modelo» (en Windows usa Netfabb).',
      'Alternativas gratuitas: Windows 3D Builder (abre y te ofrece reparar), Meshmixer (Analysis → Inspector → Auto Repair All) o la web de Formware/Meshlab.',
      'Si la diseñaste tú, une los cuerpos (Unión booleana) antes de exportar el STL.',
      'Vuelve a subir el archivo reparado aquí: el aviso desaparecerá y la confianza subirá.',
    ],
  }),

  thin_walls: d => ({
    title: 'Hay partes más finas de lo que la boquilla puede imprimir',
    what: `Con boquilla de ${n(d.nozzle)} mm cada línea de plástico mide unos ${n(d.lw)} mm de ancho. La app ha lanzado rayos desde la superficie hacia el interior y ha encontrado zonas de solo ≈ ${n(d.min)} mm de grosor (${n(d.frac)} % de las mediciones).`,
    why: 'Una pared más fina que una línea no se puede rellenar con una pasada de la boquilla.',
    risk: 'El laminador omitirá esas zonas o las dejará como un hilo débil: pueden faltar detalles como dedos, antenas, textos en relieve o bordes afilados.',
    fix: [
      'Ya se ha activado el generador de paredes Arachne y «Detectar paredes finas», que salvan parte de los casos.',
      d.min < 0.4 ? 'Para detalles por debajo de 0,4 mm la solución real es una boquilla de 0,2 (más lenta y se atasca con más facilidad: solo PLA).' : 'Engrosa en el modelo las partes finas hasta al menos 2 anchos de línea.',
      'Si puedes, escala la pieza un poco (campo «Escala %»).',
      'Revisa la vista previa por capas del laminador: lo que no aparezca ahí no se imprimirá.',
    ],
  }),

  com_outside: d => ({
    title: 'La pieza puede volcar durante la impresión',
    what: `El centro de masas (el punto de equilibrio) cae fuera de la zona en la que la pieza toca la cama, que solo mide ${n(d.contact)} cm².`,
    why: 'Pasa con piezas inclinadas, en forma de L tumbada al revés o que se ensanchan hacia arriba.',
    risk: 'La Neptune 3 Pro mueve la cama hacia delante y atrás (eje Y). En cada cambio de dirección la pieza recibe un empujón: si está desequilibrada puede despegarse o tumbarse a mitad de impresión.',
    fix: [
      `Se ha puesto un borde (brim) de ${d.brim} mm para agarrarla mejor a la cama.`,
      'Prueba otra opción del desplegable «Orientación»: la recomendada suele apoyar la cara plana más grande.',
      'Activa soporte o añade en el modelo un apoyo/pata de sacrificio.',
      'Limpia la PEI con alcohol isopropílico antes de imprimir para máxima adherencia.',
    ],
  }),

  bridge_risky: d => ({
    title: `Puente largo de ${n(d.span)} mm`,
    what: `Hay una zona horizontal a ${n(d.z)} mm de altura que cruza ${n(d.span)} mm en el aire, apoyada solo en sus extremos.`,
    why: 'Los puentes de menos de 10 mm salen siempre bien; entre 10 y 30 mm salen con buen ventilador; entre 30 y 50 mm depende del filamento y de la refrigeración; a partir de 50 mm se necesita soporte.',
    risk: 'Los hilos del puente pueden descolgarse, dejando la cara inferior fea y la primera capa de encima con huecos.',
    fix: [
      `Ya está configurado para puentes: ${d.speed} mm/s y ventilador al ${d.fan} %.`,
      'Imprime antes un test de puentes (busca «bridge test» en Printables) con este mismo filamento.',
      'Si cuelga, activa el soporte en el laminador solo para esa zona (pintar soportes / bloqueador).',
      'O gira la pieza para que esa cara quede vertical.',
    ],
  }),

  enclosure: d => ({
    title: `${d.material} necesita cerramiento`,
    what: `${d.material} encoge mucho al enfriarse y suelta vapores. Se imprime a ${d.nozzle} °C de boquilla y ${d.bed} °C de cama.`,
    why: 'La Neptune 3 Pro es una impresora abierta y su hotend tiene un tubo de PTFE dentro que se degrada por encima de unos 250 °C mantenidos.',
    risk: 'Sin cerramiento las esquinas se levantan (warping) y las capas se separan (delaminación). Por encima de 250 °C el PTFE se degrada y acaba provocando atascos.',
    fix: [
      'Usa un cerramiento (aunque sea una caja de cartón o un armario de IKEA) y evita corrientes de aire.',
      'No subas de 250 °C de boquilla.',
      'Ventila la habitación mientras imprime.',
      'Si no tienes cerramiento, PETG es la alternativa resistente que funciona bien en esta máquina.',
    ],
  }),

  nozzle_02: d => ({
    title: 'Boquilla de 0,2 mm: atención a los atascos',
    what: `Con 0,2 mm se imprimen detalles finísimos (capa ${n(d.layer)} mm), pero el agujero es tan pequeño que cualquier impureza lo tapa.`,
    why: 'Elegoo recomienda boquillas de 0,4 o mayores en esta máquina.',
    risk: 'Atascos, subextrusión y tiempos de impresión muy largos.',
    fix: ['Solo PLA de buena calidad y seco.', 'Velocidad máxima 30–40 mm/s (ya aplicado).', 'Limpia la boquilla con una aguja antes de empezar.'],
  }),

  nozzle_06: d => ({
    title: 'Boquilla de 0,6 mm: límite de caudal',
    what: `Con 0,6 mm y capa de ${n(d.layer)} mm se empuja mucho plástico por segundo. La velocidad útil queda limitada a unos ${d.cap} mm/s.`,
    why: 'El hotend de serie, con tubo de PTFE, no funde más de unos 11–12 mm³/s.',
    risk: 'Si vas más rápido, el plástico no se funde a tiempo: paredes con huecos y piezas débiles.',
    fix: ['Mantén 40–50 mm/s (ya aplicado).', 'Calibra el caudal máximo en «Mi impresora» si quieres afinar.'],
  }),

  nozzle_08: d => ({
    title: 'Boquilla de 0,8 mm: caudal muy limitado',
    what: `Con 0,8 mm el límite de fusión del hotend deja la velocidad en unos ${d.cap} mm/s.`,
    why: 'El hotend con PTFE no da más caudal.',
    risk: 'Si se fuerza más velocidad aparece subextrusión.',
    fix: ['Úsala para piezas grandes y toscas o jarrones.', 'Velocidad 25–35 mm/s (ya aplicado).'],
  }),

  photo_mode: () => ({
    title: 'Confianza baja: el perfil sale de fotos',
    what: 'Con fotos la app no puede medir la pieza: no ve la cara oculta, no sabe los ángulos exactos de los voladizos, ni el grosor de las paredes, ni dónde hay puentes. Por eso la confianza parte de 40 sobre 100.',
    why: 'Incluso los modelos de IA que convierten una imagen en 3D se inventan la parte trasera y no dan medidas reales.',
    risk: 'Puede que se active soporte donde no hace falta (más tiempo y marcas) o que falte donde sí.',
    fix: [
      'Si tienes el STL/3MF, súbelo en la pestaña «Archivo 3D»: el análisis será exacto.',
      'Comprueba que las medidas reales están bien introducidas.',
      'Revisa siempre la vista previa por capas del laminador (las zonas rojas de voladizo).',
    ],
  }),

  no_fit_photo: d => ({
    title: 'Con esas medidas no cabe',
    what: `Has indicado ${d.dims.join(' × ')} mm y el volumen útil es ${d.usable.join(' × ')} mm.`,
    why: 'La Neptune 3 Pro imprime como máximo 225 × 225 × 280 mm y conviene dejar 5 mm de margen.',
    risk: 'No se podrá imprimir en una pieza.',
    fix: ['Comprueba que las medidas son correctas.', 'Gírala o escálala en el laminador.', 'Divídela en partes.'],
  }),
};

export function explainWarning(w) {
  const f = EXPLAIN[w.id];
  if (f) return f(w.data || {});
  return { title: 'Aviso', what: w.text, why: '', risk: '', fix: [] };
}

export function explainConfidence(p) {
  const lines = (p.warnings || []).filter(w => w.penalty > 0).map(w => ({ label: explainWarning(w).title, penalty: w.penalty }));
  return {
    title: `Confianza ${p.confidence}: ${p.confScore}/100`,
    base: p.confBase,
    lines,
    what: p.confBase === 100
      ? 'Se parte de 100 porque has subido el modelo 3D y la app ha podido medirlo todo. Cada problema encontrado resta puntos.'
      : 'Se parte de 40 porque el perfil se calcula con fotos y medidas, sin poder medir la geometría.',
    scale: '80–100: alta (imprime con tranquilidad) · 50–79: media (revisa los avisos) · menos de 50: baja (corrige antes de imprimir).',
  };
}
