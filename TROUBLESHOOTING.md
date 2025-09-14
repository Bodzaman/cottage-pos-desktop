# Troubleshooting Guide

Common issues and solutions for Cottage Tandoori Desktop POS.

## 🔧 Installation Issues

### "Windows protected your PC" message
**Solution**: Click "More info" then "Run anyway". The app is safe but not code-signed.

### Installation fails with permission error
**Solution**: Right-click installer and select "Run as administrator"

### App won't install on Windows 10
**Solution**: Ensure Windows 10 is version 1809 or later. Update Windows if needed.

## 🖨️ Printing Issues

### No printers found in settings
**Cause**: Printer driver not installed or printer not connected
**Solutions**:
1. Install Epson TM-T20III driver from manufacturer
2. Check USB cable connection
3. Restart the POS application
4. Verify printer appears in Windows Settings > Printers

### Test print fails
**Cause**: Printer offline or misconfigured
**Solutions**:
1. Check printer power and paper
2. Set printer as default in Windows Settings
3. Print test page from Windows printer settings first
4. Restart printer and try again

### Receipts printing to wrong printer
**Cause**: Wrong default printer selected
**Solution**: Go to POS > Settings > Printing Settings and select correct printer

## ⚙️ Configuration Issues

### Settings not saving
**Cause**: Insufficient file permissions
**Solutions**:
1. Run app as administrator once to create config file
2. Check Windows UAC settings
3. Manually create folder: `%APPDATA%\cottage-tandoori-pos`

### Auto-start not working
**Cause**: Registry permissions or Windows security
**Solutions**:
1. Run app as administrator
2. Toggle auto-start off then on in settings
3. Check Windows Task Manager > Startup tab
4. Disable Windows antivirus temporarily during setup

### POSII URL connection fails
**Cause**: Network issues or incorrect URL
**Solutions**:
1. Test URL in web browser first
2. Check internet connection
3. Verify URL format includes `https://`
4. Contact system administrator for correct URL

## 🖥️ Application Issues

### App won't start
**Causes & Solutions**:
1. **Windows updates needed**: Install all Windows updates
2. **Antivirus blocking**: Add app to antivirus exceptions
3. **Corrupted installation**: Uninstall and reinstall
4. **Node.js missing**: Download from https://nodejs.org

### App crashes on startup
**Solutions**:
1. Delete config file: `%APPDATA%\cottage-tandoori-pos\pos-config.json`
2. Restart computer
3. Run Windows memory diagnostic
4. Reinstall application

### Black/blank screen
**Cause**: Network connectivity or POSII server issue
**Solutions**:
1. Check internet connection
2. Verify POSII URL in settings
3. Try reloading: Ctrl+R
4. Contact system administrator

### App freezes during use
**Solutions**:
1. Wait 30 seconds (may be loading)
2. Press Ctrl+Shift+R to restart app
3. Check available memory (Task Manager)
4. Close other programs if memory low

## 🔄 Update Issues

### Updates not downloading
**Cause**: Network or permission issues
**Solutions**:
1. Check internet connection
2. Run app as administrator
3. Manually download from GitHub releases
4. Check Windows firewall settings

### Update fails to install
**Solutions**:
1. Close all instances of the app
2. Run installer as administrator
3. Temporarily disable antivirus
4. Restart computer and try again

## 🔐 Permission Issues

### "Access denied" errors
**Solutions**:
1. Run app as administrator
2. Check user account has admin rights
3. Modify UAC settings (with caution)
4. Contact IT administrator

### Can't modify settings
**Cause**: File permissions or Windows security
**Solutions**:
1. Right-click app icon > "Run as administrator"
2. Check antivirus isn't blocking file writes
3. Verify user has write access to `%APPDATA%`

## 📞 Getting Additional Help

### Self-Service Options:
1. **Reset configuration**: Delete `%APPDATA%\cottage-tandoori-pos\pos-config.json`
2. **Reinstall app**: Uninstall from Windows Settings, then reinstall
3. **Check Windows Event Viewer**: Look for application errors
4. **Enable developer tools**: Settings > Advanced > Enable Dev Tools > F12

### When to Contact Support:
- Hardware failures (printer, computer)
- Network connectivity issues
- POSII server problems
- Persistent crashes after reinstalling

### Information to Provide:
- Windows version (Settings > System > About)
- App version (Help > About)
- Error messages (exact text)
- Steps that led to the problem

---

**💡 Tip**: Most issues are resolved by restarting the app or running as administrator once.
