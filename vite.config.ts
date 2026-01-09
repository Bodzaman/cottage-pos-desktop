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
      'app': resolve(__dirname, 'renderer/lib/app-compat.ts'),  // Riff compatibility
      'brain': resolve(__dirname, 'renderer/brain'),
      'constants': resolve(__dirname, 'renderer/constants'),
      'components': resolve(__dirname, 'renderer/components'),
      'pages': resolve(__dirname, 'renderer/pages'),
      'utils': resolve(__dirname, 'renderer/utils'),
      'types': resolve(__dirname, 'renderer/types')
    }
  },

  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
