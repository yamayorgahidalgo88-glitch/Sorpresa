import { Category } from './types';

export const COLORS: Record<Category, string> = {
  nacional: '#D32F2F',
  madrid: '#EF6C00',
  capital: '#AD1457',
  docencia: '#1565C0',
  propio: '#2E7D32',
};

export const LABELS: Record<Category, string> = {
  nacional: 'Festivo nacional',
  madrid: 'Festivo Madrid',
  capital: 'Festivo Madrid capital',
  docencia: 'Docencia',
  propio: 'Mis eventos',
};

export const CATEGORIES = Object.keys(COLORS) as Category[];

export const UI = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#1B1F2A',
  muted: '#6B7280',
  line: '#E5E7EB',
  accent: '#3949AB',
};
