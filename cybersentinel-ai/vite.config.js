import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Development server ──────────────────────────────────────────
  server: {
    port: 5173,
    open: true,
    cors: true,
  },

  // ── Production build ────────────────────────────────────────────
  build: {
    outDir: 'dist',
    // Generate sourcemaps for debugging (remove in prod if you prefer)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks to improve caching (function form required by Vite 8/rolldown)
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
        },
      },
    },
  },

  // ── Preview (vite preview) ──────────────────────────────────────
  preview: {
    port: 4173,
  },
})
