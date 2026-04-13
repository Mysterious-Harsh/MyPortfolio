import { defineConfig } from 'vite'

export default defineConfig({
  // Entry point — all TS gets bundled into one JS file Django loads
  build: {
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'main.js',
        dir: 'static/js',
      },
    },
    // Don't hash filenames — Django references static/js/main.js directly
    cssCodeSplit: false,
  },
  // Dev server proxies API calls to Django
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/static': 'http://127.0.0.1:8000',
    },
  },
})
