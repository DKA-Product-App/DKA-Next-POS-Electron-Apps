; ============================================================
; DKA Cashier POS Apps - NSIS Main Include (electron-builder)
; File : resources/scripts/installer-main.nsh
; ============================================================

!include "FileFunc.nsh"
; !include "nsExec.nsh"

; ${BUILD_RESOURCES_DIR} -> folder "resources" (atau sesuai directories.buildResources)
!addincludedir "${BUILD_RESOURCES_DIR}\scripts"
!addincludedir "${BUILD_RESOURCES_DIR}/scripts"
!addincludedir "resources/scripts"
!addincludedir "."

; ===== Wajib: ACL untuk folder database =====
!include "installer-acl.nsh"

; ===== Opsional: modul lain (boleh kosong, tapi file harus ada) =====
!include "installer-firewall.nsh"

; ---- Setelah include, baru cek macro yang tersedia ----
!ifdef FIREWALL_RULES
  !define DKA_HAS_FIREWALL 1
!endif
!ifdef FIREWALL_CLEANUP
  !define DKA_HAS_FIREWALL 1
!endif

; ============================================================
; Helper log
; ============================================================
!macro DKA_LogLine MSG
  DetailPrint "${MSG}"
!macroend
!macro DKA_LogKV K V
  DetailPrint "${K}: ${V}"
!macroend

; ============================================================
; preInit (tanpa LogicLib; deteksi 64-bit pakai Sysnative probe)
; ============================================================
!macro preInit
  !insertmacro DKA_LogLine "==== preInit ===="
  !insertmacro DKA_LogKV "INSTDIR" "$InstDir"

  ; Deteksi arsitektur OS tanpa LogicLib:
  ; Jika folder %WINDIR%\Sysnative ada (visible dari proses 32-bit), berarti OS 64-bit.
  StrCpy $0 "32-bit OS (assumed)"
  IfFileExists "$WINDIR\Sysnative\*.*" 0 +2
    StrCpy $0 "64-bit OS (detected by Sysnative)"
  !insertmacro DKA_LogKV "OS" "$0"

  !ifdef ACL_PREINIT
    !insertmacro DKA_LogLine "ACL_PREINIT"
    !insertmacro ACL_PREINIT
  !endif
  !ifdef FIREWALL_PREINIT
    !insertmacro DKA_LogLine "FIREWALL_PREINIT"
    !insertmacro FIREWALL_PREINIT
  !endif
  !ifdef REG_PREINIT
    !insertmacro DKA_LogLine "REG_PREINIT"
    !insertmacro REG_PREINIT
  !endif
  !insertmacro DKA_LogLine "==== preInit done ===="
!macroend

; ============================================================
; customHeader (opsional)
; ============================================================
!macro customHeader
  !insertmacro DKA_LogLine "==== customHeader ===="
  !insertmacro DKA_LogLine "DKA Cashier POS – preparing installation…"
!macroend

; ============================================================
; customInstall
; ============================================================
!macro customInstall
  !insertmacro DKA_LogLine "==== customInstall ===="

  !ifdef ACL_APPLY
    !insertmacro DKA_LogLine "Applying ACL to database directory…"
    !insertmacro ACL_APPLY
  !else
    !insertmacro DKA_LogLine "ACL_APPLY not defined – skipping ACL."
  !endif

  !ifdef DKA_HAS_FIREWALL
    !insertmacro DKA_LogLine "Configuring firewall rules…"
    !ifdef FIREWALL_RULES
      !insertmacro FIREWALL_RULES
    !endif
  !endif

  !insertmacro DKA_LogLine "==== customInstall done ===="
!macroend

; ============================================================
; customUnInstall
; ============================================================
!macro customUnInstall
  !insertmacro DKA_LogLine "==== customUnInstall ===="

  !ifdef DKA_HAS_FIREWALL
    !insertmacro DKA_LogLine "Removing firewall rules…"
    !ifdef FIREWALL_CLEANUP
      !insertmacro FIREWALL_CLEANUP
    !endif
  !endif

  !ifdef ACL_REVERT
    !insertmacro DKA_LogLine "Reverting ACL on database directory…"
    !insertmacro ACL_REVERT
  !else
    !insertmacro DKA_LogLine "ACL_REVERT not defined – skipping ACL revert."
  !endif

  !insertmacro DKA_LogLine "==== customUnInstall done ===="
!macroend

; (Fallback Section kalau mau, tetap sama punyamu)
