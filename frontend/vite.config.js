import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server:{
    host:'0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: [
      '5173-jcjaramill-envasesab-11mnts8b81l.ws-us121.gitpod.io'
    ],

  },

  plugins: [
    tailwindcss(),
    react()
  ],
})


