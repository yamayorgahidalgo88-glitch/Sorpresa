export type Category = 'nacional' | 'madrid' | 'capital' | 'docencia' | 'propio';

export interface CalEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: Category;
  info?: string;
}

export interface Attachment {
  id: string;
  name: string;
  uri: string;
  kind: 'image' | 'file';
}

export interface DayNote {
  text: string;
  attachments: Attachment[];
}

export interface EventSetting {
  /** null/undefined = usar el valor por defecto de la categoría */
  sameDay?: boolean;
  /** días de antelación extra, p. ej. [1, 3, 7] */
  advance: number[];
}

export interface CustomEvent {
  id: string;
  date: string;
  title: string;
}

export interface Prefs {
  hour: number;
  minute: number;
  sameDayByCategory: Record<Category, boolean>;
  visible: Record<Category, boolean>;
}

export interface AppState {
  notes: Record<string, DayNote>;
  settings: Record<string, EventSetting>;
  custom: CustomEvent[];
  prefs: Prefs;
}
