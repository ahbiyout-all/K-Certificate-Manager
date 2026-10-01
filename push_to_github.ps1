# ==============================================================================
#  K-Certificate Manager (K-인증서 매니저) - GitHub 자동 업로드 및 릴리스 스크립트
# ==============================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ($ScriptDir) { Set-Location $ScriptDir }

$GIT_USERNAME = "ahbiyout-all"
$GIT_EMAIL = "ahbiyout@gmail.com"
$REPO_URL = "https://github.com/ahbiyout-all/K-Certificate-Manager.git"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  K-Certificate Manager - GitHub 자동 업로드 도구 (PowerShell)" -ForegroundColor Cyan
Write-Host "  계정      : " -NoNewline -ForegroundColor Gray
Write-Host "$GIT_USERNAME ($GIT_EMAIL)" -ForegroundColor White
Write-Host "  원격 저장소: " -NoNewline -ForegroundColor Gray
Write-Host $REPO_URL -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Git 설치 확인
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "[ERROR] Git이 설치되어 있지 않거나 환경변수 PATH에 등록되지 않았습니다." -ForegroundColor Red
    Write-Host "        https://git-scm.com/download/win 에서 Git을 먼저 설치해 주세요." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "종료하려면 Enter 키를 누르세요..."
    exit 1
}

# 2. Git 초기화
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Git 저장소 초기화 중..." -ForegroundColor Green
    & git init
} else {
    Write-Host "[1/5] 기존 Git 저장소 확인됨." -ForegroundColor Green
}

# 3. 계정 정보 설정
Write-Host "[INFO] Git 계정 설정 ($GIT_USERNAME / $GIT_EMAIL)..." -ForegroundColor Gray
& git config user.name "$GIT_USERNAME"
& git config user.email "$GIT_EMAIL"

# 4. 대용량 빌드 파일 추적 해제
Write-Host "[2/5] 대용량 빌드 폴더 Git 추적 제외 처리 중..." -ForegroundColor Green
$untrackTargets = @(
    "release", "dist", "node_modules", "package-lock.json", ".vs", "Output", "_Output",
    "src-wpf/KCert.Core/bin", "src-wpf/KCert.Core/obj",
    "src-wpf/KCertManager.Wpf/bin", "src-wpf/KCertManager.Wpf/obj",
    "bun.lock", "app-icon.ico", "app.ico",
    "K-인증서 매니저-메인.png", "K-인증서 매니저-시트.png"
)
foreach ($target in $untrackTargets) {
    & git rm -rf --cached --ignore-unmatch $target *>$null
}

# 5. package.json 및 docs/PATCHNOTES.md에서 버전 동적 추출
$APP_VERSION = ""
if (Test-Path "package.json") {
    try {
        $pkg = Get-Content "package.json" -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($pkg.version) {
            $APP_VERSION = $pkg.version
        }
    } catch {}
}
if ([string]::IsNullOrWhiteSpace($APP_VERSION) -and (Test-Path "docs/PATCHNOTES.md")) {
    try {
        $content = Get-Content "docs/PATCHNOTES.md" -Raw -Encoding UTF8
        if ($content -match '\[v([0-9\.]+)\]') {
            $APP_VERSION = $matches[1]
        }
    } catch {}
}
if ([string]::IsNullOrWhiteSpace($APP_VERSION)) {
    $APP_VERSION = "1.4.5"
}
Write-Host "[INFO] 감지된 프로젝트 릴리스 버전: v$APP_VERSION" -ForegroundColor Yellow

# 6. 소스코드 스테이징 및 커밋
Write-Host "[3/5] 소스코드 스테이징 및 커밋 생성 중 (v$APP_VERSION)..." -ForegroundColor Green
& git add .
& git commit -m "chore: release K-Certificate Manager v$APP_VERSION (3D Metallic K-Shield Icon, Transparent Desktop Shortcut, Header Version Cleanup, CRLF Bugfix, Manual Update Check)" *>$null

# 7. 브랜치 및 원격 저장소 설정
Write-Host "[4/5] 원격 저장소 연결 설정 중 ($REPO_URL)..." -ForegroundColor Green
& git branch -M main
& git remote remove origin *>$null
& git remote add origin "$REPO_URL"

# 8. GitHub 업로드 및 태그 푸시
Write-Host "[5/5] GitHub 원격 저장소로 업로드(Push) 및 릴리스 태그(v$APP_VERSION) 등록 중..." -ForegroundColor Green
Write-Host "      (GitHub 로그인 창이 뜨면 '$GIT_EMAIL' / '$GIT_USERNAME' 계정으로 승인해 주세요)" -ForegroundColor Gray
Write-Host ""

& git push -u origin main --force
$mainExit = $LASTEXITCODE

if ($mainExit -ne 0) {
    Write-Host "[NOTICE] 이전 계정 자격 증명 충돌 가능성 감지 -> 캐시 초기화 후 재시도..." -ForegroundColor Yellow
    & cmdkey /delete:git:https://github.com *>$null
    & cmdkey /delete:LegacyGeneric:target=git:https://github.com *>$null
    & git push -u origin main --force
    $mainExit = $LASTEXITCODE
}

if ($mainExit -eq 0) {
    Write-Host "[INFO] 릴리스 태그(v$APP_VERSION) 푸시 중..." -ForegroundColor Gray
    & git tag -f "v$APP_VERSION" -m "K-Certificate Manager Release v$APP_VERSION"
    & git push origin "v$APP_VERSION" --force

    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "  [SUCCESS] GitHub 업로드가 성공적으로 완료되었습니다!" -ForegroundColor Green
    Write-Host "  • 소스코드 저장소: https://github.com/$GIT_USERNAME/K-Certificate-Manager" -ForegroundColor White
    Write-Host "  • 릴리스(Releases): https://github.com/$GIT_USERNAME/K-Certificate-Manager/releases" -ForegroundColor White
    Write-Host "  • 태그(Tags)     : https://github.com/$GIT_USERNAME/K-Certificate-Manager/tags" -ForegroundColor White
    Write-Host "------------------------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "  [TIP] GitHub 자동 업데이트 알림 완벽 활성화 방법:" -ForegroundColor Yellow
    Write-Host "  1. https://github.com/$GIT_USERNAME/K-Certificate-Manager/releases 접속" -ForegroundColor Gray
    Write-Host "  2. 'Draft a new release' 클릭 후 방금 올라간 태그 'v$APP_VERSION' 선택" -ForegroundColor Gray
    Write-Host "  3. 'Publish release' 버튼을 누르면 모든 이전 버전 사용자에게 즉시 업데이트 팝업 점등!" -ForegroundColor Gray
    Write-Host "==============================================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Red
    Write-Host "  [ERROR] GitHub 푸시(업로드)에 실패했습니다. 아래 2가지를 확인해 주세요:" -ForegroundColor Red
    Write-Host "  1. https://github.com/new 에서 'K-Certificate-Manager' 저장소를 생성했는지 확인" -ForegroundColor Yellow
    Write-Host "  2. 로그인 창에서 '$GIT_USERNAME' ($GIT_EMAIL) 계정으로 인증했는지 확인" -ForegroundColor Yellow
    Write-Host "==============================================================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "종료하려면 Enter 키를 누르세요..."
