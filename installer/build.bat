@echo off
echo ══════════════════════════════════════════
echo  Cottage Tandoori Installer Build Script
echo ══════════════════════════════════════════
echo.

REM Step 1: Build Electron app
echo [1/4] Building Electron POS app...
cd ..
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Electron build failed
    exit /b 1
)

REM Step 2: Install printer service dependencies
echo [2/4] Installing printer service dependencies...
cd printer-service
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Printer service npm install failed
    exit /b 1
)
cd ..

REM Step 3: Compile NSIS installer
echo [3/4] Compiling NSIS installer...
"C:\\Program Files (x86)\\NSIS\\makensis.exe" /V3 installer\\cottage-tandoori-setup.nsi
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: NSIS compilation failed
    exit /b 1
)

REM Step 4: Done
echo [4/4] Build complete!
echo.
echo ══════════════════════════════════════════
echo  Installer: installer\\CottageTandooriSetup-1.0.0.exe
echo ══════════════════════════════════════════
pause
