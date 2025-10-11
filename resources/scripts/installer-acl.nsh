!include "FileFunc.nsh"
!include "LogicLib.nsh"

; =======================
; Konstanta & helper
; =======================
!define DKA_DB_DIR "$InstDir\database"
!define SID_BUILTIN_USERS "S-1-5-32-545"    ; Builtin\Users (lintas bahasa)
; Kalau mau ganti target principal, tinggal ubah SID ini (mis. Authenticated Users: S-1-5-11)

!macro _RunIcacls CMD
  ; Jalankan icacls, pop 2x: exitCode lalu output
  nsExec::ExecToStack '${CMD}'
  Pop $1     ; exitCode
  Pop $2     ; stdout/stderr
  DetailPrint 'icacls: ${CMD}'
  DetailPrint '  -> exit=$1'
  ${If} $1 != 0
    DetailPrint '  -> out: $2'
  ${EndIf}
!macroend

; =======================
; Macro: apply ACL (dipanggil saat install)
; =======================
!macro ACL_APPLY
  DetailPrint 'ACL_APPLY: start'

  ; Pastikan icacls ada
  ${IfNot} ${FileExists} "$WINDIR\System32\icacls.exe"
    DetailPrint 'icacls not found, skip ACL'
    Return
  ${EndIf}

  ; Buat folder kalau belum ada
  CreateDirectory "${DKA_DB_DIR}"

  ; Putus inheritance dari Program Files → supaya ACE custom nggak ketiban
  !insertmacro _RunIcacls 'icacls "${DKA_DB_DIR}" /inheritance:d'

  ; Hapus ACE lama untuk Builtin Users (biar idempotent)
  ; (Kalau belum ada, icacls tetap exit 0)
  !insertmacro _RunIcacls 'icacls "${DKA_DB_DIR}" /remove:g *${SID_BUILTIN_USERS}'

  ; Grant Modify (M) recursively + turunan (OI/CI)
  !insertmacro _RunIcacls 'icacls "${DKA_DB_DIR}" /grant *${SID_BUILTIN_USERS}:(OI)(CI)M'

  ; Terapkan ke subfolder/file kalau sudah ada isi
  !insertmacro _RunIcacls 'icacls "${DKA_DB_DIR}" /T /C'

  DetailPrint 'ACL_APPLY: done'
!macroend

; =======================
; Macro: revert ACL (dipanggil saat uninstall)
; =======================
!macro ACL_REVERT
  DetailPrint 'ACL_REVERT: start'

  ${IfNot} ${FileExists} "${DKA_DB_DIR}"
    DetailPrint 'DB dir not found, skip'
    Return
  ${EndIf}

  ; Balikkan ke default ACL sesuai parent (Program Files)
  !insertmacro _RunIcacls 'icacls "${DKA_DB_DIR}" /inheritance:e'
  !insertmacro _RunIcacls 'icacls "${DKA_DB_DIR}" /reset /T /C'

  DetailPrint 'ACL_REVERT: done'
!macroend

; =======================
; Fallback Section untuk manual include (kalau mau langsung section)
; =======================
Section -PostInstallACL
  !insertmacro ACL_APPLY
SectionEnd
