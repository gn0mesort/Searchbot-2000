!define UNINSTREG "Software\Microsoft\Windows\CurrentVersion\Uninstall"
!define COMPANY "Gutfuck LLC"
!define APP "searchbot-2000"
!define MAJOR "1"
!define MINOR "0"
!define PATCH "1"

OutFile "${APP}-v${MAJOR}.${MINOR}.${PATCH}-x86.exe"
Name "${COMPANY} - ${APP}"
InstallDir "$TEMP\${APP}\install"
RequestExecutionLevel admin
LicenseData "license.rtf"

page license
page instfiles

Section "install"
	SetRegView 32
	SetOutPath $INSTDIR
	File "node-v8.11.3-x86.msi"
	ExecWait '"msiexec" /i "$INSTDIR\node-v8.11.3-x86.msi"' $0
	ReadRegStr $0 HKLM SOFTWARE\Node.js "InstallPath"
	DetailPrint "Executing $0npm.cmd i -g gutfuckllc/${APP}"
	nsExec::ExecToLog '"$0npm.cmd" i -g "gutfuckllc/${APP}'
	CreateDirectory "$APPDATA\${APP}"
	WriteUninstaller "$APPDATA\${APP}\uninstall.exe"

	# Write Registry
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "DisplayName" "${APP}"
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "UninstallString" "$\"$APPDATA\${APP}\uninstall.exe$\""
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "QuietUninstallString" "$\"$APPDATA\${APP}\uninstall.exe$\" /S"
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "InstallLocation" "$\"$APPDATA\npm\node_modules\${APP}$\""
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "Publisher" "$\"${COMPANY}$\""
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "DisplayVersion" "$\"${MAJOR}.${MINOR}.${PATCH}$\""
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "VersionMajor" "${MAJOR}"
	WriteRegStr HKLM "${UNINSTREG}\${COMPANY} ${APP}" "VersionMinor" "${MINOR}"
	WriteRegDWORD HKLM "${UNINSTREG}\${COMPANY} ${APP}" "NoModify" 1
	WriteRegDWORD HKLM "${UNINSTREG}\${COMPANY} ${APP}" "NoRepair" 1
	WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "${APP}" "$APPDATA\npm\${APP}.cmd -d"
SectionEnd

Section "uninstall"
	SetRegView 32
	ReadRegStr $0 HKLM SOFTWARE\Node.js "InstallPath"
	DetailPrint "Executing $0npm.cmd rm -g ${APP}"
	nsExec::ExecToLog '"$0npm.cmd" rm -g ${APP}'
	DeleteRegValue HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "${APP}"
	DeleteRegKey HKLM "${UNINSTREG}\${COMPANY} ${APP}"
	Delete "$APPDATA\${APP}\uninstall.exe"
	RMDir "$APPDATA\${APP}"
SectionEnd