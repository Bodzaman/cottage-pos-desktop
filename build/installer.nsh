!macro customInstall
  ; Install Cottage Tandoori Printer Service using NSSM
  ; This runs with admin privileges (perMachine: true, allowElevation: true)
  
  DetailPrint "Installing Cottage Tandoori Printer Service..."
  
  ; Path to NSSM executable
  StrCpy $0 "$INSTDIR\resources\printer-service\tools\nssm.exe"
  
  ; Path to Node.js in printer-service
  StrCpy $1 "$INSTDIR\resources\printer-service\node.exe"
  
  ; Path to server.js
  StrCpy $2 "$INSTDIR\resources\printer-service\src\server.js"
  
  ; Service name
  StrCpy $3 "CottagePrinterService"
  
  ; Check if service already exists (upgrade scenario)
  nsExec::ExecToStack '"$0" status "$3"'
  Pop $4
  Pop $5
  
  ; If service exists (exit code 0), stop and remove it first
  ${If} $4 == 0
    DetailPrint "Stopping existing printer service..."
    nsExec::ExecToLog '"$0" stop "$3"'
    Sleep 2000
    
    DetailPrint "Removing existing printer service..."
    nsExec::ExecToLog '"$0" remove "$3" confirm'
    Sleep 1000
  ${EndIf}
  
  ; Install the service
  DetailPrint "Creating printer service..."
  nsExec::ExecToLog '"$0" install "$3" "$1" "$2"'
  
  ; Set service description
  nsExec::ExecToLog '"$0" set "$3" Description "Cottage Tandoori Thermal Printer Service - Handles kitchen and receipt printing"'
  
  ; Set working directory
  nsExec::ExecToLog '"$0" set "$3" AppDirectory "$INSTDIR\resources\printer-service"'
  
  ; Set service to start automatically
  nsExec::ExecToLog '"$0" set "$3" Start SERVICE_AUTO_START"'
  
  ; Configure service restart on failure
  nsExec::ExecToLog '"$0" set "$3" AppStdout "$INSTDIR\resources\printer-service\logs\service-stdout.log"'
  nsExec::ExecToLog '"$0" set "$3" AppStderr "$INSTDIR\resources\printer-service\logs\service-stderr.log"'
  
  ; Start the service
  DetailPrint "Starting printer service..."
  nsExec::ExecToLog '"$0" start "$3"'
  
  ; Wait a moment for service to start
  Sleep 2000
  
  ; Check service status
  nsExec::ExecToStack '"$0" status "$3"'
  Pop $4
  Pop $5
  
  ${If} $4 == 0
    DetailPrint "✓ Printer service installed and running successfully"
  ${Else}
    DetailPrint "⚠ Service installed but may not be running. Check Event Viewer for details."
  ${EndIf}
!macroend

!macro customUnInstall
  ; Uninstall Cottage Tandoori Printer Service
  DetailPrint "Uninstalling Cottage Tandoori Printer Service..."
  
  ; Path to NSSM executable
  StrCpy $0 "$INSTDIR\resources\printer-service\tools\nssm.exe"
  StrCpy $3 "CottagePrinterService"
  
  ; Check if service exists
  nsExec::ExecToStack '"$0" status "$3"'
  Pop $4
  Pop $5
  
  ${If} $4 == 0
    ; Service exists, stop it first
    DetailPrint "Stopping printer service..."
    nsExec::ExecToLog '"$0" stop "$3"'
    Sleep 2000
    
    ; Remove service
    DetailPrint "Removing printer service..."
    nsExec::ExecToLog '"$0" remove "$3" confirm'
    
    DetailPrint "✓ Printer service uninstalled successfully"
  ${Else}
    DetailPrint "Service not found, skipping removal"
  ${EndIf}
!macroend
