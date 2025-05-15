import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests to Cloudflare Pages Functions
        '/api': {
          target: 'http://localhost:8788',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      // Prevent excessive comments in production build
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'chart-vendor': ['chart.js', 'react-chartjs-2'],
          }
        }
      }
    },
    define: {
      // Make env variables available to the client code
      // Only include variables prefixed with VITE_
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    }
  }
})
