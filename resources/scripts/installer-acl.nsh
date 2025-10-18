; ============================================================
; ACL handler untuk folder database
; ============================================================
!verbose push
!verbose 3

!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "nsExec.nsh"

; =======================
; Konstanta
; =======================
!ifndef DKA_DB_DIR
  !define DKA_DB_DIR "$InstDir\database"
!endif
!define SID_BUILTIN_USERS "S-1-5-32-545"  ; Builtin\Users (lintas bahasa)

; =======================
; Variabel
; =======================
Var DKA_ICACLS_PATH

; =======================
; Resolve path icacls (Sysnative-safe)
; =======================
!macro DKA_RESOLVE_ICACLS
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
; Helper icacls (ExecToStack)
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
; Macro: apply ACL (install)
; =======================
!macro ACL_APPLY
  DetailPrint 'ACL_APPLY: start'

  !insertmacro DKA_RESOLVE_ICACLS

  ${IfNot} ${FileExists} "$DKA_ICACLS_PATH"
    DetailPrint 'icacls not found, skip ACL'
    Return
  ${EndIf}

  ${IfNot} ${AtLeastWin7}
    DetailPrint 'OS < Windows 7, skip ACL'
    Return
  ${EndIf}

  CreateDirectory "${DKA_DB_DIR}"

  ; Putus inheritance agar ACE custom efektif
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /inheritance:d'

  ; Hapus ACE lama utk Builtin\Users (idempotent)
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /remove:g *${SID_BUILTIN_USERS}'

  ; Grant Modify (M) + turunan (OI/CI) ke Builtin\Users
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /grant *${SID_BUILTIN_USERS}:(OI)(CI)M'

  ; Terapkan ke isi yang sudah ada (best-effort)
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /T /C'

  DetailPrint 'ACL_APPLY: done'
!macroend

; =======================
; Macro: revert ACL (uninstall)
; =======================
!macro ACL_REVERT
  DetailPrint 'ACL_REVERT: start'

  ${IfNot} ${FileExists} "${DKA_DB_DIR}"
    DetailPrint 'DB dir not found, skip'
    Return
  ${EndIf}

  !insertmacro DKA_RESOLVE_ICACLS

  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /inheritance:e'
  !insertmacro _RunIcacls '"${DKA_DB_DIR}" /reset /T /C'

  DetailPrint 'ACL_REVERT: done'
!macroend

; =======================
; (Opsional) Hook Sections
;   Nonaktif default untuk hindari double-run
;   Aktifkan dengan: !define DKA_ACL_SECTIONS 1 sebelum include
; =======================
!ifdef DKA_ACL_SECTIONS
Section -PostInstallACL
  !insertmacro ACL_APPLY
SectionEnd

Section -PreUninstallACL
  !insertmacro ACL_REVERT
SectionEnd
!endif

!verbose pop
