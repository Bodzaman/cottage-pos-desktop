!define PRODUCT_NAME "Cottage Tandoori Printer Service"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Cottage Tandoori"
!define INSTALL_DIR "$PROGRAMFILES64\CottageTandoori\PrinterService"
!define SERVICE_NAME "CottageTandooriPrinter"

; MUI Settings
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"

Name "${PRODUCT_NAME}"
OutFile "CottageTandooriPrinterService-Setup.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel admin

; MUI Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ============================================================
; INSTALLER SECTION
; ============================================================
Section "Install" SecInstall
  
  ; Stop existing service if running
  DetailPrint "Checking for existing service..."
  ExecWait '"$INSTDIR\\nssm.exe" stop ${SERVICE_NAME}' $0
  Sleep 2000
  ExecWait '"$INSTDIR\\nssm.exe" remove ${SERVICE_NAME} confirm' $0
  
  ; Create installation directory
  SetOutPath "$INSTDIR"
  
  ; Install NSSM (Windows Service Manager)
  File "nssm.exe"
  
  ; Install Node.js runtime
  SetOutPath "$INSTDIR\\node-runtime"
  File "node-runtime\\node.exe"
  
  ; Install printer service files
  SetOutPath "$INSTDIR\\printer-service"
  File /r "printer-service\\*.*"
  
  ; Create logs directory
  CreateDirectory "$PROGRAMDATA\\CottageTandoori\\Logs\\PrinterService"
  
  ; Register Windows service using NSSM
  DetailPrint "Registering Windows service..."
  
  ExecWait '"$INSTDIR\\nssm.exe" install ${SERVICE_NAME} "$INSTDIR\\node-runtime\\node.exe" "$INSTDIR\\printer-service\\src\\server.js"' $0
  ${If} $0 != 0
    DetailPrint "Failed to install service (exit code $0)"
    Abort "Service installation failed"
  ${EndIf}
  
  ; Configure service parameters
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} DisplayName "Cottage Tandoori Printer Service"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} Description "Thermal printer service for Cottage Tandoori POS system"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} Start SERVICE_AUTO_START"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppDirectory "$INSTDIR\\printer-service"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppStdout "$PROGRAMDATA\\CottageTandoori\\Logs\\PrinterService\\service.log"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppStderr "$PROGRAMDATA\\CottageTandoori\\Logs\\PrinterService\\service-error.log"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppRotateFiles 1'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppRotateOnline 1'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppRotateBytes 1048576'
  
  ; Set service to auto-restart on failure
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppExit Default Restart"'
  ExecWait '"$INSTDIR\\nssm.exe" set ${SERVICE_NAME} AppRestartDelay 5000'
  
  ; Start the service
  DetailPrint "Starting printer service..."
  ExecWait '"$INSTDIR\\nssm.exe" start ${SERVICE_NAME}' $0
  ${If} $0 != 0
    DetailPrint "Warning: Service start returned code $0"
  ${Else}
    DetailPrint "Service started successfully"
  ${EndIf}
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  
  ; Add to Add/Remove Programs
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}" "UninstallString" "$INSTDIR\\Uninstall.exe"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  DetailPrint "Installation complete!"
  MessageBox MB_OK "Cottage Tandoori Printer Service installed successfully!$\n$\nService is now running on http://localhost:3000"
  
SectionEnd

; ============================================================
; UNINSTALLER SECTION
; ============================================================
Section "Uninstall"
  
  ; Stop and remove service
  DetailPrint "Stopping printer service..."
  ExecWait '"$INSTDIR\\nssm.exe" stop ${SERVICE_NAME}'
  Sleep 2000
  ExecWait '"$INSTDIR\\nssm.exe" remove ${SERVICE_NAME} confirm'
  
  ; Remove files
  Delete "$INSTDIR\\Uninstall.exe"
  Delete "$INSTDIR\\nssm.exe"
  RMDir /r "$INSTDIR\\node-runtime"
  RMDir /r "$INSTDIR\\printer-service"
  RMDir "$INSTDIR"
  
  ; Remove registry entries
  DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}"
  
  ; Note: Logs are preserved for troubleshooting
  MessageBox MB_YESNO "Do you want to delete log files as well?" IDYES DeleteLogs IDNO SkipLogs
  
  DeleteLogs:
    RMDir /r "$PROGRAMDATA\\CottageTandoori\\Logs\\PrinterService"
  
  SkipLogs:
  DetailPrint "Uninstallation complete"
  
SectionEnd
