import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    sourcemap: true,
    // Three.js is lazy-loaded as a separate 3D engine chunk; keep the warning
    // threshold above that measured boundary while protecting the initial UI.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'json-summary'],
    },
  },
});
