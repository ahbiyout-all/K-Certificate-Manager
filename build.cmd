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
set "APP_VER=2.0.0"
for /f "tokens=2 delims=:, " %%a in ('findstr /i "\"version\"" "%~dp0package.json" 2^>nul') do (
    set "APP_VER=%%~a"
)
set "APP_VER=%APP_VER:"=%"
set "DIST_BASE=%~dp0dist\v%APP_VER%"
set "DIR_WEB=%DIST_BASE%\web"
set "DIR_WINX64=%DIST_BASE%\win-x64"
set "DIR_CORE=%DIST_BASE%\core-dll"
set "DIR_UNPACKED=%DIST_BASE%\unpacked"
set "DIR_INSTALLER=%DIST_BASE%\installer"

echo ==============================================================================
echo   K-Certificate Manager - Windows Automated Build Script (CMD Fallback)
echo   Target Version: v%APP_VER%
echo   Output Directory: %DIST_BASE%
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

if not exist "%DIST_BASE%" mkdir "%DIST_BASE%"
if not exist "%DIR_WEB%" mkdir "%DIR_WEB%"
if not exist "%DIR_WINX64%" mkdir "%DIR_WINX64%"
if not exist "%DIR_CORE%" mkdir "%DIR_CORE%"
if not exist "%DIR_UNPACKED%" mkdir "%DIR_UNPACKED%"
if not exist "%DIR_INSTALLER%" mkdir "%DIR_INSTALLER%"

xcopy "%~dp0dist\index.html" "%DIR_WEB%\" /Y /Q >nul 2>&1
if exist "%~dp0dist\assets" xcopy "%~dp0dist\assets" "%DIR_WEB%\assets" /E /I /Y /Q >nul 2>&1
echo [OK] Web bundle output to: %DIR_WEB%

echo.
echo [2/6] Building C# WPF Native Desktop Edition (.NET 10 / .NET 8, v%APP_VER%)...
where dotnet >nul 2>&1
if %ERRORLEVEL% equ 0 (
    dotnet publish "%~dp0src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj" -c Release -r win-x64 -p:Version=%APP_VER% -p:AssemblyVersion=%APP_VER%.0 -p:FileVersion=%APP_VER%.0 --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o "%DIR_WINX64%"
    if exist "%DIR_WINX64%\KCertManager.Wpf.exe" (
        copy /Y "%DIR_WINX64%\KCertManager.Wpf.exe" "%DIR_WINX64%\KCertManager.exe" >nul 2>&1
        copy /Y "%DIR_WINX64%\KCertManager.Wpf.exe" "%~dp0KCertManager.exe" >nul 2>&1
    )
    echo [OK] WPF desktop output to: %DIR_WINX64%\KCertManager.exe
) else (
    echo [NOTICE] .NET SDK is not installed. Skipping WPF desktop build.
)

echo.
echo [3/6] Building Core DLLs (KCert.Core.dll, KCert.Crypto.dll)...
if exist "%~dp0src-wpf\KCert.Core\KCert.Core.csproj" (
    dotnet build "%~dp0src-wpf\KCert.Core\KCert.Core.csproj" -c Release -p:Version=%APP_VER% -p:AssemblyVersion=%APP_VER%.0 -p:FileVersion=%APP_VER%.0 -o "%DIR_CORE%" >nul 2>&1
    if exist "%DIR_CORE%\KCert.Core.dll" copy /Y "%DIR_CORE%\KCert.Core.dll" "%~dp0KCert.Core.dll" >nul 2>&1
)
if exist "%~dp0src-wpf\KCert.Crypto\KCert.Crypto.csproj" (
    dotnet build "%~dp0src-wpf\KCert.Crypto\KCert.Crypto.csproj" -c Release -p:Version=%APP_VER% -p:AssemblyVersion=%APP_VER%.0 -p:FileVersion=%APP_VER%.0 -o "%DIR_CORE%" >nul 2>&1
    if exist "%DIR_CORE%\KCert.Crypto.dll" copy /Y "%DIR_CORE%\KCert.Crypto.dll" "%~dp0KCert.Crypto.dll" >nul 2>&1
)
echo [OK] Core DLLs output to: %DIR_CORE%

echo.
echo [4/6] Creating Unpacked Application Package (Unpacked Multi-File)...
if exist "%~dp0run-web.cmd" copy /Y "%~dp0run-web.cmd" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%~dp0launch-web.vbs" copy /Y "%~dp0launch-web.vbs" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%~dp0LICENSE.txt" copy /Y "%~dp0LICENSE.txt" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%~dp0LICENSE_KR.txt" copy /Y "%~dp0LICENSE_KR.txt" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%~dp0LICENSE_EN.txt" copy /Y "%~dp0LICENSE_EN.txt" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%DIR_WINX64%\KCertManager.exe" copy /Y "%DIR_WINX64%\KCertManager.exe" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%DIR_CORE%\KCert.Core.dll" copy /Y "%DIR_CORE%\KCert.Core.dll" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%DIR_CORE%\KCert.Crypto.dll" copy /Y "%DIR_CORE%\KCert.Crypto.dll" "%DIR_UNPACKED%\" >nul 2>&1
if exist "%DIR_WEB%" (
    if not exist "%DIR_UNPACKED%\dist" mkdir "%DIR_UNPACKED%\dist"
    xcopy "%DIR_WEB%" "%DIR_UNPACKED%\dist" /E /I /Y /Q >nul 2>&1
)
if exist "%~dp0docs" (
    if not exist "%DIR_UNPACKED%\docs" mkdir "%DIR_UNPACKED%\docs"
    copy /Y "%~dp0docs\USER_GUIDE.md" "%DIR_UNPACKED%\docs\" >nul 2>&1
    copy /Y "%~dp0docs\PATCHNOTES.md" "%DIR_UNPACKED%\docs\" >nul 2>&1
    copy /Y "%~dp0docs\LICENSE.md" "%DIR_UNPACKED%\docs\" >nul 2>&1
)
echo [OK] Unpacked package output to: %DIR_UNPACKED%

echo.
echo ==============================================================================
echo [SUCCESS] Build completed successfully!
echo           Outputs are organized in: %DIST_BASE%
echo             - Web Bundle:    %DIR_WEB%
echo             - WPF Desktop:   %DIR_WINX64%
echo             - Core DLLs:     %DIR_CORE%
echo             - Unpacked App:  %DIR_UNPACKED%
echo             - Installer:     %DIR_INSTALLER%
echo ==============================================================================
pause
exit /b 0
