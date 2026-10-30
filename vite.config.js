import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// VITE_BASE define o caminho público (ex.: /chemtox-engine/ no GitHub Pages).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
