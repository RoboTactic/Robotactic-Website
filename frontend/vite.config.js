import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'cloudflare' ? [cloudflare()] : [])],
  ...(mode === 'cloudflare' ? { define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api') } } : {}),
  build: { commonjsOptions: { include: [/node_modules/, /backend/] } },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
}));
