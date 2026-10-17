@echo off
chcp 65001 >nul
title K-Certificate Manager - GitHub Upload Script (v1.4.5)

cd /d "%~dp0"

set "GIT_USER=AhBiYout-all"
set "GIT_MAIL=AhBiYout-all@users.noreply.github.com"
set "REPO=https://github.com/AhBiYout-all/K-Certificate-Manager.git"

:: 버전 자동 동적 추출 (1차: package.json Node/PowerShell -> 2차: docs/PATCHNOTES.md)
set "APP_VER="
if exist "package.json" (
    for /f "tokens=*" %%V in ('node -p "require('./package.json').version" 2^>nul') do (
        if not "%%V"=="" set "APP_VER=%%V"
    )
)
if not defined APP_VER if exist "package.json" (
    for /f "tokens=*" %%V in ('powershell -NoProfile -Command "(Get-Content 'package.json' -Raw | ConvertFrom-Json).version" 2^>nul') do (
        if not "%%V"=="" set "APP_VER=%%V"
    )
)
if not defined APP_VER if exist "docs\PATCHNOTES.md" (
    for /f "tokens=*" %%V in ('powershell -NoProfile -Command "if ((Get-Content 'docs\PATCHNOTES.md' -Raw) -match '\[v([0-9\.]+)\]') { $matches[1] }" 2^>nul') do (
        if not "%%V"=="" set "APP_VER=%%V"
    )
)
if not defined APP_VER set "APP_VER=1.5.0"

title K-Certificate Manager - GitHub Upload Script (v%APP_VER%)

echo ==============================================================================
echo   K-Certificate Manager (K-인증서 매니저) - GitHub 자동 업로드 도구
echo   Developer        : AhBiYout (GitHub: %GIT_USER%)
echo   Official Blog    : https://ahbiyoutvibe.blogspot.com/
echo   Company          : https://www.cisnet.co.kr
echo   Target Repository: %REPO%
echo   Release Version  : v%APP_VER%
echo ==============================================================================
echo.

where git >nul 2>&1
if %ERRORLEVEL% neq 0 goto :NO_GIT

if not exist ".git" (
    echo [1/5] Git 저장소 초기화 중...
    git init
) else (
    echo [1/5] 기존 Git 저장소 확인됨.
)

echo [INFO] Git 보안 프로필 설정 중 (개인 이메일 비공개 보호)...
git config user.name "%GIT_USER%"
git config user.email "%GIT_MAIL%"

echo [2/5] 대용량 빌드 산출물, 압축/포터블 파일 및 민감 파일 Git 추적 제외 처리 중...
git rm -rf --cached --ignore-unmatch release dist node_modules deploy .vs Output _Output src-wpf/KCert.Core/bin src-wpf/KCert.Core/obj src-wpf/KCertManager.Wpf/bin src-wpf/KCertManager.Wpf/obj bun.lock app-icon.ico app.ico favicon.ico KCert.Core.dll AI_INSTRUCTIONS.md scripts portable Portable *.zip *.7z *.rar *.exe *.dll *.msi "K-인증서 매니저-메인.png" "K-인증서 매니저-시트.png" *.pfx *.p12 *.key *.pri *.der *.cer >nul 2>&1

echo [3/5] 소스코드 스테이징 및 커밋 생성 중 (v%APP_VER%)...
git add .
git commit -m "chore: release K-Certificate Manager v%APP_VER% (Official Release by AhBiYout)" >nul 2>&1

echo [4/5] 원격 저장소 연결 설정 중...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO%

echo [5/5] GitHub 원격 저장소로 업로드 및 릴리스 태그(v%APP_VER%) 등록 중...
echo       GitHub 브라우저 또는 로그인 창이 뜨면 '%GIT_USER%' 계정으로 승인해 주세요.
echo.

git push -u origin main --force
if %ERRORLEVEL% equ 0 goto :PUSH_OK

echo.
echo [NOTICE] 이전 계정 자격 증명 충돌 가능성 감지 - 캐시 초기화 후 재시도...
cmdkey /delete:git:https://github.com >nul 2>&1
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
git push -u origin main --force

if %ERRORLEVEL% neq 0 goto :FAILURE

:PUSH_OK
echo [INFO] 릴리스 태그 v%APP_VER% 등록 및 원격 푸시 중...
git tag -f "v%APP_VER%" -m "K-Certificate Manager Release v%APP_VER%" >nul 2>&1
git push origin "v%APP_VER%" --force >nul 2>&1

echo.
echo ==============================================================================
echo [SUCCESS] GitHub 업로드가 성공적으로 완료되었습니다!
echo   저장소       : https://github.com/%GIT_USER%/K-Certificate-Manager
echo   Releases 탭  : https://github.com/%GIT_USER%/K-Certificate-Manager/releases
echo   태그 목록    : https://github.com/%GIT_USER%/K-Certificate-Manager/tags
echo ------------------------------------------------------------------------------
echo [TIP] GitHub 자동 업데이트 알림 완벽 활성화:
echo   1. GitHub Actions 빌드가 완료되면 릴리스에 인스톨러(Setup.exe)가 자동 등록됩니다.
echo   2. 모든 이전 버전 사용자에게 실시간 업데이트 팝업창이 자동 표시됩니다.
echo ==============================================================================
echo.
pause
exit /b 0

:FAILURE
echo.
echo ==============================================================================
echo [ERROR] 업로드에 실패했습니다. 아래 2가지를 확인해 주세요:
echo   1. https://github.com/new 에서 'K-Certificate-Manager' 저장소를 생성했는지 확인
echo   2. 팝업 창에서 '%GIT_USER%' 계정으로 로그인했는지 확인
echo ==============================================================================
echo.
pause
exit /b 1

:NO_GIT
echo.
echo [ERROR] Git이 설치되어 있지 않습니다.
echo         https://git-scm.com/download/win 에서 Git을 먼저 설치해 주세요.
echo.
pause
exit /b 1
