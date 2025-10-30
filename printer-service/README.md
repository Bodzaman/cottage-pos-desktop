# Cottage Tandoori Printer Helper Service

**Version:** 1.0.0  
**Platform:** Windows 10/11  
**Purpose:** Thermal printer communication service for Cottage Tandoori Electron POS

---

## 📋 Overview

This service runs as a Windows background service, providing a local HTTP API for thermal printer communication. The Cottage Tandoori Electron POS app connects to this service to print kitchen tickets and customer receipts.

### Key Features

- ✅ **Windows Service** - Auto-starts on boot, runs in background
- ✅ **ESC/POS Support** - Works with Epson TM-T20II, TM-T88V, and compatible printers
- ✅ **Dual Printer Support** - Kitchen printer (USB) + Customer printer (network/USB)
- ✅ **Template System** - Customizable receipt templates
- ✅ **Error Handling** - Comprehensive logging and error codes
- ✅ **Health Monitoring** - `/health` endpoint for status checks

---

## 🧰 Requirements

**Hardware:**
- Epson TM-T20II (USB) for kitchen tickets
- Epson TM-T88V (network/USB) for customer receipts
- Windows 10/11 PC

**Software:**
- Node.js 18+ (bundled in installer)
- NSSM (Non-Sucking Service Manager) - bundled
- Administrator privileges for installation

---

## 🚀 Installation

### Method 1: Automated Installer (Recommended)

1. Extract the `printer-service` folder to a temporary location
2. Open PowerShell as **Administrator**
3. Navigate to the extracted folder
4. Run the installation script:

```powershell
.\install-service.ps1
```

5. The service will be installed to `C:\Program Files\CottageTandoori\PrinterService`
6. Service starts automatically

### Method 2: Manual Installation

1. Copy the `printer-service` folder to `C:\Program Files\CottageTandoori\PrinterService`
2. Download Node.js portable and extract `node.exe` to the service folder
3. Download NSSM and extract `nssm.exe` to the service folder
4. Open PowerShell as Administrator and run:

```powershell
npm install
.\install-service.ps1
```

---

## 🔧 Configuration

Edit `src/config.js` to configure printers:

```javascript
printers: {
  kitchen: {
    name: 'TM-T20II',
    type: 'epson',
    interface: 'usb',  // or 'network'
    width: 42
  },
  customer: {
    name: 'TM-T88V',
    type: 'epson',
    interface: 'network',
    ip: '192.168.1.100',  // Update this!
    port: 9100,
    width: 48
  }
}
```

**Important:** Update the customer printer IP address to match your network configuration.

---

## 🌐 API Endpoints

The service runs on `http://127.0.0.1:3000` (localhost only - security).

### 1. POST `/print/kitchen`

Prints a kitchen ticket.

**Request:**
```json
{
  "order_id": "ORD-12345",
  "order_type": "DINE-IN",
  "table_number": "5",
  "items": [
    {
      "name": "Chicken Tikka Masala",
      "quantity": 2,
      "modifiers": ["Extra Spicy", "No Onions"],
      "special_instructions": "Nut allergy"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kitchen ticket printed successfully",
  "timestamp": "2024-10-29T23:00:00.000Z"
}
```

### 2. POST `/print/customer`

Prints a customer receipt.

**Request:**
```json
{
  "order_id": "ORD-12345",
  "order_type": "COLLECTION",
  "customer_name": "John Smith",
  "items": [
    {
      "name": "Chicken Tikka Masala",
      "quantity": 2,
      "price": 12.95
    }
  ],
  "subtotal": 25.90,
  "tax": 5.18,
  "total": 31.08,
  "payment_method": "Card",
  "open_drawer": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer receipt printed successfully",
  "timestamp": "2024-10-29T23:00:00.000Z"
}
```

### 3. GET `/health`

Checks service and printer health.

**Response:**
```json
{
  "status": "healthy",
  "printers": {
    "TM-T20II": {
      "status": "online",
      "interface": "usb"
    },
    "TM-T88V": {
      "status": "online",
      "interface": "network"
    }
  },
  "timestamp": "2024-10-29T23:00:00.000Z",
  "uptime_seconds": 3600
}
```

---

## 📊 Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_PAYLOAD` | 400 | Missing required fields |
| `PRINTER_NOT_FOUND` | 503 | Printer not detected |
| `PRINTER_OFFLINE` | 503 | Printer not responding |
| `OUT_OF_PAPER` | 503 | Printer out of paper |
| `TIMEOUT` | 504 | Print job timed out |
| `PRINT_ERROR` | 503 | Generic print error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🛠️ Management

### Check Service Status

```powershell
Get-Service -Name CottageTandooriPrinter
```

### Start Service

```powershell
Start-Service -Name CottageTandooriPrinter
```

### Stop Service

```powershell
Stop-Service -Name CottageTandooriPrinter
```

### Restart Service

```powershell
Restart-Service -Name CottageTandooriPrinter
```

### View Logs

```powershell
Get-Content 'C:\ProgramData\CottageTandoori\Logs\printer-service.log' -Tail 50
```

### Uninstall Service

```powershell
.\uninstall-service.ps1
```

---

## 🔍 Troubleshooting

### Service won't start

1. Check logs: `C:\ProgramData\CottageTandoori\Logs\service-stderr.log`
2. Verify `node.exe` exists in service folder
3. Check Windows Event Viewer → Windows Logs → Application

### Printer not found

1. Check printer is powered on and connected
2. Verify USB cable connection (kitchen printer)
3. Verify network IP address (customer printer)
4. Test printer from Windows (print test page)

### Network printer timeout

1. Check printer IP address in `src/config.js`
2. Verify printer is on same network
3. Test connectivity: `ping 192.168.1.100`
4. Check firewall settings (allow port 9100)

### Port 3000 already in use

1. Check if another service is using port 3000
2. Edit `src/config.js` to change port
3. Restart service

---

## 📝 Technical Details

**Dependencies:**
- `express` - HTTP server
- `node-thermal-printer` - ESC/POS printing
- `winston` - Logging
- `cors` - Cross-origin requests (for Electron app)

**File Structure:**
```
printer-service/
├── src/
│   ├── server.js              # Express HTTP server
│   ├── config.js              # Configuration
│   ├── logger.js              # Winston logger setup
│   ├── printer-controller.js  # ESC/POS print logic
│   └── template-loader.js     # Template management
├── package.json               # Dependencies
├── install-service.ps1        # Installation script
├── uninstall-service.ps1      # Uninstallation script
└── README.md                  # This file
```

**Logs:**
- Service logs: `C:\ProgramData\CottageTandoori\Logs\printer-service.log`
- STDOUT logs: `C:\ProgramData\CottageTandoori\Logs\service-stdout.log`
- STDERR logs: `C:\ProgramData\CottageTandoori\Logs\service-stderr.log`

---

## 🆘 Support

For issues or questions, contact the development team or check the logs at:
`C:\ProgramData\CottageTandoori\Logs\printer-service.log`

---

**Version:** 1.0.0  
**Last Updated:** October 2024  
**License:** Proprietary - Cottage Tandoori Restaurant
