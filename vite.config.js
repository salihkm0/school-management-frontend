import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5055',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5055',
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:5055',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Target modern browsers — smaller bundle output
    target: 'es2020',
    // Warn at 600 kB per chunk
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core — very stable, cache aggressively
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/')) {
            return 'vendor-react';
          }
          // Redux — also rarely changes
          if (id.includes('node_modules/@reduxjs/') ||
              id.includes('node_modules/redux') ||
              id.includes('node_modules/react-redux')) {
            return 'vendor-redux';
          }
          // Heroicons — large, stable icon set
          if (id.includes('node_modules/@heroicons/')) {
            return 'vendor-icons';
          }
          // Everything else in node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
})