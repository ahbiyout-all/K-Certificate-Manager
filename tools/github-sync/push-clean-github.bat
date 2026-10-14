@echo off
chcp 65001 >nul
title K-Certificate Manager - GitHub Clean Push Tool

cd /d "%~dp0"

echo ==============================================================================
echo   K-Certificate Manager - 깃허브 전용 핵심 파일 클린 자동 푸시 도구
echo   Developer: AhBiYout (GitHub: AhBiYout-all)
echo   Company  : (주)씨아이에스넷 CISNet (https://www.cisnet.co.kr)
echo   Blog     : https://ahbiyoutvibe.blogspot.com/
echo ==============================================================================
echo.

echo [단계 1/3] 빌드 필수 핵심 파일 전용 폴더(deploy\github-core)로 최신 동기화...
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    node "%~dp0sync-core-files.mjs"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-core-files.ps1"
)
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 핵심 파일 동기화 실패로 업로드를 중단합니다.
    pause
    exit /b 1
)

set "TARGET_DIR=%~dp0..\..\deploy\github-core"
if not exist "%TARGET_DIR%" (
    echo [ERROR] 전용 폴더(%TARGET_DIR%)를 찾을 수 없습니다.
    pause
    exit /b 1
)

cd /d "%TARGET_DIR%"

echo.
echo [단계 2/3] 깃허브 전용 저장소 환경 준비 (deploy\github-core)...
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git이 설치되어 있지 않습니다.
    echo         https://git-scm.com/ 에서 Git을 설치해 주세요.
    pause
    exit /b 1
)

if not exist ".git" (
    git init
)

set "GIT_USER=AhBiYout-all"
set "GIT_MAIL=AhBiYout-all@users.noreply.github.com"
set "REPO=https://github.com/AhBiYout-all/K-Certificate-Manager.git"

git config user.name "%GIT_USER%"
git config user.email "%GIT_MAIL%"

:: 버전 자동 추출
set "APP_VER=1.5.0"
if exist "package.json" (
    for /f "tokens=*" %%V in ('powershell -NoProfile -Command "(Get-Content 'package.json' -Raw | ConvertFrom-Json).version" 2^>nul') do (
        if not "%%V"=="" set "APP_VER=%%V"
    )
)

echo.
echo [단계 3/3] 스테이징, 커밋 및 깃허브 원격 푸시 (v%APP_VER%)...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO%

git add .
git commit -m "chore: release K-Certificate Manager v%APP_VER% (Core Build-Essential Clean Release)" >nul 2>&1

echo GitHub 브라우저 로그인 창이 나타나면 '%GIT_USER%' 계정으로 승인해 주세요.
git push -u origin main --force
if %ERRORLEVEL% neq 0 (
    echo [NOTICE] 이전 자격 증명 캐시 초기화 후 재시도...
    cmdkey /delete:git:https://github.com >nul 2>&1
    cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
    git push -u origin main --force
)

if %ERRORLEVEL% equ 0 (
    echo [INFO] 릴리스 태그(v%APP_VER%) 등록 및 푸시...
    git tag -f "v%APP_VER%" -m "K-Certificate Manager Release v%APP_VER%" >nul 2>&1
    git push origin "v%APP_VER%" --force >nul 2>&1

    echo.
    echo ==============================================================================
    echo [SUCCESS] 깃허브 핵심 파일 단독 업로드가 성공적으로 완료되었습니다!
    echo   저장소       : https://github.com/%GIT_USER%/K-Certificate-Manager
    echo   Releases 탭  : https://github.com/%GIT_USER%/K-Certificate-Manager/releases
    echo ==============================================================================
) else (
    echo.
    echo [ERROR] 업로드에 실패했습니다. 저장소 생성 및 로그인 계정을 확인해 주세요.
)

echo.
pause
exit /b %ERRORLEVEL%
