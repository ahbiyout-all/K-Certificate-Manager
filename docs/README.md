# K-인증서 매니저 (K-Certificate Manager) 문서

대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융 공동인증서(NPKI)를 안전하게 탐색, 백업, 정리 및 복구할 수 있는 통합 인증서 관리 소프트웨어입니다.

---

## 📌 프로젝트 정보

- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **현재 버전**: `v1.4.5` (Semantic Versioning: `1.4.5`)
- **개발자**: AhBiYout
- **소속**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/) (CISNet)
- **공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **GitHub 저장소**: [https://github.com/ahbiyout-all/K-Certificate-Manager](https://github.com/ahbiyout-all/K-Certificate-Manager)
- **라이선스**: Free Use / MIT License — **한국어(`LICENSE_KR.txt`) 및 영어(`LICENSE_EN.txt`) 2종 라이선스 정의 사용** (개인·공공기관·기업 무료 이용 허용)

---

## 📂 문서 디렉터리 구성 (`/docs`)

| 파일명 | 설명 |
| :--- | :--- |
| [`VERSIONING_POLICY.md`](./VERSIONING_POLICY.md) | **버전 관리 표준 정책**: SemVer 2.0.0 (MAJOR.MINOR.PATCH) 3단계 분류 및 코드 수정 시 동기화 체크리스트 |
| [`PATCHNOTES.md`](./PATCHNOTES.md) | **버전 릴리스 패치노트**: v1.0.0부터 v1.4.3까지의 상세 기능 변경, 보안 패치 및 릴리스 히스토리 |
| [`LICENSE.md`](./LICENSE.md) | **소프트웨어 라이선스 & 법적 고지**: 한국어(`LICENSE_KR.txt`)·영어(`LICENSE_EN.txt`) 2종 라이선스 정의, 무상 이용 조건 및 보증 부인 |
| [`USER_GUIDE.md`](./USER_GUIDE.md) | **사용자 매뉴얼**: 모던 일체형 타이틀바, 4종 테마, 인증서 탐색, USB 백업, USB➔PC 복사, 만료/타인 정리 및 휴지통 가이드 |
| [`BUILD_GUIDE.md`](./BUILD_GUIDE.md) | **빌드 및 배포 가이드**: .NET 10 / .NET 8 자동 감지 빌드(`build.bat`), Inno Setup 폴더 풀림 패키징, GitHub 업로드(`push_to_github.bat`) 안내 |
| [`AUTO_UPDATE_GUIDE.md`](./AUTO_UPDATE_GUIDE.md) | **자동 업데이트 가이드**: GitHub Releases REST API 기반 실시간 버전 확인, SemVer 비교, 웹/WPF 자동 감지 및 릴리스 배포 파이프라인 |
| [`WPF_NATIVE_GUIDE.md`](./WPF_NATIVE_GUIDE.md) | **C# WPF 데스크톱 개발 가이드**: MVVM 아키텍처, 모던 일체형 타이틀바(`WindowChrome`), 풀버전/라이트 빌드 안내 |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | **시스템 아키텍처**: 인증서 파일 쌍 규격, 경로 매핑, 양방향 전송 파이프라인 및 7대 보안 하드닝 설계 원칙 |
| [`KCERT_CORE_DLL_SPEC.md`](./KCERT_CORE_DLL_SPEC.md) | **KCert.Core.dll 기술 명세서**: 순수 창작 코어 라이브러리 동작 원리, OID 역해석, 화이트리스트 안전 전송, WMI 가드 상세 명세 |
| [`WORK_LOG.md`](./WORK_LOG.md) | **공식 작업 일지**: 개발 요구사항, 차수별 구현 내역, 보안 감사 및 검증 이력 |

---

## 🚀 주요 기능 요약

1. **자동 경로 탐색 및 비표준 경로 정밀 식별**
   - Windows 사용자 프로필 내 `GPKI`, `EPKI`, `NPKI` 인증서 표준/비표준 경로 자동 감지
   - `signCert.der`(공개키) 및 `signPri.key`(개인키) 파일 쌍 실시간 무결성 검증
2. **모던 일체형 타이틀바 (`WindowChrome`) & 4종 테마 시스템**
   - Windows 기본 흰색 타이틀바를 제거하고 앱 상단 헤더에 최소화·최대화/복원·닫기 버튼 및 드래그 이동을 통합한 모던 프레임리스 디자인
   - 다크 · 회색 · 화이트 · 베이지 4가지 테마와 타이틀바·사이드바·상태 표시줄 완벽 색상 동기화
3. **7대 보안 하드닝 (Security Hardening)**
   - 인증서 전송 시 화이트리스트 확장자(`.der`, `.cer`, `.crt`, `.key`, `.pri`, `.pfx`, `.p12`, `.pem`)만 허용하여 악성 실행파일(`.exe`, `.bat` 등) 동반 복사 원천 차단
   - `Path.GetFullPath` 정규화 기반 상위 경로 이탈(Path Traversal) 차단, 외부 URL(`https://`/`http://`) 스킴 검증, 파서 512KB 크기 제한(DoS 방어) 적용
4. **한국어·영어 2종 라이선스 정의 및 친화적 한국어 오류 안내**
   - `LICENSE_KR.txt`(한국어), `LICENSE_EN.txt`(영어), `LICENSE.txt`(한·영 통합) 2종 라이선스 체계 지원
   - 복잡한 시스템 예외를 사용자 눈높이의 친절한 한국어 설명과 해결 가이드로 변환 표시
5. **USB ➔ 컴퓨터(PC) 양방향 인증서 복사 및 최대 3회 자동 재시도**
   - PC ➔ USB 백업 및 외부 USB 디스크의 인증서를 로컬 PC `AppData\LocalLow` 표준 보관함으로 안전하게 가져오기
   - 일시적 I/O 오류 발생 시 지수 백오프 기반 최대 3회 자동 재시도 및 SHA-256 해시 대조
6. **만료된 인증서 & 타인 인증서 안전 삭제 및 휴지통/실행 취소**
   - 유효기간 경과 인증서 및 공용 PC 내 타인 인증서 안전 정리, 즉시 실행 취소(Undo) 및 안전 격리 휴지통(`SafetyTrash`) 지원

