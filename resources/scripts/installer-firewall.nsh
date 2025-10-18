; ============================================================
; DKA POS - Windows Firewall rules (NSIS 3.x)
; File: resources/scripts/installer-firewall.nsh
; ============================================================

!verbose push
!verbose 3

!include "nsExec.nsh"
!include "WinVer.nsh"

Var DKA_NETSH_PATH
Var DKA_FW_OUT
Var DKA_FW_CODE

; ---- Resolve netsh path (Sysnative-safe) ----
!macro FIREWALL_RESOLVE_NETSH
  StrCpy $DKA_NETSH_PATH "$WINDIR\Sysnative\netsh.exe"
  IfFileExists "$DKA_NETSH_PATH" 0 +3
    Goto dka_fw_resolved

  StrCpy $DKA_NETSH_PATH "$WINDIR\System32\netsh.exe"
  IfFileExists "$DKA_NETSH_PATH" 0 +2
    Goto dka_fw_resolved

  StrCpy $DKA_NETSH_PATH ""
dka_fw_resolved:
!macroend

; ---- Exec helper ----
!macro _FW_RUN CMD
  nsExec::ExecToStack '"$DKA_NETSH_PATH" ${CMD}'
  Pop $DKA_FW_OUT
  Pop $DKA_FW_CODE
  DetailPrint 'netsh ${CMD}'
  DetailPrint '  -> exit=$DKA_FW_CODE'
  StrCmp $DKA_FW_OUT "" +2 0
    DetailPrint '  -> out: $DKA_FW_OUT'
!macroend

; (Opsional) allow EXE — kalau mau allow by app, bukan port
!macro _FW_ALLOW_APP NAME EXE_PATH
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="${NAME}" program="${EXE_PATH}"'
  !insertmacro _FW_RUN 'advfirewall firewall add rule name="${NAME}" dir=in action=allow program="${EXE_PATH}" enable=yes profile=any'
!macroend

; ---- Upsert allow rule untuk TCP port ----
!macro _FW_ALLOW_TCP PORT
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS TCP ${PORT}" protocol=TCP localport=${PORT}'
  !insertmacro _FW_RUN 'advfirewall firewall add rule name="DKA POS TCP ${PORT}" dir=in action=allow protocol=TCP localport=${PORT} profile=any enable=yes'
!macroend

; ---- Delete allow rule untuk TCP port ----
!macro _FW_DELETE_TCP PORT
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS TCP ${PORT}" protocol=TCP localport=${PORT}'
!macroend

; ============================================================
; Public macros
; ============================================================
!macro FIREWALL_PREINIT
  ${IfNot} ${AtLeastWin7}
    DetailPrint "OS < Windows 7, skipping firewall preinit"
    Return
  ${EndIf}

  !insertmacro FIREWALL_RESOLVE_NETSH
  StrCmp "$DKA_NETSH_PATH" "" dka_fw_preinit_skip 0
    !insertmacro _FW_RUN "advfirewall show allprofiles"
    Goto dka_fw_preinit_end
dka_fw_preinit_skip:
  DetailPrint "netsh.exe not found, skipping firewall preinit"
dka_fw_preinit_end:
!macroend

!macro FIREWALL_RULES
  ${IfNot} ${AtLeastWin7}
    DetailPrint "OS < Windows 7, skipping firewall rules"
    Return
  ${EndIf}

  !insertmacro FIREWALL_RESOLVE_NETSH
  StrCmp "$DKA_NETSH_PATH" "" dka_fw_rules_skip 0

  ; === Inbound TCP ports (sesuaikan daftar) ===
  !insertmacro _FW_ALLOW_TCP 5900
  !insertmacro _FW_ALLOW_TCP 8083
  !insertmacro _FW_ALLOW_TCP 443
  !insertmacro _FW_ALLOW_TCP 80

  ; (Opsional) allow EXE utama:
  ; !insertmacro _FW_ALLOW_APP "DKA POS App" "$InstDir\your-app.exe"

  Goto dka_fw_rules_end
dka_fw_rules_skip:
  DetailPrint "netsh.exe not found, skipping firewall rules"
dka_fw_rules_end:
!macroend

!macro FIREWALL_CLEANUP
  !insertmacro FIREWALL_RESOLVE_NETSH
  StrCmp "$DKA_NETSH_PATH" "" dka_fw_cleanup_skip 0

  !insertmacro _FW_DELETE_TCP 5900
  !insertmacro _FW_DELETE_TCP 8083
  !insertmacro _FW_DELETE_TCP 443
  !insertmacro _FW_DELETE_TCP 80

  ; (Opsional) hapus rule by app:
  ; !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS App"'

  Goto dka_fw_cleanup_end
dka_fw_cleanup_skip:
  DetailPrint "netsh.exe not found, skipping firewall cleanup"
dka_fw_cleanup_end:
!macroend

!verbose pop
