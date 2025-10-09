!include "FileFunc.nsh"
!include "LogicLib.nsh"

Section -PostInstallACL
  ; Pastikan folder ada
  CreateDirectory "$InstDir\database"

  ; Putus warisan permission dari parent (Program Files)
  nsExec::ExecToStack 'icacls "$InstDir\database" /inheritance:d'

  ; Grant Modify (M) untuk Builtin Users (SID 545) termasuk turunannya (OI/CI)
  nsExec::ExecToStack 'icacls "$InstDir\database" /grant *S-1-5-32-545:(OI)(CI)M'

  ; (Opsional) pastikan owner SYSTEM atau Administrators tetap
  ; nsExec::ExecToStack 'icacls "$InstDir\database" /setowner "Administrators"'
SectionEnd
