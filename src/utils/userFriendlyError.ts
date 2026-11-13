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
      summary: '폴더 선택 또는 작업이 취소되었습니다.',
      actionTip: '계속하려면 폴더를 다시 선택해 주세요.',
      fullDisplay: `${contextPrefix}사용자가 작업을 취소했습니다.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'ABORTED',
      solutions: [
        '폴더 선택 창에서 대상 폴더를 고른 뒤 [확인]을 눌러주세요.',
        '기존 파일은 변경되지 않고 그대로 안전합니다.',
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
      title: '폴더 접근 권한 필요 (Permission Denied)',
      summary: '선택한 드라이브나 폴더에 쓸 수 있는 권한이 없습니다.',
      actionTip: '주소창 왼쪽 설정에서 파일 접근 권한을 허용하거나 다른 폴더를 선택하세요.',
      fullDisplay: `${contextPrefix}폴더 접근 권한이 필요합니다.\n\n• 브라우저 주소창 왼쪽 설정에서 폴더 접근을 '허용'해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'PERMISSION_DENIED',
      solutions: [
        '브라우저 주소창 왼쪽 자물쇠/설정 아이콘에서 [파일 수정 권한]을 허용하세요.',
        '앱 또는 브라우저를 [관리자 권한으로 실행]해 보세요.',
        'C:\\Windows 등 보호 폴더 대신 USB 드라이브나 인증서 폴더를 선택하세요.',
        '사내 보안 프로그램(DLP)이 USB 쓰기를 막고 있는지 확인하세요.',
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
      title: 'USB 쓰기 금지 상태 (Read-Only)',
      summary: 'USB가 잠겨 있어 파일을 저장할 수 없습니다.',
      actionTip: 'USB 잠금 스위치를 해제하거나 읽기 전용 설정을 꺼주세요.',
      fullDisplay: `${contextPrefix}USB가 쓰기 금지(잠금) 상태입니다.\n\n• 잠금 스위치 또는 읽기 전용 속성을 해제해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'WRITE_PROTECTED',
      solutions: [
        'USB 옆면의 물리 잠금(LOCK) 스위치를 해제(UNLOCK)로 옮기세요.',
        '드라이브 우클릭 → [속성]에서 "읽기 전용" 체크를 해제하세요.',
        '관리자 CMD에서 diskpart → attributes disk clear readonly 를 실행하세요.',
        '사내 보안 프로그램 차단 시 관리자에게 예외를 요청하세요.',
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
      summary: '드라이브 여유 공간이 부족해 파일을 저장할 수 없습니다.',
      actionTip: '불필요한 파일을 지워 여유 공간을 확보해 주세요.',
      fullDisplay: `${contextPrefix}저장 공간이 부족합니다.\n\n• 여유 용량을 확보한 뒤 다시 시도해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'DISK_FULL',
      solutions: [
        '대상 드라이브의 불필요한 파일을 삭제해 10MB 이상 확보하세요.',
        '여유 공간이 충분한 다른 USB를 선택하세요.',
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
      title: 'USB 연결 끊김 (I/O 오류)',
      summary: '복사 중 USB 연결이 일시적으로 끊겼습니다.',
      actionTip: 'USB를 뺐다가 다른 포트에 다시 꽂아주세요.',
      fullDisplay: `${contextPrefix}USB 연결에 문제가 발생했습니다.\n\n• 다른 USB 포트에 다시 꽂고 재시도하세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'DISCONNECTED',
      solutions: [
        'USB를 빼고 본체의 다른 포트에 직접 꽂아보세요.',
        'USB 허브 대신 본체 단자에 직접 연결하면 안정적입니다.',
        '인식 후 [다시 시도]를 눌러 복사를 진행하세요.',
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
      title: '인증서 파일 사용 중 (File In Use)',
      summary: '은행·보안 프로그램이 인증서 파일을 사용 중입니다.',
      actionTip: '열린 은행 창이나 보안 프로그램을 닫고 다시 시도하세요.',
      fullDisplay: `${contextPrefix}다른 프로그램이 인증서 파일을 사용 중입니다.\n\n• 열린 뱅킹 창이나 폴더를 닫고 다시 시도하세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'FILE_LOCKED',
      solutions: [
        '열려 있는 인터넷뱅킹·홈택스·인증 창을 모두 닫아주세요.',
        '트레이의 보안 프로그램을 종료한 뒤 다시 시도하세요.',
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
      title: '인증서 파일 손상',
      summary: '인증서 파일이 손상되어 읽을 수 없습니다.',
      actionTip: '정상 파일인지 확인하거나 발급기관에서 다시 받으세요.',
      fullDisplay: `${contextPrefix}인증서 파일이 손상되었습니다.\n\n• 발급기관 사이트에서 인증서를 재발급받아 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
      category: 'CORRUPTED',
      solutions: [
        'signCert.der / signPri.key 파일 크기가 0바이트가 아닌지 확인하세요.',
        '손상된 경우 발급기관 사이트에서 다시 발급받아 주세요.',
      ],
    };
  }

  // 8. 일반 예외
  return {
    title: '인증서 복사 오류',
    summary: '파일을 복사하는 중 오류가 발생했습니다.',
    actionTip: '잠시 후 다시 시도하거나 다른 USB를 선택하세요.',
    fullDisplay: `${contextPrefix}작업 중 오류가 발생했습니다: ${rawMsg}`,
    technicalDetail: `${errName}: ${rawMsg}`,
    category: 'GENERAL',
    solutions: [
      'USB 연결 상태를 확인한 뒤 다시 시도하세요.',
      '다른 USB 포트나 다른 드라이브를 선택해 보세요.',
      '새로고침(F5) 후 다시 시도하세요.',
    ],
  };
}

export function formatUserErrorMessage(err: unknown, actionContext?: string): string {
  const info = parseUserFriendlyError(err, actionContext);
  return info.fullDisplay;
}
