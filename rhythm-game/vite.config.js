import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite servir el build desde cualquier subcarpeta (p. ej. GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true },
});
