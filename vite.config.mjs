// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 must match your repo name exactly (case-sensitive)
export default defineConfig({
  plugins: [react()],
 
})