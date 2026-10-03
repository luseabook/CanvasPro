!macro customInstallMode
  ${if} ${isUpdated}
    ${if} $hasPerMachineInstallation == "1"
      StrCpy $isForceMachineInstall "1"
    ${else}
      StrCpy $isForceCurrentInstall "1"
    ${endif}
  ${endif}
!macroend

; Never force-kill an editor that might still be saving or displaying a cancelable close dialog.
!macro ensureExistingAppClosed
  ${if} $INSTDIR != ""
    InitPluginsDir
    File /oname=$PLUGINSDIR\aic-process-check.ps1 "${BUILD_RESOURCES_DIR}\installer-process-check.ps1"
    DetailPrint "Waiting for the selected installation to close. Save work and exit the editor first."
    nsExec::ExecToStack `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\aic-process-check.ps1" -InstallDir "$INSTDIR" -ExecutableName "${APP_EXECUTABLE_FILENAME}"`
    Pop $0
    Pop $1
    ${if} $0 != 0
      ${ifNot} ${Silent}
        MessageBox MB_OK|MB_ICONEXCLAMATION "Installation or removal was cancelled. Please save your work, close the editor, and retry. No application process was force-terminated."
      ${endif}
      SetErrorLevel 2
      Quit
    ${endif}
  ${endif}
!macroend

!macro customInit
  !insertmacro ensureExistingAppClosed
!macroend

!macro customCheckAppRunning
  !insertmacro ensureExistingAppClosed
!macroend

!macro customInstall
  ${if} ${isUpdated}
  ${andIf} ${isForceRun}
    HideWindow
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "--updated"
    !insertmacro quitSuccess
  ${endif}
!macroend

!macro verifyOldUninstallerResult
  ${if} ${Errors}
    ${ifNot} ${Silent}
      MessageBox MB_OK|MB_ICONEXCLAMATION "The previous uninstaller could not be started. Installation was cancelled; existing files were retained."
    ${endif}
    SetErrorLevel 2
    Quit
  ${endif}
  ${if} $R0 != 0
    ${ifNot} ${Silent}
      MessageBox MB_OK|MB_ICONEXCLAMATION "The previous uninstaller did not complete ($R0). Installation was cancelled instead of assuming cleanup succeeded."
    ${endif}
    SetErrorLevel 2
    Quit
  ${endif}
!macroend

!macro customUnInstallCheck
  !insertmacro verifyOldUninstallerResult
!macroend

!macro customUnInstallCheckCurrentUser
  !insertmacro verifyOldUninstallerResult
!macroend

!macro customRemoveFiles
  !insertmacro ensureExistingAppClosed
  InitPluginsDir
  File /oname=$PLUGINSDIR\aic-remove-program-files.ps1 "${BUILD_RESOURCES_DIR}\uninstall-program-files.ps1"
  SetOutPath $TEMP
  nsExec::ExecToStack `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\aic-remove-program-files.ps1" -InstallDir "$INSTDIR"`
  Pop $0
  Pop $1
  ${if} $0 != 0
    ${ifNot} ${Silent}
      MessageBox MB_OK|MB_ICONEXCLAMATION "Program cleanup could not be verified. Removal was stopped. Data folders, unknown files, and modified files are retained in place."
    ${endif}
    SetErrorLevel 2
    Quit
  ${endif}
  ; The generated uninstaller is not part of the packed application manifest.
  Delete "$INSTDIR\${UNINSTALL_FILENAME}"
  ; Deliberately non-recursive. Unknown/legacy content is never removed implicitly.
  RMDir "$INSTDIR"
!macroend
