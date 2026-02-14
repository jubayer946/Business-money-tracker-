import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext'
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: true,
    port: 3000
  }
});