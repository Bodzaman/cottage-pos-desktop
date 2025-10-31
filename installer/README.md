# Cottage Tandoori Combined Installer

This directory contains the unified installer for both:
1. **Cottage Tandoori POS Desktop** (Electron app)
2. **Printer Service** (Node.js Windows service)

## Prerequisites

### Required Software
1. **NSIS 3.x** - [Download here](https://nsis.sourceforge.io/Download)
   - Install to default location: `C:\Program Files (x86)\NSIS`
2. **Node.js 18 LTS** - For building the Electron app
3. **Git** - For cloning the repository

### Required Files
Before building, ensure these are present:
- `printer-service/node.exe` - Portable Node.js runtime (v18 LTS)
- `printer-service/tools/nssm.exe` - NSSM service manager

## Building Locally

### Step 1: Build Electron App
```bash
npm install
npm run build
```
This creates `dist/win-unpacked/` with the Electron app

### Step 2: Install Printer Service Dependencies
```bash
cd printer-service
npm install --production
cd ..
```

### Step 3: Compile Installer
```bash
"C:\Program Files (x86)\NSIS\makensis.exe" /V3 installer\cottage-tandoori-setup.nsi
```

Or use the automated script:
```bash
installer\build.bat
```

## Output

Successful build creates:
```
installer/CottageTandooriSetup-1.0.0.exe
```

## Installer Behavior

### Fresh Install
1. Installs POS Desktop to `C:\Program Files\Cottage Tandoori\`
2. Installs Printer Service files
3. Creates Windows service "CottagePrinterService" using NSSM
4. Configures service for auto-start
5. Starts the service
6. Creates desktop + Start Menu shortcuts

### Update
1. Detects existing installation
2. Stops printer service
3. Updates all files
4. Updates service configuration
5. Restarts service
6. Preserves settings and data

### Uninstall
1. Stops and removes Windows service
2. Deletes all files
3. Removes shortcuts
4. Cleans registry entries

## Troubleshooting

### Build Fails
- Verify `dist/win-unpacked/` exists (run Electron build first)
- Check `printer-service/` directory has all files

### Service Won't Start
- Check `printer-service/node.exe` exists
- Check `printer-service/tools/nssm.exe` exists
- View service logs: `printer-service/logs/service-stderr.log`
- Check Windows Event Viewer

### Antivirus Blocks NSSM
- Add exclusion for `nssm.exe`
- Code signing may be needed for production

## GitHub Actions Build

The installer is automatically built by GitHub Actions on release.
See `.github/workflows/build-combined-installer.yml`

## Files

- `cottage-tandoori-setup.nsi` - Main NSIS installer script
- `build.bat` - Automated build script for Windows
- `LICENSE.txt` - License shown during installation
- `README.md` - This file

## Support

For issues or questions, contact the development team.


<!-- Build triggered: 2025-10-31 16:14:50 UTC -->