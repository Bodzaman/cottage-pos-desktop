
# Cottage Tandoori POS - Professional Desktop Application

A professional Windows desktop application for restaurant point of sale operations with USB thermal printing support.

## 🎯 Features

- **Professional Desktop App** - Installs like GitHub Desktop or Spotify
- **USB Thermal Printing** - Silent printing to Epson TM-T20III
- **Auto-Updates** - Seamless background updates via GitHub Releases
- **System Tray Integration** - Runs in background when minimized
- **Global Hotkeys** - Quick test printing with Ctrl+Shift+P
- **Menu Bar** - Professional application menu with settings

## 📦 Installation

### For Staff (End Users)
1. Download the installer from [GitHub Releases](https://github.com/Bodzaman/cottage-pos-desktop/releases)
2. Run `Cottage Tandoori POS-Setup-1.0.0.exe` as Administrator
3. Follow the installation wizard
4. Launch from desktop shortcut "Cottage Tandoori POS"

### For Developers
1. Clone this repository
2. Install Node.js 16+ and npm
3. Run `npm install`
4. Start development: `npm start`
5. Build installer: `npm run build-win`

## 🖨️ Printer Setup

1. Install Epson TM-T20III driver from [Epson website](https://epson.com/support)
2. Connect printer via USB
3. Set printer as default in Windows Settings
4. Test print from Windows to verify driver works
5. Use **Ctrl+Shift+P** in the app to test thermal printing

## 🚀 Usage

### Desktop Application
- **Start**: Click desktop shortcut or Start Menu
- **Test Print**: Ctrl+Shift+P (or File menu)
- **System Tray**: Right-click tray icon for quick access
- **Updates**: Automatic background updates
- **Exit**: File → Exit or Ctrl+Q

### Features
- Resizable window (not kiosk mode)
- Standard window controls (minimize/maximize/close)
- Professional menu bar with File, View, Help menus
- System tray for background operation
- Auto-update notifications

## 🛠️ Build Configuration

### Scripts
```bash
npm start          # Start development
npm run build      # Build for all platforms
npm run build-win  # Build Windows installer
npm run dist       # Build without publishing
npm run release    # Build and publish to GitHub
```

### Installer Features
- **NSIS-based** professional Windows installer
- **Desktop shortcut** "Cottage Tandoori POS"
- **Start Menu entry** in "Restaurant Management" category
- **Uninstaller** with clean removal
- **Admin privileges** for USB printer access
- **Custom icon** and branding

## 🔄 Auto-Updates

The app automatically checks for updates using electron-updater:
- Updates downloaded in background
- User notified when update ready
- Seamless installation on restart
- Update channel detection

## 📁 Project Structure

```
cottage-pos-desktop/
├── main.js              # Main Electron process
├── preload.js           # IPC bridge
├── package.json         # Dependencies & build config
├── build/
│   ├── icon.ico         # App icon
│   └── installer.nsh    # NSIS installer script
├── assets/              # Application assets
├── scripts/             # Build scripts
└── .github/workflows/   # CI/CD automation
```

## 🐛 Troubleshooting

### Printer Issues
- **No printer found**: Check Windows Printer Settings
- **Print failed**: Ensure printer online with paper loaded
- **Driver issues**: Reinstall Epson driver as Administrator

### Application Issues
- **Won't start**: Run installer as Administrator
- **Update failed**: Check internet connection
- **Missing shortcut**: Reinstall application

### Development Issues
- **Build failed**: Ensure Node.js 16+ installed
- **Icon missing**: Add icon.ico to build/ directory
- **Signing errors**: Disable code signing in package.json

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Bodzaman/cottage-pos-desktop/issues)
- **Releases**: [GitHub Releases](https://github.com/Bodzaman/cottage-pos-desktop/releases)
- **Documentation**: This README and inline comments

## 📄 License

MIT License - see LICENSE file for details

---

**Cottage Tandoori Restaurant** - Professional POS Solutions


## 🚀 Ready for Development

**[📋 See DEPLOYMENT.md for complete setup instructions](./DEPLOYMENT.md)**

✅ Repository ready for immediate development work


<!-- Build trigger: 1758204269 -->