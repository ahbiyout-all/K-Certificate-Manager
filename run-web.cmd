@echo off
title K-Certificate Manager - Web Edition
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:MENU
cls
echo ==============================================================================
echo   K-Certificate Manager - Web Edition Launcher
echo   Developer: AhBiYout ^| https://ahbivibelog.blogspot.com/
echo ==============================================================================
echo.

set "WEB_HTML="
if exist "%SCRIPT_DIR%dist\index.html" set "WEB_HTML=%SCRIPT_DIR%dist\index.html"
if not defined WEB_HTML if exist "%SCRIPT_DIR%release\04_WebBundle\index.html" set "WEB_HTML=%SCRIPT_DIR%release\04_WebBundle\index.html"

if not defined WEB_HTML (
    echo [ERROR] Web bundle 'dist\index.html' not found.
    echo Please run 'build.bat' first to build the application.
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)

echo [발견된 웹 번들] %WEB_HTML%
echo.
echo   [1] 기본 브라우저에서 바로 열기 (dist\index.html)
echo   [2] 로컬 HTTP 웹 서버 구동 (Vite Preview / 포트 3000)
echo   [3] 배포 폴더 열기 (Explorer)
echo   [Q] 종료
echo ==============================================================================
set /p "OPT=선택 (1-3 또는 Q, 기본값: 1): "

if "%OPT%"=="" set "OPT=1"
if /i "%OPT%"=="Q" exit /b 0

if "%OPT%"=="1" (
    echo.
    echo [INFO] 기본 웹 브라우저에서 열고 있습니다...
    start "" "%WEB_HTML%"
    echo [OK] 브라우저가 실행되었습니다.
    echo.
    echo 창을 유지합니다. 메뉴로 돌아가려면 아무 키나 누르세요...
    pause >nul
    goto :MENU
)

if "%OPT%"=="2" (
    echo.
    echo [INFO] 로컬 보안 웹 서버를 구동합니다 (127.0.0.1 전용 / 중지: Ctrl+C)...
    call npx vite preview --port 3000 --host 127.0.0.1
    echo.
    echo 서버가 종료되었습니다.
    pause
    goto :MENU
)

if "%OPT%"=="3" (
    start "" explorer "%SCRIPT_DIR%dist"
    pause
    goto :MENU
)

goto :MENU
