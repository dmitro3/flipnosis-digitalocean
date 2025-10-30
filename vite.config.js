import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '', {
    envDir: process.cwd(),
    envPrefix: 'VITE_'
  })
  
  // Only expose safe environment variables to frontend
  const safeEnv = {
    VITE_PLATFORM_FEE_RECEIVER: env.VITE_PLATFORM_FEE_RECEIVER,
    VITE_ETHEREUM_RPC_URL: env.VITE_ETHEREUM_RPC_URL,
    VITE_SEPOLIA_RPC_URL: env.VITE_SEPOLIA_RPC_URL,
    VITE_BASE_RPC_URL: env.VITE_BASE_RPC_URL,
    VITE_ALCHEMY_API_KEY: env.VITE_ALCHEMY_API_KEY,
    VITE_BASESCAN_API_KEY: env.VITE_BASESCAN_API_KEY,
    VITE_ETHERSCAN_API_KEY: env.VITE_ETHERSCAN_API_KEY,
    VITE_BSCSCAN_API_KEY: env.VITE_BSCSCAN_API_KEY,
    VITE_AVALANCHE_API_KEY: env.VITE_AVALANCHE_API_KEY,
    VITE_POLYGONSCAN_API_KEY: env.VITE_POLYGONSCAN_API_KEY,
    VITE_REPORT_GAS: env.VITE_REPORT_GAS,
    NODE_ENV: env.NODE_ENV
  }
  
  console.log('Loaded safe environment variables for frontend:', safeEnv)
  
  return {
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin']
        }
      })
    ],
    resolve: {
      alias: {
        '@': '/src',
        stream: resolve(__dirname, 'node_modules/stream-browserify'),
        crypto: resolve(__dirname, 'node_modules/crypto-browserify'),
        util: resolve(__dirname, 'node_modules/util'),
        buffer: resolve(__dirname, 'node_modules/buffer'),
        process: resolve(__dirname, 'node_modules/process/browser'),
        zlib: resolve(__dirname, 'node_modules/browserify-zlib'),
        path: resolve(__dirname, 'node_modules/path-browserify'),
        'use-sync-external-store/shim/with-selector': resolve(__dirname, 'node_modules/use-sync-external-store/shim/with-selector.js'),
        // Fix wagmi's nested use-sync-external-store
        'wagmi/node_modules/use-sync-external-store/shim/with-selector': resolve(__dirname, 'node_modules/use-sync-external-store/shim/with-selector.js'),
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false, // Disable canvas for browser compatibility
      },
      dedupe: ['use-sync-external-store', 'react', 'react-dom']
    },
    optimizeDeps: {
      include: [
        'stream-browserify',
        'crypto-browserify',
        'util',
        'buffer',
        'browserify-zlib',
        'path-browserify',
        'eventemitter3',
        'use-sync-external-store',
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
        'wagmi',
        '@wagmi/core',
        '@rainbow-me/rainbowkit'
      ],
      exclude: ['canvas', '@base-org/account'],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'import-assertions': true
        }
      }
    },
    build: {
      target: 'esnext',
      minify: 'esbuild', // Use esbuild for better compatibility
      cssCodeSplit: false, // Keep CSS in single file to prevent layout shift
      rollupOptions: {
        external: ['fsevents'],
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            wagmi: ['@rainbow-me/rainbowkit', '@wagmi/core', 'wagmi'],
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            socketio: ['socket.io-client'],
          },
          // Ensure consistent chunk loading
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        requireReturnsDefault: 'auto',
        defaultIsModuleExports: 'auto'
      },
      chunkSizeWarningLimit: 1000, // Increase warning limit
    },
    define: {
      'process.env': safeEnv
    },
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
}) 