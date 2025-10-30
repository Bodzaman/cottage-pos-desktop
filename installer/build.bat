@echo off
echo ══════════════════════════════════════════
echo  Cottage Tandoori Installer Build Script
echo ══════════════════════════════════════════
echo.

REM ══════════════════════════════════════════
REM Step 0: Download Portable Node.js v18 LTS
REM ══════════════════════════════════════════
echo [0/5] Checking for portable Node.js...
if not exist "printer-service\node.exe" (
    echo    Node.js not found - downloading v18 LTS...

    REM Download latest v18 LTS
    powershell -Command "& { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/latest-v18.x/node-v18.20.8-win-x64.zip' -OutFile 'node-v18.zip' }"

    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to download Node.js
        exit /b 1
    )

    echo    Extracting node.exe...
    powershell -Command "& { Expand-Archive -Path 'node-v18.zip' -DestinationPath 'temp-node' -Force }"

    if not exist "printer-service" mkdir printer-service
    copy "temp-node\node-v18.20.8-win-x64\node.exe" "printer-service\node.exe"

    REM Cleanup
    del node-v18.zip
    rmdir /s /q temp-node

    echo    Node.js v18 installed successfully!
) else (
    echo    Node.js already present - skipping download
)
echo.

REM ══════════════════════════════════════════
REM Step 1: Build Electron app
REM ══════════════════════════════════════════
echo [1/5] Building Electron POS app...
cd ..
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Electron build failed
    exit /b 1
)

REM ══════════════════════════════════════════
REM Step 2: Install printer service dependencies
REM ══════════════════════════════════════════
echo [2/5] Installing printer service dependencies...
cd printer-service
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Printer service npm install failed
    exit /b 1
)
cd ..

REM ══════════════════════════════════════════
REM Step 3: Download NSSM (if needed)
REM ══════════════════════════════════════════
echo [3/5] Checking for NSSM...
if not exist "printer-service\tools\nssm.exe" (
    echo    NSSM not found - downloading v2.24...

    if not exist "printer-service\tools" mkdir printer-service\tools

    powershell -Command "& { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip' }"

    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to download NSSM
        exit /b 1
    )

    echo    Extracting NSSM...
    powershell -Command "& { Expand-Archive -Path 'nssm.zip' -DestinationPath 'temp-nssm' -Force }"
    copy "temp-nssm\nssm-2.24\win64\nssm.exe" "printer-service\tools\nssm.exe"

    REM Cleanup
    del nssm.zip
    rmdir /s /q temp-nssm

    echo    NSSM v2.24 installed successfully!
) else (
    echo    NSSM already present - skipping download
)
echo.

REM ══════════════════════════════════════════
REM Step 4: Compile NSIS installer
REM ══════════════════════════════════════════
echo [4/5] Compiling NSIS installer...
"C:\Program Files (x86)\NSIS\makensis.exe" /V3 installer\cottage-tandoori-setup.nsi
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: NSIS compilation failed
    exit /b 1
)

REM ══════════════════════════════════════════
REM Step 5: Done
REM ══════════════════════════════════════════
echo [5/5] Build complete!
echo.
echo ══════════════════════════════════════════
echo  Installer: installer\CottageTandooriSetup-1.0.0.exe
echo ══════════════════════════════════════════
echo.
echo Next steps:
echo  1. Test the installer on a Windows VM
echo  2. Verify service installation and auto-start
echo  3. Check POS app connects to printer service
echo.
pause
