import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback object for other usages of process.env
      'process.env': JSON.stringify({
         API_KEY: env.API_KEY
      })
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});