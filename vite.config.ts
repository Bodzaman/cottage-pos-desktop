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
    outDir: 'dist/renderer',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html')
      }
    },

    // Optimize for Electron
    target: 'chrome120', // Modern Chromium version
    minify: 'esbuild',
    sourcemap: true,

    // Asset handling
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@components': resolve(__dirname, 'src/renderer/components'),
      '@stores': resolve(__dirname, 'src/renderer/stores'),
      '@utils': resolve(__dirname, 'src/renderer/utils'),
      '@types': resolve(__dirname, 'src/shared/types')
    }
  },

  // Electron-specific optimizations
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },

  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['electron']
  },

  // Base path for production builds
  base: './',

  // Environment variables
  envPrefix: 'VITE_'
});