; ==============================================================================
;  K-Certificate Manager (K-인증서 매니저) - Inno Setup Script
;  Unpacked Multi-File (폴더 풀림 구조) & 최적화된 개별 필수 파일 설치 명세
;  * 중복 팩킹(동일 바이너리 중복, 와일드카드 중복, 스크립트 중복) 완전 제거
;  * 개발 전용 파일(package.json, 원본 index.html, metadata.json 등) 배포 제외
;  Developer: AhBiYout
;  Company:   CISNet (http://www.cisnet.co.kr/)
;  Blog:      https://ahbivibelog.blogspot.com/
; ==============================================================================

#define MyAppName "K-Certificate Manager"
#define MyAppNameKR "K-인증서 매니저"
#define MyAppVersion "1.4.2"
#define MyAppPublisher "AhBiYout"
#define MyAppURL "http://www.cisnet.co.kr/"
#define MyAppSupportURL "https://ahbivibelog.blogspot.com/"
#define MyAppExeName "KCertManager.exe"
#define MyAppWebCmdName "run-web.cmd"

[Setup]
; Unique Application GUID
AppId={{8F5B123A-4C2E-497B-902B-6277D8C7B8E1}}
AppName={#MyAppNameKR} ({#MyAppName})
AppVersion={#MyAppVersion}
AppVerName={#MyAppNameKR} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppSupportURL}
AppUpdatesURL={#MyAppURL}

; Target Directory: Unpacked Multi-File Structure into {autopf}\K-Certificate Manager
DefaultDirName={autopf}\K-Certificate Manager
DefaultGroupName={#MyAppNameKR}
AllowNoIcons=yes
LicenseFile=LICENSE.txt

; Output Setup Executable with Version Suffix
OutputDir=release\07_Installer
OutputBaseFilename=kcert-manager-v{#MyAppVersion}-setup
SetupIconFile=public\assets\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

; Installation Privileges (Supports standard user or admin elevation)
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DisableDirPage=no
DisableProgramGroupPage=no

; Uninstaller Configuration
UninstallDisplayIcon={app}\assets\app.ico
UninstallDisplayName={#MyAppNameKR} ({#MyAppName}) v{#MyAppVersion}
CreateUninstallRegKey=yes

[Languages]
#if FileExists(AddBackslash(CompilerPath) + "Languages\Korean.isl")
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"; LicenseFile: "LICENSE_KR.txt"
#elif FileExists(AddBackslash(CompilerPath) + "Languages\Unofficial\Korean.isl")
Name: "korean"; MessagesFile: "compiler:Languages\Unofficial\Korean.isl"; LicenseFile: "LICENSE_KR.txt"
#else
Name: "korean"; MessagesFile: "compiler:Default.isl"; LicenseFile: "LICENSE_KR.txt"
#endif
Name: "english"; MessagesFile: "compiler:Default.isl"; LicenseFile: "LICENSE_EN.txt"

[CustomMessages]
korean.CreateDesktopIcon=바탕화면에 바로가기 만들기(&D)
korean.CreateQuickLaunchIcon=빠른 실행 도구 모음에 바로가기 만들기(&Q)
korean.LaunchProgram=K-인증서 매니저 실행하기
korean.OpenInstallDir=설치 폴더 열기 (폴더 풀림 Unpacked Multi-File)
korean.ViewUserGuide=사용자 가이드(User Guide) 열기
korean.LaunchWpfApp=C# WPF 데스크톱 풀버전 실행하기
korean.LaunchWebApp=K-인증서 매니저 웹 버전 실행하기

english.CreateDesktopIcon=Create a &desktop shortcut
english.CreateQuickLaunchIcon=Create a &Quick Launch shortcut
english.LaunchProgram=Launch K-Certificate Manager
english.OpenInstallDir=Open Installation Folder (Unpacked Multi-File)
english.ViewUserGuide=View User Guide
english.LaunchWpfApp=Launch C# WPF Desktop App
english.LaunchWebApp=Launch Web Version

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

; ==============================================================================
; [Files] Section: 슬림화 및 중복 완전 제거된 정규 개별 파일 설치 명세
; ==============================================================================
[Files]
; ------------------------------------------------------------------------------
; 1. Native C# WPF Desktop Executables & Core Libraries (단일 1벌만 팩킹)
;    동일한 바이너리가 버전명/일반명으로 중복 팩킹되지 않도록 단일 1벌만 지정
; ------------------------------------------------------------------------------
#if FileExists("release\05_WpfDesktop\KCertManager.exe")
Source: "release\05_WpfDesktop\KCertManager.exe"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("release\05_WpfDesktop\KCertManager_v" + MyAppVersion + ".exe")
Source: "release\05_WpfDesktop\KCertManager_v{#MyAppVersion}.exe"; DestDir: "{app}"; DestName: "KCertManager.exe"; Flags: ignoreversion
#endif

#if FileExists("release\05_WpfDesktop\KCertManager-Lite.exe")
Source: "release\05_WpfDesktop\KCertManager-Lite.exe"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("release\05_WpfDesktop\KCertManager-Lite_v" + MyAppVersion + ".exe")
Source: "release\05_WpfDesktop\KCertManager-Lite_v{#MyAppVersion}.exe"; DestDir: "{app}"; DestName: "KCertManager-Lite.exe"; Flags: ignoreversion
#endif

#if FileExists("release\05_WpfDesktop\KCert.Core.dll")
Source: "release\05_WpfDesktop\KCert.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
#endif

; ------------------------------------------------------------------------------
; 2. Essential Application Launchers (불필요한 스크립트 제외, 웹 실행용 cmd만 포함)
; ------------------------------------------------------------------------------
Source: "run-web.cmd"; DestDir: "{app}"; Flags: ignoreversion

; ------------------------------------------------------------------------------
; 3. Production Web Bundle (dist 폴더 풀림 구조 - HTML, JS, CSS 개별 에셋 전개)
; ------------------------------------------------------------------------------
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; ------------------------------------------------------------------------------
; 4. Official User Guides & Documentation (필수 사용자 및 기술 매뉴얼만 선별 전개)
; ------------------------------------------------------------------------------
Source: "docs\USER_GUIDE.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\PATCHNOTES.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\VERSIONING_POLICY.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\KCERT_CORE_DLL_SPEC.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\BUILD_GUIDE.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\LICENSE.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\README.md"; DestDir: "{app}\docs"; Flags: ignoreversion

; ------------------------------------------------------------------------------
; 5. Official License Files (한국어 / 영어 2종류 및 통합본 배포)
; ------------------------------------------------------------------------------
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE_KR.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE_EN.txt"; DestDir: "{app}"; Flags: ignoreversion

; ------------------------------------------------------------------------------
; 6. Official Branding Assets (Icons, Logos)
; ------------------------------------------------------------------------------
Source: "public\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

; ==============================================================================
; [Icons] Section: Start Menu & Desktop Shortcuts
; ==============================================================================
[Icons]
; Start Menu Shortcuts
Name: "{group}\{#MyAppNameKR} (C# WPF 데스크톱)"; Filename: "{app}\KCertManager.exe"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 C# WPF 네이티브 실행 (브라우저 미사용)"; Check: HasWpfExe
Name: "{group}\{#MyAppNameKR} (C# WPF 경량 에디션)"; Filename: "{app}\KCertManager-Lite.exe"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 C# WPF 초경량 에디션 실행"; Check: HasWpfLiteExe
Name: "{group}\{#MyAppNameKR} (웹 버전 브라우저 실행)"; Filename: "{app}\{#MyAppWebCmdName}"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 웹 버전 실행"; IconFilename: "{app}\assets\app.ico"
Name: "{group}\설치 폴더 열기 (Unpacked Multi-File)"; Filename: "explorer.exe"; Parameters: """{app}"""; WorkingDir: "{app}"; Comment: "설치된 폴더 풀림 구조 및 개별 파일 탐색기 열기"

; Document Shortcuts
Name: "{group}\사용자 가이드 (User Guide)"; Filename: "{app}\docs\USER_GUIDE.md"
Name: "{group}\버전 릴리스 패치노트 (Patch Notes)"; Filename: "{app}\docs\PATCHNOTES.md"
Name: "{group}\버전 관리 정책 (Versioning Policy)"; Filename: "{app}\docs\VERSIONING_POLICY.md"
Name: "{group}\KCert.Core 코어 DLL 기술 명세서 (Core Spec)"; Filename: "{app}\docs\KCERT_CORE_DLL_SPEC.md"
Name: "{group}\소프트웨어 라이선스 - 한국어 (License KR)"; Filename: "{app}\LICENSE_KR.txt"
Name: "{group}\Software License - English (License EN)"; Filename: "{app}\LICENSE_EN.txt"
Name: "{group}\소프트웨어 라이선스 통합 문서 (License MD)"; Filename: "{app}\docs\LICENSE.md"
Name: "{group}\공식 홈페이지 (CISNet)"; Filename: "{#MyAppURL}"
Name: "{group}\개발자 기술 블로그 (AhBiYout)"; Filename: "{#MyAppSupportURL}"
Name: "{group}\{cm:UninstallProgram,{#MyAppNameKR}}"; Filename: "{uninstallexe}"

; Desktop Shortcut (Optional Task) - WPF 데스크톱 우선 연결
Name: "{autodesktop}\{#MyAppNameKR}"; Filename: "{app}\KCertManager.exe"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 C# WPF 네이티브 실행 (브라우저 미사용)"; Check: HasWpfExe; Tasks: desktopicon
Name: "{autodesktop}\{#MyAppNameKR}"; Filename: "{app}\{#MyAppWebCmdName}"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 실행"; IconFilename: "{app}\assets\app.ico"; Check: not HasWpfExe; Tasks: desktopicon

; ==============================================================================
; [InstallDelete] Section: Clean up legacy, dev, duplicate, or unneeded files
; ==============================================================================
[InstallDelete]
; 1. Delete unnecessary source/dev and legacy scripts
Type: files; Name: "{app}\package.json"
Type: files; Name: "{app}\metadata.json"
Type: files; Name: "{app}\index.html"
Type: files; Name: "{app}\run-web.ps1"
Type: files; Name: "{app}\*.ps1"
Type: files; Name: "{app}\*.vbs"
Type: files; Name: "{app}\kcert-manager.vbs"
Type: files; Name: "{app}\create-desktop-shortcut.vbs"
Type: files; Name: "{app}\kcert-manager.cmd"
Type: files; Name: "{app}\kcert-manager.bat"
Type: files; Name: "{app}\run.bat"
Type: files; Name: "{app}\start.bat"

; 2. Delete build/debug artifacts
Type: files; Name: "{app}\*.pdb"
Type: files; Name: "{app}\*.deps.json"

; 3. Delete legacy version-tagged binaries (prevents 70MB duplicate pile-up)
Type: files; Name: "{app}\KCertManager_v*.exe"
Type: files; Name: "{app}\KCertManager-Lite_v*.exe"

; 4. Delete unneeded loose WPF runtime C++ DLLs (now embedded in single-file exe)
Type: files; Name: "{app}\D3DCompiler_47_cor3.dll"
Type: files; Name: "{app}\PenImc_cor3.dll"
Type: files; Name: "{app}\PresentationNative_cor3.dll"
Type: files; Name: "{app}\vcruntime140_cor3.dll"
Type: files; Name: "{app}\wpfgfx_cor3.dll"

; ==============================================================================
; [Run] Section: Post-Installation Launch Options
; ==============================================================================
[Run]
Filename: "{app}\KCertManager.exe"; Description: "{cm:LaunchWpfApp}"; Flags: nowait postinstall skipifsilent; Check: HasWpfExe
Filename: "{app}\{#MyAppWebCmdName}"; Description: "{cm:LaunchWebApp}"; Flags: shellexec postinstall nowait skipifsilent; Check: not HasWpfExe
Filename: "explorer.exe"; Parameters: """{app}"""; Description: "{cm:OpenInstallDir}"; Flags: postinstall skipifsilent nowait unchecked

; ==============================================================================
; [UninstallDelete] Section: Complete Unpacked Multi-File Cleanup
; ==============================================================================
[UninstallDelete]
Type: filesandordirs; Name: "{app}\dist"
Type: filesandordirs; Name: "{app}\docs"
Type: files; Name: "{app}\*.exe"
Type: files; Name: "{app}\*.dll"
Type: files; Name: "{app}\*.cmd"
Type: files; Name: "{app}\*.vbs"
Type: files; Name: "{app}\*.ps1"
Type: files; Name: "{app}\*.json"
Type: files; Name: "{app}\*.html"
Type: files; Name: "{app}\*.pdb"
Type: files; Name: "{app}\*.log"
Type: files; Name: "{app}\*.txt"
Type: dirifempty; Name: "{app}"

; ==============================================================================
; [Code] Section: Dynamic Environment Detection & Upgrade Prompt
; ==============================================================================
[Code]
var
  ExistingUninstallString: String;
  ExistingInstallDir: String;
  IsCleanInstallRequested: Boolean;

function GetUninstallRegistryKey(): String;
begin
  Result := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#SetupSetting("AppId")}_is1';
end;

// Detect existing installation and prompt user for clean install vs overwrite
function InitializeSetup(): Boolean;
var
  UninstPath: String;
  InstallDir: String;
  MsgPrompt: String;
  UserChoice: Integer;
  ResultCode: Integer;
begin
  Result := True;
  UninstPath := '';
  InstallDir := '';
  IsCleanInstallRequested := False;

  // 1. Check HKCU registry for existing installation
  if not RegQueryStringValue(HKCU, GetUninstallRegistryKey(), 'UninstallString', UninstPath) then
  begin
    // 2. Check HKLM registry
    RegQueryStringValue(HKLM, GetUninstallRegistryKey(), 'UninstallString', UninstPath);
  end;

  if not RegQueryStringValue(HKCU, GetUninstallRegistryKey(), 'InstallLocation', InstallDir) then
  begin
    RegQueryStringValue(HKLM, GetUninstallRegistryKey(), 'InstallLocation', InstallDir);
  end;

  // 3. Check fallback default folder if unins000.exe exists
  if (UninstPath = '') and FileExists(ExpandConstant('{autopf}\K-Certificate Manager\unins000.exe')) then
  begin
    UninstPath := ExpandConstant('"{autopf}\K-Certificate Manager\unins000.exe"');
    InstallDir := ExpandConstant('{autopf}\K-Certificate Manager');
  end;

  // Prompt user if existing installation was detected
  if UninstPath <> '' then
  begin
    ExistingUninstallString := RemoveQuotes(UninstPath);
    ExistingInstallDir := InstallDir;

    MsgPrompt := '컴퓨터에 이전 버전의 {#MyAppNameKR} ({#MyAppName})이(가) 이미 설치되어 있습니다.' + #13#10 + #13#10 +
                 '[예 (Yes)]' + #13#10 +
                 '  기존 설치된 버전을 완전히 삭제하고 깨끗하게 새로 설치합니다 (권장, 클린 설치).' + #13#10 + #13#10 +
                 '[아니오 (No)]' + #13#10 +
                 '  기존 파일을 유지한 채 새 버전으로 덮어쓰기(업그레이드)합니다.' + #13#10 + #13#10 +
                 '[취소 (Cancel)]' + #13#10 +
                 '  설치 마법사를 중단하고 종료합니다.';

    UserChoice := MsgBox(MsgPrompt, mbConfirmation, MB_YESNOCANCEL);

    if UserChoice = IDYES then
    begin
      IsCleanInstallRequested := True;
      if FileExists(ExistingUninstallString) then
      begin
        Exec(ExistingUninstallString, '/SILENT /NORESTART /SUPPRESSMSGBOXES', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end;
      Result := True;
    end
    else if UserChoice = IDNO then
    begin
      IsCleanInstallRequested := False;
      Result := True;
    end
    else
    begin
      Result := False;
    end;
  end;
end;

// Pascal Script: Check if WPF desktop executable exists in installation directory
function HasWpfExe(): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\KCertManager.exe'));
end;

// Pascal Script: Check if WPF Lite executable exists in installation directory
function HasWpfLiteExe(): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\KCertManager-Lite.exe'));
end;
