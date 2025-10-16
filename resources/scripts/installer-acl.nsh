!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"        ; untuk ${AtLeastWin7} jika mau validasi OS

; =======================
; Konstanta
; =======================
!define DKA_DB_DIR "$InstDir\database"
!define SID_BUILTIN_USERS "S-1-5-32-545"    ; Builtin\Users (universal, lintas bahasa)

Var DKA_ICACLS_PATH

; =======================
; Resolve path icacls (Sysnative-safe)
; =======================
!macro DKA_RESOLVE_ICACLS
  ; Jika proses 32-bit di OS 64-bit, gunakan Sysnative agar tidak kena redirection
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
  DetailPrint '  -> exit=$1'
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
    DetailPrint 'OS < Windows 7, skip ACL (icacls fitur mungkin terbatas)'
    Return
  ${EndIf}

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
  !insertmacro _RunIcacls '/inheritance:e "${DKA_DB_DIR}"'
  !insertmacro _RunIcacls '/reset /T /C "${DKA_DB_DIR}"'

  DetailPrint 'ACL_REVERT: done'
!macroend

; =======================
; Fallback Section (jika tidak pakai hook electron-builder)
; =======================
Section -PostInstallACL
  !insertmacro ACL_APPLY
SectionEnd
