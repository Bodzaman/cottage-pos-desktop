import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Development server configuration
  server: {
    port: 5173,
    host: 'localhost',
    cors: true,
    hmr: {
      port: 5174
    }
  },

  // Build configuration for Electron renderer
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'renderer/index.html')
      }
    },

    // Optimize for Electron
    target: 'chrome120',
    minify: 'esbuild',
    sourcemap: true,

    // Asset handling
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1500
  },

  // Path resolution to match our renderer/ structure
  resolve: {
    alias: {
      '@': resolve(__dirname, 'renderer'),
      'components': resolve(__dirname, 'renderer/components'),
      'utils': resolve(__dirname, 'renderer/utils'),
      'pages': resolve(__dirname, 'renderer/pages')
    }
  },

  // Electron-specific optimizations
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.2.4'),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },

  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['electron']
  },

  // Base path for production builds (important for Electron)
  base: './',

  // Environment variables
  envPrefix: 'VITE_'
});
