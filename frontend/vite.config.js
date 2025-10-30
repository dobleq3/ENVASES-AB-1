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
      '5173--019a070c-0148-7818-bf32-4296457c6704.us-east-1-01.gitpod.dev'
    ],

  },

  plugins: [
    tailwindcss(),
    react()
  ],
})


