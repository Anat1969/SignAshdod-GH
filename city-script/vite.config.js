import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500, rollupOptions: { output: { manualChunks: { maplibre: ['maplibre-gl'], vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', '@supabase/supabase-js'] } } } },
})
