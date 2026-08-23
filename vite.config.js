import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // relative base so `npm run build` output also runs from file:// (see main.jsx)
  base: './',
  server: {
    // `npm run dev` starts server/dev.js on :3001 alongside Vite
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? 3001}`,
        changeOrigin: true,
      },
    },
  },
})
