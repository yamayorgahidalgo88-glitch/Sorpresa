import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, parseIso, toIso } from './dates';
import { eventsForYear } from './events';
import { AppState, CalEvent } from './types';

const CHANNEL = 'efemerides';
/** iOS solo conserva 64 avisos locales pendientes; se reprograman al abrir la app. */
const MAX_SCHEDULED = 60;

export const ADVANCE_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: '1 día antes' },
  { days: 2, label: '2 días antes' },
  { days: 3, label: '3 días antes' },
  { days: 7, label: '1 semana antes' },
  { days: 14, label: '2 semanas antes' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Días señalados',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export function allEvents(state: AppState, fromYear: number, toYear: number): CalEvent[] {
  const out: CalEvent[] = [];
  for (let y = fromYear; y <= toYear; y++) out.push(...eventsForYear(y));
  for (const c of state.custom) out.push({ id: c.id, date: c.date, title: c.title, category: 'propio' });
  return out;
}

export function sameDayEnabled(state: AppState, e: CalEvent): boolean {
  return state.settings[e.id]?.sameDay ?? state.prefs.sameDayByCategory[e.category];
}

function leadText(days: number): string {
  if (days === 1) return 'Mañana';
  if (days === 7) return 'En 1 semana';
  if (days === 14) return 'En 2 semanas';
  return `En ${days} días`;
}

interface Planned {
  when: Date;
  title: string;
  body: string;
  date: string;
}

export function planNotifications(state: AppState, now = new Date()): Planned[] {
  const { hour, minute } = state.prefs;
  const y = now.getFullYear();
  const horizon = addDays(now, 400);
  const planned: Planned[] = [];

  for (const e of allEvents(state, y, y + 2)) {
    const day = parseIso(e.date);
    const offsets = new Set<number>(state.settings[e.id]?.advance ?? []);
    if (sameDayEnabled(state, e)) offsets.add(0);
    for (const off of offsets) {
      const when = addDays(day, -off);
      when.setHours(hour, minute, 0, 0);
      if (when <= now || when > horizon) continue;
      planned.push({
        when,
        date: e.date,
        title: off === 0 ? `Hoy es: ${e.title}` : `${leadText(off)}: ${e.title}`,
        body: off === 0 ? 'Toca para ver tus notas de este día.' : `Será el ${day.getDate()}/${day.getMonth() + 1}.`,
      });
    }
  }
  planned.sort((a, b) => a.when.getTime() - b.when.getTime());
  return planned.slice(0, MAX_SCHEDULED);
}

/** Cancela todo y vuelve a programar los próximos avisos. Devuelve cuántos quedaron. */
export async function reschedule(state: AppState): Promise<number> {
  const ok = await ensurePermission();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!ok) return 0;
  const plan = planNotifications(state);
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: p.title, body: p.body, data: { date: p.date } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.when,
        channelId: CHANNEL,
      },
    });
  }
  return plan.length;
}

export async function sendTest(): Promise<void> {
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Hoy es: Día Mundial de los Docentes', body: 'Así te llegarán los avisos 🎓', data: { date: toIso(new Date()) } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL },
  });
}
