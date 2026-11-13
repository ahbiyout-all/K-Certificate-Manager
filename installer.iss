; ==============================================================================
;  K-Certificate Manager (K-인증서 매니저) - Inno Setup Script
;  Unpacked Multi-File (폴더 풀림 구조) & 최적화된 개별 필수 파일 설치 명세
;  * 중복 팩킹(동일 바이너리 중복, 와일드카드 중복, 스크립트 중복) 완전 제거
;  * 개발 전용 파일(package.json, 원본 index.html, metadata.json 등) 배포 제외
;  Developer: AhBiYout (GitHub: AhBiYout-all)
;  Company:   (주)청운정보시스템 ( cisnet.co.kr )
;  Blog:      https://ahbiyoutvibe.blogspot.com/
; ==============================================================================

#define MyAppName "K-Certificate Manager"
#define MyAppNameKR "K-인증서 매니저"
#ifndef MyAppVersion
  #define MyAppVersion "2.1.0"
#endif
#define MyAppPublisher "AhBiYout"
#define MyAppURL "https://www.cisnet.co.kr"
#define MyAppSupportURL "https://ahbiyoutvibe.blogspot.com/"
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
OutputDir=dist\v{#MyAppVersion}\installer
OutputBaseFilename=kcert-manager-v{#MyAppVersion}-setup
SetupIconFile=public\assets\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

; Installation Privileges & Silent / Unattended Operation
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
AppMutex=KCertManager_Singleton_Mutex_8F5B123A
CloseApplications=yes
CloseApplicationsFilter=*.exe,KCertManager.exe
RestartApplications=no
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
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

; ==============================================================================
; [Files] Section: 슬림화 및 정규 개별 필수 파일 설치 명세 (Unpacked Multi-File)
; ==============================================================================
[Files]
; ------------------------------------------------------------------------------
; 1. Native C# WPF Desktop Executable & Core Library (단일 1벌 팩킹)
; ------------------------------------------------------------------------------
#if FileExists("dist\v" + MyAppVersion + "\win-x64\KCertManager.exe")
Source: "dist\v{#MyAppVersion}\win-x64\KCertManager.exe"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("dist\win-x64\KCertManager.exe")
Source: "dist\win-x64\KCertManager.exe"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("release\05_WpfDesktop\KCertManager.exe")
Source: "release\05_WpfDesktop\KCertManager.exe"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("release\05_WpfDesktop\KCertManager_v" + MyAppVersion + ".exe")
Source: "release\05_WpfDesktop\KCertManager_v{#MyAppVersion}.exe"; DestDir: "{app}"; DestName: "KCertManager.exe"; Flags: ignoreversion
#endif

#if FileExists("dist\v" + MyAppVersion + "\core-dll\KCert.Core.dll")
Source: "dist\v{#MyAppVersion}\core-dll\KCert.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("dist\v" + MyAppVersion + "\win-x64\KCert.Core.dll")
Source: "dist\v{#MyAppVersion}\win-x64\KCert.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("dist\core-dll\KCert.Core.dll")
Source: "dist\core-dll\KCert.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("release\05_WpfDesktop\KCert.Core.dll")
Source: "release\05_WpfDesktop\KCert.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
#endif

#if FileExists("dist\v" + MyAppVersion + "\core-dll\KCert.Crypto.dll")
Source: "dist\v{#MyAppVersion}\core-dll\KCert.Crypto.dll"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("dist\v" + MyAppVersion + "\win-x64\KCert.Crypto.dll")
Source: "dist\v{#MyAppVersion}\win-x64\KCert.Crypto.dll"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("dist\core-dll\KCert.Crypto.dll")
Source: "dist\core-dll\KCert.Crypto.dll"; DestDir: "{app}"; Flags: ignoreversion
#elif FileExists("release\05_WpfDesktop\KCert.Crypto.dll")
Source: "release\05_WpfDesktop\KCert.Crypto.dll"; DestDir: "{app}"; Flags: ignoreversion
#endif

; ------------------------------------------------------------------------------
; 2. Essential Application Launchers
; ------------------------------------------------------------------------------
#if FileExists("launch-web.vbs")
Source: "launch-web.vbs"; DestDir: "{app}"; Flags: ignoreversion
#endif

#if FileExists("run-web.cmd")
Source: "run-web.cmd"; DestDir: "{app}"; Flags: ignoreversion
#endif

; ------------------------------------------------------------------------------
; 3. Production Web Bundle (dist 폴더가 존재할 때만 포함)
; ------------------------------------------------------------------------------
#if DirExists("dist\v" + MyAppVersion + "\web")
Source: "dist\v{#MyAppVersion}\web\*"; DestDir: "{app}\dist"; Excludes: "aistudio,aistudio\*,*.map,*.tmp"; Flags: ignoreversion recursesubdirs createallsubdirs
#elif DirExists("dist")
Source: "dist\*"; DestDir: "{app}\dist"; Excludes: "v*,aistudio,aistudio\*,*.map,*.tmp"; Flags: ignoreversion recursesubdirs createallsubdirs
#endif

; ------------------------------------------------------------------------------
; 4. Official User Guide & Release Notes (필수 사용자 가이드만 선별 전개)
; ------------------------------------------------------------------------------
Source: "docs\USER_GUIDE.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "docs\PATCHNOTES.md"; DestDir: "{app}\docs"; Flags: ignoreversion

; ------------------------------------------------------------------------------
; 5. Official License Files (한국어 / 영어 2종류 및 통합본)
; ------------------------------------------------------------------------------
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE_KR.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE_EN.txt"; DestDir: "{app}"; Flags: ignoreversion

; ------------------------------------------------------------------------------
; 6. Official Branding Assets (Icons, Logos)
; ------------------------------------------------------------------------------
Source: "public\assets\*"; DestDir: "{app}\assets"; Excludes: "aistudio,aistudio\*,*.tmp,*.log"; Flags: ignoreversion recursesubdirs createallsubdirs

; ==============================================================================
; [Icons] Section: Start Menu & Desktop Shortcuts
; ==============================================================================
[Icons]
; Start Menu Shortcuts
Name: "{group}\{#MyAppNameKR} (C# WPF 데스크톱)"; Filename: "{app}\KCertManager.exe"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 C# WPF 네이티브 실행 (브라우저 미사용)"; Check: HasWpfExe
#if DirExists("dist")
Name: "{group}\{#MyAppNameKR} (웹 버전 브라우저 실행)"; Filename: "{app}\launch-web.vbs"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 웹 버전 실행"; IconFilename: "{app}\assets\app.ico"
#endif
Name: "{group}\설치 폴더 열기 (Unpacked Multi-File)"; Filename: "explorer.exe"; Parameters: """{app}"""; WorkingDir: "{app}"; Comment: "설치된 폴더 풀림 구조 및 개별 파일 탐색기 열기"

; Document Shortcuts
Name: "{group}\사용자 가이드 (User Guide)"; Filename: "{app}\docs\USER_GUIDE.md"
Name: "{group}\버전 릴리스 패치노트 (Patch Notes)"; Filename: "{app}\docs\PATCHNOTES.md"
Name: "{group}\소프트웨어 라이선스 - 한국어 (License KR)"; Filename: "{app}\LICENSE_KR.txt"
Name: "{group}\Software License - English (License EN)"; Filename: "{app}\LICENSE_EN.txt"
Name: "{group}\소속회사 홈페이지 ((주)청운정보시스템 ( cisnet.co.kr ))"; Filename: "{#MyAppURL}"
Name: "{group}\공식 구글 블로그 (AhBi Vibe Log)"; Filename: "{#MyAppSupportURL}"
Name: "{group}\GitHub 공식 저장소 (AhBiYout-all)"; Filename: "https://github.com/AhBiYout-all/K-Certificate-Manager"
Name: "{group}\{cm:UninstallProgram,{#MyAppNameKR}}"; Filename: "{uninstallexe}"

; Desktop Shortcut (Optional Task) - WPF 데스크톱 우선 연결 (없으면 launch-web.vbs 연결)
Name: "{autodesktop}\{#MyAppNameKR}"; Filename: "{app}\KCertManager.exe"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 C# WPF 네이티브 실행 (브라우저 미사용)"; Check: HasWpfExe; Tasks: desktopicon
Name: "{autodesktop}\{#MyAppNameKR}"; Filename: "{app}\launch-web.vbs"; WorkingDir: "{app}"; Comment: "K-인증서 매니저 실행"; IconFilename: "{app}\assets\app.ico"; Check: not HasWpfExe; Tasks: desktopicon

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

; 5. Delete obsolete/temporary asset directories if present from earlier builds
Type: filesandordirs; Name: "{app}\assets\aistudio"
Type: filesandordirs; Name: "{app}\dist\assets\aistudio"

; ==============================================================================
; [Run] Section: Post-Installation Launch & Silent Firewall Rules Registration
; ==============================================================================
[Run]
; 1. Windows Defender Firewall Inbound Rules Pre-Registration (기본 이름 및 버전 포함 이름 동시 등록)
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppName}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden; Check: HasWpfExe
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppName} v{#MyAppVersion}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden; Check: HasWpfExe
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppNameKR}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden; Check: HasWpfExe
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppNameKR} v{#MyAppVersion}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden; Check: HasWpfExe

; 2. Application Launch Options (대화형 설치 시 마지막 화면 옵션)
Filename: "{app}\KCertManager.exe"; Description: "{cm:LaunchWpfApp}"; Flags: nowait postinstall skipifsilent; Check: HasWpfExe
Filename: "{app}\launch-web.vbs"; Description: "{cm:LaunchWebApp}"; Flags: shellexec postinstall nowait skipifsilent; Check: not HasWpfExe
Filename: "explorer.exe"; Parameters: """{app}"""; Description: "{cm:OpenInstallDir}"; Flags: postinstall skipifsilent nowait unchecked

; ==============================================================================
; [UninstallRun] Section: Firewall Inbound Rules Cleanup
; ==============================================================================
[UninstallRun]
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName}"" program=""{app}\{#MyAppExeName}"""; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName} v{#MyAppVersion}"" program=""{app}\{#MyAppExeName}"""; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppNameKR}"" program=""{app}\{#MyAppExeName}"""; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppNameKR} v{#MyAppVersion}"" program=""{app}\{#MyAppExeName}"""; Flags: runhidden

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
; [Code] Section: Dynamic Environment Detection, Upgrade Prompt & Silent Mode
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

// Check if a specific process is currently running in Windows
function IsAppProcessRunning(const ExeName: String): Boolean;
var
  ResultCode: Integer;
begin
  Result := False;
  if Exec(ExpandConstant('{cmd}'), '/C tasklist /FI "IMAGENAME eq ' + ExeName + '" | findstr /I /C:"' + ExeName + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    Result := (ResultCode = 0);
  end;
end;

// Terminate running application processes safely and completely (Release file locks)
procedure TerminateAppProcesses();
var
  ResultCode: Integer;
  WaitCount: Integer;
begin
  // 1. Force terminate native WPF and legacy executable instances (/F: Force, /T: Tree)
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /T /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /T /IM KCertManager-Lite.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // 2. Give Windows up to 1.5 seconds to fully release file locks and clean up process handles
  WaitCount := 0;
  while IsAppProcessRunning('{#MyAppExeName}') and (WaitCount < 15) do
  begin
    Sleep(100);
    WaitCount := WaitCount + 1;
  end;
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

  // =========================================================================
  // 1. 기존 실행 중인 앱(KCertManager.exe) 감지 및 먼저 종료 처리
  // =========================================================================
  if IsAppProcessRunning('{#MyAppExeName}') then
  begin
    // 대화형(GUI) 모드에서는 사용자에게 친절히 알리고 동의 후 자동 종료 진행
    if not WizardSilent() then
    begin
      MsgPrompt := '현재 {#MyAppNameKR} ({#MyAppName}) 프로그램이 실행 중입니다.' + #13#10 + #13#10 +
                   '새 버전 설치 및 업데이트를 안전하게 진행하기 위해 실행 중인 프로그램을 종료해야 합니다.' + #13#10 + #13#10 +
                   '실행 중인 프로그램을 자동으로 종료하고 설치를 계속하시겠습니까?' + #13#10 + #13#10 +
                   '  [예 (Yes)]    : 실행 중인 앱을 즉시 종료하고 설치를 계속합니다 (권장).' + #13#10 +
                   '  [아니오 (No)] : 설치를 중단하고 마법사를 종료합니다.';

      if MsgBox(MsgPrompt, mbConfirmation, MB_YESNO) <> IDYES then
      begin
        Result := False;
        Exit;
      end;
    end;

    // 실행 중인 프로그램 프로세스 즉각 종료 및 파일 잠금(Lock) 해제
    TerminateAppProcesses();
  end;

  // =========================================================================
  // 2. 기존 설치 레지스트리 및 언인스톨러 조회
  // =========================================================================
  // 2-1. Check HKCU registry for existing installation
  if not RegQueryStringValue(HKCU, GetUninstallRegistryKey(), 'UninstallString', UninstPath) then
  begin
    // 2-2. Check HKLM registry
    RegQueryStringValue(HKLM, GetUninstallRegistryKey(), 'UninstallString', UninstPath);
  end;

  if not RegQueryStringValue(HKCU, GetUninstallRegistryKey(), 'InstallLocation', InstallDir) then
  begin
    RegQueryStringValue(HKLM, GetUninstallRegistryKey(), 'InstallLocation', InstallDir);
  end;

  // 2-3. Check fallback default folder if unins000.exe exists
  if (UninstPath = '') and FileExists(ExpandConstant('{autopf}\K-Certificate Manager\unins000.exe')) then
  begin
    UninstPath := ExpandConstant('"{autopf}\K-Certificate Manager\unins000.exe"');
    InstallDir := ExpandConstant('{autopf}\K-Certificate Manager');
  end;

  // Handle existing installation
  if UninstPath <> '' then
  begin
    ExistingUninstallString := RemoveQuotes(UninstPath);
    ExistingInstallDir := InstallDir;

    // 무인(Silent / VerySilent) 설치 환경 지원: 질문 대화상자를 건너뛰고 업그레이드 모드로 자동 진행
    if WizardSilent() then
    begin
      Result := True;
      Exit;
    end;

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
        // 언인스톨러 실행 전 프로세스 종료 확실히 보장
        TerminateAppProcesses();
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

// Pre-installation hook: Ensure processes are dead before extracting files
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
  begin
    // 파일 복사 직전 혹시 모를 잔여 프로세스 확실히 종료
    TerminateAppProcesses();
  end;
end;

// Uninstallation hook: Close app if user runs uninstaller while app is open
function InitializeUninstall(): Boolean;
var
  MsgPrompt: String;
begin
  Result := True;
  if IsAppProcessRunning('{#MyAppExeName}') then
  begin
    if not UninstallSilent() then
    begin
      MsgPrompt := '현재 {#MyAppNameKR} ({#MyAppName}) 프로그램이 실행 중입니다.' + #13#10 + #13#10 +
                   '프로그램 제거(삭제)를 안전하게 진행하기 위해 실행 중인 프로그램을 종료합니다.' + #13#10 +
                   '계속하시겠습니까?';
      if MsgBox(MsgPrompt, mbConfirmation, MB_YESNO) <> IDYES then
      begin
        Result := False;
        Exit;
      end;
    end;
    TerminateAppProcesses();
  end;
end;

// Pascal Script: Check if WPF desktop executable exists in installation directory
function HasWpfExe(): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\KCertManager.exe'));
end;
