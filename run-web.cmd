@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title K-Certificate Manager - Web Edition Launcher

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

rem 1. Priority: Check if Native C# WPF Desktop App exists
if exist "%SCRIPT_DIR%KCertManager.exe" (
    start "" "%SCRIPT_DIR%KCertManager.exe"
    exit /b 0
)

rem 2. Locate Web Bundle (dist\index.html or release\04_WebBundle\index.html)
set "WEB_HTML="
if exist "%SCRIPT_DIR%dist\index.html" set "WEB_HTML=%SCRIPT_DIR%dist\index.html"
if not defined WEB_HTML if exist "%SCRIPT_DIR%release\04_WebBundle\index.html" set "WEB_HTML=%SCRIPT_DIR%release\04_WebBundle\index.html"

if not defined WEB_HTML (
    echo [ERROR] Web bundle 'dist\index.html' not found.
    echo Please run 'build.bat' first to build the application.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

rem 3. If command-line parameter /menu or --menu is passed, show interactive menu
if /i "%~1"=="--menu" goto :MENU
if /i "%~1"=="-menu" goto :MENU
if /i "%~1"=="/menu" goto :MENU
if /i "%~1"=="menu" goto :MENU

rem 4. Default execution when launched: Launch default browser directly and exit silently
start "" "%WEB_HTML%"
timeout /t 1 >nul
exit /b 0

:MENU
cls
echo ==============================================================================
echo   K-Certificate Manager - Web Edition Developer Menu
echo   Developer: AhBiYout ^| https://ahbiyoutvibe.blogspot.com/
echo ==============================================================================
echo.
echo [Web Bundle Path] %WEB_HTML%
echo.
echo   [1] Open directly in Default Web Browser (dist\index.html)
echo   [2] Start Local HTTP Web Server (Vite Preview / Port 3000)
echo   [3] Open Distribution Folder (Explorer)
echo   [Q] Quit
echo ==============================================================================
set /p "OPT=Select option (1-3 or Q, Default: 1): "

if "%OPT%"=="" set "OPT=1"
if /i "%OPT%"=="Q" exit /b 0

if "%OPT%"=="1" (
    echo.
    echo [INFO] Launching default web browser...
    start "" "%WEB_HTML%"
    timeout /t 1 >nul
    exit /b 0
)

if "%OPT%"=="2" (
    echo.
    echo [INFO] Starting local secure web server (127.0.0.1 / Press Ctrl+C to stop)...
    call npx vite preview --port 3000 --host 127.0.0.1
    echo.
    echo Server stopped.
    pause
    goto :MENU
)

if "%OPT%"=="3" (
    start "" explorer "%SCRIPT_DIR%dist"
    pause
    goto :MENU
)

goto :MENU
