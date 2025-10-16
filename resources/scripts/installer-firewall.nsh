; ============================================================
; DKA POS - Windows Firewall rules (NSIS 3.0.4.1 compatible)
; File: resources/scripts/installer-firewall.nsh
; Usage: call !insertmacro FIREWALL_RULES on install,
;        call !insertmacro FIREWALL_CLEANUP on uninstall.
; ============================================================

- !include "nsExec.nsh"

Var DKA_NETSH_PATH
Var DKA_FW_OUT
Var DKA_FW_CODE

; ---- Resolve netsh path (Sysnative-safe untuk 32-bit installer di 64-bit OS) ----
!macro FIREWALL_RESOLVE_NETSH
  ; Coba %WINDIR%\Sysnative\netsh.exe dulu (visible dari proses 32-bit di OS 64-bit)
  StrCpy $DKA_NETSH_PATH "$WINDIR\Sysnative\netsh.exe"
  IfFileExists "$DKA_NETSH_PATH" 0 +3
    Goto dka_fw_resolved

  ; Fallback ke System32
  StrCpy $DKA_NETSH_PATH "$WINDIR\System32\netsh.exe"
  IfFileExists "$DKA_NETSH_PATH" 0 +2
    Goto dka_fw_resolved

  ; Last resort: kosongkan (biar caller bisa skip dengan aman)
  StrCpy $DKA_NETSH_PATH ""

dka_fw_resolved:
!macroend

; ---- Exec helper: nsExec::ExecToStack pushes (stdout, exitcode) ----
!macro _FW_RUN CMD
  nsExec::ExecToStack '"$DKA_NETSH_PATH" ${CMD}'
  Pop $DKA_FW_OUT    ; stdout / stderr
  Pop $DKA_FW_CODE   ; exit code
  DetailPrint 'netsh ${CMD}'
  DetailPrint '  -> exit=$DKA_FW_CODE'
  StrCmp $DKA_FW_OUT "" +2 0
    DetailPrint '  -> out: $DKA_FW_OUT'
!macroend

; ---- Upsert allow rule untuk TCP port ----
!macro _FW_ALLOW_TCP PORT
  ; Hapus rule lama (idempotent)
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS TCP ${PORT}" protocol=TCP localport=${PORT}'
  ; Tambah rule baru (all profiles)
  !insertmacro _FW_RUN 'advfirewall firewall add rule name="DKA POS TCP ${PORT}" dir=in action=allow protocol=TCP localport=${PORT} profile=any enable=yes'
!macroend

; ---- Delete allow rule untuk TCP port ----
!macro _FW_DELETE_TCP PORT
  !insertmacro _FW_RUN 'advfirewall firewall delete rule name="DKA POS TCP ${PORT}" protocol=TCP localport=${PORT}'
!macroend

; ============================================================
; Public macros dipanggil dari installer-main.nsh hooks
; ============================================================
!macro FIREWALL_PREINIT
  !insertmacro FIREWALL_RESOLVE_NETSH
  StrCmp "$DKA_NETSH_PATH" "" dka_fw_preinit_skip 0
    ; optional: show profile status biar keliatan di log
    !insertmacro _FW_RUN "advfirewall show allprofiles"
    Goto dka_fw_preinit_end
dka_fw_preinit_skip:
  DetailPrint "netsh.exe not found, skipping firewall preinit"
dka_fw_preinit_end:
!macroend

!macro FIREWALL_RULES
  !insertmacro FIREWALL_RESOLVE_NETSH
  StrCmp "$DKA_NETSH_PATH" "" dka_fw_rules_skip 0

  ; Buka inbound TCP ports
  !insertmacro _FW_ALLOW_TCP 5900
  !insertmacro _FW_ALLOW_TCP 8083
  !insertmacro _FW_ALLOW_TCP 443
  !insertmacro _FW_ALLOW_TCP 80

  Goto dka_fw_rules_end
dka_fw_rules_skip:
  DetailPrint "netsh.exe not found, skipping firewall rules"
dka_fw_rules_end:
!macroend

!macro FIREWALL_CLEANUP
  !insertmacro FIREWALL_RESOLVE_NETSH
  StrCmp "$DKA_NETSH_PATH" "" dka_fw_cleanup_skip 0

  ; Hapus rules (best-effort)
  !insertmacro _FW_DELETE_TCP 5900
  !insertmacro _FW_DELETE_TCP 8083
  !insertmacro _FW_DELETE_TCP 443
  !insertmacro _FW_DELETE_TCP 80

  Goto dka_fw_cleanup_end
dka_fw_cleanup_skip:
  DetailPrint "netsh.exe not found, skipping firewall cleanup"
dka_fw_cleanup_end:
!macroend
