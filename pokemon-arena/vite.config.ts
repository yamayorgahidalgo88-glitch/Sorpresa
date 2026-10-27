import { defineConfig } from 'vitest/config';

// base relativo: el juego funciona servido desde cualquier subcarpeta (p. ej. GitHub Pages).
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1600 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
