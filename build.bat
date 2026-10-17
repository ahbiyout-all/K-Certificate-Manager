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
echo [4/7] Building Web Production Bundle...
call npm run build
if not exist "%~dp0dist\index.html" (
    echo [ERROR] Web build failed.
    pause
    exit /b 1
)

if not exist "%RELEASE_BASE%" mkdir "%RELEASE_BASE%"
if not exist "%RELEASE_BASE%\04_WebBundle" mkdir "%RELEASE_BASE%\04_WebBundle"
xcopy "%~dp0dist" "%RELEASE_BASE%\04_WebBundle" /E /I /Y /Q >nul 2>&1

echo.
echo [5/7] Building C# WPF Native Desktop Edition...
where dotnet >nul 2>&1
if %ERRORLEVEL% equ 0 (
    if not exist "%RELEASE_BASE%\05_WpfDesktop" mkdir "%RELEASE_BASE%\05_WpfDesktop"
    dotnet publish "%~dp0src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o "%RELEASE_BASE%\05_WpfDesktop"
    if exist "%RELEASE_BASE%\05_WpfDesktop\KCertManager.Wpf.exe" (
        copy /Y "%RELEASE_BASE%\05_WpfDesktop\KCertManager.Wpf.exe" "%RELEASE_BASE%\05_WpfDesktop\KCertManager.exe" >nul 2>&1
        copy /Y "%RELEASE_BASE%\05_WpfDesktop\KCertManager.Wpf.exe" "%~dp0KCertManager.exe" >nul 2>&1
    )
) else (
    echo [NOTICE] .NET SDK is not installed. Skipping WPF desktop build.
)

echo.
echo [6/7] Creating Unpacked Application Package...
if not exist "%RELEASE_BASE%\06_UnpackedApp" mkdir "%RELEASE_BASE%\06_UnpackedApp"
if exist "%~dp0run-web.cmd" copy /Y "%~dp0run-web.cmd" "%RELEASE_BASE%\06_UnpackedApp\" >nul 2>&1
if exist "%~dp0LICENSE.txt" copy /Y "%~dp0LICENSE.txt" "%RELEASE_BASE%\06_UnpackedApp\" >nul 2>&1
if exist "%~dp0LICENSE_KR.txt" copy /Y "%~dp0LICENSE_KR.txt" "%RELEASE_BASE%\06_UnpackedApp\" >nul 2>&1
if exist "%RELEASE_BASE%\05_WpfDesktop\KCertManager.exe" copy /Y "%RELEASE_BASE%\05_WpfDesktop\KCertManager.exe" "%RELEASE_BASE%\06_UnpackedApp\" >nul 2>&1
if exist "%RELEASE_BASE%\04_WebBundle" (
    if not exist "%RELEASE_BASE%\06_UnpackedApp\dist" mkdir "%RELEASE_BASE%\06_UnpackedApp\dist"
    xcopy "%RELEASE_BASE%\04_WebBundle" "%RELEASE_BASE%\06_UnpackedApp\dist" /E /I /Y /Q >nul 2>&1
)

echo.
echo ==============================================================================
echo [SUCCESS] Build completed successfully!
echo           Outputs are located in: %RELEASE_BASE%
echo ==============================================================================
pause
exit /b 0
