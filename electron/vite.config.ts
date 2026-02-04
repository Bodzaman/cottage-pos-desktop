import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Path to frontend's node_modules where all dependencies are installed
const frontendNodeModules = path.resolve(__dirname, '../frontend/node_modules');

// Vite configuration for Electron POS app
// Uses electron/index.html as entry point with Electron-specific routing
// Resolves to frontend/src for shared codebase components
// Dependencies are resolved from frontend/node_modules via aliases
export default defineConfig(({ mode }) => {
  // Load env vars from electron/.env.development (or .env.production)
  const env = loadEnv(mode, __dirname, '');

  return {
  plugins: [react()],
  root: __dirname,
  publicDir: path.resolve(__dirname, '../frontend/public'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  resolve: {
    alias: {
      // Source code aliases - ORDER MATTERS: more specific paths first
      '@/components/ui': path.resolve(__dirname, '../frontend/src/extensions/shadcn/components'),
      '@/hooks': path.resolve(__dirname, '../frontend/src/extensions/shadcn/hooks'),
      '@/components/hooks': path.resolve(__dirname, '../frontend/src/extensions/shadcn/hooks'),
      '@': path.resolve(__dirname, '../frontend/src'),
      'components': path.resolve(__dirname, '../frontend/src/components'),
      'utils': path.resolve(__dirname, '../frontend/src/utils'),
      // IMPORTANT: Use local brain.ts (app-compat) instead of frontend brain
      // This routes API calls to Supabase directly, not backend HTTP endpoints
      'brain': path.resolve(__dirname, 'lib/brain.ts'),
      'types': path.resolve(__dirname, '../frontend/src/types'),
      'app': path.resolve(__dirname, '../frontend/src/app'),
      'pages': path.resolve(__dirname, '../frontend/src/pages'),

      // Dependency aliases - resolve from frontend's node_modules
      'react': path.resolve(frontendNodeModules, 'react'),
      'react-dom': path.resolve(frontendNodeModules, 'react-dom'),
      'react-router-dom': path.resolve(frontendNodeModules, 'react-router-dom'),
      // Also alias react-router to prevent version mismatch from nested dependencies
      'react-router': path.resolve(frontendNodeModules, 'react-router-dom/node_modules/react-router'),
      'zustand': path.resolve(frontendNodeModules, 'zustand'),
      'framer-motion': path.resolve(frontendNodeModules, 'framer-motion'),
      'lucide-react': path.resolve(frontendNodeModules, 'lucide-react'),
      'sonner': path.resolve(frontendNodeModules, 'sonner'),
      'clsx': path.resolve(frontendNodeModules, 'clsx'),
      'tailwind-merge': path.resolve(frontendNodeModules, 'tailwind-merge'),
      'date-fns': path.resolve(frontendNodeModules, 'date-fns'),
      'classnames': path.resolve(frontendNodeModules, 'classnames'),
      'zod': path.resolve(frontendNodeModules, 'zod'),
      '@tanstack/react-query': path.resolve(frontendNodeModules, '@tanstack/react-query'),
      '@supabase/supabase-js': path.resolve(frontendNodeModules, '@supabase/supabase-js'),
      '@stripe/stripe-js': path.resolve(frontendNodeModules, '@stripe/stripe-js'),
      '@stripe/react-stripe-js': path.resolve(frontendNodeModules, '@stripe/react-stripe-js'),
      '@google/genai': path.resolve(frontendNodeModules, '@google/genai'),
      '@react-google-maps/api': path.resolve(frontendNodeModules, '@react-google-maps/api'),
      '@dnd-kit/core': path.resolve(frontendNodeModules, '@dnd-kit/core'),
      '@dnd-kit/sortable': path.resolve(frontendNodeModules, '@dnd-kit/sortable'),
      '@dnd-kit/utilities': path.resolve(frontendNodeModules, '@dnd-kit/utilities'),
      '@hookform/resolvers': path.resolve(frontendNodeModules, '@hookform/resolvers'),
      'react-hook-form': path.resolve(frontendNodeModules, 'react-hook-form'),
      'react-markdown': path.resolve(frontendNodeModules, 'react-markdown'),
      'react-loading-skeleton': path.resolve(frontendNodeModules, 'react-loading-skeleton'),
      'html2canvas': path.resolve(frontendNodeModules, 'html2canvas'),
      'qrcode.react': path.resolve(frontendNodeModules, 'qrcode.react'),
      // i18next packages are in electron's own package.json (not aliased)
      // This ensures they work in CI where frontend/node_modules doesn't exist
    },
    // Force deduplication to ensure only one instance of react-router-dom is used
    // This prevents context isolation issues from nested dependencies
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 5174,  // Use 5174 to avoid conflict with frontend (5173)
    fs: {
      // Allow serving files from parent directory (frontend)
      allow: [
        path.resolve(__dirname, '..'),
      ],
    },
  },
  optimizeDeps: {
    // Pre-bundle dependencies from frontend's node_modules
    include: ['react', 'react-dom', 'react-router-dom'],
    // Force re-bundling to pick up deduplication changes
    force: true,
  },
  define: {
    // Build-time constants required by frontend code
    '__APP_ID__': JSON.stringify('cottage-pos-desktop'),
    '__API_PATH__': JSON.stringify(''),
    '__API_URL__': JSON.stringify(''),
    '__API_HOST__': JSON.stringify(''),
    '__API_PREFIX_PATH__': JSON.stringify(''),
    '__WS_API_URL__': JSON.stringify(''),
    '__APP_BASE_PATH__': JSON.stringify(''),
    '__APP_TITLE__': JSON.stringify('Cottage Tandoori POS'),
    '__APP_FAVICON_LIGHT__': JSON.stringify(''),
    '__APP_FAVICON_DARK__': JSON.stringify(''),
    '__APP_DEPLOY_USERNAME__': JSON.stringify(''),
    '__APP_DEPLOY_APPNAME__': JSON.stringify(''),
    '__APP_DEPLOY_CUSTOM_DOMAIN__': JSON.stringify(''),

    // Environment variables for Supabase, Stripe, Google Maps (from .env file)
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || ''),
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
    'import.meta.env.VITE_RIFF_BACKEND_URL': JSON.stringify(env.VITE_RIFF_BACKEND_URL || ''),
    'import.meta.env.VITE_WEBSITE_URL': JSON.stringify(env.VITE_WEBSITE_URL || ''),
  },
};
});
