// Preguntas de la trama con Gemini (IA de Google, plan gratuito: solo hace falta GEMINI_API_KEY de aistudio.google.com).
// Se piden una sola vez por anime y se guardan en la base de datos (trivia_ai_bank); las partidas siguientes las reutilizan.
import { validQuestion } from './trivia-shared.js';

const BASE = () => process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
const MODELS = () => [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean);
export const geminiEnabled = () => !!process.env.GEMINI_API_KEY;

const SYSTEM = `Eres el presentador de un quiz tipo Kahoot sobre anime para dos amigos españoles.
Escribes todo en español de España (castellano).
- Preguntas sobre lo que pasa dentro del anime: momentos clave, combates y partidos (quién gana, resultados), quién hace qué, poderes, papeles en el equipo, relaciones, lugares y frases conocidas.
- Solo del ANIME (nunca de lo que solo sale en el manga o en novelas). La persona lo ha visto entero, así que vale cualquier temporada, también el final.
- Solo hechos de los que estés completamente seguro. Si dudas, no la escribas.
- Mezcla preguntas fáciles con otras más a fondo, pero siempre de cosas importantes que recuerda quien lo ha visto. Nada de números de episodio, actores de doblaje ni datos de producción.
- 4 respuestas cortas (máximo unas 8 palabras), plausibles y del mismo anime; solo una correcta. La pregunta no puede dar pistas de la respuesta.
- Nombres de personajes como en la versión original (p. ej. «Tanjiro», «Luffy»).`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING', description: 'La pregunta' },
          a: { type: 'STRING', description: 'La respuesta correcta' },
          w: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Exactamente 3 respuestas incorrectas' },
        },
        required: ['q', 'a', 'w'],
      },
    },
  },
  required: ['questions'],
};

function prompt(anime, info) {
  const names = (info?.characters || []).slice(0, 20).map((c) => c.name);
  return [
    `Anime: ${anime.title}`,
    info?.romaji && info.romaji !== anime.title ? `Título original: ${info.romaji}` : '',
    `Tipo: ${anime.kind === 'movie' ? 'película' : 'serie'}${info?.year || anime.year ? ` (${info?.year || anime.year})` : ''}`,
    names.length ? `Personajes: ${names.join(', ')}` : '',
    '',
    'Escribe 15 preguntas distintas sobre la trama de este anime. Si no conoces bien este anime, devuelve la lista vacía.',
  ].filter((x) => x !== '').join('\n');
}

/** Pide a Gemini las preguntas de un anime (formato del banco: { q, a, w }). [] = no conoce el anime; null = error (se reintenta). */
export async function geminiQuestions(anime, info, { timeoutMs = 25_000 } = {}) {
  if (!geminiEnabled()) return null;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: prompt(anime, info) }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.4 },
  });
  for (const model of MODELS()) {
    let res;
    try {
      res = await fetch(`${BASE()}/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      console.error('Quiz: Gemini no responde', e?.message || e);
      return null;
    }
    if (res.status === 404) continue; // ese modelo ya no existe: probamos el siguiente
    if (!res.ok) { console.error('Quiz: Gemini ha fallado', res.status, (await res.text()).slice(0, 300)); return null; }
    let parsed;
    try {
      const data = await res.json();
      parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}');
    } catch { return null; }
    return (parsed?.questions || [])
      .map((x) => ({ q: String(x.q || '').trim(), a: String(x.a || '').trim(), w: (Array.isArray(x.w) ? x.w : []).map((y) => String(y).trim()).slice(0, 3) }))
      .filter((x) => validQuestion({ question: x.q, options: [x.a, ...x.w], correct: 0 }))
      .slice(0, 20);
  }
  return null;
}
