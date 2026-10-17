# ==============================================================================
#  K-Certificate Manager - GitHub 전용 핵심 파일 동기화 스크립트 (PowerShell)
#  빌드에 꼭 필요한 핵심 파일만 'deploy/github-core' 전용 폴더에 선별 복사합니다.
#  Developer: AhBiYout (GitHub: AhBiYout-all)
# ==============================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path "$ScriptDir\..\.."
$TargetDir = "$ProjectRoot\deploy\github-core"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  K-Certificate Manager - 깃허브 전용 핵심 파일 선별 동기화 도구" -ForegroundColor Green
Write-Host "  소스 루트 : $ProjectRoot" -ForegroundColor Gray
Write-Host "  전용 대상 : $TargetDir" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 대상 폴더 초기화
Write-Host "[1/4] 전용 폴더(deploy\github-core) 초기화 중..." -ForegroundColor Cyan
if (Test-Path $TargetDir) {
    # .git 폴더가 이미 있으면 보존 (저장소 히스토리 유지 목적)
    $hasGit = Test-Path "$TargetDir\.git"
    Get-ChildItem -Path $TargetDir -Exclude ".git" | Remove-Item -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}
Write-Host " [OK] 대상 폴더 준비 완료." -ForegroundColor Green

# 2. 필수 개별 파일 복사
Write-Host ""
Write-Host "[2/4] 핵심 설정 파일 및 스크립트 복사 중..." -ForegroundColor Cyan
$coreFiles = @(
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "index.html",
    "metadata.json",
    "KCertManager.sln",
    "nuget.config",
    "installer.iss",
    "build.bat",
    "build.ps1",
    "run-web.cmd",
    "launch-web.vbs",
    "push_to_github.bat",
    "push_to_github.ps1",
    "LICENSE.txt",
    "LICENSE_KR.txt",
    "LICENSE_EN.txt",
    "README.md",
    ".gitignore",
    ".gitattributes"
)

foreach ($f in $coreFiles) {
    $srcPath = "$ProjectRoot\$f"
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination "$TargetDir\$f" -Force
        Write-Host "  + $f" -ForegroundColor DarkGray
    } else {
        Write-Host "  - [NOTICE] $f 파일 없음 (생략)" -ForegroundColor DarkYellow
    }
}

# 3. 필수 핵심 디렉터리 복사 (임시 빌드/캐시 폴더 완벽 필터링)
Write-Host ""
Write-Host "[3/4] 핵심 소스 디렉터리 필터링 복사 중..." -ForegroundColor Cyan

# (1) .github 워크플로 복사
if (Test-Path "$ProjectRoot\.github") {
    $destGithub = "$TargetDir\.github"
    New-Item -ItemType Directory -Path $destGithub -Force | Out-Null
    Copy-Item -Path "$ProjectRoot\.github\*" -Destination $destGithub -Recurse -Force
    Write-Host "  + .github/ (CI/CD 워크플로)" -ForegroundColor Green
}

# (2) src/ 웹 소스코드 복사
if (Test-Path "$ProjectRoot\src") {
    $destSrc = "$TargetDir\src"
    Copy-Item -Path "$ProjectRoot\src" -Destination $TargetDir -Recurse -Force
    Write-Host "  + src/ (React 웹 관리 콘솔 소스)" -ForegroundColor Green
}

# (3) public/ 웹 정적 에셋 복사
if (Test-Path "$ProjectRoot\public") {
    Copy-Item -Path "$ProjectRoot\public" -Destination $TargetDir -Recurse -Force
    Write-Host "  + public/ (웹 브랜딩 에셋)" -ForegroundColor Green
}

# (4) src-wpf/ C# WPF 소스코드 복사 (bin, obj, .vs 완벽 제거)
if (Test-Path "$ProjectRoot\src-wpf") {
    $destWpf = "$TargetDir\src-wpf"
    Copy-Item -Path "$ProjectRoot\src-wpf" -Destination $TargetDir -Recurse -Force
    
    # bin, obj, *.user, *.suo 제거
    Get-ChildItem -Path $destWpf -Include "bin", "obj" -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
    Get-ChildItem -Path $destWpf -Include "*.user", "*.suo", "*.tmp", "*.pdb" -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "  + src-wpf/ (C# WPF 소스코드, bin/obj 제외 완료)" -ForegroundColor Green
}

# (5) docs/ 공식 기술 문서 복사
if (Test-Path "$ProjectRoot\docs") {
    Copy-Item -Path "$ProjectRoot\docs" -Destination $TargetDir -Recurse -Force
    Write-Host "  + docs/ (공식 기술 매뉴얼 및 패치노트)" -ForegroundColor Green
}

# 4. 보안 감사 및 최종 검증
Write-Host ""
Write-Host "[4/4] 복사된 파일 보안 감사 및 무결성 검증 중..." -ForegroundColor Cyan

# 민감 인증서 파일이 복사되었는지 검사
$leakPatterns = @("*.pfx", "*.p12", "*.key", "*.pri", "*.der", "*.cer", "*.pem", "*.credentials")
$leakedFiles = Get-ChildItem -Path $TargetDir -Include $leakPatterns -Recurse -File -ErrorAction SilentlyContinue
if ($leakedFiles -and $leakedFiles.Count -gt 0) {
    Write-Host "[WARNING] 보안 경고: 민감한 인증서 확장자 파일이 감지되어 자동 제거합니다:" -ForegroundColor Red
    foreach ($lf in $leakedFiles) {
        Write-Host "  - 삭제: $($lf.FullName)" -ForegroundColor Red
        Remove-Item -Path $lf.FullName -Force
    }
} else {
    Write-Host " [PASS] 민감 인증서 파일 유출 0건 (완벽 격리 확인)" -ForegroundColor Green
}

# 불필요한 빌드 산출물 폴더 잔존 검사
$dirtyDirs = @("node_modules", "release", "dist", ".vs", "Output", "_Output")
foreach ($d in $dirtyDirs) {
    if (Test-Path "$TargetDir\$d") {
        Remove-Item -Path "$TargetDir\$d" -Recurse -Force
        Write-Host "  - 불필요 폴더($d) 자동 제거 완료" -ForegroundColor Yellow
    }
}

# 요약 보고
$allFiles = Get-ChildItem -Path $TargetDir -Recurse -File
$totalSizeMB = [math]::Round(($allFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  [동기화 완료] 깃허브 전용 핵심 파일 선별 폴더 생성이 완료되었습니다!" -ForegroundColor Green
Write-Host "  * 대상 폴더: deploy\github-core\" -ForegroundColor White
Write-Host "  * 총 파일수: $($allFiles.Count)개" -ForegroundColor White
Write-Host "  * 총 용량  : $totalSizeMB MB (대용량 빌드 파일 제외 슬림화)" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
