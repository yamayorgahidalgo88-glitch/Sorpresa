import { addDays, easter, iso, nthWeekday, toIso } from './dates';
import { CalEvent, Category } from './types';

type Fixed = [month: number, day: number, title: string, info?: string];

/** Festivos nacionales (BOE), en su fecha nominal. */
const NACIONALES: Fixed[] = [
  [1, 1, 'Año Nuevo'],
  [1, 6, 'Epifanía del Señor (Reyes)'],
  [5, 1, 'Fiesta del Trabajo'],
  [8, 15, 'Asunción de la Virgen'],
  [10, 12, 'Fiesta Nacional de España'],
  [11, 1, 'Todos los Santos'],
  [12, 6, 'Día de la Constitución'],
  [12, 8, 'Inmaculada Concepción'],
  [12, 25, 'Navidad'],
];

/**
 * Calendario laboral oficial de la Comunidad de Madrid, solo lo que NO
 * coincide con un festivo nacional en su fecha nominal.
 * 2026: Decreto de la Comunidad de Madrid (BOCM sept. 2025).
 * 2027: Decreto 82/2026, de 30 de septiembre (BOCM 1 oct. 2026).
 */
const MADRID_OFICIAL: Record<number, Fixed[]> = {
  2026: [
    [4, 2, 'Jueves Santo'],
    [5, 2, 'Día de la Comunidad de Madrid'],
    [11, 2, 'Traslado de Todos los Santos'],
    [12, 7, 'Traslado del Día de la Constitución'],
  ],
  2027: [
    [3, 19, 'San José'],
    [3, 25, 'Jueves Santo'],
    [8, 16, 'Traslado de la Asunción'],
  ],
};

/** Festivos locales de Madrid capital. */
const CAPITAL: Fixed[] = [
  [5, 15, 'San Isidro (Madrid capital)'],
  [11, 9, 'Virgen de la Almudena (Madrid capital)'],
];

/** Días relacionados con la docencia, la educación y la inclusión. */
const DOCENCIA: Fixed[] = [
  [1, 4, 'Día Mundial del Braille'],
  [1, 24, 'Día Internacional de la Educación', 'Proclamado por la ONU.'],
  [1, 27, 'Día de la Memoria del Holocausto'],
  [1, 30, 'Día Escolar de la No Violencia y la Paz (DENIP)'],
  [2, 11, 'Día de la Mujer y la Niña en la Ciencia'],
  [2, 21, 'Día Internacional de la Lengua Materna'],
  [3, 8, 'Día Internacional de la Mujer'],
  [3, 14, 'Día de Pi (Matemáticas)'],
  [3, 20, 'Día Internacional de la Felicidad'],
  [3, 21, 'Día Mundial del Síndrome de Down'],
  [3, 21, 'Día Mundial de la Poesía'],
  [3, 22, 'Día Mundial del Agua'],
  [3, 27, 'Día Mundial del Teatro'],
  [4, 2, 'Día Mundial de Concienciación sobre el Autismo'],
  [4, 2, 'Día Internacional del Libro Infantil y Juvenil'],
  [4, 7, 'San Juan Bautista de La Salle (patrón de los educadores)'],
  [4, 7, 'Día Mundial de la Salud'],
  [4, 22, 'Día de la Tierra'],
  [4, 23, 'Día del Libro y Día del Idioma Español'],
  [4, 29, 'Día Internacional de la Danza'],
  [5, 2, 'Día Internacional contra el Acoso Escolar'],
  [5, 12, 'Día Escolar de las Matemáticas'],
  [5, 15, 'Día Internacional de las Familias'],
  [5, 17, 'Día de Internet'],
  [5, 17, 'Día contra la LGTBIfobia'],
  [5, 21, 'Día de la Diversidad Cultural'],
  [6, 5, 'Día Mundial del Medio Ambiente'],
  [6, 12, 'Día contra el Trabajo Infantil'],
  [6, 21, 'Día Mundial de la Música'],
  [8, 25, 'San José de Calasanz (patrón de los maestros)'],
  [9, 8, 'Día Internacional de la Alfabetización'],
  [9, 21, 'Día Internacional de la Paz'],
  [9, 23, 'Día Internacional de las Lenguas de Signos'],
  [9, 26, 'Día Europeo de las Lenguas'],
  [10, 5, 'Día Mundial de los Docentes', 'Día del Docente, proclamado por la UNESCO.'],
  [10, 8, 'Día Mundial de la Dislexia'],
  [10, 10, 'Día Mundial de la Salud Mental'],
  [10, 11, 'Día Internacional de la Niña'],
  [10, 24, 'Día de las Bibliotecas'],
  [11, 16, 'Día Internacional para la Tolerancia'],
  [11, 17, 'Día Internacional del Estudiante'],
  [11, 20, 'Día Universal de la Infancia'],
  [11, 25, 'Día contra la Violencia de Género'],
  [12, 3, 'Día Internacional de las Personas con Discapacidad'],
  [12, 10, 'Día de los Derechos Humanos'],
];

const make = (y: number, f: Fixed, category: Category, extra = ''): CalEvent => ({
  id: `${category}:${iso(y, f[0], f[1])}:${f[2]}${extra}`,
  date: iso(y, f[0], f[1]),
  title: f[2],
  category,
  info: f[3],
});

/** Si el año no tiene decreto cargado, se estima (Jueves Santo + 2 de mayo + traslado de domingos). */
function madridEstimado(y: number): Fixed[] {
  const out: Fixed[] = [];
  const jueves = addDays(easter(y), -3);
  out.push([jueves.getMonth() + 1, jueves.getDate(), 'Jueves Santo (estimado)']);
  if (new Date(y, 4, 2).getDay() !== 0) out.push([5, 2, 'Día de la Comunidad de Madrid (estimado)']);
  for (const [m, d, t] of NACIONALES) {
    if (new Date(y, m - 1, d).getDay() === 0) {
      const lun = addDays(new Date(y, m - 1, d), 1);
      out.push([lun.getMonth() + 1, lun.getDate(), `Traslado: ${t} (estimado)`]);
    }
  }
  return out;
}

const cache = new Map<number, CalEvent[]>();

export function eventsForYear(y: number): CalEvent[] {
  const hit = cache.get(y);
  if (hit) return hit;
  const list: CalEvent[] = [];

  for (const f of NACIONALES) list.push(make(y, f, 'nacional'));
  const vs = addDays(easter(y), -2);
  list.push(make(y, [vs.getMonth() + 1, vs.getDate(), 'Viernes Santo'], 'nacional'));

  for (const f of MADRID_OFICIAL[y] ?? madridEstimado(y)) list.push(make(y, f, 'madrid'));
  for (const f of CAPITAL) list.push(make(y, f, 'capital'));

  for (const f of DOCENCIA) list.push(make(y, f, 'docencia'));
  const variables: [Date, string][] = [
    [nthWeekday(y, 2, 2, 2), 'Día de Internet Segura (2.º martes de febrero)'],
    [nthWeekday(y, 10, 1, 3), 'Día de las Escritoras (3.er lunes de octubre)'],
    [nthWeekday(y, 11, 4, 3), 'Día Mundial de la Filosofía (3.er jueves de noviembre)'],
  ];
  for (const [dt, t] of variables) list.push(make(y, [dt.getMonth() + 1, dt.getDate(), t], 'docencia'));

  list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  cache.set(y, list);
  return list;
}

export const isFestivo = (e: CalEvent) =>
  e.category === 'nacional' || e.category === 'madrid' || e.category === 'capital';

export const todayIso = () => toIso(new Date());
