// Preguntas del quiz generadas por Claude (solo si el proyecto tiene ANTHROPIC_API_KEY).
// Si no hay clave, o la IA tarda o falla, el servidor usa las preguntas de AniList (trivia-shared.js).
import Anthropic from '@anthropic-ai/sdk';
import { TRIVIA_COUNT, validQuestion, animeImage, triviaShuffle } from './trivia-shared.js';

const MODEL = process.env.TRIVIA_MODEL || 'claude-opus-5-5';
const EFFORT = process.env.TRIVIA_EFFORT || 'low';

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          anime: { type: 'string', description: 'Título del anime tal cual aparece en la lista' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, description: 'Exactamente 4 respuestas distintas' },
          correct: { type: 'integer', description: 'Posición (0-3) de la respuesta correcta en options' },
          image: { type: 'string', description: 'Nombre exacto de un personaje de la lista que salga en la pregunta y NO sea la respuesta, o cadena vacía' },
          fact: { type: 'string', description: 'Una frase corta que explica la respuesta' },
        },
        required: ['anime', 'question', 'options', 'correct', 'image', 'fact'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

const SYSTEM = `Eres el presentador de un quiz tipo Kahoot sobre anime para dos amigos españoles que comparten sus listas.
Escribes todo en español de España (castellano), con un tono divertido pero claro.

Cómo son las preguntas:
- Tratan sobre situaciones, momentos, personajes, poderes, relaciones, lugares y frases conocidas de la trama de cada anime: cosas que recuerda cualquiera que lo haya visto. Nada rebuscado (ni números de episodio, ni actores de doblaje, ni datos de producción).
- Solo hechos de los que estés completamente seguro. Si dudas de un detalle, haz otra pregunta.
- La persona ha visto el anime, pero puede que no haya llegado a lo último que se ha emitido: evita los giros del final y la temporada o arco más reciente.
- 4 respuestas cortas (máximo unas 8 palabras), todas plausibles y del mismo anime; solo una correcta. La pregunta no puede dar pistas de la respuesta.
- Los nombres de los personajes, como en la versión original (p. ej. «Eren», «Tanjiro», «Luffy»).
- Varía el tipo de pregunta y la posición de la respuesta correcta.`;

function prompt(animes, infos, plan) {
  const counts = new Map();
  for (const i of plan) counts.set(i, (counts.get(i) || 0) + 1);
  const blocks = [...counts.entries()].map(([i, n]) => {
    const a = animes[i], info = infos[i];
    const names = (info?.characters || []).map((c) => c.name);
    return [
      `### ${a.title}`,
      info?.romaji && info.romaji !== a.title ? `Título original: ${info.romaji}` : '',
      `Tipo: ${a.kind === 'movie' ? 'película' : 'serie'}${info?.year || a.year ? ` · ${info?.year || a.year}` : ''}`,
      names.length ? `Personajes (para el campo image): ${names.join(', ')}` : 'Personajes: (sin lista; deja image vacío)',
      `Preguntas que quiero de este anime: ${n}`,
    ].filter(Boolean).join('\n');
  });
  return `Prepara exactamente ${plan.length} preguntas en total, repartidas así:\n\n${blocks.join('\n\n')}\n\n` +
    'En «anime» pon el título tal cual aparece tras ###. En «image», el nombre exacto de un personaje de su lista que aparezca en la pregunta pero que no sea la respuesta (para enseñar su foto); si no hay ninguno, deja la cadena vacía y se usará una imagen del anime.';
}

/** Pide las preguntas a Claude. Devuelve [] si no se puede (sin clave, error o respuesta rara). */
export async function aiTrivia(animes, infos, plan) {
  if (!aiEnabled()) return [];
  const client = new Anthropic({ timeout: 45_000, maxRetries: 0 });
  let res;
  try {
    res = await client.messages.create({
      model: MODEL,
      max_tokens: 12000,
      system: SYSTEM,
      output_config: { effort: EFFORT, format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: prompt(animes, infos, plan) }],
    });
  } catch (e) {
    console.error('Quiz: la IA ha fallado', e?.status || '', e?.message || e);
    return [];
  }
  if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') return [];
  const text = res.content.find((b) => b.type === 'text')?.text;
  let parsed;
  try { parsed = JSON.parse(text); } catch { return []; }
  const byTitle = new Map(animes.map((a, i) => [a.title.trim().toLowerCase(), i]));
  const out = [];
  for (const q of parsed?.questions || []) {
    if (!validQuestion(q)) continue;
    const idx = byTitle.get(String(q.anime || '').trim().toLowerCase());
    const a = idx == null ? null : animes[idx];
    const info = idx == null ? null : infos[idx];
    const right = q.options[q.correct];
    // Foto del personaje que sale en la pregunta, salvo que sea justo la respuesta
    const ch = info?.characters?.find((c) => c.name.toLowerCase() === String(q.image || '').trim().toLowerCase());
    const givesAway = ch && right.toLowerCase().includes(ch.name.split(' ')[0].toLowerCase());
    // Mezclamos las opciones aquí: así la correcta no cae siempre en el mismo sitio
    const options = triviaShuffle(q.options);
    out.push({
      anime: a?.title || String(q.anime).slice(0, 120),
      question: q.question.trim(),
      options,
      correct: options.indexOf(right),
      image: ch && !givesAway ? ch.image : a ? animeImage(a, info) : null,
      fact: String(q.fact || '').trim().slice(0, 300),
    });
  }
  return out.slice(0, TRIVIA_COUNT);
}
