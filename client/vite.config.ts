import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim())
      : ['localhost'],
    proxy: {
      '/api': {
        target: 'http://server:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://server:3000',
        changeOrigin: true,
      },
    },
  },
});
