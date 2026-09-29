# K-인증서 매니저 빌드 및 배포 가이드 (Build & Deployment Guide)

본 문서는 Windows 환경에서 K-인증서 매니저를 자동으로 빌드하고, **Inno Setup 폴더 풀림(Unpacked Multi-File) 설치 프로그램(`setup.exe`)** 및 포터블 실행 파일을 패키징하는 절차를 안내합니다.

---

## 1. 사전 요구사항 (Prerequisites)

- **운영체제**: Windows 10 / 11 또는 Windows Server
- **.NET SDK**: **.NET 10.0 SDK** (권장, `net10.0-windows` 타깃) 또는 **.NET 8.0 SDK** (`net8.0-windows` 자동 호환)
- **Node.js**: v18.0.0 이상 권장
- **NPM**: Node.js 기본 패키지 관리자
- **Inno Setup**: Inno Setup 6 (권장) 또는 Inno Setup 5 (설치 프로그램 컴파일 시 필요)
  - 공식 다운로드: [https://jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php)

---

## 2. Inno Setup 폴더 풀림(Unpacked Multi-File) 설치 방식

K-인증서 매니저는 단일 압축 덩어리 형태가 아닌, 설치 대상 디렉터리에 애플리케이션의 모든 구성 파일과 서브디렉터리가 온전히 풀리는 **Unpacked Multi-File 레이아웃**으로 설치됩니다.

### 📂 설치 후 대상 폴더 구조 (`{autopf}\K-Certificate Manager`)
```text
C:\Program Files (x86)\K-Certificate Manager\  (또는 사용자 지정 경로)
 ├── dist\                         # Vite 빌드 프로덕션 웹 번들
 │    ├── index.html               # 메인 진입점
 │    └── assets\                  # 번들링된 JS, CSS, 폰트, 정적 리소스
 ├── docs\                         # 전체 기술 및 사용자 문서
 │    ├── README.md
 │    ├── USER_GUIDE.md
 │    ├── BUILD_GUIDE.md
 │    ├── PATCHNOTES.md
 │    ├── ARCHITECTURE.md
 │    ├── KCERT_CORE_DLL_SPEC.md
 │    ├── VERSIONING_POLICY.md
 │    └── LICENSE.md
 ├── KCertManager.exe              # C# WPF 네이티브 데스크톱 단일 실행 파일
 ├── KCertManager-Lite.exe         # C# WPF 초경량 라이트 에디션 실행 파일
 ├── KCert.Core.dll                # 인증서 코어 라이브러리 DLL
 ├── run-web.cmd                   # 웹 브라우저 실행 스크립트 (127.0.0.1 로컬 격리)
 ├── LICENSE.txt                   # 한·영 통합 공식 소프트웨어 라이선스
 ├── LICENSE_KR.txt                # 한국어 소프트웨어 라이선스 정의
 ├── LICENSE_EN.txt                # 영어(English) 소프트웨어 라이선스 정의
 └── unins000.exe                  # Inno Setup 공식 언인스톨러
```

### 🎯 Inno Setup 주요 설정 (`installer.iss`)
- **설치 모드**: `PrivilegesRequired=lowest` (관리자 권한 없이도 일반 사용자 계정에 안전하게 설치 가능)
- **압축 알고리즘**: `lzma2/ultra64` (최대 압축률과 빠른 풀기 속도)
- **다국어 지원**: 한국어(`LICENSE_KR.txt`) 및 영어(`LICENSE_EN.txt`) 위저드 인터페이스 제공
- **단축 아이콘**: 시작 메뉴 프로그램 그룹 및 바탕화면 바로가기 자동 생성
- **클린 삭제**: 프로그램 제거 시 설치된 `dist`, `docs`, 런처 스크립트 및 런타임 로그를 완벽하게 정리

---

## 3. 원클릭 자동 빌드 스크립트 (`build.bat`)

프로젝트 루트의 `build.bat`을 실행하면 전체 빌드 및 Inno Setup 설치 파일 패키징이 자동으로 진행됩니다.
이 스크립트는 **.NET 10.0(`net10.0-windows`) 및 .NET 8.0(`net8.0-windows`)을 지능적으로 감지**하여 최적의 타깃 프레임워크로 빌드합니다:

```cmd
:: 1. 시스템에 설치된 .NET SDK 버전에 따라 자동 감지 빌드 (기본값)
build.bat

:: 2. .NET 10.0 타깃 명시 빌드 (net10.0-windows)
build.bat net10

:: 3. .NET 8.0 타깃 명시 빌드 (net8.0-windows)
build.bat net8
```

### 빌드 파이프라인 진행 순서
0. **Pre-build Cleanup**: 작업 공간 내 잔여 레거시 스크립트(`*.vbs`, 중복 `*.bat`, `*.ps1`) 자동 정리
1. **Environment Check**: `node.exe`, `npm.cmd`, `dotnet.exe` 환경 점검
2. **Version Extraction**: `package.json`의 SemVer 버전 자동 추출 (예: `1.4.2`)
3. **Dependency Verification**: `node_modules` 존재 여부 확인 및 자동 설치
4. **Web Bundle Build**: `npm run build` (`dist/` 생성)
5. **C# WPF Native Desktop Compilation**:
   - .NET 10.0 / .NET 8.0 타깃 프레임워크 자동 매칭 컴파일
   - `KCert.Core.dll` 순수 창작 코어 라이브러리 빌드
   - `KCertManager_v1.4.2.exe` (풀버전, Self-Contained)
   - `KCertManager-Lite_v1.4.2.exe` (초경량 에디션, Framework-Dependent)
   - 인스톨러 및 런처 호환용 `KCertManager.exe` 자동 생성
6. **Unpacked Multi-File Package Assembling**: `release\06_UnpackedApp\` 폴더에 불필요한 VBS/중복 스크립트 없이 정제된 구성 파일 및 실행 런처(`run-web.cmd`) 복사
7. **Inno Setup Compiler Packaging (Unpacked Multi-File Installer)**:
   - `ISCC.exe`가 감지되면 `installer.iss`를 자동 컴파일하여 `release\07_Installer\kcert-manager-v1.4.2-setup.exe` 생성
   - **중복 팩킹 원천 제거**: 70MB 바이너리를 단 1벌만 배포하고, 무차별 와일드카드(`*`) 제거, 중복 스크립트 및 개발 전용 소스 파일 배포 제외로 인스톨러 용량 50% 절감
   - **폴더 풀림(Unpacked Multi-File) 설치**: 설치 완료 시 대상 디렉터리(`{app}`) 내에 `dist\`, `docs\`, 필수 실행 바이너리(`KCertManager.exe`, `KCertManager-Lite.exe`, `KCert.Core.dll`) 및 런처가 디렉터리 트리 그대로 개별 파일로 완전히 풀려서 설치됨
   - 미감지 시 `06_UnpackedApp` 무설치 패키지 바로 사용 가능

---

## 4. 수동 Inno Setup 컴파일 방법

Inno Setup Compiler GUI를 열거나 커맨드라인에서 직접 컴파일할 수도 있습니다:

```cmd
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" /DMyAppVersion=1.4.2 installer.iss
```

---

## 5. 산출물 디렉터리 체계 (`release/`)

| 폴더 / 파일 | 빌드 단계 | 예상 용량 | 설명 및 특징 |
| :--- | :--- | :--- | :--- |
| `release\04_WebBundle\` | **Step 4** | ~2MB | Vite 프로덕션 번들 (HTML, CSS, JS 개별 에셋) |
| `release\05_WpfDesktop\KCertManager_v1.4.2.exe` | **Step 5-1** | **~69MB** | **C# WPF 데스크톱 풀버전 (정식 독립 실행형)** (.NET 10 / .NET 8 런타임 내장) |
| `release\05_WpfDesktop\KCertManager-Lite_v1.4.2.exe` | **Step 5-2** | **~6MB** | **C# WPF 초경량 라이트 에디션** (프레임워크 종속형 단일 실행 바이너리) |
| `release\06_UnpackedApp\` | **Step 6** | ~75MB | 중복 파일이 제거된 슬림 무설치 폴더 풀림(Unpacked Multi-File) 포터블 패키지 |
| `release\07_Installer\kcert-manager-v1.4.2-setup.exe` | **Step 7** | ~40MB | Inno Setup 공식 설치 인스톨러 (중복 팩킹 없는 정규 개별 파일 설치 수행) |

> 💡 **배포 패키지 경량화 & 2대 실행 파일 전용 압축**: 포터블 압축 파일(`KCertManager-v1.4.2-WPF-Desktop.zip`)에는 사용자의 혼란을 방지하기 위해 불필요한 개발 디버깅 파일(`*.pdb`), 의존성 파일(`*.deps.json`) 및 외부 DLL을 자동 정리하고, **버전 정보가 명시된 2개의 실행 파일(`KCertManager_v1.4.2.exe`, `KCertManager-Lite_v1.4.2.exe`)만 깨끗하게 패킹**됩니다.

---

## 6. GitHub 원격 저장소 자동 업로드 및 클라우드 CI/CD (`push_to_github.bat`)

빌드 완료 후 대용량 바이너리(`release/`, `bin/`, `obj/`)로 인한 GitHub 100MB 용량 제한 오류 없이 소스코드를 원클릭으로 업로드할 수 있도록 `push_to_github.bat` 스크립트를 제공합니다:

```cmd
:: GitHub 공식 저장소(https://github.com/ahbiyout-all/K-Certificate-Manager.git)로 자동 커밋 및 업로드
push_to_github.bat
```
- **버전 동적 추출 & 릴리스 태그 생성**: `package.json`의 버전을 자동으로 판별하여 커밋 메시지 및 Git 태그(`v1.4.2`)를 자동 생성하여 푸시합니다.
- **GitHub Actions 클라우드 빌드 (`.github/workflows/build.yml`)**: 코드가 푸시되면 깃허브 클라우드의 Windows 러너가 웹(Vite)과 C# WPF 데스크톱 앱을 자동 컴파일하고 정식 릴리스 압축본(`KCertManager-v1.4.2-WPF-Desktop.zip`)과 인스톨러(`kcert-manager-v1.4.2-setup.exe`)를 생성하여 **GitHub Releases**에 자동 등록합니다.
- **용량 제한 방어**: `.gitignore`를 통해 `node_modules/`, `dist/`, `release/`, `**/bin/`, `**/obj/` 대용량 폴더를 자동으로 Git 추적에서 제외(`git rm -r --cached`)합니다.

---

## 7. 공식 정보 및 문의 채널
- **개발자**: AhBiYout
- **GitHub 공식 저장소**: [https://github.com/ahbiyout-all/K-Certificate-Manager](https://github.com/ahbiyout-all/K-Certificate-Manager)
- **버그 제보 및 기능 제안 (Issues)**: [https://github.com/ahbiyout-all/K-Certificate-Manager/issues](https://github.com/ahbiyout-all/K-Certificate-Manager/issues)
- **공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **회사 홈페이지**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/) (CISNet)

