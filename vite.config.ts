import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Precisa vir antes do plugin do React: e ele que gera o routeTree.gen.ts.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // O celular na mesma rede precisa alcancar o dev server.
    host: true,
    port: 5173,
  },
})
