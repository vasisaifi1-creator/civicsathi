import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019', // wider support for low-end / older Android browsers
    sourcemap: false,
  },
});
