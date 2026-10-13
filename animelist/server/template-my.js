// "ANIME LIST: M&Y" — la lista original (PDF). Columnas: Marta (azul) y Yago (verde).
// together = estaba en negrita ("ver juntos"). m/y = [visto, nota] de Marta / Yago.
export const TEMPLATE_NAME = 'ANIME LIST: M&Y';
export const TEMPLATE_PEOPLE = [
  { name: 'Marta', color: '#5b9bd5' },
  { name: 'Yago', color: '#8bc34a' },
];

const S = 'Crunchyroll', N = 'Netflix', ES = 'Español', JA = 'Japonés';
// [título, duración, plataforma, idioma, juntos, [vistoM, notaM], [vistoY, notaY], jwId]
export const TEMPLATE_ROWS = [
  ['Hunter X Hunter', '148 cap', N, ES, 0, [0, null], [1, 8], 'ts32835'],
  ['Blue Lock', '39 cap', S, ES, 0, [1, null], [1, 9.25], 'ts304470'],
  ['Kimetsu No Yaiba', '52 cap', N, ES, 1, [1, 9], [1, 10], 'ts87466'],
  ['Kimetsu No Yaiba: Infinity Castle', 'Película', S, JA, 1, [1, null], [1, null], 'tm1572695'],
  ['Solo Leveling', '26 cap', S, ES, 1, [1, 9], [1, 9], 'ts359486'],
  ['One Punch Man', '38 cap', S, ES, 0, [0, null], [1, 4], 'ts37539'],
  ['Jujutsu Kaisen', '59 cap', S, ES, 0, [0, null], [0, null], 'ts222852'],
  ['Jujutsu Kaisen 0', 'Película', S, ES, 0, [0, null], [0, null], 'tm1040315'],
  ['Gachiakuta', '24 cap', S, ES, 0, [0, null], [0, 8.5], 'ts437012'],
  ['My Hero Academy', '179 cap', S, ES, 0, [0, null], [1, 10], 'ts38725'],
  ['My Hero Academy: Vigilantes', '26 cap', S, ES, 0, [0, null], [0, null], 'ts463891'],
  ['My Hero Academy: You’re Next', 'Película', S, ES, 0, [0, null], [0, null], 'tm1477261'],
  ['Assassination Classroom', '47 cap', N, ES, 0, [0, null], [0, null], 'ts21984'],
  ['Naruto', '220 cap', S, ES, 1, [0, 7], [0, 7.5], 'ts20305'],
  ['Naruto Shippuden', '500 cap', S, ES, 1, [0, 7], [0, null], 'ts22069'],
  ['Dan Da Dan', '24 cap', S, ES, 1, [0, null], [0, null], 'ts413191'],
  ['Death Note', '37 cap', S, ES, 0, [0, null], [1, 6.75], 'ts11313'],
  ['Haikyu', '91 cap', S, ES, 1, [1, 8.75], [1, 8.75], 'ts20112'],
  ['Chainsaw Man', '14 cap', S, ES, 0, [0, null], [1, null], 'ts269483'],
  ['Kuroko No Basket', '78 cap', N, JA, 0, [0, null], [1, 8.25], 'ts22249'],
  ['Vinland Saga', '48 cap', S, ES, 0, [0, null], [1, 7.75], 'ts90311'],
  ['Tokyo Goul', '48 cap', N, ES, 1, [1, null], [0, null], 'ts20202'],
  ['Record Of Ragnarok', '32 cap', N, ES, 0, [0, null], [0, null], 'ts269881'],
  ['ReZero', '57 cap', S, ES, 0, [0, null], [0, null], 'ts41257'],
  ['Black Cover', '171 cap', S, ES, 0, [0, null], [0, null], 'ts296797'],
  ['That Time I Got Reincarnated As A Slime', '86 cap', S, ES, 0, [0, null], [0, null], 'ts84230'],
  ['That Time I Got Reincarnated As A Slime: El vínculo escarlata', 'Película', S, ES, 0, [0, null], [0, null], 'tm1218957'],
  ['That Time I Got Reincarnated As A Slime: Lágrimas del mar azul', 'Película', S, ES, 0, [0, null], [0, null], 'tm1661497'],
  ['Kaiju No.8', '25 cap', S, ES, 0, [0, null], [0, null], 'ts365566'],
  ['Spy X Family', '50 cap', S, ES, 1, [0, null], [0, null], 'ts283022'],
  ['Full Metal Alchemist', '51 cap', N, ES, 0, [0, null], [0, null], 'ts21482'],
  ['Attack On Titan', '73 cap', S, ES, 0, [0, null], [0, null], 'ts20682'],
];
