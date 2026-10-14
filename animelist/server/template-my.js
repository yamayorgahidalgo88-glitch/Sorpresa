// Animes para ver juntos (los que estaban en negrita en el PDF "ANIME LIST: M&Y").
// Columnas: Marta (azul) y Yago (verde). m/y = [visto, nota] de Marta / Yago.
export const TEMPLATE_NAME = 'Animes para ver juntos';
export const TEMPLATE_PEOPLE = [
  { name: 'Marta', color: '#5b9bd5' },
  { name: 'Yago', color: '#8bc34a' },
];

const S = 'Crunchyroll', N = 'Netflix', ES = 'Español', JA = 'Japonés';
// [título, duración, plataforma, idioma, [vistoM, notaM], [vistoY, notaY], jwId]
export const TEMPLATE_ROWS = [
  ['Kimetsu No Yaiba', '52 cap', N, ES, [1, 9], [1, 10], 'ts87466'],
  ['Kimetsu No Yaiba: Infinity Castle', 'Película', S, JA, [1, null], [1, null], 'tm1572695'],
  ['Solo Leveling', '26 cap', S, ES, [1, 9], [1, 9], 'ts359486'],
  ['Naruto', '220 cap', S, ES, [0, 7], [0, 7.5], 'ts20305'],
  ['Naruto Shippuden', '500 cap', S, ES, [0, 7], [0, null], 'ts22069'],
  ['Dan Da Dan', '24 cap', S, ES, [0, null], [0, null], 'ts413191'],
  ['Haikyu', '91 cap', S, ES, [1, 8.75], [1, 8.75], 'ts20112'],
  ['Tokyo Goul', '48 cap', N, ES, [1, null], [0, null], 'ts20202'],
  ['Spy X Family', '50 cap', S, ES, [0, null], [0, null], 'ts283022'],
];
