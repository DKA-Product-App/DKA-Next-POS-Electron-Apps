; ============================================================
; DKA Cashier POS Apps - NSIS Main Include (electron-builder)
; File : resources/scripts/installer-main.nsh
; ============================================================

!verbose push
!verbose 3

!include "FileFunc.nsh"

; Pastikan semua lokasi include aman (CI kadang beda cwd)
!addincludedir "${BUILD_RESOURCES_DIR}\scripts"
!addincludedir "${BUILD_RESOURCES_DIR}/scripts"
!addincludedir "resources/scripts"
!addincludedir "."

; ===== Wajib / fitur =====
!include "installer-acl.nsh"
!include "installer-firewall.nsh"

; ============================================================
; Helper log (runtime)
; ============================================================
!macro DKA_LogLine MSG
  DetailPrint "${MSG}"
!macroend
!macro DKA_LogKV K V
  DetailPrint "${K}: ${V}"
!macroend

; ============================================================
; preInit (runtime; valid context)
; ============================================================
!macro preInit
  !insertmacro DKA_LogLine "==== preInit ===="
  !insertmacro DKA_LogKV "INSTDIR" "$InstDir"

  ; Deteksi 64-bit via Sysnative presence (runtime)
  StrCpy $0 "32-bit OS (assumed)"
  IfFileExists "$WINDIR\Sysnative\*.*" 0 +2
    StrCpy $0 "64-bit OS (detected by Sysnative)"
  !insertmacro DKA_LogKV "OS" "$0"

  ; Preinit Firewall (selalu aman, makro handle missing netsh)
  !insertmacro FIREWALL_PREINIT

  !insertmacro DKA_LogLine "==== preInit done ===="
!macroend

; ============================================================
; customHeader (compile-time only; JANGAN pakai DetailPrint)
; ============================================================
!macro customHeader
  !echo "==== customHeader ===="
  !echo "DKA Cashier POS – preparing installation…"
!macroend

; ============================================================
; customInstall (runtime)
; ============================================================
!macro customInstall
  !insertmacro DKA_LogLine "==== customInstall ===="

  ; Selalu apply ACL (makro internal sudah graceful)
  !insertmacro ACL_APPLY

  ; Selalu pasang firewall rules (graceful kalau netsh nggak ada)
  !insertmacro FIREWALL_RULES

  !insertmacro DKA_LogLine "==== customInstall done ===="
!macroend

; ============================================================
; customUnInstall (runtime)
; ============================================================
!macro customUnInstall
  !insertmacro DKA_LogLine "==== customUnInstall ===="

  !insertmacro FIREWALL_CLEANUP
  !insertmacro ACL_REVERT

  !insertmacro DKA_LogLine "==== customUnInstall done ===="
!macroend

!verbose pop
