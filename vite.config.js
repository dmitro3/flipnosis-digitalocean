import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
      // Explicitly expose environment variables
      __VITE_ALCHEMY_API_KEY__: JSON.stringify(env.VITE_ALCHEMY_API_KEY),
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
  }
}) 