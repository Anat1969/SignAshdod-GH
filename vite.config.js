import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` must match the GitHub Pages sub-path for a project site:
//   https://<user>.github.io/<repo>/  ->  base: '/<repo>/'
// It can be overridden at build time with VITE_BASE (e.g. '/' for a custom domain).
export default defineConfig({
  base: process.env.VITE_BASE || '/SignAshdod-GH/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
