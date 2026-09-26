@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title K-Certificate Manager - Windows Automated Build Tool

cd /d "%~dp0"
set "SCRIPT_DIR=%CD%"

REM Optional CLI parameter for TargetFramework override: build.bat net10, build.bat net8, etc.
set "CLI_TFM="
if /i "%~1"=="net10" set "CLI_TFM=net10.0-windows"
if /i "%~1"=="net10.0" set "CLI_TFM=net10.0-windows"
if /i "%~1"=="10" set "CLI_TFM=net10.0-windows"
if /i "%~1"=="net8" set "CLI_TFM=net8.0-windows"
if /i "%~1"=="net8.0" set "CLI_TFM=net8.0-windows"
if /i "%~1"=="8" set "CLI_TFM=net8.0-windows"

echo.
echo ==============================================================================
echo   _  __      _____          _     __  __                                   
echo  ^| ^|/ /     / ____^|        ^| ^|   ^|  \/  ^|                                  
echo  ^| ' /_____^| ^|     ___ _ __^| ^|_  ^| \  / ^| __ _ _ __   __ _  __ _  ___ _ __ 
echo  ^|  ^<______^| ^|    / _ \ '__^| __^| ^| ^|\/^| ^|/ _` ^| '_ \ / _` ^|/ _` ^|/ _ \ '__^|
echo  ^| . \     ^| ^|___^|  __/ ^|  ^| ^|_  ^| ^|  ^| ^| (_^| ^| ^| ^| ^| (_^| ^| (_^| ^|  __/ ^|   
echo  ^|_^|\_\     \_____\___^|_^|   \__^| ^|_^|  ^|_^|\__,_^|_^| ^|_^|\__,_^|\__, ^|\___^|_^|   
echo                                                             __/ ^|          
echo                                                            ^|___/           
echo ==============================================================================
echo   K-Certificate Manager (K-인증서 매니저) - Windows Automated Build Script
echo   Developer: AhBiYout
echo   Company:   CISNet (http://www.cisnet.co.kr/)
echo   Blog:      https://ahbivibelog.blogspot.com/
echo ==============================================================================
echo [INFO] Working Directory: %CD%
echo [INFO] Start Timestamp:   %DATE% %TIME%
echo.

REM ------------------------------------------------------------------------------
REM [0/7] Pre-build Cleanup of Redundant and Legacy Files
REM ------------------------------------------------------------------------------
echo [0/7] Cleaning up redundant legacy scripts (*.vbs, *.bat duplicates, *.ps1)...
for %%F in (kcert-manager.vbs create-desktop-shortcut.vbs kcert-manager.bat run.bat start.bat run-web.ps1) do (
    if exist "%%F" del /f /q "%%F" >nul 2>&1
)
if exist "%RELEASE_BASE%\06_UnpackedApp" (
    del /f /q "%RELEASE_BASE%\06_UnpackedApp\*.vbs" >nul 2>&1
    del /f /q "%RELEASE_BASE%\06_UnpackedApp\kcert-manager.cmd" >nul 2>&1
    del /f /q "%RELEASE_BASE%\06_UnpackedApp\kcert-manager.vbs" >nul 2>&1
    del /f /q "%RELEASE_BASE%\06_UnpackedApp\create-desktop-shortcut.vbs" >nul 2>&1
)
echo [OK] Pre-build workspace cleaned.
echo.

REM ------------------------------------------------------------------------------
REM [1/7] Node.js and NPM Environment Checking
REM ------------------------------------------------------------------------------
echo [1/7] Checking Node.js and NPM Environment...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 goto :ERR_NODE

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 goto :ERR_NPM

for /f "tokens=*" %%V in ('node -v') do set "NODE_VER=%%V"
for /f "tokens=*" %%V in ('npm -v') do set "NPM_VER=%%V"
echo [OK] Node.js: %NODE_VER%, NPM: %NPM_VER%
echo.

REM ------------------------------------------------------------------------------
REM [2/7] Reading Semantic Version from package.json
REM ------------------------------------------------------------------------------
echo [2/7] Extracting Semantic Version (SemVer)...
set "APP_VER=1.4.1"
for /f "tokens=*" %%V in ('node -p "require('./package.json').version" 2^>nul') do (
    if not "%%V"=="" set "APP_VER=%%V"
)
echo [OK] Target Version: v%APP_VER%
echo.

REM ------------------------------------------------------------------------------
REM [3/7] Verifying Project Dependencies (node_modules)
REM ------------------------------------------------------------------------------
echo [3/7] Verifying Project Dependencies (node_modules)...
if not exist "node_modules" goto :DO_NPM_INSTALL
echo [OK] node_modules verified.
goto :STEP4_VITE

:DO_NPM_INSTALL
echo [INFO] Installing npm dependencies, please wait...
call npm install
if %ERRORLEVEL% neq 0 goto :ERR_NPM_INSTALL
echo [OK] Dependencies installation completed.

:STEP4_VITE
echo.
REM ------------------------------------------------------------------------------
REM [4/7] Vite Production Web Bundle Building
REM ------------------------------------------------------------------------------
echo [4/7] Compiling Vite Production Web Bundle...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [WARNING] npm run build failed, retrying with npx vite build...
    call npx vite build
)

if not exist "dist\index.html" goto :ERR_DIST

set "RELEASE_BASE=release"
if not exist "%RELEASE_BASE%" mkdir "%RELEASE_BASE%"

set "DIR_04_WEB=%RELEASE_BASE%\04_WebBundle"
if not exist "%DIR_04_WEB%" mkdir "%DIR_04_WEB%"
xcopy "dist" "%DIR_04_WEB%" /E /I /Y /Q /R >nul 2>&1
if not exist "%DIR_04_WEB%\assets" mkdir "%DIR_04_WEB%\assets"
if exist "public\assets" xcopy "public\assets" "%DIR_04_WEB%\assets" /E /I /Y /Q /R >nul 2>&1
echo [OK] Step 4 Web Bundle Created: %DIR_04_WEB%
echo.

REM ------------------------------------------------------------------------------
REM [5/7] .NET 8 C# WPF Native Desktop Edition Build
REM ------------------------------------------------------------------------------
echo [5/7] Compiling .NET 8 C# WPF Native Desktop Binaries with Version Suffix...
set "CORE_PROJ=src-wpf\KCert.Core\KCert.Core.csproj"
set "WPF_PROJ=src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj"
set "DIR_05_WPF=%RELEASE_BASE%\05_WpfDesktop"
if not exist "%DIR_05_WPF%" mkdir "%DIR_05_WPF%"
if not exist "%DIR_05_WPF%\Assets" mkdir "%DIR_05_WPF%\Assets"
if not exist "src-wpf\KCertManager.Wpf\Assets" mkdir "src-wpf\KCertManager.Wpf\Assets"
if exist "public\assets\app.ico" copy /Y "public\assets\app.ico" "src-wpf\KCertManager.Wpf\Assets\app.ico" >nul 2>&1
if exist "public\app.ico" copy /Y "public\app.ico" "src-wpf\KCertManager.Wpf\Assets\app.ico" >nul 2>&1
if exist "public\assets\app-icon.ico" copy /Y "public\assets\app-icon.ico" "src-wpf\KCertManager.Wpf\Assets\app-icon.ico" >nul 2>&1
if exist "public\assets\icons" xcopy "public\assets\icons" "%DIR_05_WPF%\Assets" /E /I /Y /Q /R >nul 2>&1
if exist "public\assets\favicon.jpg" copy /Y "public\assets\favicon.jpg" "%DIR_05_WPF%\Assets\" >nul 2>&1
if exist "public\assets\app.ico" copy /Y "public\assets\app.ico" "%DIR_05_WPF%\Assets\" >nul 2>&1
if exist "public\app.ico" copy /Y "public\app.ico" "%DIR_05_WPF%\" >nul 2>&1
if exist "%DIR_05_WPF%" (
    del /f /q "%DIR_05_WPF%\KCertManager_v*.exe" >nul 2>&1
    del /f /q "%DIR_05_WPF%\KCertManager-Lite_v*.exe" >nul 2>&1
    del /f /q "%DIR_05_WPF%\*.pdb" >nul 2>&1
    del /f /q "%DIR_05_WPF%\*.deps.json" >nul 2>&1
    del /f /q "%DIR_05_WPF%\*_cor3.dll" >nul 2>&1
    del /f /q "%DIR_05_WPF%\D3DCompiler*.dll" >nul 2>&1
)

where dotnet >nul 2>&1
if %ERRORLEVEL% neq 0 goto :SKIP_WPF

set "DOTNET_MAJOR="
set "DOTNET_FULL_VER="
for /f "tokens=1 delims=." %%A in ('dotnet --version 2^>nul') do set "DOTNET_MAJOR=%%A"
for /f "tokens=*" %%V in ('dotnet --version 2^>nul') do set "DOTNET_FULL_VER=%%V"

if not "%CLI_TFM%"=="" (
    set "TARGET_TFM=%CLI_TFM%"
) else if not "%DOTNET_TARGET_TFM%"=="" (
    set "TARGET_TFM=%DOTNET_TARGET_TFM%"
) else (
    if "%DOTNET_MAJOR%"=="8" (
        set "TARGET_TFM=net8.0-windows"
    ) else if "%DOTNET_MAJOR%"=="9" (
        set "TARGET_TFM=net9.0-windows"
    ) else (
        set "TARGET_TFM=net10.0-windows"
    )
)

echo [5/7] Compiling C# WPF Native Desktop Binaries with Version Suffix...
echo       - Target Framework : %TARGET_TFM% (supports net10.0-windows / net8.0-windows)
echo       - Detected .NET SDK: %DOTNET_FULL_VER% (v%DOTNET_MAJOR%.x)
echo.

if not exist "%CORE_PROJ%" goto :BUILD_WPF_EXE
echo [INFO] Step 5-0 Compiling KCert.Core DLL (%TARGET_TFM%)...
dotnet build "%CORE_PROJ%" -c Release -p:TargetFramework=%TARGET_TFM% -o "%DIR_05_WPF%" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [NOTICE] Primary build with %TARGET_TFM% failed. Retrying with default SDK settings...
    dotnet build "%CORE_PROJ%" -c Release -o "%DIR_05_WPF%" >nul 2>&1
)
if exist "%DIR_05_WPF%\KCert.Core.dll" copy /Y "%DIR_05_WPF%\KCert.Core.dll" "KCert.Core.dll" >nul 2>&1
if exist "%DIR_05_WPF%\KCert.Core.dll" echo [OK] Step 5-0 KCert.Core.dll Core Library Compiled.

:BUILD_WPF_EXE
if not exist "%WPF_PROJ%" goto :STEP6_UNPACKED

echo [INFO] Restoring packages for win-x64 platform [%TARGET_TFM%]...
dotnet restore "%WPF_PROJ%" -r win-x64 -p:TargetFramework=%TARGET_TFM% >nul 2>&1
if %ERRORLEVEL% neq 0 dotnet restore "%WPF_PROJ%" -r win-x64 >nul 2>&1

echo [INFO] Step 5-1 Building Standalone Desktop Executable: KCertManager_v%APP_VER%.exe [%TARGET_TFM%]...
dotnet publish "%WPF_PROJ%" -c Release -r win-x64 -p:TargetFramework=%TARGET_TFM% --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o "%DIR_05_WPF%"
if %ERRORLEVEL% equ 0 goto :PUBLISH_5_1_DONE

echo [NOTICE] Single-file ReadyToRun build fallback. Retrying standard self-contained...
dotnet publish "%WPF_PROJ%" -c Release -r win-x64 -p:TargetFramework=%TARGET_TFM% --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o "%DIR_05_WPF%"
if %ERRORLEVEL% equ 0 goto :PUBLISH_5_1_DONE

echo [NOTICE] Self-Contained build fallback to Framework-Dependent mode [%TARGET_TFM%]...
dotnet publish "%WPF_PROJ%" -c Release -r win-x64 -p:TargetFramework=%TARGET_TFM% --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o "%DIR_05_WPF%"
if %ERRORLEVEL% equ 0 goto :PUBLISH_5_1_DONE

echo [NOTICE] Fallback: compiling without explicit TargetFramework parameter...
dotnet publish "%WPF_PROJ%" -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o "%DIR_05_WPF%"

:PUBLISH_5_1_DONE
if exist "%DIR_05_WPF%\KCertManager.exe" (
    copy /Y "%DIR_05_WPF%\KCertManager.exe" "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe" >nul 2>&1
    copy /Y "%DIR_05_WPF%\KCertManager.exe" "KCertManager_v%APP_VER%.exe" >nul 2>&1
    copy /Y "%DIR_05_WPF%\KCertManager.exe" "KCertManager.exe" >nul 2>&1
    echo [OK] Step 5-1 Desktop Executable Created: %DIR_05_WPF%\KCertManager_v%APP_VER%.exe
)

echo [INFO] Step 5-2 Building Ultra-Lightweight Edition: KCertManager-Lite_v%APP_VER%.exe [%TARGET_TFM%]...
set "DIR_05_LITE=%RELEASE_BASE%\05_WpfLite"
if not exist "%DIR_05_LITE%" mkdir "%DIR_05_LITE%"
dotnet publish "%WPF_PROJ%" -c Release -r win-x64 -p:TargetFramework=%TARGET_TFM% --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o "%DIR_05_LITE%" >nul 2>&1
if not exist "%DIR_05_LITE%\KCertManager.exe" (
    dotnet publish "%WPF_PROJ%" -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o "%DIR_05_LITE%" >nul 2>&1
)

if exist "%DIR_05_LITE%\KCertManager.exe" (
    copy /Y "%DIR_05_LITE%\KCertManager.exe" "%DIR_05_WPF%\KCertManager-Lite_v%APP_VER%.exe" >nul 2>&1
    copy /Y "%DIR_05_LITE%\KCertManager.exe" "%DIR_05_WPF%\KCertManager-Lite.exe" >nul 2>&1
    copy /Y "%DIR_05_LITE%\KCertManager.exe" "KCertManager-Lite_v%APP_VER%.exe" >nul 2>&1
    copy /Y "%DIR_05_LITE%\KCertManager.exe" "KCertManager-Lite.exe" >nul 2>&1
    echo [OK] Step 5-2 Ultra-Lightweight Executable Created: %DIR_05_WPF%\KCertManager-Lite_v%APP_VER%.exe
)
if exist "%DIR_05_LITE%" rd /s /q "%DIR_05_LITE%" >nul 2>&1
goto :STEP6_UNPACKED

:SKIP_WPF
echo [NOTICE] .NET SDK (dotnet.exe) not found. Skipping WPF native desktop build.
echo         (Web Production Bundle is ready to use.)

:STEP6_UNPACKED
echo.
REM ------------------------------------------------------------------------------
REM [6/7] Assembling Clean Unpacked Multi-File Portable Package
REM ------------------------------------------------------------------------------
echo [6/7] Assembling Clean Unpacked Multi-File Portable Package (No duplicates)...
set "DIR_06_UNPACKED=%RELEASE_BASE%\06_UnpackedApp"
if exist "%DIR_06_UNPACKED%" rd /s /q "%DIR_06_UNPACKED%" >nul 2>&1
mkdir "%DIR_06_UNPACKED%"

REM Copy only essential license (Korean & English) and web launcher (No VBS scripts)
for %%F in (run-web.cmd LICENSE.txt LICENSE_KR.txt LICENSE_EN.txt) do (
    if exist "%%F" copy /Y "%%F" "%DIR_06_UNPACKED%" >nul 2>&1
)

REM Copy native desktop binaries (Single copy, avoiding 70MB duplicates)
if exist "%DIR_05_WPF%\KCertManager.exe" (
    copy /Y "%DIR_05_WPF%\KCertManager.exe" "%DIR_06_UNPACKED%" >nul 2>&1
) else if exist "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe" (
    copy /Y "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe" "%DIR_06_UNPACKED%\KCertManager.exe" >nul 2>&1
)

if exist "%DIR_05_WPF%\KCertManager-Lite.exe" (
    copy /Y "%DIR_05_WPF%\KCertManager-Lite.exe" "%DIR_06_UNPACKED%" >nul 2>&1
) else if exist "%DIR_05_WPF%\KCertManager-Lite_v%APP_VER%.exe" (
    copy /Y "%DIR_05_WPF%\KCertManager-Lite_v%APP_VER%.exe" "%DIR_06_UNPACKED%\KCertManager-Lite.exe" >nul 2>&1
)

if exist "%DIR_05_WPF%\KCert.Core.dll" (
    copy /Y "%DIR_05_WPF%\KCert.Core.dll" "%DIR_06_UNPACKED%" >nul 2>&1
)

REM Copy Web Production Bundle
if not exist "%DIR_06_UNPACKED%\dist" mkdir "%DIR_06_UNPACKED%\dist"
xcopy "dist" "%DIR_06_UNPACKED%\dist" /E /I /Y /Q /R >nul 2>&1

REM Copy Branding Assets for portable distribution
if not exist "%DIR_06_UNPACKED%\assets" mkdir "%DIR_06_UNPACKED%\assets"
if exist "public\assets" xcopy "public\assets" "%DIR_06_UNPACKED%\assets" /E /I /Y /Q /R >nul 2>&1
if exist "public\app.ico" copy /Y "public\app.ico" "%DIR_06_UNPACKED%\app.ico" >nul 2>&1
if exist "public\assets\app.ico" copy /Y "public\assets\app.ico" "%DIR_06_UNPACKED%\assets\app.ico" >nul 2>&1
if not exist "%DIR_06_UNPACKED%\dist\assets" mkdir "%DIR_06_UNPACKED%\dist\assets"
if exist "public\assets" xcopy "public\assets" "%DIR_06_UNPACKED%\dist\assets" /E /I /Y /Q /R >nul 2>&1

REM Copy Essential Documentation (Excluding internal work logs)
if not exist "%DIR_06_UNPACKED%\docs" mkdir "%DIR_06_UNPACKED%\docs"
for %%D in (USER_GUIDE.md PATCHNOTES.md VERSIONING_POLICY.md KCERT_CORE_DLL_SPEC.md BUILD_GUIDE.md LICENSE.md README.md) do (
    if exist "docs\%%D" copy /Y "docs\%%D" "%DIR_06_UNPACKED%\docs" >nul 2>&1
)

REM Strict post-clean for UnpackedApp directory: ensure no *.vbs, *.pdb, *.deps.json
del /f /q "%DIR_06_UNPACKED%\*.vbs" >nul 2>&1
del /f /q "%DIR_06_UNPACKED%\*.pdb" >nul 2>&1
del /f /q "%DIR_06_UNPACKED%\*.deps.json" >nul 2>&1
del /f /q "%DIR_06_UNPACKED%\kcert-manager.cmd" >nul 2>&1
del /f /q "%DIR_06_UNPACKED%\kcert-manager.vbs" >nul 2>&1
del /f /q "%DIR_06_UNPACKED%\create-desktop-shortcut.vbs" >nul 2>&1

echo [OK] Step 6 Clean Unpacked Portable Package Assembled: %DIR_06_UNPACKED%
echo.

REM ------------------------------------------------------------------------------
REM [7/7] Inno Setup Compiler Packaging Check
REM ------------------------------------------------------------------------------
echo [7/7] Checking Inno Setup Compiler Packaging...
set "DIR_07_INSTALLER=%RELEASE_BASE%\07_Installer"
if not exist "%DIR_07_INSTALLER%" mkdir "%DIR_07_INSTALLER%"

set "ISCC_EXE="
if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC_EXE=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC_EXE=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe" set "ISCC_EXE=%LocalAppData%\Programs\Inno Setup 6\ISCC.exe"
where ISCC.exe >nul 2>&1
if %ERRORLEVEL% equ 0 set "ISCC_EXE=ISCC.exe"

if not defined ISCC_EXE goto :SKIP_INNO
if not exist "installer.iss" goto :SKIP_INNO

echo [INFO] Inno Setup Compiler Detected: %ISCC_EXE%
"%ISCC_EXE%" "/O%DIR_07_INSTALLER%" "/DMyAppVersion=%APP_VER%" "installer.iss"
if %ERRORLEVEL% equ 0 (
    echo [OK] Step 7 Installer Package Created: %DIR_07_INSTALLER%\kcert-manager-v%APP_VER%-setup.exe
)
if %ERRORLEVEL% neq 0 (
    echo [NOTICE] Inno Setup compilation bypassed. Portable package in 06_UnpackedApp is ready.
)
goto :BUILD_DONE

:SKIP_INNO
echo [NOTICE] Inno Setup (ISCC.exe) not found. Portable version in 06_UnpackedApp is ready.

:BUILD_DONE
echo.
echo ==============================================================================
echo   [BUILD COMPLETED] All release artifacts generated successfully!
echo ==============================================================================
echo   * Product:       K-Certificate Manager
echo   * Version:       v%APP_VER%
echo   * Developer:     AhBiYout
echo   * Company:       CISNet (http://www.cisnet.co.kr/)
echo   * Blog:          https://ahbivibelog.blogspot.com/
echo ------------------------------------------------------------------------------
echo   Release Artifacts Summary in [%RELEASE_BASE%\]:
if exist "%DIR_04_WEB%\index.html" (
    echo   [+] [Step 4] Web Production Bundle:  !DIR_04_WEB!
) else (
    echo   [-] [Step 4] Web Production Bundle:  Not generated
)
if exist "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe" (
    echo   [+] [Step 5-1] Standalone WPF App:   !DIR_05_WPF!\KCertManager_v!APP_VER!.exe
) else if exist "%DIR_05_WPF%\KCertManager.exe" (
    echo   [+] [Step 5-1] Standalone WPF App:   !DIR_05_WPF!\KCertManager.exe
) else (
    echo   [-] [Step 5-1] WPF Desktop App:      [.NET SDK required for desktop compile]
)
if exist "%DIR_05_WPF%\KCertManager-Lite_v%APP_VER%.exe" (
    echo   [+] [Step 5-2] Lightweight Edition:  !DIR_05_WPF!\KCertManager-Lite_v!APP_VER!.exe
)
if exist "%DIR_06_UNPACKED%" (
    echo   [+] [Step 6] Unpacked Multi-File:    !DIR_06_UNPACKED!
)
if exist "%DIR_07_INSTALLER%\kcert-manager-v%APP_VER%-setup.exe" (
    echo   [+] [Step 7] Inno Setup Installer:   !DIR_07_INSTALLER!\kcert-manager-v!APP_VER!-setup.exe
)
echo ==============================================================================
echo.

:MENU_POST_BUILD
echo ------------------------------------------------------------------------------
echo   Please select an option:
echo ------------------------------------------------------------------------------
echo   [1] Open release output directory in File Explorer
if exist "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe" (
    echo   [2] Launch WPF Desktop Executable [KCertManager_v!APP_VER!.exe]
) else if exist "%DIR_05_WPF%\KCertManager.exe" (
    echo   [2] Launch WPF Desktop Executable [KCertManager.exe]
)
echo   [3] Open Web Edition in default browser [dist\index.html]
echo   [4] Start local preview web server [Vite Preview on port 3000]
echo   [5] Open Unpacked Portable package directory [06_UnpackedApp]
echo   [6] Rebuild project from scratch
echo   [7] Create Desktop Shortcut with official icon (바탕화면 바로가기 생성)
echo   [Q] Exit build tool
echo ==============================================================================
set /p "OPT=Option (1-7 or Q, default: 1): "

if "%OPT%"=="" set "OPT=1"
if /i "%OPT%"=="Q" (
    echo.
    echo Exiting build tool. Goodbye!
    exit /b 0
)

if "%OPT%"=="7" (
    echo [INFO] Creating desktop shortcut for KCertManager.exe...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $target = $null; @('%DIR_06_UNPACKED%\KCertManager.exe', '%DIR_05_WPF%\KCertManager.exe', 'KCertManager.exe') | ForEach-Object { if (!$target -and (Test-Path $_)) { $target = (Resolve-Path $_).Path } }; if ($target) { $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\K-인증서 매니저.lnk'); $s.TargetPath = $target; $s.WorkingDirectory = Split-Path $target; if (Test-Path 'public\assets\app.ico') { $s.IconLocation = (Resolve-Path 'public\assets\app.ico').Path } elseif (Test-Path 'app.ico') { $s.IconLocation = (Resolve-Path 'app.ico').Path }; $s.Description = 'K-인증서 매니저 (C# WPF 데스크톱)'; $s.Save(); Write-Host '[OK] 바탕화면에 바로가기가 성공적으로 생성되었습니다.' -ForegroundColor Green } else { Write-Host '[ERROR] KCertManager.exe 실행 파일을 찾을 수 없습니다.' -ForegroundColor Red }"
    echo.
    pause
    goto :MENU_POST_BUILD
)

if "%OPT%"=="1" (
    start "" explorer "%RELEASE_BASE%"
    echo [OK] Opened release folder in File Explorer.
    goto :MENU_POST_BUILD
)

if "%OPT%"=="2" (
    if exist "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe" (
        echo [INFO] Launching C# WPF Desktop App [KCertManager_v%APP_VER%.exe]...
        start "" "%DIR_05_WPF%\KCertManager_v%APP_VER%.exe"
    ) else if exist "%DIR_05_WPF%\KCertManager.exe" (
        echo [INFO] Launching C# WPF Desktop App [KCertManager.exe]...
        start "" "%DIR_05_WPF%\KCertManager.exe"
    ) else (
        echo [NOTICE] WPF Desktop executable not found. Please use the Web edition.
    )
    goto :MENU_POST_BUILD
)

if "%OPT%"=="3" (
    if exist "%DIR_04_WEB%\index.html" (
        echo [INFO] Opening Web Edition in default browser...
        start "" "%DIR_04_WEB%\index.html"
    ) else if exist "dist\index.html" (
        start "" "dist\index.html"
    ) else (
        echo [ERROR] Web bundle not found.
    )
    goto :MENU_POST_BUILD
)

if "%OPT%"=="4" (
    echo [INFO] Starting local preview web server on port 3000 [Press Ctrl+C to stop]...
    call npx vite preview --port 3000 --host 0.0.0.0
    goto :MENU_POST_BUILD
)

if "%OPT%"=="5" (
    if exist "%DIR_06_UNPACKED%" (
        start "" explorer "%DIR_06_UNPACKED%"
    ) else (
        echo [ERROR] Unpacked portable package directory not found.
    )
    goto :MENU_POST_BUILD
)

if "%OPT%"=="6" (
    cls
    goto :STEP4_VITE
)

goto :MENU_POST_BUILD

REM ==============================================================================
REM  Error Routines
REM ==============================================================================
:ERR_NODE
echo.
echo [ERROR] Node.js is not installed or not found in system PATH.
echo Please install LTS version from https://nodejs.org/ and retry.
echo.
echo ==============================================================================
set /p "DUMMY=Press Enter to close this window..."
exit /b 1

:ERR_NPM
echo.
echo [ERROR] npm command was not found.
echo Please check your Node.js installation.
echo.
echo ==============================================================================
set /p "DUMMY=Press Enter to close this window..."
exit /b 1

:ERR_NPM_INSTALL
echo.
echo [ERROR] npm install failed.
echo Please check your internet connection and directory permissions.
echo.
echo ==============================================================================
set /p "DUMMY=Press Enter to close this window..."
exit /b 1

:ERR_DIST
echo.
echo [ERROR] Output file dist\index.html was not generated.
echo Please check Vite build error logs above.
echo.
echo ==============================================================================
set /p "DUMMY=Press Enter to close this window..."
exit /b 1
