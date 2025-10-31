!define APP_NAME "Cottage Tandoori POS"
!ifndef APP_VERSION
!define APP_VERSION "1.0.0"
!endif
!define COMPANY_NAME "Cottage Tandoori"
!define SERVICE_NAME "CottagePrinterService"
!define SERVICE_DISPLAY "Cottage Tandoori Printer Service"
!define SERVICE_DESCRIPTION "Background service for ESC/POS thermal printing"

Name "${APP_NAME}"
OutFile "installer\\CottageTandooriSetup-${APP_VERSION}.exe"
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
!define MUI_FINISHPAGE_RUN "$INSTDIR\Cottage Tandoori POS.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APP_NAME}"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; ========================================
; Installer Section
; ========================================

Section "Install" SEC01

    SetOutPath "$INSTDIR"
    
    ; Copy Electron POS Desktop files
    ; NOTE: makensis.exe is invoked from repo root, so paths are relative to root
    File /r "dist\win-unpacked\*"
    
    ; Copy printer service files
    SetOutPath "$INSTDIR\printer-service"
    File /r "printer-service\*"
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; Create Start Menu shortcuts
    CreateDirectory "$SMPROGRAMS\${COMPANY_NAME}"
    CreateShortcut "$SMPROGRAMS\${COMPANY_NAME}\${APP_NAME}.lnk" "$INSTDIR\Cottage Tandoori POS.exe"
    CreateShortcut "$SMPROGRAMS\${COMPANY_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    
    ; Create Desktop shortcut
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\Cottage Tandoori POS.exe"
    
    ; Add to Add/Remove Programs
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\Cottage Tandoori POS.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${COMPANY_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    
    ; Install printer service as Windows service using NSSM
    DetailPrint "Installing Printer Service..."
    
    ; Stop service if it exists
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" stop "${SERVICE_NAME}"'
    Sleep 2000
    
    ; Remove service if it exists
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" remove "${SERVICE_NAME}" confirm'
    Sleep 1000
    
    ; Install service
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" install "${SERVICE_NAME}" "$INSTDIR\printer-service\node.exe" "$INSTDIR\printer-service\server.js"'
    
    ; Configure service
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" DisplayName "${SERVICE_DISPLAY}"'
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" Description "${SERVICE_DESCRIPTION}"'
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" AppDirectory "$INSTDIR\printer-service"'
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" set "${SERVICE_NAME}" Start SERVICE_AUTO_START"'
    
    ; Start service
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" start "${SERVICE_NAME}"'
    
    DetailPrint "Printer Service installed and started successfully!"

SectionEnd

; ========================================
; Uninstaller Section
; ========================================

Section "Uninstall"

    ; Stop and remove printer service
    DetailPrint "Removing Printer Service..."
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" stop "${SERVICE_NAME}"'
    Sleep 2000
    nsExec::ExecToLog '"$INSTDIR\printer-service\tools\nssm.exe" remove "${SERVICE_NAME}" confirm'
    
    ; Remove files
    RMDir /r "$INSTDIR\*.*"
    RMDir "$INSTDIR"
    
    ; Remove shortcuts
    Delete "$DESKTOP\${APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${COMPANY_NAME}\${APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${COMPANY_NAME}\Uninstall.lnk"
    RMDir "$SMPROGRAMS\${COMPANY_NAME}"
    
    ; Remove registry keys
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
    
    DetailPrint "Uninstall complete!"

SectionEnd
