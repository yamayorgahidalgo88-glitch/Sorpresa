import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from './types';

const KEY = 'calendario-docente:v1';

export const defaultState = (): AppState => ({
  notes: {},
  settings: {},
  custom: [],
  prefs: {
    hour: 8,
    minute: 0,
    sameDayByCategory: { nacional: true, madrid: true, capital: true, docencia: true, propio: true },
    visible: { nacional: true, madrid: true, capital: true, docencia: true, propio: true },
  },
});

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const d = defaultState();
    return {
      ...d,
      ...parsed,
      prefs: {
        ...d.prefs,
        ...parsed.prefs,
        sameDayByCategory: { ...d.prefs.sameDayByCategory, ...parsed.prefs?.sameDayByCategory },
        visible: { ...d.prefs.visible, ...parsed.prefs?.visible },
      },
    };
  } catch {
    return defaultState();
  }
}

export async function saveState(s: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // sin espacio o sin acceso: no se puede hacer más
  }
}
