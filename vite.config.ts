import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // FIX: Simplified environment variable handling. Vite automatically loads .env files
  // into `process.env` for the config file, so `loadEnv` is not strictly necessary.
  // This also removes the line that was causing a type error due to incorrect global types
  // defined in `vite-env.d.ts`.
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  },
})
