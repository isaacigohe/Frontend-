import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ── FIX: Expose environment variables to the browser ──────────────────
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
  // ── FIX: Ensure proper handling of environment variables ──────────────
  envPrefix: 'VITE_',
})