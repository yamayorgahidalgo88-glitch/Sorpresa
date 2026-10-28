import { defineConfig } from 'vitest/config';

// base relativo: el juego funciona servido desde cualquier subcarpeta (p. ej. GitHub Pages).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: { input: { main: 'index.html', referencia: 'referencia.html' } },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
