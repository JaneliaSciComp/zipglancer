/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// Configurable base path so zipglancer can be deployed standalone at "/"
// or co-served by the fileglancer backend at e.g. "/zipglancer/".
// Set ZIPGLANCER_BASE=/zipglancer/ at build time for the co-served deployment.
const base = process.env.ZIPGLANCER_BASE ?? '/';

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    fs: {
      // Disable Vite's strict file-path security check. Without this, Vite 6
      // decodes the %2F-encoded slashes in the ?url= query parameter and
      // incorrectly treats the decoded value as a filesystem path to validate.
      strict: false
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: 'src/__tests__/setup.ts',
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/main.tsx']
    }
  }
});
