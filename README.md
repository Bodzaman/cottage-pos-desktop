# Cottage Tandoori Desktop POS

Professional Windows desktop application for Cottage Tandoori restaurant point-of-sale system.

## 🌟 Features

- **Desktop POS Interface**: Wraps POSII in a professional desktop app
- **Thermal Printing**: Silent printing to Epson TM-T20III printers
- **Configuration System**: Easy settings management via GUI
- **Auto-Start**: Automatically starts with Windows
- **Auto-Updates**: Seamless updates via GitHub Releases
- **System Tray**: Runs in background with system tray integration

## 🖥️ System Requirements

- **Operating System**: Windows 11 (recommended) or Windows 10
- **Node.js**: Version 16 or higher
- **Printer**: Epson TM-T20III with Windows driver installed
- **Permissions**: Administrator privileges for initial setup

## 🚀 Quick Installation

### For Restaurant Staff (Simple)

1. **Download the installer** from [Releases](https://github.com/Bodzaman/cottage-pos-desktop/releases)
2. **Run the installer** as Administrator
3. **Launch** the app from Desktop shortcut
4. **Configure** settings via POS > Settings menu

### For Developers (Manual)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Bodzaman/cottage-pos-desktop.git
   cd cottage-pos-desktop
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

## ⚙️ Configuration

Access settings via **POS > Settings** menu:

### Connection Settings
- **POSII URL**: Configure your restaurant's POS interface URL

### Printing Settings  
- **Default Printer**: Select Epson thermal printer
- **Paper Width**: 58mm or 80mm thermal paper
- **Silent Printing**: Enable automatic printing without dialogs

### Startup Settings
- **Auto-start**: Start with Windows
- **Update Channel**: Stable or Beta releases
- **Start Minimized**: Launch minimized to system tray

### Advanced Settings
- **Window Mode**: Normal or Kiosk mode
- **Developer Tools**: Enable F12 debugging (if needed)

## 🖨️ Printer Setup

1. **Install Epson driver** from the manufacturer's website
2. **Connect printer** via USB cable
3. **Set as default** in Windows Settings > Printers & scanners
4. **Test printing** via POS > Test Print menu

## ⌨️ Keyboard Shortcuts

- `Ctrl + ,` - Open Settings
- `Ctrl + Shift + P` - Test Print Receipt
- `Ctrl + Shift + R` - Restart Application
- `Ctrl + Q` - Quit Application
- `F12` - Developer Tools (if enabled)

## 🔄 Updates

The app automatically checks for updates and notifies you when new versions are available. Updates are downloaded from GitHub Releases.

## 🆘 Support

- **Setup Guide**: See [SETUP.md](SETUP.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Issues**: Report bugs via [GitHub Issues](https://github.com/Bodzaman/cottage-pos-desktop/issues)

## 📝 Version History

- **v1.2.0** - Enhanced configuration system with comprehensive settings UI
- **v1.1.0** - Auto-updates and Windows installer
- **v1.0.0** - Initial desktop POS with thermal printing

---

**© 2024 Cottage Tandoori Restaurant** - Professional POS Desktop Application
