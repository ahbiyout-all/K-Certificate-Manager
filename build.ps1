# ==============================================================================
#  K-Certificate Manager (K-인증서 매니저) - PowerShell Unified Build Tool
#  Developer: AhBiYout
#  Blog & Homepage: https://ahbivibelog.blogspot.com/
# ==============================================================================

[CmdletBinding()]
param(
    [string]$TargetFramework = "",
    [switch]$SkipWpf,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  K-Certificate Manager (K-인증서 매니저) - PowerShell Unified Build Tool" -ForegroundColor Green
Write-Host "  Developer: AhBiYout | Blog & Homepage: https://ahbivibelog.blogspot.com/" -ForegroundColor DarkCyan
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
Write-Host " [OK] Node.js: $nodeVer, NPM: $npmVer" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 2: Read Semantic Version from package.json
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/7] package.json 버전 정보 확인 중..." -ForegroundColor Cyan
$appVersion = "1.3.0"
if (Test-Path "$scriptDir\package.json") {
    try {
        $pkgJson = Get-Content "$scriptDir\package.json" -Raw | ConvertFrom-Json
        if ($pkgJson.version) { $appVersion = $pkgJson.version }
    } catch {
        Write-Host " [NOTICE] package.json 파싱 실패. 기본 버전(1.3.0) 사용" -ForegroundColor Yellow
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
# Step 4: Vite Production Web Bundle Build
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/7] Vite 프로덕션 웹 번들 빌드 시작..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Vite 웹 번들 빌드에 실패했습니다." -ForegroundColor Red
    exit 1
}

$releaseBase = "$scriptDir\release"
if (-not (Test-Path $releaseBase)) { New-Item -ItemType Directory -Path $releaseBase | Out-Null }

$dir04Web = "$releaseBase\04_WebBundle"
if (Test-Path $dir04Web) { Remove-Item -Recurse -Force $dir04Web }
New-Item -ItemType Directory -Path $dir04Web | Out-Null
Copy-Item -Path "$scriptDir\dist\*" -Destination $dir04Web -Recurse -Force
Write-Host " [OK] Step 4 웹 번들 생성 완료: $dir04Web\" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 5: .NET 8 C# WPF Native Desktop Edition Build
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/7] .NET 8 C# WPF 데스크톱 네이티브 에디션 및 KCert.Core DLL 빌드..." -ForegroundColor Cyan
$coreProj = "$scriptDir\src-wpf\KCert.Core\KCert.Core.csproj"
$wpfProj = "$scriptDir\src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj"
$dir05Wpf = "$releaseBase\05_WpfDesktop"
if (-not (Test-Path $dir05Wpf)) { New-Item -ItemType Directory -Path $dir05Wpf | Out-Null }

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
    Write-Host " [INFO] .NET SDK: $dotnetVer (대상 TargetFramework: $resolvedTfm)" -ForegroundColor Cyan

    # 5-0: KCert.Core.dll
    if (Test-Path $coreProj) {
        Write-Host " [INFO] KCert.Core 독립 DLL 빌드 중 ($resolvedTfm)..." -ForegroundColor Yellow
        & dotnet build $coreProj -c Release -p:TargetFramework=$resolvedTfm -o $dir05Wpf
        if ($LASTEXITCODE -ne 0) {
            & dotnet build $coreProj -c Release -o $dir05Wpf
        }
        if (Test-Path "$dir05Wpf\KCert.Core.dll") {
            Copy-Item -Path "$dir05Wpf\KCert.Core.dll" -Destination "$scriptDir\KCert.Core.dll" -Force
            Write-Host " [OK] Step 5-0 KCert.Core.dll 생성 완료: $dir05Wpf\KCert.Core.dll" -ForegroundColor Green
        }
    }

    # 5-1: Full WPF Standalone
    if (Test-Path $wpfProj) {
        Write-Host " [INFO] win-x64 패키지 복원 중 ($resolvedTfm)..." -ForegroundColor Yellow
        & dotnet restore $wpfProj -r win-x64 -p:TargetFramework=$resolvedTfm 2>$null | Out-Null

        Write-Host " [INFO] Step 5-1 데스크톱 풀버전 KCertManager.exe ($resolvedTfm Self-Contained) 빌드 중..." -ForegroundColor Yellow
        & dotnet publish $wpfProj -c Release -r win-x64 -p:TargetFramework=$resolvedTfm --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o $dir05Wpf

        if ($LASTEXITCODE -ne 0) {
            Write-Host " [NOTICE] Self-Contained 실패 시 프레임워크 종속 모드로 대체 빌드 ($resolvedTfm)..." -ForegroundColor Yellow
            & dotnet publish $wpfProj -c Release -r win-x64 -p:TargetFramework=$resolvedTfm --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o $dir05Wpf
        }

        if (Test-Path "$dir05Wpf\KCertManager.exe") {
            Copy-Item -Path "$dir05Wpf\KCertManager.exe" -Destination "$scriptDir\KCertManager.exe" -Force
            $size = (Get-Item "$dir05Wpf\KCertManager.exe").Length
            $sizeMb = [math]::Round($size / 1MB, 2)
            Write-Host " [OK] Step 5-1 C# WPF 풀버전 생성 완료: $dir05Wpf\KCertManager.exe ($sizeMb MB)" -ForegroundColor Green
        }

        # 5-2: Lite Edition
        Write-Host " [INFO] Step 5-2 초경량 라이트 에디션 KCertManager-Lite.exe ($resolvedTfm) 빌드 중..." -ForegroundColor Yellow
        $dir05Lite = "$releaseBase\05_WpfLite"
        if (Test-Path $dir05Lite) { Remove-Item -Recurse -Force $dir05Lite }
        New-Item -ItemType Directory -Path $dir05Lite | Out-Null
        & dotnet publish $wpfProj -c Release -r win-x64 -p:TargetFramework=$resolvedTfm --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=false -p:DebugType=none -p:DebugSymbols=false -o $dir05Lite 2>$null | Out-Null

        if (Test-Path "$dir05Lite\KCertManager.exe") {
            Copy-Item -Path "$dir05Lite\KCertManager.exe" -Destination "$dir05Wpf\KCertManager-Lite.exe" -Force
            Copy-Item -Path "$dir05Lite\KCertManager.exe" -Destination "$scriptDir\KCertManager-Lite.exe" -Force
            $liteSizeKb = [math]::Round((Get-Item "$dir05Wpf\KCertManager-Lite.exe").Length / 1KB, 1)
            Write-Host " [OK] Step 5-2 초경량 라이트 에디션 생성 완료: $dir05Wpf\KCertManager-Lite.exe ($liteSizeKb KB)" -ForegroundColor Green
        }
        if (Test-Path $dir05Lite) { Remove-Item -Recurse -Force $dir05Lite }
    }
} else {
    Write-Host " [NOTICE] .NET SDK가 없거나 SkipWpf가 지정되어 WPF 빌드를 건너뜁니다." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# Step 6: Unpacked Multi-File Assembly
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/7] 배포용 폴더 풀림 [Unpacked Multi-File] 구조 조립 중..." -ForegroundColor Cyan
$dir06Unpacked = "$releaseBase\06_UnpackedApp"
if (-not (Test-Path $dir06Unpacked)) { New-Item -ItemType Directory -Path $dir06Unpacked | Out-Null }

$artifactName = "kcert-manager-v$appVersion"

# ------------------------------------------------------------------------------
# Step 6: Unpacked Multi-File Assembly (Clean, no dev/debug leftovers)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/7] 배포용 폴더 풀림 [Unpacked Multi-File] 구조 조립 중..." -ForegroundColor Cyan
$dir06Unpacked = "$releaseBase\06_UnpackedApp"
if (Test-Path $dir06Unpacked) { Remove-Item -Recurse -Force $dir06Unpacked }
New-Item -ItemType Directory -Path $dir06Unpacked | Out-Null

# 1. Essential Launchers & License (Korean & English) only (Exclude dev files and unnecessary scripts)
foreach ($f in @("run-web.cmd", "LICENSE.txt", "LICENSE_KR.txt", "LICENSE_EN.txt")) {
    if (Test-Path "$scriptDir\$f") { Copy-Item -Path "$scriptDir\$f" -Destination $dir06Unpacked -Force }
}

# 2. Native Desktop Binaries (Single copy only, no duplicate version tags, no pdb/deps)
if (Test-Path "$dir05Wpf\KCertManager.exe") {
    Copy-Item -Path "$dir05Wpf\KCertManager.exe" -Destination $dir06Unpacked -Force
} elseif (Test-Path "$dir05Wpf\KCertManager_v$appVersion.exe") {
    Copy-Item -Path "$dir05Wpf\KCertManager_v$appVersion.exe" -Destination "$dir06Unpacked\KCertManager.exe" -Force
}

if (Test-Path "$dir05Wpf\KCertManager-Lite.exe") {
    Copy-Item -Path "$dir05Wpf\KCertManager-Lite.exe" -Destination $dir06Unpacked -Force
} elseif (Test-Path "$dir05Wpf\KCertManager-Lite_v$appVersion.exe") {
    Copy-Item -Path "$dir05Wpf\KCertManager-Lite_v$appVersion.exe" -Destination "$dir06Unpacked\KCertManager-Lite.exe" -Force
}

if (Test-Path "$dir05Wpf\KCert.Core.dll") {
    Copy-Item -Path "$dir05Wpf\KCert.Core.dll" -Destination $dir06Unpacked -Force
}

# 3. Web Bundle (dist)
$destDist = "$dir06Unpacked\dist"
if (Test-Path $destDist) { Remove-Item -Recurse -Force $destDist }
New-Item -ItemType Directory -Path $destDist | Out-Null
Copy-Item -Path "$scriptDir\dist\*" -Destination $destDist -Recurse -Force

# 4. Docs
if (Test-Path "$scriptDir\docs") {
    $destDocs = "$dir06Unpacked\docs"
    if (-not (Test-Path $destDocs)) { New-Item -ItemType Directory -Path $destDocs | Out-Null }
    foreach ($d in @("USER_GUIDE.md", "PATCHNOTES.md", "VERSIONING_POLICY.md", "KCERT_CORE_DLL_SPEC.md", "BUILD_GUIDE.md", "LICENSE.md", "README.md")) {
        if (Test-Path "$scriptDir\docs\$d") { Copy-Item -Path "$scriptDir\docs\$d" -Destination $destDocs -Force }
    }
}

Write-Host " [OK] Step 6 클린 무설치 폴더 조립 완료: $dir06Unpacked\" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 7: Inno Setup Compiler Packaging
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[7/7] Inno Setup 컴파일러 (ISCC.exe) 탐색 및 설치 파일 패키징..." -ForegroundColor Cyan
$dir07Installer = "$releaseBase\07_Installer"
if (-not (Test-Path $dir07Installer)) { New-Item -ItemType Directory -Path $dir07Installer | Out-Null }

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
    & "$isccPath" "/O$dir07Installer" "/DMyAppVersion=$appVersion" "$scriptDir\installer.iss"
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK] Step 7 설치 파일 생성 완료: $dir07Installer\$artifactName-setup.exe" -ForegroundColor Green
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
Write-Host "  * 개발자:      AhBiYout (https://ahbivibelog.blogspot.com/)" -ForegroundColor White
Write-Host "  * 홈페이지:    https://ahbivibelog.blogspot.com/" -ForegroundColor White
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [빌드 산출물 목록: $releaseBase\]" -ForegroundColor Yellow
Write-Host "   1. [Step 4 웹 번들]        $dir04Web\" -ForegroundColor White
if (Test-Path "$dir05Wpf\KCertManager.exe") {
    Write-Host "   2. [Step 5-1 WPF 데스크톱] $dir05Wpf\KCertManager.exe" -ForegroundColor White
}
if (Test-Path "$dir05Wpf\KCertManager-Lite.exe") {
    Write-Host "   2-1.[Step 5-2 라이트 에디션] $dir05Wpf\KCertManager-Lite.exe" -ForegroundColor White
}
Write-Host "   3. [Step 6 무설치 패키지]  $dir06Unpacked\" -ForegroundColor White
if (Test-Path "$dir07Installer\$artifactName-setup.exe") {
    Write-Host "   4. [Step 7 설치 프로그램]  $dir07Installer\$artifactName-setup.exe" -ForegroundColor White
}
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  원하시는 작업을 선택하세요:" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [1] 배포 결과물(release) 폴더 탐색기로 열기" -ForegroundColor White
    if (Test-Path "$dir05Wpf\KCertManager.exe") {
        Write-Host "  [2] C# WPF 데스크톱 앱 실행 (KCertManager.exe)" -ForegroundColor White
    }
    Write-Host "  [3] 웹 브라우저 에디션 열기 (dist\index.html)" -ForegroundColor White
    Write-Host "  [4] 로컬 웹 서버 구동 (Vite Preview / 포트 3000)" -ForegroundColor White
    Write-Host "  [5] 무설치 패키지 폴더 열기 (06_UnpackedApp)" -ForegroundColor White
    Write-Host "  [Q] 종료" -ForegroundColor White
    Write-Host "==============================================================================" -ForegroundColor Cyan
    
    $opt = Read-Host "선택 (1-5 또는 Q, 기본값: 1)"
    if ([string]::IsNullOrWhiteSpace($opt)) { $opt = "1" }
    
    if ($opt -match '^(q|Q)$') {
        Write-Host "빌드 도구를 종료합니다." -ForegroundColor Green
        break
    } elseif ($opt -eq "1") {
        Invoke-Item $releaseBase
        Write-Host " [OK] release 폴더를 열었습니다." -ForegroundColor Green
    } elseif ($opt -eq "2" -and (Test-Path "$dir05Wpf\KCertManager.exe")) {
        Start-Process "$dir05Wpf\KCertManager.exe"
        Write-Host " [OK] WPF 데스크톱 앱을 실행했습니다." -ForegroundColor Green
    } elseif ($opt -eq "3") {
        $targetHtml = if (Test-Path "$dir04Web\index.html") { "$dir04Web\index.html" } else { "$scriptDir\dist\index.html" }
        if (Test-Path $targetHtml) {
            Start-Process $targetHtml
            Write-Host " [OK] 기본 브라우저에서 웹 에디션을 열었습니다." -ForegroundColor Green
        }
    } elseif ($opt -eq "4") {
        Write-Host " [INFO] 로컬 웹 서버를 구동합니다 (종료: Ctrl+C)..." -ForegroundColor Yellow
        npx vite preview --port 3000 --host 0.0.0.0
    } elseif ($opt -eq "5") {
        if (Test-Path $dir06Unpacked) {
            Invoke-Item $dir06Unpacked
            Write-Host " [OK] 06_UnpackedApp 폴더를 열었습니다." -ForegroundColor Green
        }
    }
}
