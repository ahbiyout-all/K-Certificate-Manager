# ==============================================================================
#  K-Certificate Manager (K-인증서 매니저) - PowerShell Unified Build Tool
#  Developer: AhBiYout (GitHub: AhBiYout-all)
#  Official Blog: https://ahbiyoutvibe.blogspot.com/
#  Company:       (주)청운정보시스템 ( cisnet.co.kr ) (https://www.cisnet.co.kr)
# ==============================================================================

[CmdletBinding()]
param(
    [string]$TargetFramework = "",
    [switch]$SkipWpf,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$scriptDir = if ($PSScriptRoot) { 
    $PSScriptRoot 
} elseif ($MyInvocation.MyCommand -and $MyInvocation.MyCommand.Path) { 
    Split-Path -Parent $MyInvocation.MyCommand.Path 
} elseif ($MyInvocation.MyCommand -and $MyInvocation.MyCommand.Definition -and (Test-Path -LiteralPath $MyInvocation.MyCommand.Definition -ErrorAction SilentlyContinue)) { 
    Split-Path -Parent $MyInvocation.MyCommand.Definition 
} else { 
    (Get-Location).Path 
}
if ($scriptDir -and (Test-Path -LiteralPath $scriptDir -ErrorAction SilentlyContinue)) { Set-Location -LiteralPath $scriptDir }

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  K-Certificate Manager (K-인증서 매니저) - PowerShell Unified Build Tool" -ForegroundColor Green
Write-Host "  Developer: AhBiYout | Blog: https://ahbiyoutvibe.blogspot.com/ | Company: (주)청운정보시스템 ( cisnet.co.kr )" -ForegroundColor DarkCyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " [INFO] Working Directory: $scriptDir" -ForegroundColor Gray
Write-Host " [INFO] Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# ------------------------------------------------------------------------------
# Step 1: Check Node.js and NPM
# ------------------------------------------------------------------------------
Write-Host "[1/7] Node.js 및 NPM 환경 확인 중..." -ForegroundColor Cyan
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue

if (-not $nodeCmd) {
    Write-Host "[ERROR] Node.js가 설치되어 있지 않거나 PATH에 없습니다. (https://nodejs.org/)" -ForegroundColor Red
    Write-Host "창을 닫으려면 아무 키나 누르세요..." -ForegroundColor Yellow
    if ($Host.Name -eq "ConsoleHost") { $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") }
    exit 1
}
$nodeVer = & node -v
$npmVer = & npm -v
Write-Host " [OK] Node.js: $nodeVer (Node 22 LTS / 24 권장), NPM: $npmVer" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 2: Read Semantic Version from package.json
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/7] package.json 버전 정보 확인 중..." -ForegroundColor Cyan
$appVersion = "2.0.0"
if (Test-Path "$scriptDir\package.json") {
    try {
        $pkgJson = Get-Content "$scriptDir\package.json" -Raw | ConvertFrom-Json
        if ($pkgJson.version) { $appVersion = $pkgJson.version }
    } catch {
        Write-Host " [NOTICE] package.json 파싱 실패. 기본 버전(1.8.0) 사용" -ForegroundColor Yellow
    }
}
Write-Host " [OK] 대상 버전: v$appVersion" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 3: Verify Dependencies
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/7] 프로젝트 의존성 (node_modules) 확인 중..." -ForegroundColor Cyan
if (-not (Test-Path "$scriptDir\node_modules")) {
    Write-Host " [INFO] node_modules가 없습니다. npm install을 실행합니다..." -ForegroundColor Yellow
    & npm install
} else {
    Write-Host " [OK] node_modules 폴더 확인 완료." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# Version-Numbered Distribution Paths (under /dist/v$appVersion/...)
# ------------------------------------------------------------------------------
$distBase = "$scriptDir\dist"
$versionTag = "v$appVersion"
$versionDist = "$distBase\$versionTag"

$dirWeb = "$versionDist\web"
$dirWinX64 = "$versionDist\win-x64"
$dirCore = "$versionDist\core-dll"
$dirUnpacked = "$versionDist\unpacked"
$dirInstaller = "$versionDist\installer"

# Ensure all destination directories exist
foreach ($dir in @($distBase, $versionDist, $dirWeb, $dirWinX64, $dirCore, $dirUnpacked, $dirInstaller)) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
}

# ------------------------------------------------------------------------------
# Step 4: Vite Production Web Bundle Build
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/7] Vite 프로덕션 웹 번들 빌드 시작 (v$appVersion)..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Vite 웹 번들 빌드에 실패했습니다." -ForegroundColor Red
    exit 1
}

if (Test-Path $dirWeb) { Remove-Item -Recurse -Force $dirWeb }
New-Item -ItemType Directory -Path $dirWeb | Out-Null

# Copy web dist assets (excluding recursive v* folders) into /dist/v$appVersion/web
Get-ChildItem -Path "$scriptDir\dist" -Exclude "v*" | Copy-Item -Destination $dirWeb -Recurse -Force
Write-Host " [OK] Step 1 웹 번들 생성 완료: $dirWeb\" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 5: .NET 10 / .NET 8 C# WPF Native Desktop Edition & Core DLL Build
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/7] .NET 10 / .NET 8 C# WPF 데스크톱 네이티브 에디션 및 KCert.Core DLL 빌드 (v$appVersion)..." -ForegroundColor Cyan
$coreProj = "$scriptDir\src-wpf\KCert.Core\KCert.Core.csproj"
$wpfProj = "$scriptDir\src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj"

$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue

if ($dotnetCmd -and (-not $SkipWpf)) {
    # Detect .NET SDK version and select appropriate Target Framework
    $dotnetVer = & dotnet --version 2>$null
    $dotnetMajor = ($dotnetVer -split '\.')[0]
    $resolvedTfm = $TargetFramework
    if ([string]::IsNullOrWhiteSpace($resolvedTfm)) {
        if ($dotnetMajor -eq "8") {
            $resolvedTfm = "net8.0-windows"
        } elseif ($dotnetMajor -eq "9") {
            $resolvedTfm = "net9.0-windows"
        } else {
            $resolvedTfm = "net10.0-windows"
        }
    }
    Write-Host " [INFO] .NET SDK: $dotnetVer (대상 TargetFramework: $resolvedTfm, 빌드 버전: v$appVersion)" -ForegroundColor Cyan

    # 5-0: KCert.Core.dll & KCert.Crypto.dll -> /dist/v$appVersion/core-dll
    if (Test-Path $coreProj) {
        Write-Host " [INFO] KCert.Core 독립 DLL 빌드 중 ($resolvedTfm, v$appVersion)..." -ForegroundColor Yellow
        & dotnet build $coreProj -c Release -p:TargetFramework=$resolvedTfm -p:Version=$appVersion -p:AssemblyVersion=$appVersion.0 -p:FileVersion=$appVersion.0 -o $dirCore
        if ($LASTEXITCODE -ne 0) {
            & dotnet build $coreProj -c Release -p:Version=$appVersion -p:AssemblyVersion=$appVersion.0 -p:FileVersion=$appVersion.0 -o $dirCore
        }
        if (Test-Path "$dirCore\KCert.Core.dll") {
            Copy-Item -Path "$dirCore\KCert.Core.dll" -Destination "$scriptDir\KCert.Core.dll" -Force
            Write-Host " [OK] KCert.Core.dll 생성 완료: $dirCore\KCert.Core.dll" -ForegroundColor Green
        }
    }

    $cryptoProj = "$scriptDir\src-wpf\KCert.Crypto\KCert.Crypto.csproj"
    if (Test-Path $cryptoProj) {
        Write-Host " [INFO] KCert.Crypto 독립 DLL 빌드 중 ($resolvedTfm, v$appVersion)..." -ForegroundColor Yellow
        & dotnet build $cryptoProj -c Release -p:TargetFramework=$resolvedTfm -p:Version=$appVersion -p:AssemblyVersion=$appVersion.0 -p:FileVersion=$appVersion.0 -o $dirCore
        if (Test-Path "$dirCore\KCert.Crypto.dll") {
            Copy-Item -Path "$dirCore\KCert.Crypto.dll" -Destination "$scriptDir\KCert.Crypto.dll" -Force
            Write-Host " [OK] KCert.Crypto.dll 생성 완료: $dirCore\KCert.Crypto.dll" -ForegroundColor Green
        }
    }

    # 5-1: Full WPF Standalone
    if (Test-Path $wpfProj) {
        Write-Host " [INFO] win-x64 패키지 복원 중 ($resolvedTfm)..." -ForegroundColor Yellow
        & dotnet restore $wpfProj -r win-x64 -p:TargetFramework=$resolvedTfm 2>$null | Out-Null

        Write-Host " [INFO] Step 2 데스크톱 풀버전 KCertManager.exe ($resolvedTfm Self-Contained, v$appVersion) 빌드 중..." -ForegroundColor Yellow
        & dotnet publish $wpfProj -c Release -r win-x64 -p:TargetFramework=$resolvedTfm -p:Version=$appVersion -p:AssemblyVersion=$appVersion.0 -p:FileVersion=$appVersion.0 --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o $dirWinX64

        if ($LASTEXITCODE -ne 0) {
            Write-Host " [NOTICE] Self-Contained 실패 시 프레임워크 종속 모드로 대체 빌드 ($resolvedTfm, v$appVersion)..." -ForegroundColor Yellow
            & dotnet publish $wpfProj -c Release -r win-x64 -p:TargetFramework=$resolvedTfm -p:Version=$appVersion -p:AssemblyVersion=$appVersion.0 -p:FileVersion=$appVersion.0 --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o $dirWinX64
        }

        if (Test-Path "$dirWinX64\KCertManager.exe") {
            Copy-Item -Path "$dirWinX64\KCertManager.exe" -Destination "$scriptDir\KCertManager.exe" -Force
            $size = (Get-Item "$dirWinX64\KCertManager.exe").Length
            $sizeMb = [math]::Round($size / 1MB, 2)
            Write-Host " [OK] Step 2 C# WPF 풀버전 생성 완료: $dirWinX64\KCertManager.exe ($sizeMb MB)" -ForegroundColor Green
        }

        # 5-2: Lite Edition
        Write-Host " [INFO] Step 3 초경량 라이트 에디션 KCertManager-Lite.exe ($resolvedTfm, v$appVersion) 빌드 중..." -ForegroundColor Yellow
        & dotnet publish $wpfProj -c Release -r win-x64 -p:TargetFramework=$resolvedTfm -p:Version=$appVersion -p:AssemblyVersion=$appVersion.0 -p:FileVersion=$appVersion.0 --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o "$dirWinX64\lite" 2>$null | Out-Null

        if (Test-Path "$dirWinX64\lite\KCertManager.exe") {
            Copy-Item -Path "$dirWinX64\lite\KCertManager.exe" -Destination "$dirWinX64\KCertManager-Lite.exe" -Force
            Remove-Item -Recurse -Force "$dirWinX64\lite"
            $liteSizeKb = [math]::Round((Get-Item "$dirWinX64\KCertManager-Lite.exe").Length / 1KB, 1)
            Write-Host " [OK] Step 3 초경량 라이트 에디션 생성 완료: $dirWinX64\KCertManager-Lite.exe ($liteSizeKb KB)" -ForegroundColor Green
        }
    }
} else {
    Write-Host " [NOTICE] .NET SDK가 없거나 SkipWpf가 지정되어 WPF 빌드를 건너뜁니다." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# Step 6: Unpacked Multi-File Assembly (Clean, no dev/debug leftovers)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/7] 배포용 폴더 풀림 [Unpacked Multi-File] 구조 조립 중 ($dirUnpacked)..." -ForegroundColor Cyan
$artifactName = "kcert-manager-v$appVersion"
if (Test-Path $dirUnpacked) { Remove-Item -Recurse -Force $dirUnpacked }
New-Item -ItemType Directory -Path $dirUnpacked | Out-Null

# 1. Essential Launchers & License (Korean & English) only
foreach ($f in @("run-web.cmd", "launch-web.vbs", "LICENSE.txt", "LICENSE_KR.txt", "LICENSE_EN.txt")) {
    if (Test-Path "$scriptDir\$f") { Copy-Item -Path "$scriptDir\$f" -Destination $dirUnpacked -Force }
}

# 2. Native Desktop Binaries & DLLs
if (Test-Path "$dirWinX64\KCertManager.exe") {
    Copy-Item -Path "$dirWinX64\KCertManager.exe" -Destination $dirUnpacked -Force
}

if (Test-Path "$dirCore\KCert.Core.dll") {
    Copy-Item -Path "$dirCore\KCert.Core.dll" -Destination $dirUnpacked -Force
}

if (Test-Path "$dirCore\KCert.Crypto.dll") {
    Copy-Item -Path "$dirCore\KCert.Crypto.dll" -Destination $dirUnpacked -Force
}

# 3. Web Bundle (dist)
$destDist = "$dirUnpacked\dist"
if (Test-Path $destDist) { Remove-Item -Recurse -Force $destDist }
New-Item -ItemType Directory -Path $destDist | Out-Null
if (Test-Path $dirWeb) {
    Copy-Item -Path "$dirWeb\*" -Destination $destDist -Recurse -Force
}

# 4. Docs
if (Test-Path "$scriptDir\docs") {
    $destDocs = "$dirUnpacked\docs"
    if (-not (Test-Path $destDocs)) { New-Item -ItemType Directory -Path $destDocs | Out-Null }
    foreach ($d in @("USER_GUIDE.md", "PATCHNOTES.md", "VERSIONING_POLICY.md", "KCERT_CORE_DLL_SPEC.md", "BUILD_GUIDE.md", "LICENSE.md", "README.md")) {
        if (Test-Path "$scriptDir\docs\$d") { Copy-Item -Path "$scriptDir\docs\$d" -Destination $destDocs -Force }
    }
}

Write-Host " [OK] Step 6 클린 무설치 폴더 조립 완료: $dirUnpacked\" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 7: Inno Setup Compiler Packaging
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[7/7] Inno Setup 컴파일러 (ISCC.exe) 탐색 및 설치 파일 패키징 ($dirInstaller)..." -ForegroundColor Cyan
if (-not (Test-Path $dirInstaller)) { New-Item -ItemType Directory -Path $dirInstaller | Out-Null }

$isccPath = $null
$possibleIscc = @(
    "ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "${env:LocalAppData}\Programs\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 5\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 5\ISCC.exe"
)

foreach ($path in $possibleIscc) {
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $isccPath = $path; break
    } elseif (Test-Path $path) {
        $isccPath = $path; break
    }
}

if ($isccPath -and (-not $SkipInstaller) -and (Test-Path "$scriptDir\installer.iss")) {
    Write-Host " [INFO] Inno Setup 감지: $isccPath" -ForegroundColor Yellow
    & "$isccPath" "/O$dirInstaller" "/DMyAppVersion=$appVersion" "$scriptDir\installer.iss"
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK] Step 7 설치 파일 생성 완료: $dirInstaller\$artifactName-setup.exe" -ForegroundColor Green
    }
} else {
    Write-Host " [NOTICE] Inno Setup (ISCC.exe)이 없어 설치 파일 생성을 건너뜁니다. (무설치 포터블 버전 준비 완료)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  [BUILD COMPLETED] 빌드가 성공적으로 완료되었습니다!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  * 프로젝트:    K-Certificate Manager (K-인증서 매니저)" -ForegroundColor White
Write-Host "  * 버전:        v$appVersion" -ForegroundColor White
Write-Host "  * 개발자:      AhBiYout (GitHub: https://github.com/AhBiYout-all)" -ForegroundColor White
Write-Host "  * 공식 블로그: https://ahbiyoutvibe.blogspot.com/" -ForegroundColor White
Write-Host "  * 소속 회사:   (주)청운정보시스템 ( cisnet.co.kr )" -ForegroundColor White
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [버전별 dist 빌드 산출물: $versionDist\]" -ForegroundColor Yellow
Write-Host "   1. [웹 번들]         $dirWeb\" -ForegroundColor White
if (Test-Path "$dirWinX64\KCertManager.exe") {
    Write-Host "   2. [WPF 데스크톱]    $dirWinX64\KCertManager.exe" -ForegroundColor White
}
if (Test-Path "$dirWinX64\KCertManager-Lite.exe") {
    Write-Host "   3. [라이트 에디션]   $dirWinX64\KCertManager-Lite.exe" -ForegroundColor White
}
if (Test-Path "$dirCore\KCert.Core.dll") {
    Write-Host "   4. [Core DLL]        $dirCore\KCert.Core.dll" -ForegroundColor White
}
Write-Host "   5. [무설치 패키지]   $dirUnpacked\" -ForegroundColor White
if (Test-Path "$dirInstaller\$artifactName-setup.exe") {
    Write-Host "   6. [설치 프로그램]   $dirInstaller\$artifactName-setup.exe" -ForegroundColor White
}
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [작업 선택 / Next Actions]:" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [1] dist 배포 결과물 폴더 열기 (Explorer: $versionDist)" -ForegroundColor White
    if (Test-Path "$dirWinX64\KCertManager.exe") {
        Write-Host "  [2] KCertManager.exe WPF 데스크톱 앱 실행" -ForegroundColor White
    }
    Write-Host "  [3] 웹 브라우저 에디션 열기 (web\index.html)" -ForegroundColor White
    Write-Host "  [4] 로컬 웹 서버 구동 (Vite Preview / 포트 3000)" -ForegroundColor White
    Write-Host "  [5] 무설치 패키지 폴더 열기 (unpacked)" -ForegroundColor White
    if (Test-Path "$dirInstaller\$artifactName-setup.exe") {
        Write-Host "  [6] 인스톨러(Setup) 실행" -ForegroundColor White
    }
    Write-Host "  [Q] 종료 (Quit)" -ForegroundColor White
    Write-Host "==============================================================================" -ForegroundColor Cyan
    
    $opt = Read-Host "선택 [1-6 또는 Q, 기본값: 1]"
    if ([string]::IsNullOrWhiteSpace($opt)) { $opt = "1" }
    
    if ($opt -match '^(q|Q)$') {
        Write-Host " [INFO] Build Tool Exited (빌드 도구 종료) " -ForegroundColor Green
        break
    } elseif ($opt -eq "1") {
        Invoke-Item $versionDist
        Write-Host " [OK] Distribution folder opened ($versionDist) " -ForegroundColor Green
    } elseif ($opt -eq "2" -and (Test-Path "$dirWinX64\KCertManager.exe")) {
        Start-Process "$dirWinX64\KCertManager.exe"
        Write-Host " [OK] WPF Desktop App started (데스크톱 앱 실행) " -ForegroundColor Green
    } elseif ($opt -eq "3") {
        $targetHtml = if (Test-Path "$dirWeb\index.html") { "$dirWeb\index.html" } else { "$scriptDir\dist\index.html" }
        if (Test-Path $targetHtml) {
            Start-Process $targetHtml
            Write-Host " [OK] Web Edition opened (웹 브라우저 열림) " -ForegroundColor Green
        }
    } elseif ($opt -eq "4") {
        Write-Host " [INFO] Local Web Server started (종료: Ctrl+C) " -ForegroundColor Yellow
        npx vite preview --port 3000 --host 0.0.0.0
    } elseif ($opt -eq "5") {
        if (Test-Path $dirUnpacked) {
            Invoke-Item $dirUnpacked
            Write-Host " [OK] Unpacked portable folder opened ($dirUnpacked) " -ForegroundColor Green
        }
    } elseif ($opt -eq "6" -and (Test-Path "$dirInstaller\$artifactName-setup.exe")) {
        Start-Process "$dirInstaller\$artifactName-setup.exe"
        Write-Host " [OK] Installer started ($artifactName-setup.exe) " -ForegroundColor Green
    }
}
