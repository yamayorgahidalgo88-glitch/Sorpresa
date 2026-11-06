// Estado del local en la cabecera: «Abierto · Cierra a las 14:00» o
// «Cerrado · Abre mañana a las 10:00». Se calcula con la hora de Madrid,
// sea cual sea la zona horaria del móvil del visitante.

// Horario semanal (0 = domingo … 6 = sábado). Si cambia, se toca solo aquí
// y en el JSON-LD de index.html (openingHoursSpecification).
const HOURS = {
  0: [],
  1: [['10:00', '14:00'], ['15:00', '21:00']],
  2: [['10:00', '14:00'], ['15:00', '21:00']],
  3: [['10:00', '14:00'], ['15:00', '21:00']],
  4: [['10:00', '14:00'], ['15:00', '21:00']],
  5: [['10:00', '14:00'], ['15:00', '21:00']],
  6: [['10:00', '14:00'], ['15:00', '21:00']],
};

const DAY_NAMES = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function madridNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return { day: WEEKDAY[parts.weekday], min: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function hoursStatus({ day, min } = madridNow()) {
  for (const [from, to] of HOURS[day]) {
    if (min >= toMin(from) && min < toMin(to)) {
      return { open: true, state: 'Abierto', next: `Cierra a las ${to}` };
    }
  }
  // Cerrado: buscamos la próxima apertura, hoy más tarde o en los próximos días
  for (let ahead = 0; ahead < 7; ahead++) {
    const d = (day + ahead) % 7;
    const slot = HOURS[d].find(([from]) => ahead > 0 || toMin(from) > min);
    if (!slot) continue;
    const when = ahead === 0 ? '' : ahead === 1 ? 'mañana ' : `${DAY_NAMES[d]} `;
    return { open: false, state: 'Cerrado', next: `Abre ${when}a las ${slot[0]}` };
  }
  return { open: false, state: 'Cerrado', next: '' };
}

export function initHours() {
  const el = document.getElementById('hours');
  if (!el) return;
  const state = el.querySelector('.hours__label');
  const next = el.querySelector('.hours__next');
  const paint = () => {
    const s = hoursStatus();
    el.classList.toggle('is-open', s.open);
    state.textContent = s.state;
    next.textContent = s.next;
    el.hidden = false;
  };
  paint();
  setInterval(paint, 30_000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && paint());
}
