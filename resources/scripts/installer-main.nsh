; ============================================================
; DKA Cashier POS Apps - NSIS Main Include (electron-builder)
; File : resources/scripts/installer-main.nsh
; ============================================================

; ---- Include dasar NSIS ----
!include "FileFunc.nsh"
!include "LogicLib.nsh"

; ---- Tambah search path include (robust untuk electron-builder) ----
; ${BUILD_RESOURCES_DIR} akan menunjuk ke folder "resources"
!addincludedir "${BUILD_RESOURCES_DIR}\scripts"
!addincludedir "${BUILD_RESOURCES_DIR}/scripts"
!addincludedir "resources/scripts"           ; fallback lokal
!addincludedir "."                           ; fallback ekstra

; ---- Include modul kustom (opsional, guarded) ----
; Wajib (disarankan): ACL untuk folder database
!include "installer-acl.nsh"

; Opsional: atur firewall (contoh macro: FIREWALL_RULES / FIREWALL_CLEANUP)
!ifdef FIREWALL_RULES
  !define DKA_HAS_FIREWALL 1
!endif
!ifdef FIREWALL_CLEANUP
  !define DKA_HAS_FIREWALL 1
!endif
!include "installer-firewall.nsh"

; Opsional: registry penunjang (contoh macro: REG_WRITE / REG_CLEANUP)
!ifdef REG_WRITE
  !define DKA_HAS_REGISTRY 1
!endif
!ifdef REG_CLEANUP
  !define DKA_HAS_REGISTRY 1
!endif
!include "installer-registry.nsh"

; Opsional: service helper (contoh macro: SERVICE_INSTALL / SERVICE_REMOVE)
!ifdef SERVICE_INSTALL
  !define DKA_HAS_SERVICE 1
!endif
!ifdef SERVICE_REMOVE
  !define DKA_HAS_SERVICE 1
!endif
!include "installer-services.nsh"

; ============================================================
; Helper umum
; ============================================================
!macro DKA_LogLine MSG
  DetailPrint "${MSG}"
!macroend

!macro DKA_LogKV K V
  DetailPrint "${K}: ${V}"
!macroend

; ============================================================
; Hook: preInit
; Dipanggil PALING AWAL oleh electron-builder sebelum UI.
; Cocok untuk early env/probe/arch checks.
; ============================================================
!macro preInit
  !insertmacro DKA_LogLine "==== preInit ===="

  ; Sanity: pastikan variable utama dari electron-builder ada
  ; (Biasanya otomatis ada; ini sekadar debug)
  !insertmacro DKA_LogKV "INSTDIR" "$InstDir"
  !insertmacro DKA_LogKV "PROGRAMFILES" "$PROGRAMFILES"
  !insertmacro DKA_LogKV "PROGRAMFILES64" "$PROGRAMFILES64"

  ; Contoh: cek arsitektur
  ${If} ${RunningX64}
    !insertmacro DKA_LogLine "Detected: 64-bit OS"
  ${Else}
    !insertmacro DKA_LogLine "Detected: 32-bit OS"
  ${EndIf}

  ; Panggil pre-flight dari modul-modul (jika disediakan)
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
; Hook: customHeader (opsional)
; Dipanggil sebelum Section ditulis; bisa buat banner/log awal.
; ============================================================
!macro customHeader
  !insertmacro DKA_LogLine "==== customHeader ===="
  !insertmacro DKA_LogLine "DKA Cashier POS – preparing installation…"
!macroend

; ============================================================
; Hook: customInstall
; Dipanggil SETELAH electron-builder selesai menyalin file.
; Tempat yang tepat untuk: ACL, firewall rule, registry, service, dsb.
; ============================================================
!macro customInstall
  !insertmacro DKA_LogLine "==== customInstall ===="

  ; --- ACL untuk folder database di $InstDir\database ---
  !ifdef ACL_APPLY
    !insertmacro DKA_LogLine "Applying ACL to database directory…"
    !insertmacro ACL_APPLY
  !else
    !insertmacro DKA_LogLine "ACL_APPLY not defined – skipping ACL."
  !endif

  ; --- Firewall rules (opsional) ---
  !ifdef DKA_HAS_FIREWALL
    !insertmacro DKA_LogLine "Configuring firewall rules…"
    !ifdef FIREWALL_RULES
      !insertmacro FIREWALL_RULES
    !endif
  !endif

  ; --- Registry writes (opsional) ---
  !ifdef DKA_HAS_REGISTRY
    !insertmacro DKA_LogLine "Writing registry keys…"
    !ifdef REG_WRITE
      !insertmacro REG_WRITE
    !endif
  !endif

  ; --- Service install (opsional) ---
  !ifdef DKA_HAS_SERVICE
    !insertmacro DKA_LogLine "Installing services…"
    !ifdef SERVICE_INSTALL
      !insertmacro SERVICE_INSTALL
    !endif
  !endif

  !insertmacro DKA_LogLine "==== customInstall done ===="
!macroend

; ============================================================
; Hook: customUnInstall
; Dipanggil saat proses UNINSTALL.
; Tempat untuk rollback: remove ACL/custom, firewall, registry, service.
; ============================================================
!macro customUnInstall
  !insertmacro DKA_LogLine "==== customUnInstall ===="

  ; --- Firewall cleanup (opsional) ---
  !ifdef DKA_HAS_FIREWALL
    !insertmacro DKA_LogLine "Removing firewall rules…"
    !ifdef FIREWALL_CLEANUP
      !insertmacro FIREWALL_CLEANUP
    !endif
  !endif

  ; --- Registry cleanup (opsional) ---
  !ifdef DKA_HAS_REGISTRY
    !insertmacro DKA_LogLine "Cleaning registry keys…"
    !ifdef REG_CLEANUP
      !insertmacro REG_CLEANUP
    !endif
  !endif

  ; --- Services remove (opsional) ---
  !ifdef DKA_HAS_SERVICE
    !insertmacro DKA_LogLine "Removing services…"
    !ifdef SERVICE_REMOVE
      !insertmacro SERVICE_REMOVE
    !endif
  !endif

  ; --- Revert ACL (kalau mau balikin inheritance/ACL default) ---
  !ifdef ACL_REVERT
    !insertmacro DKA_LogLine "Reverting ACL on database directory…"
    !insertmacro ACL_REVERT
  !else
    !insertmacro DKA_LogLine "ACL_REVERT not defined – skipping ACL revert."
  !endif

  !insertmacro DKA_LogLine "==== customUnInstall done ===="
!macroend

; ============================================================
; Fallback Section (opsional)
; Kalau kamu mau jalankan ACL_APPLY bahkan tanpa hook electron-builder,
; uncomment Section ini. Biasanya tidak diperlukan kalau hook bekerja.
; ============================================================
; Section -PostInstallFallback
;   !ifdef ACL_APPLY
;     !insertmacro ACL_APPLY
;   !endif
; SectionEnd
