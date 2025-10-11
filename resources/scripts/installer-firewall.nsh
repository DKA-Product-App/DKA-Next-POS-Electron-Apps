; ============================================================
; DKA POS - Windows Firewall rules (NSIS)
; File: resources/scripts/installer-firewall.nsh
; Requires: LogicLib.nsh
; Usage: call !insertmacro FIREWALL_RULES on install,
;        call !insertmacro FIREWALL_CLEANUP on uninstall.
; ============================================================

!include "LogicLib.nsh"

Var DKA_NETSH_PATH

; ---- Resolve netsh path (Sysnative-safe for 32-bit installer on 64-bit OS) ----
!macro FIREWALL_RESOLVE_NETSH
  ${If} ${RunningX64}
    StrCpy $DKA_NETSH_PATH "$WINDIR\Sysnative\netsh.exe"
    ${IfNot} ${FileExists} "$DKA_NETSH_PATH"
      StrCpy $DKA_NETSH_PATH "$WINDIR\System32\netsh.exe"
    ${EndIf}
  ${Else}
    StrCpy $DKA_NETSH_PATH "$WINDIR\System32\netsh.exe"
  ${EndIf}
!macroend

; ---- Exec helper: nsExec::ExecToStack pushes (stdout, exitcode) ----
!macro _FW_RUN CMD
  nsExec::ExecToStack '"$DKA_NETSH_PATH" ${CMD}'
  Pop $0   ; stdout / stderr
  Pop $1   ; exit code
  DetailPrint 'netsh ${CMD}'
  DetailPrint '  -> exit=$1'
  ${If} $0 != ""
    DetailPrint '  -> out: $0'
  ${EndIf}
!macroend

; ---- Upsert allow rule for a TCP port ----
!macro _FW_ALLOW_TCP PORT
  ; Delete existing rule with same name (idempotent)
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS TCP ${PORT}" protocol=TCP localport=${PORT}'
  ; Add new allow rule for all profiles
  !insertmacro _FW_RUN 'advfirewall firewall add rule name="DKA POS TCP ${PORT}" dir=in action=allow protocol=TCP localport=${PORT} profile=any enable=yes'
!macroend

; ---- Delete allow rule for a TCP port ----
!macro _FW_DELETE_TCP PORT
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS TCP ${PORT}" protocol=TCP localport=${PORT}'
!macroend

; ============================================================
; Public macros called by installer-main.nsh hooks
; ============================================================
!macro FIREWALL_PREINIT
  ; optional: just resolves path & prints version
  !insertmacro FIREWALL_RESOLVE_NETSH
  !insertmacro _FW_RUN "advfirewall show allprofiles"
!macroend

!macro FIREWALL_RULES
  !insertmacro FIREWALL_RESOLVE_NETSH
  ; Open inbound TCP ports
  !insertmacro _FW_ALLOW_TCP 5900
  !insertmacro _FW_ALLOW_TCP 8083
  !insertmacro _FW_ALLOW_TCP 443
  !insertmacro _FW_ALLOW_TCP 80
!macroend

!macro FIREWALL_CLEANUP
  !insertmacro FIREWALL_RESOLVE_NETSH
  ; Remove rules (best-effort)
  !insertmacro _FW_DELETE_TCP 5900
  !insertmacro _FW_DELETE_TCP 8083
  !insertmacro _FW_DELETE_TCP 443
  !insertmacro _FW_DELETE_TCP 80
!macroend
