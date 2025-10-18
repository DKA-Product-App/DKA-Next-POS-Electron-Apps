; =======================
; Includes (urutannya penting)
; =======================
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"       ; <-- WAJIB untuk ${RunningX64}
!include "WinVer.nsh"    ; untuk ${AtLeastWin7}
!include "nsExec.nsh"    ; untuk nsExec::ExecToStack

; =======================
; Konstanta
; =======================
!define DKA_DB_DIR "$InstDir\database"
!define SID_BUILTIN_USERS "S-1-5-32-545"    ; Builtin\Users (universal, lintas bahasa)

; =======================
; Variabel
; =======================
Var DKA_ICACLS_PATH

; =======================
; Resolve path icacls (Sysnative-safe)
; =======================
!macro DKA_RESOLVE_ICACLS
  ; Kalau installer 32-bit di OS 64-bit, pakai Sysnative biar lolos WOW64 redirection
  ${If} ${RunningX64}
    StrCpy $DKA_ICACLS_PATH "$WINDIR\Sysnative\icacls.exe"
    ${IfNot} ${FileExists} "$DKA_ICACLS_PATH"
      StrCpy $DKA_ICACLS_PATH "$WINDIR\System32\icacls.exe"
    ${EndIf}
  ${Else}
    StrCpy $DKA_ICACLS_PATH "$WINDIR\System32\icacls.exe"
  ${EndIf}
!macroend

; =======================
; Helper eksekusi icacls
; (ExecToStack -> output dulu, lalu exitcode)
; =======================
!macro _RunIcacls CMD
  nsExec::ExecToStack '"$DKA_ICACLS_PATH" ${CMD}'
  Pop $2     ; stdout/stderr
  Pop $1     ; exitCode
  DetailPrint 'icacls ${CMD}'
  ${If} $1 != 0
    DetailPrint '  -> exit=$1 (non-zero)'
  ${Else}
    DetailPrint '  -> exit=0'
  ${EndIf}
  ${If} $2 != ""
    DetailPrint '  -> out: $2'
  ${EndIf}
!macroend

; =======================
; Macro: apply ACL (dipanggil saat install)
; =======================
!macro ACL_APPLY
  DetailPrint 'ACL_APPLY: start'

  !insertmacro DKA_RESOLVE_ICACLS

  ${IfNot} ${FileExists} "$DKA_ICACLS_PATH"
    DetailPrint 'icacls not found, skip ACL'
    Return
  ${EndIf}

  ; (Opsional) pastikan minimal Windows 7 (Vista+ sebenarnya sudah oke)
  ${IfNot} ${AtLeastWin7}
    DetailPrint 'OS < Windows 7, skip ACL (fitur icacls mungkin terbatas)'
    Return
  ${EndIf}

  ; Pastikan folder ada
  CreateDirectory "${DKA_DB_DIR}"

  ; Putus inheritance dari Program Files -> biar ACE custom berlaku
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /inheritance:d'

  ; Hapus ACE lama utk Builtin\Users (idempotent)
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /remove:g *${SID_BUILTIN_USERS}'

  ; Grant Modify (M) + turunan (OI/CI) ke Builtin\Users
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /grant *${SID_BUILTIN_USERS}:(OI)(CI)M'

  ; Terapkan ke isi saat ini (kalau sudah ada struktur)
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /T /C'

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

  !insertmacro DKA_RESOLVE_ICACLS

  ; Kembalikan inheritance dan reset ACE ke default parent
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /inheritance:e'
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /reset /T /C'

  DetailPrint 'ACL_REVERT: done'
!macroend

; =======================
; Hook Sections
; Catatan:
; - electron-builder biasanya menjalankan Section standar.
; - Bagian ini aman bila file di-include dari script utama.
; =======================

; Jalankan APPLY setelah file2 terpasang
Section -PostInstallACL
  !insertmacro ACL_APPLY
SectionEnd

; (Opsional) Jalankan REVERT saat uninstall (kalau uninstaller dipanggil)
Section -PreUninstallACL
  !insertmacro ACL_REVERT
SectionEnd
