import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ensurePermission, sendTest } from './notifications';
import { CATEGORIES, COLORS, LABELS, UI } from './theme';
import { AppState, Category } from './types';

interface Props {
  visible: boolean;
  state: AppState;
  scheduled: number;
  onChange: (next: AppState) => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function SettingsModal({ visible, state, scheduled, onChange, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const { prefs } = state;
  const setPrefs = (p: Partial<typeof prefs>) => onChange({ ...state, prefs: { ...prefs, ...p } });

  const stepHour = (d: number) => setPrefs({ hour: (prefs.hour + d + 24) % 24 });
  const stepMinute = (d: number) => setPrefs({ minute: (prefs.minute + d + 60) % 60 });

  const test = async () => {
    setBusy(true);
    const ok = await ensurePermission();
    setBusy(false);
    if (!ok) return Alert.alert('Notificaciones desactivadas', 'Actívalas para esta app en los ajustes del móvil.');
    await sendTest();
    Alert.alert('Enviada', 'Te llegará una notificación de prueba en 5 segundos. Puedes salir de la app para verla.');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>Ajustes</Text>
          <Pressable onPress={onClose} hitSlop={12}><Text style={s.close}>Listo</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <Text style={s.section}>Hora de los avisos</Text>
          <View style={[s.card, s.timeRow]}>
            <Stepper value={pad(prefs.hour)} onMinus={() => stepHour(-1)} onPlus={() => stepHour(1)} />
            <Text style={s.colon}>:</Text>
            <Stepper value={pad(prefs.minute)} onMinus={() => stepMinute(-5)} onPlus={() => stepMinute(5)} />
          </View>

          <Text style={s.section}>Avisar el mismo día de…</Text>
          <View style={s.card}>
            {CATEGORIES.map((c: Category) => (
              <View key={c} style={s.row}>
                <View style={[s.dot, { backgroundColor: COLORS[c] }]} />
                <Text style={s.label}>{LABELS[c]}</Text>
                <Switch
                  value={prefs.sameDayByCategory[c]}
                  onValueChange={(v) => setPrefs({ sameDayByCategory: { ...prefs.sameDayByCategory, [c]: v } })}
                />
              </View>
            ))}
          </View>
          <Text style={s.muted}>
            Dentro de cada día puedes cambiar un evento concreto y pedir aviso 1, 2, 3 días, 1 o 2 semanas antes.
          </Text>

          <Text style={s.section}>Estado</Text>
          <View style={s.card}>
            <Text style={s.label}>{scheduled} avisos programados</Text>
            <Text style={s.muted}>
              El móvil limita los avisos pendientes (iOS: 64). La app programa los próximos y se renueva cada vez que la abres,
              así que ábrela de vez en cuando.
            </Text>
          </View>
          <Pressable style={s.btn} onPress={test} disabled={busy}>
            <Text style={s.btnText}>Enviar notificación de prueba</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable style={s.step} onPress={onPlus}><Text style={s.stepText}>＋</Text></Pressable>
      <Text style={s.big}>{value}</Text>
      <Pressable style={s.step} onPress={onMinus}><Text style={s.stepText}>－</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: UI.card, borderBottomWidth: 1, borderBottomColor: UI.line },
  title: { fontSize: 18, fontWeight: '700', color: UI.text },
  close: { color: UI.accent, fontSize: 16, fontWeight: '700' },
  section: { fontSize: 13, fontWeight: '700', color: UI.muted, textTransform: 'uppercase' },
  card: { backgroundColor: UI.card, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: UI.line },
  timeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  colon: { fontSize: 36, fontWeight: '700', color: UI.text },
  big: { fontSize: 36, fontWeight: '700', color: UI.text, width: 64, textAlign: 'center' },
  step: { width: 44, height: 36, borderRadius: 8, backgroundColor: UI.bg, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: UI.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { flex: 1, fontSize: 15, color: UI.text },
  muted: { color: UI.muted, fontSize: 13 },
  btn: { backgroundColor: UI.accent, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
