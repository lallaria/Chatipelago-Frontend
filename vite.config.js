import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@mixitup_files': resolve(__dirname, 'src/mixitup_files'),
    },
  },
  // Expose mixitup_files for static serving in dev/build
  publicDir: 'src/mixitup_files'
})
