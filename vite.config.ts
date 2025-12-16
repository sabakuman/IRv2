import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      host: true, // Listen on all network interfaces (0.0.0.0)
      port: 5173,
    },
    preview: {
      host: true, // Listen on all network interfaces for production preview
      port: 4173,
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});