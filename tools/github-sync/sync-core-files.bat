@echo off
chcp 65001 >nul
title K-Certificate Manager - GitHub Core Files Synchronizer

cd /d "%~dp0"

echo ==============================================================================
echo   K-Certificate Manager - GitHub 전용 핵심 파일 동기화 도구 (Windows CMD)
echo   Developer: AhBiYout (GitHub: AhBiYout-all)
echo ==============================================================================
echo.

echo [INFO] 핵심 파일 선별 동기화 프로세스를 시작합니다...

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    node "%~dp0sync-core-files.mjs"
    goto :SYNC_CHECK
)

where powershell >nul 2>&1
if %ERRORLEVEL% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-core-files.ps1"
    goto :SYNC_CHECK
)

echo [ERROR] Node.js 또는 PowerShell 환경을 찾을 수 없습니다.
pause
exit /b 1

:SYNC_CHECK
if %ERRORLEVEL% equ 0 (
    echo [OK] deploy\github-core 동기화가 정상 완료되었습니다.
) else (
    echo [ERROR] 동기화 중 오류가 발생했습니다.
)

echo.
pause
exit /b %ERRORLEVEL%
