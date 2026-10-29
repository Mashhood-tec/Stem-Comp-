import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { aiApiPlugin } from './server/aiApiPlugin';

export default defineConfig(({ mode }) => {
  // Loads every variable from .env files for server-side use only. Only VITE_-prefixed
  // variables are ever exposed to the browser bundle, so the AI key never reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), aiApiPlugin(env)],
    server: { port: 5173 },
    preview: { port: 4173 },
  };
});
