"use strict";
// ---------- logros ----------
const ACH = [
  ['pueblo', '🏕', 'Primeros pasos', 'Funda tu primer pueblo.', () => kingdoms.some(k => k.alive)],
  ['reino', '🏰', 'Un reino', 'Un pueblo crece hasta ser un reino.', () => kingdoms.some(k => k.alive && k.rank >= 1)],
  ['imperio', '👑', 'Imperio', 'Un reino se convierte en imperio.', () => kingdoms.some(k => k.alive && k.rank >= 2)],
  ['mil', '👥', 'Mil almas', 'Mil habitantes vivos a la vez.', () => civPop >= 1000],
  ['bronce', '🔔', 'Edad del Bronce', 'Un pueblo llega a la Edad del Bronce.', () => kingdoms.some(k => k.era >= 2)],
  ['hierro', '⚔', 'Edad del Hierro', 'Un pueblo forja hierro.', () => kingdoms.some(k => k.era >= 3)],
  ['industria', '🏭', 'Revolución industrial', 'Un pueblo entra en la Era Industrial.', () => kingdoms.some(k => k.era >= 6)],
  ['moderna', '🌆', 'Mundo moderno', 'Un pueblo llega a la Era Moderna.', () => kingdoms.some(k => k.era >= 7)],
  ['guerra', '🔥', 'Primera guerra', 'Dos pueblos entran en guerra.', () => kingdoms.some(k => k.alive && k.wars.size)],
  ['heroe', '⭐', 'Nace un héroe', 'Alguien se convierte en héroe.', () => units.some(u => u.hero)],
  ['leyenda', '🌟', 'Leyenda viva', 'Un héroe alcanza el rango de Leyenda.', () => units.some(u => u.level >= 12)],
  ['fe', '🙏', 'Fe', 'Nace la primera religión.', () => religions.length > 0],
  ['barco', '⛵', 'Hacia el horizonte', 'Un pueblo bota su primer barco.', () => units.some(u => u.def.boat)],
  ['mercado', '💰', 'Comercio', 'Una ciudad levanta un mercado.', () => cities.some(c => c && c.alive && c.has?.[B.MARKET])],
  ['bodas', '💞', 'Amor eterno', 'Cien parejas vivas a la vez.', () => { let n = 0; for (const u of units) if (u.partner) n++; return n >= 200; }],
  ['siglo', '📜', 'Un siglo', 'Tu mundo cumple cien años.', () => year() >= 100],
  ['milenio', '🏛', 'Diez siglos', 'Tu mundo cumple mil años.', () => year() >= 1000],
  ['dragones', '🐉', 'Era de dragones', 'Hay dragones en el mundo.', () => units.some(u => u.type === 'dragon')],
  ['zombis', '🧟', 'Apocalipsis', 'Cincuenta zombis a la vez.', () => (countType.zombie || 0) >= 50],
  ['rebelion', '✊', 'Rebelión', 'Una ciudad se independiza.', null],
  ['dinastia', '🗝', 'Cambio de dinastía', 'Una nueva casa llega al trono.', null],
  ['nuclear', '☢', 'Destructor de mundos', 'Lanza una bomba nuclear.', null],
  ['rasgo', '🧪', 'Diseñador de almas', 'Crea un rasgo propio.', null],
  ['especie', '🧬', 'Creador de especies', 'Crea una especie propia.', null],
  ['iman', '🧲', 'Mudanza divina', 'Lleva a alguien con el imán a otra tierra.', null],
];
let achDone = {};
try { achDone = JSON.parse(localStorage.getItem('caja-de-dioses-logros') || '{}') || {}; } catch (e) { achDone = {}; }
function unlock(id) {
  if (achDone[id]) return;
  const a = ACH.find(x => x[0] === id); if (!a) return;
  achDone[id] = Date.now();
  try { localStorage.setItem('caja-de-dioses-logros', JSON.stringify(achDone)); } catch (e) { }
  achToast(a);
}
function checkAch() { for (const a of ACH) if (a[4] && !achDone[a[0]]) { try { if (a[4]()) unlock(a[0]); } catch (e) { } } }
function achToast(a) {
  const el = document.getElementById('ach');
  el.innerHTML = `<span>${a[1]}</span><div><small>Logro conseguido</small><b>${esc(a[2])}</b></div>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  sfx('hero', undefined, undefined, 1, 0);
  clearTimeout(achToast.t); achToast.t = setTimeout(() => el.classList.remove('show'), 3800);
}
function achHtml() {
  const n = ACH.filter(a => achDone[a[0]]).length;
  return `<h3 class="mh">Logros <small style="color:var(--muted);font-family:var(--f-body);font-size:13px">${n} de ${ACH.length}</small></h3><div class="achs">${ACH.map(a => `<div class="${achDone[a[0]] ? 'on' : ''}" title="${esc(a[3])}"><span>${achDone[a[0]] ? a[1] : '🔒'}</span><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div>`).join('')}</div>`;
}
