; =======================
; DKA - ACL Helpers (NSIS 3.0.4.1 compatible)
; =======================

!include "FileFunc.nsh"
!include "nsExec.nsh"         ; untuk nsExec::ExecToStack (jalan di NSIS 3.0.4.1)

; =======================
; Konstanta
; =======================
!define DKA_DB_DIR "$InstDir\database"
!define SID_BUILTIN_USERS "S-1-5-32-545"    ; Builtin\Users (universal, lintas bahasa)

Var DKA_ICACLS_PATH
Var DKA_TMP_OUT
Var DKA_TMP_CODE

; =======================
; Resolve path icacls (Sysnative-safe, tanpa LogicLib)
; =======================
!macro DKA_RESOLVE_ICACLS
  ; Prefer Sysnative (untuk proses 32-bit di OS 64-bit)
  StrCpy $DKA_ICACLS_PATH "$WINDIR\Sysnative\icacls.exe"
  IfFileExists "$DKA_ICACLS_PATH" 0 +3
    ; ketemu Sysnative\icacls.exe
    Goto dka_icacls_done

  ; fallback ke System32
  StrCpy $DKA_ICACLS_PATH "$WINDIR\System32\icacls.exe"
  IfFileExists "$DKA_ICACLS_PATH" 0 +2
    Goto dka_icacls_done

  ; last resort: kosongkan biar caller tau "ga ada"
  StrCpy $DKA_ICACLS_PATH ""

dka_icacls_done:
!macroend

; =======================
; Helper eksekusi icacls
; (ExecToStack -> output dulu, lalu exitcode)
; =======================
!macro _RunIcacls CMD
  nsExec::ExecToStack '"$DKA_ICACLS_PATH" ${CMD}'
  Pop $DKA_TMP_OUT     ; stdout/stderr
  Pop $DKA_TMP_CODE    ; exitCode
  DetailPrint 'icacls ${CMD}'
  DetailPrint '  -> exit=$DKA_TMP_CODE'
  StrCmp $DKA_TMP_OUT "" +2 0
    DetailPrint '  -> out: $DKA_TMP_OUT'
!macroend

; =======================
; Macro: apply ACL (dipanggil saat install)
; =======================
!macro ACL_APPLY
  DetailPrint 'ACL_APPLY: start'

  !insertmacro DKA_RESOLVE_ICACLS

  StrCmp "$DKA_ICACLS_PATH" "" dka_acl_skip 0

  ; Pastikan folder ada
  CreateDirectory "${DKA_DB_DIR}"

  ; Putus inheritance dari Program Files -> biar ACE custom berlaku
  !insertmacro _RunIcacls '/inheritance:d "${DKA_DB_DIR}"'

  ; Hapus ACE lama utk Builtin Users (idempotent)
  !insertmacro _RunIcacls '/remove:g *${SID_BUILTIN_USERS} "${DKA_DB_DIR}"'

  ; Grant Modify (M) + turunan (OI/CI)
  !insertmacro _RunIcacls '/grant *${SID_BUILTIN_USERS}:(OI)(CI)M "${DKA_DB_DIR}"'

  ; Terapkan ke isi saat ini (kalau sudah ada struktur)
  !insertmacro _RunIcacls '/T /C "${DKA_DB_DIR}"'

  DetailPrint 'ACL_APPLY: done'
  Goto dka_acl_end

dka_acl_skip:
  DetailPrint 'icacls not found, skip ACL'

dka_acl_end:
!macroend

; =======================
; Macro: revert ACL (dipanggil saat uninstall)
; =======================
!macro ACL_REVERT
  DetailPrint 'ACL_REVERT: start'

  IfFileExists "${DKA_DB_DIR}\*.*" 0 dka_acl_revert_end

  !insertmacro DKA_RESOLVE_ICACLS
  StrCmp "$DKA_ICACLS_PATH" "" dka_acl_revert_end 0

  ; Kembalikan inheritance dan reset ACE ke default parent
  !insertmacro _RunIcacls '/inheritance:e "${DKA_DB_DIR}"'
  !insertmacro _RunIcacls '/reset /T /C "${DKA_DB_DIR}"'

dka_acl_revert_end:
  DetailPrint 'ACL_REVERT: done'
!macroend

; =======================
; Fallback Section (jika tidak pakai hook electron-builder)
; Aman dipanggil berulang, idempotent.
; =======================
Section -PostInstallACL
  !insertmacro ACL_APPLY
SectionEnd

; (Opsional) Section uninstaller supaya kebagian revert kalau dipanggil langsung
Section -un.ACL_REVERT
  !insertmacro ACL_REVERT
SectionEnd
