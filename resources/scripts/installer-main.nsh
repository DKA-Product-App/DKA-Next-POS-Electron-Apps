!addincludedir "${BUILD_RESOURCES_DIR}\scripts"
!addincludedir "${BUILD_RESOURCES_DIR}/scripts"

!include "installer-acl.nsh"

!macro customInstall
  !insertmacro ACL_APPLY
!macroend

!macro customUnInstall
  !insertmacro ACL_REVERT
!macroend
