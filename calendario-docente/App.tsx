import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DayModal from './src/DayModal';
import SettingsModal from './src/SettingsModal';
import { MONTHS, WEEKDAYS, iso, longDate } from './src/dates';
import { allEvents, reschedule } from './src/notifications';
import { isFestivo, todayIso } from './src/events';
import { defaultState, loadState, saveState } from './src/storage';
import { CATEGORIES, COLORS, LABELS, UI } from './src/theme';
import { AppState, CalEvent } from './src/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const now = new Date();
  const [state, setState] = useState<AppState>(defaultState());
  const [loaded, setLoaded] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [day, setDay] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [scheduled, setScheduled] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      setLoaded(true);
    });
  }, []);

  // Guardar y reprogramar avisos tras cada cambio (con pequeña espera).
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      saveState(state);
      reschedule(state).then(setScheduled).catch(() => setScheduled(0));
    }, 800);
    return () => clearTimeout(t);
  }, [state, loaded]);

  // Renovar la ventana de avisos al volver a la app y abrir el día al tocar un aviso.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (st) => {
      if (st === 'active' && loaded) reschedule(stateRef.current).then(setScheduled).catch(() => {});
    });
    const tap = Notifications.addNotificationResponseReceivedListener((r) => {
      const d = r.notification.request.content.data?.date;
      if (typeof d === 'string') {
        setYear(Number(d.slice(0, 4)));
        setMonth(Number(d.slice(5, 7)) - 1);
        setDay(d);
      }
    });
    return () => {
      sub.remove();
      tap.remove();
    };
  }, [loaded]);

  const events = useMemo(() => allEvents(state, year - 1, year + 1), [state.custom, year]);
  const byDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) if (state.prefs.visible[e.category]) (map[e.date] ||= []).push(e);
    return map;
  }, [events, state.prefs.visible]);

  const today = todayIso();
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // lunes primero
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const go = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const monthList = Object.keys(byDate)
    .filter((d) => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .sort();

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Pressable onPress={() => go(-1)} hitSlop={12}><Text style={s.arrow}>‹</Text></Pressable>
        <Pressable onPress={goToday} style={{ flex: 1 }}>
          <Text style={s.month}>{MONTHS[month]} {year}</Text>
        </Pressable>
        <Pressable onPress={() => go(1)} hitSlop={12}><Text style={s.arrow}>›</Text></Pressable>
        <Pressable onPress={() => setShowSettings(true)} hitSlop={12}><Text style={s.gear}>⚙️</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {CATEGORIES.map((c) => {
            const on = state.prefs.visible[c];
            return (
              <Pressable
                key={c}
                onPress={() => setState({ ...state, prefs: { ...state.prefs, visible: { ...state.prefs.visible, [c]: !on } } })}
                style={[s.filter, { borderColor: COLORS[c] }, on && { backgroundColor: COLORS[c] }]}
              >
                <Text style={[s.filterText, on && { color: '#fff' }]}>{LABELS[c]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.grid}>
          <View style={s.weekRow}>
            {WEEKDAYS.map((w) => <Text key={w} style={s.weekday}>{w}</Text>)}
          </View>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <View key={r} style={s.weekRow}>
              {cells.slice(r * 7, r * 7 + 7).map((n, i) => {
                if (!n) return <View key={i} style={s.cell} />;
                const id = iso(year, month + 1, n);
                const evs = byDate[id] ?? [];
                const festivo = evs.some(isFestivo) || i === 6;
                const hasNote = !!(state.notes[id]?.text || state.notes[id]?.attachments.length);
                return (
                  <Pressable key={i} style={[s.cell, id === today && s.today]} onPress={() => setDay(id)}>
                    <Text style={[s.num, festivo && { color: COLORS.nacional }, id === today && s.numToday]}>{n}</Text>
                    <View style={s.dots}>
                      {[...new Set(evs.map((e) => e.category))].slice(0, 4).map((c) => (
                        <View key={c} style={[s.dotSm, { backgroundColor: COLORS[c] }]} />
                      ))}
                    </View>
                    {hasNote && <Text style={s.noteMark}>✎</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={s.listTitle}>Este mes</Text>
        {monthList.length === 0 && <Text style={s.empty}>Nada señalado este mes con los filtros actuales.</Text>}
        {monthList.map((d) =>
          byDate[d].map((e) => (
            <Pressable key={e.id} style={s.item} onPress={() => setDay(d)}>
              <Text style={s.itemDay}>{Number(d.slice(8))}</Text>
              <View style={[s.dotSm, { backgroundColor: COLORS[e.category] }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle}>{e.title}</Text>
                <Text style={s.itemSub}>{longDate(d)}</Text>
              </View>
            </Pressable>
          )),
        )}
      </ScrollView>

      <DayModal
        date={day}
        events={day ? (events.filter((e) => e.date === day)) : []}
        state={state}
        onChange={setState}
        onClose={() => setDay(null)}
      />
      <SettingsModal visible={showSettings} state={state} scheduled={scheduled} onChange={setState} onClose={() => setShowSettings(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 10 },
  arrow: { fontSize: 34, color: UI.accent, lineHeight: 36 },
  gear: { fontSize: 22 },
  month: { fontSize: 22, fontWeight: '800', color: UI.text, textAlign: 'center' },
  filters: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  filter: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  filterText: { fontSize: 12, fontWeight: '600', color: UI.text },
  grid: { marginHorizontal: 8, backgroundColor: UI.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: UI.line },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingVertical: 6, color: UI.muted, fontWeight: '700', fontSize: 12 },
  cell: { flex: 1, aspectRatio: 0.85, alignItems: 'center', paddingTop: 6, borderRadius: 8 },
  today: { backgroundColor: '#E8EAF6' },
  num: { fontSize: 15, color: UI.text, fontWeight: '600' },
  numToday: { color: UI.accent, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 3, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' },
  dotSm: { width: 7, height: 7, borderRadius: 4 },
  noteMark: { position: 'absolute', bottom: 2, right: 4, fontSize: 11, color: UI.muted },
  listTitle: { fontSize: 13, fontWeight: '700', color: UI.muted, textTransform: 'uppercase', marginTop: 16, marginHorizontal: 16 },
  empty: { color: UI.muted, marginHorizontal: 16, marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: UI.card, marginHorizontal: 12, marginTop: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: UI.line },
  itemDay: { width: 28, fontSize: 17, fontWeight: '800', color: UI.text, textAlign: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: UI.text },
  itemSub: { fontSize: 12, color: UI.muted, textTransform: 'capitalize' },
});
