import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Use '.' instead of process.cwd() to avoid TS errors when @types/node is missing
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env': {
        API_KEY: env.API_KEY
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});