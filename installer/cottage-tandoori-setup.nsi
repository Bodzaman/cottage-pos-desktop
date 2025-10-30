; ========================================
; Cottage Tandoori Combined Installer
; POS Desktop + Printer Service
; ========================================
;
; This installer bundles:
; 1. Electron POS Desktop application
; 2. Printer Service (Node.js service) installed as Windows service via NSSM
;
; Handles: Fresh install, Updates, Uninstall
; ========================================

!define APP_NAME "Cottage Tandoori POS"
!define APP_VERSION "1.0.0"
!define COMPANY_NAME "Cottage Tandoori"
!define SERVICE_NAME "CottagePrinterService"
!define SERVICE_DISPLAY "Cottage Tandoori Printer Service"
!define SERVICE_DESCRIPTION "Background service for ESC/POS thermal printing"

Name "${APP_NAME}"
OutFile "CottageTandooriSetup-${APP_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${COMPANY_NAME}"

; Request admin privileges
RequestExecutionLevel admin

; Modern UI includes
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"

; ========================================
; Modern UI Configuration
; ========================================

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${APP_NAME} Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will install ${APP_NAME} and the Printer Service on your computer.$\r$\n$\r$\nThe Printer Service will be installed as a Windows service and will start automatically.$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME

; License page
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"

; Directory selection page
!insertmacro MUI_PAGE_DIRECTORY

; Installation progress page
!insertmacro MUI_PAGE_INSTFILES

; Finish page
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APP_NAME}"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApplication"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; ========================================
; Installation Section
; ========================================

Section "Install" SEC01
    SetOutPath "$INSTDIR"

    ; ══════════════════════════════════════════
    ; 1. INSTALL ELECTRON POS APP
    ; ══════════════════════════════════════════
    DetailPrint "Installing POS Desktop Application..."
    File /r "dist\win-unpacked\*.*"

    ; ══════════════════════════════════════════
    ; 2. INSTALL PRINTER SERVICE FILES
    ; ══════════════════════════════════════════
    DetailPrint "Installing Printer Service..."
    SetOutPath "$INSTDIR\printer-service"
    File /r "printer-service\*.*"

    ; ══════════════════════════════════════════
    ; 3. CHECK IF SERVICE ALREADY EXISTS (UPDATE SCENARIO)
    ; ══════════════════════════════════════════
    DetailPrint "Checking for existing service..."
    nsExec::ExecToLog 'sc query "${SERVICE_NAME}"'
    Pop $0

    ${If} $0 == 0
        ; Service exists - stop it
        DetailPrint "Stopping existing service..."
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" stop "${SERVICE_NAME}"'
        Sleep 2000
    ${EndIf}

    ; ══════════════════════════════════════════
    ; 4. INSTALL/UPDATE SERVICE WITH NSSM
    ; ══════════════════════════════════════════
    ${If} $0 == 0
        ; Service exists - just update the executable path
        DetailPrint "Updating service configuration..."
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" Application "$INSTDIR\printer-service\node.exe"'
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" AppParameters "$INSTDIR\printer-service\src\server.js"'
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" AppDirectory "$INSTDIR\printer-service"'
    ${Else}
        ; Fresh install - create service
        DetailPrint "Installing Windows service..."
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" install "${SERVICE_NAME}" "$INSTDIR\printer-service\node.exe" "$INSTDIR\printer-service\src\server.js"'

        ; Set service display name and description
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" DisplayName "${SERVICE_DISPLAY}"'
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" Description "${SERVICE_DESCRIPTION}"'

        ; Set working directory
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" AppDirectory "$INSTDIR\printer-service"'

        ; Set auto-start
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" Start SERVICE_AUTO_START'

        ; Set log files
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" AppStdout "$INSTDIR\printer-service\logs\service-stdout.log"'
        nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" AppStderr "$INSTDIR\printer-service\logs\service-stderr.log"'
    ${EndIf}

    ; ══════════════════════════════════════════
    ; 5. START THE SERVICE
    ; ══════════════════════════════════════════
    DetailPrint "Starting printer service..."
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" start "${SERVICE_NAME}"'
    Pop $0

    ${If} $0 != 0
        MessageBox MB_ICONEXCLAMATION "Warning: Printer service failed to start.$\nYou may need to start it manually from Services."
    ${Else}
        DetailPrint "Printer service started successfully!"
    ${EndIf}

    ; ══════════════════════════════════════════
    ; 6. CREATE SHORTCUTS
    ; ══════════════════════════════════════════
    DetailPrint "Creating shortcuts..."
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"

    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" \
        "$INSTDIR\CottageTandooriPOS.exe" \
        "" \
        "$INSTDIR\CottageTandooriPOS.exe" \
        0

    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" \
        "$INSTDIR\CottageTandooriPOS.exe" \
        "" \
        "$INSTDIR\CottageTandooriPOS.exe" \
        0

    ; Create uninstaller shortcut
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" \
        "$INSTDIR\Uninstall.exe"

    DetailPrint "Shortcuts created!"

    ; ══════════════════════════════════════════
    ; 7. WRITE UNINSTALLER
    ; ══════════════════════════════════════════
    DetailPrint "Creating uninstaller..."
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; ══════════════════════════════════════════
    ; 8. ADD TO ADD/REMOVE PROGRAMS
    ; ══════════════════════════════════════════
    DetailPrint "Registering with Windows..."
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "DisplayName" "${APP_NAME}"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "UninstallString" "$INSTDIR\Uninstall.exe"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "DisplayIcon" "$INSTDIR\CottageTandooriPOS.exe"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "DisplayVersion" "${APP_VERSION}"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "Publisher" "${COMPANY_NAME}"

    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "NoModify" 1

    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
        "NoRepair" 1

    DetailPrint "Installation complete!"
SectionEnd

; ========================================
; Uninstaller Section
; ========================================

Section "Uninstall"
    ; ══════════════════════════════════════════
    ; 1. STOP AND REMOVE SERVICE
    ; ══════════════════════════════════════════
    DetailPrint "Stopping printer service..."
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" stop "${SERVICE_NAME}"'
    Sleep 2000

    DetailPrint "Removing printer service..."
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" remove "${SERVICE_NAME}" confirm'

    ; ══════════════════════════════════════════
    ; 2. DELETE FILES
    ; ══════════════════════════════════════════
    DetailPrint "Removing files..."
    RMDir /r "$INSTDIR"

    ; ══════════════════════════════════════════
    ; 3. DELETE SHORTCUTS
    ; ══════════════════════════════════════════
    DetailPrint "Removing shortcuts..."
    Delete "$DESKTOP\${APP_NAME}.lnk"
    RMDir /r "$SMPROGRAMS\${APP_NAME}"

    ; ══════════════════════════════════════════
    ; 4. REMOVE REGISTRY ENTRIES
    ; ══════════════════════════════════════════
    DetailPrint "Removing registry entries..."
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

    DetailPrint "Uninstall complete!"
SectionEnd

; ========================================
; Launch Application Function
; ========================================

Function LaunchApplication
    Exec '"$INSTDIR\CottageTandooriPOS.exe"'
FunctionEnd
