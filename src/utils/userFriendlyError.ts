/**
 * K-Certificate Manager - User-Friendly Error Formatting Utility
 * Translates raw technical errors and exceptions into clear, polite, and actionable Korean messages.
 */

export interface UserErrorInfo {
  title: string;
  summary: string;
  actionTip: string;
  fullDisplay: string;
  technicalDetail?: string;
}

export function parseUserFriendlyError(err: unknown, actionContext?: string): UserErrorInfo {
  if (!err) {
    return {
      title: '작업 안내',
      summary: '알 수 없는 일시적 오류가 발생했습니다.',
      actionTip: '잠시 후 다시 시도해 주세요.',
      fullDisplay: '알 수 없는 일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
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
      title: '폴더 접근 권한 필요',
      summary: '브라우저 또는 시스템에서 지정된 폴더나 인증서 파일에 접근할 수 있는 권한을 부여하지 않았습니다.',
      actionTip: '• 브라우저 주소창 좌측의 설정 아이콘을 눌러 파일 시스템 접근 권한을 \'허용\'해 주세요.\n• Windows 또는 보호된 시스템 폴더 대신 NPKI 인증서 폴더를 직접 선택해 주세요.',
      fullDisplay: `${contextPrefix}폴더 접근 권한이 필요합니다.\n\n[해결 방법]\n• 브라우저 상단 주소창 왼쪽의 권한 설정에서 폴더 접근을 '허용'해 주세요.\n• Windows 및 시스템 폴더가 아닌 인증서 저장 폴더를 선택해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
    };
  }

  // 3. 파일/폴더 미발견 (NotFoundError)
  if (
    errName === 'NotFoundError' ||
    rawMsg.toLowerCase().includes('not found') ||
    rawMsg.toLowerCase().includes('could not find') ||
    rawMsg.includes('찾을 수 없습니다')
  ) {
    return {
      title: '인증서 파일 위치 확인 필요',
      summary: '해당 위치에서 인증서 파일(signCert.der / signPri.key)을 찾을 수 없습니다.',
      actionTip: '• USB 메모리가 컴퓨터에 정상 연결되어 있는지 확인해 주세요.\n• 인증서가 다른 폴더로 이동되었거나 이미 삭제되었는지 확인해 주세요.',
      fullDisplay: `${contextPrefix}지정된 위치에서 인증서 파일을 찾을 수 없습니다.\n\n[해결 방법]\n• USB 드라이브 연결 상태를 확인하고 최신 목록으로 새로고침해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
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
      title: '저장 공간 부족',
      summary: '드라이브 또는 브라우저 로컬 저장소 공간이 부족하여 파일을 저장할 수 없습니다.',
      actionTip: '• 드라이브의 불필요한 파일을 정리하여 여유 용량을 확보해 주세요.',
      fullDisplay: `${contextPrefix}저장 공간이 부족합니다.\n\n[해결 방법]\n• 드라이브의 여유 용량을 확보한 후 다시 시도해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
    };
  }

  // 5. USB 쓰기 금지 (Write-Protected)
  if (
    rawMsg.toLowerCase().includes('write-protected') ||
    rawMsg.toLowerCase().includes('read-only') ||
    rawMsg.includes('쓰기 금지') ||
    rawMsg.includes('읽기 전용')
  ) {
    return {
      title: 'USB 쓰기 금지(Lock) 해제 필요',
      summary: 'USB 메모리가 쓰기 금지(잠금) 상태로 설정되어 있어 인증서를 복사하거나 저장할 수 없습니다.',
      actionTip: '• USB 메모리 옆면의 물리적 잠금(Lock) 스위치를 OFF로 전환해 주세요.',
      fullDisplay: `${contextPrefix}USB 드라이브가 쓰기 금지(Lock) 상태입니다.\n\n[해결 방법]\n• USB 메모리의 잠금 스위치를 해제하거나 읽기 전용 속성을 해제해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
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
      title: '인증서 파일 사용 중 안내',
      summary: '다른 프로그램(금융/은행 보안 프로그램, 국세청 홈택스 등)에서 해당 인증서 파일을 열어두고 있습니다.',
      actionTip: '• 실행 중인 웹 브라우저 및 공인인증 보안 프로그램을 종료한 후 다시 시도해 주세요.',
      fullDisplay: `${contextPrefix}다른 보안 모듈이나 프로그램에서 인증서 파일을 사용 중입니다.\n\n[해결 방법]\n• 뱅킹 브라우저나 열려 있는 폴더를 닫고 다시 시도해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
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
      title: '인증서 데이터 형식 오류',
      summary: '인증서 파일 데이터(signCert.der / signPri.key)가 올바른 구조가 아니거나 손상되었습니다.',
      actionTip: '• 원본 인증서가 완전히 복사되었는지 확인하시거나 발급기관 포털에서 재발급받으시길 권장합니다.',
      fullDisplay: `${contextPrefix}인증서 데이터 형식이 올바르지 않거나 손상되었습니다.\n\n[해결 방법]\n• 인증서 파일이 정상적인지 확인하시거나 발급기관에서 다시 내려받아 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
    };
  }

  // 8. 클립보드 오류
  if (rawMsg.toLowerCase().includes('clipboard') || rawMsg.includes('클립보드')) {
    return {
      title: '클립보드 복사 지연',
      summary: '다른 프로그램이 클립보드를 잠그고 있어 일시적으로 복사하지 못했습니다.',
      actionTip: '• 1~2초 후 다시 복사 버튼을 눌러주세요.',
      fullDisplay: `${contextPrefix}클립보드를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.`,
      technicalDetail: `${errName}: ${rawMsg}`,
    };
  }

  // 9. 일반 예외
  return {
    title: '작업 처리 오류 안내',
    summary: '작업을 처리하는 도중 예기치 않은 문제가 발생했습니다.',
    actionTip: '• 잠시 후 다시 시도해 보시거나, 새로고침 후 진행해 주세요.\n• 문제가 지속될 경우 활동 로그를 확인해 주세요.',
    fullDisplay: `${contextPrefix}작업 처리 중 오류가 발생했습니다: ${rawMsg}\n\n[해결 방법 안내]\n• 잠시 후 다시 시도하시거나 새로고침을 실행해 주세요.`,
    technicalDetail: `${errName}: ${rawMsg}`,
  };
}

export function formatUserErrorMessage(err: unknown, actionContext?: string): string {
  const info = parseUserFriendlyError(err, actionContext);
  return info.fullDisplay;
}
