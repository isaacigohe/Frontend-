import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ── FIX: For Vercel routing ──────────────────────────────────────────────
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})