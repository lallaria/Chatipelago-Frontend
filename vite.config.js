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
      '@import_files': resolve(__dirname, 'src/import_files'),
    },
  },
  // Expose import_files for static serving in dev/build
  publicDir: 'src/import_files'
})
