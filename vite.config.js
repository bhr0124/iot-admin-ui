import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      path: 'path-browserify'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      external: ['path'],
      output: {
        globals: {
          path: 'path'
        }
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
}) 