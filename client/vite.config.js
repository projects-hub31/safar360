import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // React/react-dom/react-router change far less often than app code —
        // splitting them into their own chunk means a returning user's
        // browser (and any CDN in front of dist/) keeps serving this chunk
        // from cache across app deploys, instead of re-downloading it every
        // time any page changes. The per-route chunks from App.jsx's
        // React.lazy() calls stay automatic/unlisted here.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
