import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import { createManifest } from './manifest.config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const manifest = createManifest(env.VITE_OAUTH_CLIENT_ID ?? '');

  return {
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // crxjs handles popup + options automatically (they're declared in the manifest).
    // The dashboard lives in web_accessible_resources, so it must be an explicit entry.
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'src/pages/dashboard/index.html'),
      },
    },
    target: 'es2022',
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  };
});
