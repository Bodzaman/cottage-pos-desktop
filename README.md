# Cottage Tandoori POS Desktop

Professional Desktop Point of Sale System for Cottage Tandoori Restaurant

## 🚀 Features

- **Modern Electron Application** - Built with TypeScript and modern best practices
- **Professional Windows Installer** - NSIS installer with proper desktop integration
- **Auto-Updates** - Seamless background updates via electron-updater
- **Real-time POS Integration** - Direct connection to Cottage Tandoori web platform
- **Offline Capabilities** - Local data persistence and graceful degradation
- **Thermal Printing Support** - USB printer integration for receipts

## 📦 Installation

### For Users
1. Download the latest installer from [Releases](https://github.com/Bodzaman/cottage-pos-desktop/releases)
2. Run `Cottage-Tandoori-POS-Setup-{version}.exe`
3. Follow the installation wizard
4. Launch from desktop shortcut or Start Menu

### For Developers
```bash
# Clone repository
git clone https://github.com/Bodzaman/cottage-pos-desktop.git
cd cottage-pos-desktop

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create Windows installer
npm run dist:win
```

## 🛠️ Development Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build for production
- `npm run dist` - Create distributable packages
- `npm run dist:win` - Create Windows NSIS installer
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## 🏗️ Architecture

```
cottage-pos-desktop/
├── src/
│   ├── main/           # Main Electron process
│   └── preload/        # Preload scripts (security bridge)
├── dist/               # Compiled TypeScript
├── release/            # Built installers
├── assets/             # App icons and resources
└── .github/workflows/  # CI/CD automation
```

## 🔄 Auto-Publishing

The application automatically builds and publishes Windows installers when tags are pushed:

```bash
# Create and push a new release
git tag v1.0.1
git push origin v1.0.1
```

This triggers GitHub Actions to:
1. Build the application
2. Create Windows NSIS installer
3. Publish to GitHub Releases
4. Update auto-updater feed

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Set to 'development' for dev mode
- `GH_TOKEN` - GitHub token for auto-publishing (CI only)

### Build Configuration
All build settings are in `package.json` under the `build` section:
- Windows NSIS installer configuration
- Auto-updater settings
- File packaging rules
- Code signing (when certificates available)

## 🖨️ Printing Support

The POS supports USB thermal printers:
- Epson TM-T20III (primary)
- Star TSP143III
- Generic ESC/POS compatible printers

## 📱 Integration

The desktop app integrates with the main Cottage Tandoori platform:
- **Development**: Points to Databutton workspace
- **Production**: Points to deployed application
- **Real-time sync**: Orders, menu updates, reporting
- **Offline mode**: Local data persistence when disconnected

## 🔒 Security

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script with controlled API exposure
- No remote module access
- Web security enforced in production

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For technical support or bug reports:
1. Check [Issues](https://github.com/Bodzaman/cottage-pos-desktop/issues)
2. Create new issue with detailed description
3. Contact restaurant management for urgent issues

---

**Built with ❤️ for Cottage Tandoori Restaurant**
