import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      util: 'util',
      buffer: 'buffer',
      process: 'process/browser',
      zlib: 'browserify-zlib',
      path: 'path-browserify',
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    },
  },
  optimizeDeps: {
    include: [
      'stream-browserify',
      'crypto-browserify',
      'util',
      'buffer',
      'process/browser',
      'browserify-zlib',
      'path-browserify',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['fsevents'],
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
}) 