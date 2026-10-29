import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { longDate } from './dates';
import { ADVANCE_OPTIONS, sameDayEnabled } from './notifications';
import { COLORS, LABELS, UI } from './theme';
import { AppState, Attachment, CalEvent } from './types';

interface Props {
  date: string | null;
  events: CalEvent[];
  state: AppState;
  onChange: (next: AppState) => void;
  onClose: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Copia el archivo a la carpeta de documentos de la app para que no se pierda. */
function persist(srcUri: string, name: string): string {
  const safe = `${uid()}-${name.replace(/[^\w.\-]+/g, '_')}`;
  const dest = new File(Paths.document, safe);
  new File(srcUri).copy(dest);
  return dest.uri;
}

export default function DayModal({ date, events, state, onChange, onClose }: Props) {
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  if (!date) return null;

  const note = state.notes[date] ?? { text: '', attachments: [] };
  const setNote = (n: typeof note) => onChange({ ...state, notes: { ...state.notes, [date]: n } });

  const toggleAdvance = (ev: CalEvent, days: number) => {
    const cur = state.settings[ev.id] ?? { advance: [] };
    const advance = cur.advance.includes(days) ? cur.advance.filter((d) => d !== days) : [...cur.advance, days].sort((a, b) => a - b);
    onChange({ ...state, settings: { ...state.settings, [ev.id]: { ...cur, advance } } });
  };

  const setSameDay = (ev: CalEvent, v: boolean) => {
    const cur = state.settings[ev.id] ?? { advance: [] };
    onChange({ ...state, settings: { ...state.settings, [ev.id]: { ...cur, sameDay: v } } });
  };

  const addCustom = () => {
    const title = newTitle.trim();
    if (!title) return;
    onChange({ ...state, custom: [...state.custom, { id: `propio:${uid()}`, date, title }] });
    setNewTitle('');
  };

  const removeCustom = (id: string) => {
    const { [id]: _drop, ...rest } = state.settings;
    onChange({ ...state, custom: state.custom.filter((c) => c.id !== id), settings: rest });
  };

  const addImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permiso necesario', 'Permite el acceso a tus fotos para adjuntarlas.');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (res.canceled) return;
      const a = res.assets[0];
      const att: Attachment = { id: uid(), name: a.fileName ?? 'foto.jpg', uri: persist(a.uri, a.fileName ?? 'foto.jpg'), kind: 'image' };
      setNote({ ...note, attachments: [...note.attachments, att] });
    } catch (e) {
      Alert.alert('No se pudo adjuntar la imagen', String(e));
    }
  };

  const addFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (res.canceled) return;
      const a = res.assets[0];
      const att: Attachment = { id: uid(), name: a.name, uri: persist(a.uri, a.name), kind: 'file' };
      setNote({ ...note, attachments: [...note.attachments, att] });
    } catch (e) {
      Alert.alert('No se pudo adjuntar el archivo', String(e));
    }
  };

  const openAttachment = async (a: Attachment) => {
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(a.uri);
    } catch (e) {
      Alert.alert('No se pudo abrir', String(e));
    }
  };

  const removeAttachment = (a: Attachment) =>
    Alert.alert('Quitar adjunto', a.name, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          try { new File(a.uri).delete(); } catch { /* ya no existía */ }
          setNote({ ...note, attachments: note.attachments.filter((x) => x.id !== a.id) });
        },
      },
    ]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.header}>
            <Text style={s.title}>{longDate(date)}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Text style={s.close}>Listo</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
            <Text style={s.section}>Este día</Text>
            {events.length === 0 && <Text style={s.muted}>No hay festivos ni días señalados. Puedes añadir uno propio abajo.</Text>}
            {events.map((ev) => {
              const open = openEvent === ev.id;
              const adv = state.settings[ev.id]?.advance ?? [];
              const summary = [sameDayEnabled(state, ev) ? 'el mismo día' : null, ...ADVANCE_OPTIONS.filter((o) => adv.includes(o.days)).map((o) => o.label)]
                .filter(Boolean).join(' · ');
              return (
                <View key={ev.id} style={s.card}>
                  <Pressable onPress={() => setOpenEvent(open ? null : ev.id)} style={s.evRow}>
                    <View style={[s.dot, { backgroundColor: COLORS[ev.category] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.evTitle}>{ev.title}</Text>
                      <Text style={s.muted}>{LABELS[ev.category]}</Text>
                      {ev.info ? <Text style={s.muted}>{ev.info}</Text> : null}
                      <Text style={s.bell}>🔔 {summary || 'sin aviso'}</Text>
                    </View>
                    <Text style={s.chev}>{open ? '▲' : '▼'}</Text>
                  </Pressable>
                  {open && (
                    <View style={s.reminders}>
                      <View style={s.switchRow}>
                        <Text style={s.evTitle}>Avisarme el mismo día</Text>
                        <Switch value={sameDayEnabled(state, ev)} onValueChange={(v) => setSameDay(ev, v)} />
                      </View>
                      <Text style={s.muted}>Avisarme también antes:</Text>
                      <View style={s.chips}>
                        {ADVANCE_OPTIONS.map((o) => {
                          const on = adv.includes(o.days);
                          return (
                            <Pressable key={o.days} onPress={() => toggleAdvance(ev, o.days)} style={[s.chip, on && s.chipOn]}>
                              <Text style={[s.chipText, on && s.chipTextOn]}>{o.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {ev.category === 'propio' && (
                        <Pressable onPress={() => removeCustom(ev.id)}><Text style={s.danger}>Eliminar este evento</Text></Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            <View style={s.addRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Añadir evento propio…"
                value={newTitle}
                onChangeText={setNewTitle}
                onSubmitEditing={addCustom}
                returnKeyType="done"
              />
              <Pressable style={s.btn} onPress={addCustom}><Text style={s.btnText}>Añadir</Text></Pressable>
            </View>

            <Text style={s.section}>Mis notas</Text>
            <TextInput
              style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]}
              multiline
              placeholder="Escribe lo que quieras para este día…"
              value={note.text}
              onChangeText={(text) => setNote({ ...note, text })}
            />

            <Text style={s.section}>Adjuntos</Text>
            <View style={s.addRow}>
              <Pressable style={s.btn} onPress={addImage}><Text style={s.btnText}>📷 Foto</Text></Pressable>
              <Pressable style={s.btn} onPress={addFile}><Text style={s.btnText}>📎 Archivo</Text></Pressable>
            </View>
            {note.attachments.map((a) => (
              <Pressable key={a.id} style={s.card} onPress={() => openAttachment(a)} onLongPress={() => removeAttachment(a)}>
                {a.kind === 'image' && <Image source={{ uri: a.uri }} style={s.thumb} resizeMode="cover" />}
                <Text style={s.evTitle}>{a.kind === 'image' ? '🖼️' : '📄'} {a.name}</Text>
                <Text style={s.muted}>Toca para abrir · mantén pulsado para quitar</Text>
              </Pressable>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: UI.card, borderBottomWidth: 1, borderBottomColor: UI.line },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: UI.text, textTransform: 'capitalize' },
  close: { color: UI.accent, fontSize: 16, fontWeight: '700', marginLeft: 12 },
  section: { fontSize: 13, fontWeight: '700', color: UI.muted, textTransform: 'uppercase', marginTop: 8 },
  muted: { color: UI.muted, fontSize: 13 },
  card: { backgroundColor: UI.card, borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: UI.line },
  evRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  evTitle: { fontSize: 15, fontWeight: '600', color: UI.text },
  bell: { fontSize: 13, color: UI.accent, marginTop: 4 },
  chev: { color: UI.muted, fontSize: 12 },
  reminders: { gap: 10, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: UI.line },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: UI.line, backgroundColor: UI.bg },
  chipOn: { backgroundColor: UI.accent, borderColor: UI.accent },
  chipText: { color: UI.text, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  danger: { color: '#C62828', fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { backgroundColor: UI.card, borderRadius: 10, borderWidth: 1, borderColor: UI.line, padding: 12, fontSize: 15, color: UI.text },
  btn: { backgroundColor: UI.accent, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  thumb: { width: '100%', height: 180, borderRadius: 8 },
});
