import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    sourcemap: true,
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    target: 'es2020',
    modulePreload: {
      resolveDependencies: (url, deps) => {
        return deps.filter((dep) => !dep.includes('charts') && !dep.includes('google-oauth'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-dom') || id.includes('node_modules/motion-utils')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2') || id.includes('node_modules/@kurkle/color')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/@react-oauth/google')) {
            return 'vendor-google-oauth';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[Vite Proxy Warning] Cannot reach backend on http://127.0.0.1:5000:', err.message);
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'HostelFix backend server is currently unreachable on port 5000. Please ensure the backend is running.',
                })
              );
            }
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
