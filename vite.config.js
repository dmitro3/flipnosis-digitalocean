import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      util: "util",
    },
  },
  optimizeDeps: {
    include: ['process', 'stream-browserify', 'util']
  }
}) 