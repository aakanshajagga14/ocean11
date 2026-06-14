import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('react-router-dom')) {
            return 'vendor'
          }
          if (
            id.includes('@deck.gl') ||
            id.includes('deck.gl') ||
            id.includes('maplibre-gl') ||
            id.includes('react-map-gl')
          ) {
            return 'map'
          }
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
