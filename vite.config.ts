import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Use relative paths for Electron file:// protocol compatibility
  base: './',

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
      'app': resolve(__dirname, 'renderer/lib/app-compat.ts'),  // Riff compatibility
      'brain': resolve(__dirname, 'renderer/brain'),
      'constants': resolve(__dirname, 'renderer/constants'),
      'components': resolve(__dirname, 'renderer/components'),
      'pages': resolve(__dirname, 'renderer/pages'),
      'utils': resolve(__dirname, 'renderer/utils'),
      'types': resolve(__dirname, 'renderer/types')
    }
  },

  // Environment variables and constants
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    '__APP_ID__': JSON.stringify('cottage-pos-desktop'),
    '__API_PATH__': JSON.stringify(''),
    '__API_URL__': JSON.stringify(''),
    '__API_HOST__': JSON.stringify(''),
    '__API_PREFIX_PATH__': JSON.stringify(''),
    '__WS_API_URL__': JSON.stringify(''),
    '__APP_BASE_PATH__': JSON.stringify(''),
    '__APP_TITLE__': JSON.stringify('Cottage POS'),
    '__APP_FAVICON_LIGHT__': JSON.stringify(''),
    '__APP_FAVICON_DARK__': JSON.stringify(''),
    '__APP_DEPLOY_USERNAME__': JSON.stringify(''),
    '__APP_DEPLOY_APPNAME__': JSON.stringify(''),
    '__APP_DEPLOY_CUSTOM_DOMAIN__': JSON.stringify('')
  }
});
