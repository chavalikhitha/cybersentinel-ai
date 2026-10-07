import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // ── Development server ──────────────────────────────────────────
  server: {
    port: 5173,
    open: true,
    cors: true,
  },

  // ── Production build ────────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
            return 'animation';
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
