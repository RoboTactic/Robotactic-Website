import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async ({ mode }) => {
  const cloudflarePlugins = mode === 'cloudflare'
    ? [(await import('@cloudflare/vite-plugin')).cloudflare()]
    : [];

  return {
    plugins: [react(), ...cloudflarePlugins],
    ...(mode === 'cloudflare' ? { define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api') } } : {}),
    build: { commonjsOptions: { include: [/node_modules/, /backend/] } },
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
  };
});
