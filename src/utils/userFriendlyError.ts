/**
 * User-Friendly Error Parser and Formatter
 * Translates low-level browser File System Access API and Node/C# I/O errors
 * and exceptions into clear, polite, and actionable Korean messages.
 */

export type ErrorCategory = 
  | 'WRITE_PROTECTED'
  | 'PERMISSION_DENIED'
  | 'DISK_FULL'
  | 'DISCONNECTED'
  | 'FILE_LOCKED'
  | 'ABORTED'
  | 'CORRUPTED'
  | 'GENERAL';

export interface UserErrorInfo {
  title: string;
  summary: string;
  actionTip: string;
  fullDisplay: string;
  technicalDetail?: string;
  category: ErrorCategory;
  solutions: string[];
}

export function parseUserFriendlyError(err: unknown, actionContext?: string): UserErrorInfo {
  if (!err) {
    return {
      title: '작업 안내',
      summary: '알 수 없는 일시적 오류가 발생했습니다.',
      actionTip: '잠시 후 다시 시도해 주세요.',
      fullDisplay: '알 수 없는 일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      category: 'GENERAL',
      solutions: ['잠시 후 다시 시도해 주세요.', '새로고침(F5) 후 작업을 다시 진행해 보세요.'],
    };
  }

  const rawMsg = err instanceof Error ? err.message : String(err);
  const errName = (err instanceof Error ? err.name : '') || '';
  const contextPrefix = actionContext ? `[${actionContext}]\n` : '';

  // 1. 사용자 취소 (AbortError)
  if (errName === 'AbortError' || rawMsg.includes('user aborted') || rawMsg.includes('The user aborted a request')) {
    return {
      title: '작업 취소됨',
      summary: '폴더 선택 또는 파일 작업이 취소되었습니다.',
      actionTip: '작업을 계속하시려면 다시 폴더 선택 버튼을 눌러주세요.',
      fullDisplay: `${contextPrefix}사용자에 의해 폴더 선택 또는 작업이 취소되었습니다.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'ABORTED',
      solutions: [
        '폴더 선택 창에서 대상 USB 폴더를 선택하고 [확인]을 눌러주세요.',
        '취소된 경우 드라이브 데이터는 변경되지 않고 안전하게 유지됩니다.',
      ],
    };
  }

  // 2. 브라우저/시스템 파일 접근 권한 거부 (NotAllowedError / Permission Denied)
  if (
    errName === 'NotAllowedError' ||
    errName === 'SecurityError' ||
    rawMsg.toLowerCase().includes('permission') ||
    rawMsg.toLowerCase().includes('access denied') ||
    rawMsg.includes('권한') ||
    rawMsg.includes('거부')
  ) {
    return {
      title: '폴더/드라이브 접근 권한 필요 (Permission Denied)',
      summary: '운영체제 또는 브라우저에서 지정된 드라이브나 인증서 폴더에 쓰기/접근할 수 있는 권한을 승인하지 않았습니다.',
      actionTip: '• 브라우저 주소창 좌측의 설정 아이콘을 눌러 파일 시스템 접근 권한을 \'허용\'해 주세요.\n• Windows 보호 폴더 대신 대상 USB 드라이브의 NPKI 폴더를 선택해 주세요.',
      fullDisplay: `${contextPrefix}폴더 접근 권한이 필요합니다.\n\n[해결 방법]\n• 브라우저 상단 주소창 왼쪽의 권한 설정에서 폴더 접근을 '허용'해 주세요.\n• Windows 및 시스템 폴더가 아닌 인증서 저장 폴더를 선택해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'PERMISSION_DENIED',
      solutions: [
        '브라우저 주소창 왼쪽의 자물쇠/사이트 설정 아이콘을 클릭하여 [파일 및 폴더 수정 권한]을 "허용"으로 설정하세요.',
        '윈도우 관리자 권한이 필요한 경우, 브라우저 또는 앱을 [관리자 권한으로 실행]해 보세요.',
        'C:\\Windows 등 시스템 보호 영역 대신 USB 이동식 드라이브(E:\\, F:\\ 등)를 대상 디스크로 지정하세요.',
        '사내 보안 소프트웨어(DLP/매체제어 솔루션)가 USB 쓰기를 제한하고 있는지 전산팀에 확인하세요.',
      ],
    };
  }

  // 3. USB 쓰기 금지 (Write-Protected)
  if (
    rawMsg.toLowerCase().includes('write-protected') ||
    rawMsg.toLowerCase().includes('read-only') ||
    rawMsg.includes('쓰기 금지') ||
    rawMsg.includes('읽기 전용')
  ) {
    return {
      title: 'USB 드라이브 쓰기 금지(Write-Protected) 해제 필요',
      summary: 'USB 메모리가 물리적 스위치 또는 윈도우 보안 정책에 의해 "쓰기 금지(잠금)" 상태로 보호되어 있어 인증서 저장이 차단되었습니다.',
      actionTip: '• USB 메모리 옆면의 물리적 잠금(Lock) 스위치를 OFF로 전환해 주세요.\n• 드라이브 속성에서 읽기 전용 속성을 해제해 주세요.',
      fullDisplay: `${contextPrefix}USB 드라이브가 쓰기 금지(Lock) 상태입니다.\n\n[해결 방법]\n• USB 메모리의 잠금 스위치를 해제하거나 읽기 전용 속성을 해제해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'WRITE_PROTECTED',
      solutions: [
        'USB 메모리 측면의 물리 락(Lock) 스위치가 걸려있는지 확인하고 UNLOCK 위치로 전환하세요.',
        '파일 탐색기에서 USB 드라이브를 우클릭한 뒤 [속성]에서 "읽기 전용" 체크박스를 해제하세요.',
        'Windows 명령 프롬프트(cmd)를 관리자 권한으로 열고 diskpart 실행 후 "attributes disk clear readonly"를 입력하세요.',
        '사내 보안 DLP 프로그램(USB 쓰기 통제)이 활성화된 경우 예외 승인을 요청하세요.',
      ],
    };
  }

  // 4. 저장 공간 부족 (QuotaExceededError / Disk full)
  if (
    errName === 'QuotaExceededError' ||
    rawMsg.toLowerCase().includes('quota') ||
    rawMsg.toLowerCase().includes('disk full') ||
    rawMsg.toLowerCase().includes('not enough space') ||
    rawMsg.includes('공간이 부족')
  ) {
    return {
      title: '저장 공간 부족 (Disk Full)',
      summary: '대상 드라이브 또는 브라우저 로컬 저장소의 여유 공간이 부족하여 인증서 파일(der/key)을 쓸 수 없습니다.',
      actionTip: '• 드라이브의 불필요한 파일을 정리하여 여유 공간을 확보해 주세요.',
      fullDisplay: `${contextPrefix}저장 공간이 부족합니다.\n\n[해결 방법]\n• 드라이브의 여유 용량을 확보한 후 다시 시도해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'DISK_FULL',
      solutions: [
        '대상 드라이브의 휴지통을 비우거나 불필요한 대용량 파일을 정리하여 최소 10MB 이상의 여유 공간을 확보하세요.',
        '다른 충분한 여유 공간이 있는 외장 드라이브 또는 USB를 선택하세요.',
      ],
    };
  }

  // 5. 연결 해제 / I/O 장치 오류 (Device Disconnected / I/O Device Error)
  if (
    rawMsg.toLowerCase().includes('device') ||
    rawMsg.toLowerCase().includes('disconnected') ||
    rawMsg.toLowerCase().includes('i/o') ||
    rawMsg.toLowerCase().includes('hardware') ||
    rawMsg.includes('장치') ||
    rawMsg.includes('입출력') ||
    rawMsg.includes('연결')
  ) {
    return {
      title: 'USB 장치 연결 및 I/O 통신 오류',
      summary: '복사 작업 도중 USB 메모리와의 통신이 일시적으로 끊겼거나 하드웨어 접촉 불량이 감지되었습니다.',
      actionTip: '• USB 메모리를 분리 후 컴퓨터의 다른 USB 포트에 다시 꽂아주세요.',
      fullDisplay: `${contextPrefix}USB 장치 통신 중 문제가 발생했습니다.\n\n[해결 방법]\n• USB를 본체 뒷면 포트에 다시 연결한 후 재시도하세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'DISCONNECTED',
      solutions: [
        'USB 케이블 또는 메모리의 접촉 상태를 점검하고 컴퓨터 본체의 다른 USB 포트(본체 뒷면 포트 권장)에 다시 꽂아보세요.',
        'USB 허브 대신 PC 본체 단자에 직접 연결하면 전원 부족으로 인한 끊김을 예방할 수 있습니다.',
        '장치가 정상 인식된 후 [다시 시도] 버튼을 누르면 이어서 복사가 진행됩니다.',
      ],
    };
  }

  // 6. 파일 사용 중 (File in use / Sharing violation)
  if (
    rawMsg.toLowerCase().includes('used by another') ||
    rawMsg.toLowerCase().includes('sharing violation') ||
    rawMsg.includes('다른 프로세스') ||
    rawMsg.includes('사용 중')
  ) {
    return {
      title: '인증서 파일 프로세스 사용 중 (File In Use)',
      summary: '다른 프로그램(금융/은행 보안 프로그램, 공동인증 모듈, 국세청 홈택스 등)에서 대상 인증서 파일을 점유하고 있습니다.',
      actionTip: '• 실행 중인 인터넷뱅킹 창 및 인증서 관련 보안 프로그램을 닫고 다시 시도해 주세요.',
      fullDisplay: `${contextPrefix}다른 보안 모듈이나 프로그램에서 인증서 파일을 사용 중입니다.\n\n[해결 방법]\n• 뱅킹 브라우저나 열려 있는 폴더를 닫고 다시 시도해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'FILE_LOCKED',
      solutions: [
        '실행 중인 인터넷뱅킹 웹페이지나 증권사 HTS/MTS, 공인인증서 툴을 모두 닫아주세요.',
        '윈도우 작업 표시줄 우측 트레이에서 실행 중인 보안 프로그램(AnySign, AhnLab Safe Transaction 등)을 확인하세요.',
      ],
    };
  }

  // 7. 인증서 파싱 / 형식 손상
  if (
    rawMsg.toLowerCase().includes('asn1') ||
    rawMsg.toLowerCase().includes('pkcs') ||
    rawMsg.toLowerCase().includes('corrupted') ||
    rawMsg.toLowerCase().includes('invalid certificate') ||
    rawMsg.includes('형식') ||
    rawMsg.includes('손상')
  ) {
    return {
      title: '인증서 데이터 형식 손상 오류',
      summary: '인증서 파일 데이터(signCert.der / signPri.key)의 내부 구조가 온전하지 않거나 손상되었습니다.',
      actionTip: '• 원본 인증서 파일이 정상인지 확인하시거나 발급기관 포털에서 재발급받으시길 권장합니다.',
      fullDisplay: `${contextPrefix}인증서 데이터 형식이 올바르지 않거나 손상되었습니다.\n\n[해결 방법]\n• 인증서 파일이 정상적인지 확인하시거나 발급기관에서 다시 내려받아 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'CORRUPTED',
      solutions: [
        '원본 디스크의 signCert.der 및 signPri.key 파일 크기가 0바이트가 아닌지 확인하세요.',
        '손상된 경우 금융결제원(yessign) 또는 GPKI 발급기관 포털에서 인증서를 재발급받으시기 바랍니다.',
      ],
    };
  }

  // 8. 일반 예외
  return {
    title: '인증서 복사 중 드라이브 쓰기/권한 오류 발생',
    summary: '인증서 파일을 대상 드라이브에 쓰는 과정에서 시스템 또는 하드웨어 문제가 발생했습니다.',
    actionTip: '• 잠시 후 다시 시도해 보시거나, 다른 USB 드라이브를 선택해 주세요.\n• 문제가 지속될 경우 활동 로그를 확인해 주세요.',
    fullDisplay: `${contextPrefix}작업 처리 중 오류가 발생했습니다: ${rawMsg}\n\n[해결 방법 안내]\n• 잠시 후 다시 시도하시거나 새로고침을 실행해 주세요.`,
    technicalDetail: `${errName}: ${rawMsg}`,
    category: 'GENERAL',
    solutions: [
      'USB 메모리가 정상적으로 연결되어 있는지 확인하고 다시 시도하세요.',
      '다른 USB 포트에 연결하거나 다른 저장 드라이브를 선택해 보세요.',
      '브라우저를 새로고침(F5)한 후 복사를 다시 시도하세요.',
    ],
  };
}

export function formatUserErrorMessage(err: unknown, actionContext?: string): string {
  const info = parseUserFriendlyError(err, actionContext);
  return info.fullDisplay;
}
