import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000,
    },
    // Polyfill process.env for the Gemini SDK
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // If you need other process.env variables, define them here or use:
      // 'process.env': process.env 
      // (Note: passing the whole process.env object can be risky/large in some builds, 
      // but specific keys are safer).
    }
  };
});