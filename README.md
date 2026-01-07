# Cottage Tandoori POS Desktop

**AI-Powered Restaurant Management System**

A next-generation Electron desktop application combining point-of-sale functionality with intelligent thermal printing services.

---

## 🏗️ Repository Structure

This repository contains **two integrated components** installed together:

### 1. **POS Desktop Application** (Electron App)
- **Location:** `src/` directory
- **Technology:** Electron + React + TypeScript
- **Features:**
  - Four order modes: DINE-IN | WAITING | COLLECTION | DELIVERY
  - Real-time menu synchronization with Supabase
  - Customer management and order tracking
  - Integrated payment processing via Adyen
  - Admin dashboards and analytics
  - Offline-first architecture

### 2. **Printer Service** (Windows Background Service)
- **Location:** `printer-service/` directory
- **Technology:** Node.js + Express
- **Features:**
  - Runs as Windows service using NSSM
  - ESC/POS thermal printer support
  - HTTP API on port 3000
  - Kitchen ticket printing
  - Customer receipt generation
  - Template-based formatting

### 3. **Unified Installer**
- **Location:** `installer/` directory
- **Technology:** NSIS (Nullsoft Scriptable Install System)
- **Package:** Single installer deploying both POS app and printer service
- **Output:** `CottageTandooriPOS-Setup-v{version}.exe`

---

## 🚀 Development

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Windows 10/11 (for full testing with printer service)

### POS Desktop Development

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

### Printer Service Development

```bash
# Navigate to printer service
cd printer-service

# Install dependencies
npm install

# Run in development mode (requires thermal printer)
npm run dev

# Test health endpoint
curl http://localhost:3000/health
```

### Building the Unified Installer

The installer is built automatically via GitHub Actions when a release is created.

**Manual Build (Windows only):**
```bash
# Ensure NSIS is installed
# Build both components first
npm run build
cd printer-service && npm install --production

# Run NSIS compiler
makensis installer/cottage-pos-installer.nsi
```

---

## 📦 Distribution

### Automated GitHub Releases

Every release triggers a GitHub Actions workflow that:
1. Builds the Electron POS app for Windows x64
2. Packages the printer service with NSSM
3. Creates a unified NSIS installer
4. Uploads installer as a release asset

### Creating a Release

```bash
# Tag and push
git tag v1.2.0
git push origin v1.2.0

# Or create via GitHub UI
# Workflow runs automatically on tag push
```

---

## 🔧 Tech Stack

### POS Desktop
- **Framework:** Electron
- **UI:** React + TypeScript
- **State:** Zustand stores
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Payments:** Adyen Terminal API
- **Build:** electron-builder

### Printer Service
- **Runtime:** Node.js
- **Server:** Express
- **Printer:** node-thermal-printer (ESC/POS)
- **Logging:** Winston
- **Service Wrapper:** NSSM (Non-Sucking Service Manager)

### Deployment
- **Installer:** NSIS
- **CI/CD:** GitHub Actions
- **Release:** Automated via workflow

---

## 📂 Directory Overview

```
cottage-pos-desktop/
├── .github/
│   └── workflows/
│       └── build-release.yml        # GitHub Actions workflow
├── src/                             # Electron main process
│   ├── main.js                      # App entry point
│   ├── preload.js                   # IPC bridge
│   └── renderer/                    # React UI components
│       ├── pages/
│       ├── components/
│       └── utils/
├── printer-service/                 # Windows service for printing
│   ├── src/
│   │   ├── server.js                # Express HTTP server
│   │   ├── config.js                # Service configuration
│   │   ├── logger.js                # Winston logger
│   │   └── printer/                 # ESC/POS logic
│   ├── tools/
│   │   └── nssm.exe                 # Service wrapper (v2.24)
│   ├── package.json
│   └── README.md
├── installer/                       # NSIS installer scripts
│   ├── cottage-pos-installer.nsi    # Main installer script
│   └── README.md
├── package.json                     # Root Electron package
└── README.md                        # This file
```

---

## 🔐 Security & Credentials

- **Supabase credentials:** Configured in renderer code
- **Adyen API keys:** Stored in environment variables
- **User authentication:** Supabase Auth with role-based access
- **Printer service:** Localhost-only (127.0.0.1:3000)

---

## 📖 Documentation

- **POS Desktop:** See `src/README.md` (if available)
- **Printer Service:** See `printer-service/README.md`
- **Installer:** See `installer/README.md`
- **API Docs:** Run printer service and visit `/health`

---

## 🧪 Testing

### POS Desktop
```bash
npm test
```

### Printer Service
```bash
cd printer-service
npm test
```

### End-to-End
Install built `.exe` on Windows test machine and verify:
1. POS app launches
2. Printer service is running (check Windows Services)
3. Kitchen ticket prints correctly
4. Receipt generation works

---

## 🤝 Contributing

This is a proprietary codebase for **Cottage Tandoori Restaurant**.

For development questions, contact: **Boss🫡**

---

## 📄 License

Proprietary - All Rights Reserved © 2024 Cottage Tandoori

---

## 🆘 Support

**Issues?**
- Check printer service logs: `C:\ProgramData\CottageTandoori\PrinterService\logs`
- Check POS app logs: User AppData folder
- Verify thermal printer USB connection
- Ensure Windows Firewall allows localhost:3000

**Common Fixes:**
- Restart printer service: `services.msc` → Cottage Tandoori Printer Service → Restart
- Reinstall printer service: Run installer with `/S` flag
- Check NSSM service status: `nssm status CottageTandooriPrinterService`

---

**Built with ❤️ for Cottage Tandoori by Boss🫡's AI Agent**

<!-- Build trigger: 1764848739.4334266 -->

<!-- Build triggered: 2026-01-07 13:02:01 UTC -->
<!-- Build trigger: 01af822f2ebc302e -->
