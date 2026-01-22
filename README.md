# Cottage Tandoori POS Desktop

Windows Electron app for Cottage Tandoori POS with native thermal printing support.

## Structure

```
├── electron/          # Electron app (main process + build config)
│   ├── main.js        # Electron main process (printing, IPC, auto-update)
│   ├── preload.js     # Context bridge for renderer
│   ├── vite.config.ts # Build configuration
│   └── package.json   # Electron dependencies + electron-builder config
│
├── frontend/          # Shared React components and utilities
│   ├── src/           # Source code
│   └── package.json   # Frontend dependencies
│
└── .github/workflows/ # GitHub Actions for automated builds
```

## Building

Builds are automated via GitHub Actions when a release is published.

### Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../electron && npm install

# Run in development mode
cd electron && npm run dev:electron
```

### Manual Build

```bash
cd electron
npm run build        # Build renderer
npm run dist:win     # Package Windows installer
```

## Auto-Update

The app uses `electron-updater` to check for updates from GitHub releases on startup.

## Environment Variables

Production environment variables are injected via GitHub Actions secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
