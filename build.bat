@echo off
setlocal
cd /d "%~dp0"

REM ==============================================================================
REM   K-Certificate Manager - Windows Automated Build Tool
REM   Developer: AhBiYout (GitHub: AhBiYout-all)
REM   Repository: https://github.com/AhBiYout-all/K-Certificate-Manager
REM ==============================================================================

where powershell >nul 2>&1
if %ERRORLEVEL% equ 0 (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$d='%~dp0'.TrimEnd('\'); Set-Location -LiteralPath $d; $f=Join-Path $d 'build.ps1'; if (Test-Path -LiteralPath $f) { $c=[System.IO.File]::ReadAllText($f,[System.Text.Encoding]::UTF8); & ([scriptblock]::Create($c)) } else { exit 1 }"
    exit /b %ERRORLEVEL%
)

REM ------------------------------------------------------------------------------
REM Fallback Build Routine (Pure ASCII / Path Safe against () and special chars)
REM ------------------------------------------------------------------------------
set "SCRIPT_DIR=%~dp0"
set "RELEASE_BASE=%~dp0release"

echo ==============================================================================
echo   K-Certificate Manager - Windows Automated Build Script (CMD Fallback)
echo ==============================================================================
echo [INFO] Working Directory: %CD%
echo.

echo [1/7] Checking Node.js and NPM...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] NPM is not installed or not in PATH.
    pause
    exit /b 1
)

if not exist "%~dp0node_modules" (
    echo [INFO] Installing npm dependencies...
    call npm install
)

echo.
echo [1/6] Building Web Production Bundle...
call npm run build
if not exist "%~dp0dist\index.html" (
    echo [ERROR] Web build failed.
    pause
    exit /b 1
)

if not exist "%RELEASE_BASE%" mkdir "%RELEASE_BASE%"
if not exist "%RELEASE_BASE%\01_WebBundle" mkdir "%RELEASE_BASE%\01_WebBundle"
xcopy "%~dp0dist" "%RELEASE_BASE%\01_WebBundle" /E /I /Y /Q >nul 2>&1

echo.
echo [2/6] Building C# WPF Native Desktop Edition (.NET 10 / .NET 8, v1.9.0)...
where dotnet >nul 2>&1
if %ERRORLEVEL% equ 0 (
    if not exist "%RELEASE_BASE%\02_WpfDesktop" mkdir "%RELEASE_BASE%\02_WpfDesktop"
    dotnet publish "%~dp0src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj" -c Release -r win-x64 -p:Version=1.9.0 -p:AssemblyVersion=1.9.0.0 -p:FileVersion=1.9.0.0 --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o "%RELEASE_BASE%\02_WpfDesktop"
    if exist "%RELEASE_BASE%\02_WpfDesktop\KCertManager.Wpf.exe" (
        copy /Y "%RELEASE_BASE%\02_WpfDesktop\KCertManager.Wpf.exe" "%RELEASE_BASE%\02_WpfDesktop\KCertManager.exe" >nul 2>&1
    )
) else (
    echo [NOTICE] .NET SDK is not installed. Skipping WPF desktop build.
)

echo.
echo [3/6] Building Core DLLs (KCert.Core.dll, KCert.Crypto.dll)...
if exist "%~dp0src-wpf\KCert.Core\KCert.Core.csproj" (
    if not exist "%RELEASE_BASE%\04_CoreDll" mkdir "%RELEASE_BASE%\04_CoreDll"
    dotnet build "%~dp0src-wpf\KCert.Core\KCert.Core.csproj" -c Release -p:Version=1.9.0 -p:AssemblyVersion=1.9.0.0 -p:FileVersion=1.9.0.0 -o "%RELEASE_BASE%\04_CoreDll" >nul 2>&1
)

echo.
echo [4/6] Creating Unpacked Application Package (Unpacked Multi-File)...
if not exist "%RELEASE_BASE%\05_UnpackedApp" mkdir "%RELEASE_BASE%\05_UnpackedApp"
if exist "%~dp0run-web.cmd" copy /Y "%~dp0run-web.cmd" "%RELEASE_BASE%\05_UnpackedApp\" >nul 2>&1
if exist "%~dp0LICENSE.txt" copy /Y "%~dp0LICENSE.txt" "%RELEASE_BASE%\05_UnpackedApp\" >nul 2>&1
if exist "%~dp0LICENSE_KR.txt" copy /Y "%~dp0LICENSE_KR.txt" "%RELEASE_BASE%\05_UnpackedApp\" >nul 2>&1
if exist "%~dp0LICENSE_EN.txt" copy /Y "%~dp0LICENSE_EN.txt" "%RELEASE_BASE%\05_UnpackedApp\" >nul 2>&1
if exist "%RELEASE_BASE%\02_WpfDesktop\KCertManager.exe" copy /Y "%RELEASE_BASE%\02_WpfDesktop\KCertManager.exe" "%RELEASE_BASE%\05_UnpackedApp\" >nul 2>&1
if exist "%RELEASE_BASE%\04_CoreDll\KCert.Core.dll" copy /Y "%RELEASE_BASE%\04_CoreDll\KCert.Core.dll" "%RELEASE_BASE%\05_UnpackedApp\" >nul 2>&1
if exist "%RELEASE_BASE%\01_WebBundle" (
    if not exist "%RELEASE_BASE%\05_UnpackedApp\dist" mkdir "%RELEASE_BASE%\05_UnpackedApp\dist"
    xcopy "%RELEASE_BASE%\01_WebBundle" "%RELEASE_BASE%\05_UnpackedApp\dist" /E /I /Y /Q >nul 2>&1
)

echo.
echo ==============================================================================
echo [SUCCESS] Build completed successfully!
echo           Outputs are located in: %RELEASE_BASE%
echo ==============================================================================
pause
exit /b 0
