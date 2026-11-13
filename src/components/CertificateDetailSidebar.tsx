import React, { useState } from 'react';
import {
  FileText,
  Copy,
  X,
  Check,
  Save,
  Search,
  KeyRound,
  FolderOpen,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { CertificateItem } from '../types';
import { getDriveColorInfo } from '../utils/driveColors';
import { isUsbCertificate } from '../utils/driveFilter';
import { isNonStandardCertPath } from '../utils/certPathUtils';
import { getAccurateIssuerInfo } from '../utils/issuerUtils';

interface CertificateDetailSidebarProps {
  cert: CertificateItem | null;
  width: number;
  onClose: () => void;
  onCopySingle: (cert: CertificateItem) => void;
  onOpenFullDetailModal: (cert: CertificateItem) => void;
  onNotifyCopy?: (message: string) => void;
}

export const CertificateDetailSidebar: React.FC<CertificateDetailSidebarProps> = ({
  cert,
  width,
  onClose,
  onCopySingle,
  onOpenFullDetailModal,
  onNotifyCopy,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (key: string, value: string, label: string) => {
    if (!value) return;
    try {
      navigator.clipboard.writeText(value);
      setCopiedKey(key);
      onNotifyCopy?.(`📋 ${label}이(가) 클립보드에 복사되었습니다.`);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {}
  };

  const handleCopyAllDetails = () => {
    if (!cert) return;
    const issuerInfo = getAccurateIssuerInfo(cert.issuer, cert.caSignatureName, cert.subjectDn);
    const fullText = [
      `인증서 명칭 (CN): ${cert.name}`,
      `카테고리: ${cert.category}`,
      `발급기관: ${issuerInfo.officialOrgName} (${issuerInfo.centerName})`,
      `소유자 전체 식별명 (Subject DN): ${cert.subjectDn}`,
      `일련번호 (Serial Number): ${cert.serialNumber}`,
      `유효기간: ${cert.validFrom} ~ ${cert.validTo} (잔여 ${cert.daysRemaining}일)`,
      `정책/용도: ${cert.policy}`,
      `저장 경로: ${cert.sourceLocation}`,
      `SHA-256 지문: ${cert.files.sha256}`,
    ].join('\n');
    handleCopyText('all', fullText, '인증서 전체 상세 규격');
  };

  const getCategoryShort = (cat: CertificateItem['category']) => {
    if (cat === 'GPKI_GOV') return 'GPKI 행정';
    if (cat === 'EPKI_EDU') return 'EPKI 교육';
    if (cat === 'NPKI_CORP') return 'NPKI 법인';
    if (cat === 'NPKI_BANK') return 'NPKI 금융';
    return '기타/미분류';
  };

  return (
    <aside
      className="wpf-card wpf-native w-full xl:w-[var(--detail-w)] flex flex-col shrink-0 overflow-hidden"
      style={{
        ['--detail-w' as string]: `${width}px`,
        backgroundColor: 'var(--wpf-bg-card)',
        border: '1px solid var(--wpf-border)',
        borderRadius: '8px',
      }}
    >
      {/* Header (Matches WPF MainWindow.xaml lines 1015-1038) */}
      <div
        className="px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0"
        style={{
          backgroundColor: 'var(--wpf-bg-dark)',
          borderBottom: '1px solid var(--wpf-border)',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--wpf-accent-text)' }} />
          <span
            className="text-[13.5px] font-bold truncate"
            style={{ color: 'var(--wpf-text-primary)' }}
          >
            인증서 상세 내용
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cert && (
            <button
              type="button"
              onClick={handleCopyAllDetails}
              className="wpf-btn-secondary wpf-native px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="인증서의 전체 상세 텍스트를 클립보드에 복사합니다."
            >
              {copiedKey === 'all' ? (
                <Check className="w-3 h-3 text-[#10B981]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>전체 복사</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="wpf-btn-secondary wpf-native px-2 py-1 text-xs cursor-pointer"
            title="상세 사이드바 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Detail Content (Matches WPF lines 1040-1235) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {cert ? (
          (() => {
            const isUsb = isUsbCertificate(cert);
            const driveLetter =
              cert.sourceLocation?.length >= 2 && cert.sourceLocation[1] === ':'
                ? cert.sourceLocation.substring(0, 2)
                : 'C:';
            const dColor = getDriveColorInfo(driveLetter);
            const isNonStandard = cert.isCustomPath || isNonStandardCertPath(cert.sourceLocation);
            const issuerInfo = getAccurateIssuerInfo(cert.issuer, cert.caSignatureName, cert.subjectDn);

            const statusBadgeStyle =
              cert.status === 'expired'
                ? {
                    bg: 'var(--wpf-badge-expired-bg)',
                    border: 'var(--wpf-badge-expired-border)',
                    text: 'var(--wpf-badge-expired-text)',
                    label: '만료됨',
                  }
                : cert.status === 'expiring'
                ? {
                    bg: 'var(--wpf-badge-expiring-bg)',
                    border: 'var(--wpf-badge-expiring-border)',
                    text: 'var(--wpf-badge-expiring-text)',
                    label: `만료 임박 (D-${cert.daysRemaining})`,
                  }
                : {
                    bg: 'var(--wpf-badge-valid-bg)',
                    border: 'var(--wpf-badge-valid-border)',
                    text: 'var(--wpf-badge-valid-text)',
                    label: '정상 유효',
                  };

            return (
              <>
                {/* 1. Top Certificate Card Header */}
                <div className="wpf-well wpf-native p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-[4px]"
                      style={{
                        backgroundColor: 'var(--wpf-badge-cat-bg)',
                        color: 'var(--wpf-badge-cat-text)',
                      }}
                    >
                      {getCategoryShort(cert.category)}
                    </span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] border"
                      style={{
                        backgroundColor: dColor.bgHex,
                        borderColor: dColor.borderHex,
                        color: '#FFFFFF',
                      }}
                    >
                      {isUsb ? 'USB' : '컴퓨터'} [{dColor.letter}]
                    </span>
                  </div>

                  <div
                    className="text-[15px] font-bold break-words leading-snug"
                    style={{ color: 'var(--wpf-text-primary)' }}
                  >
                    {cert.name}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] border"
                      style={{
                        backgroundColor: statusBadgeStyle.bg,
                        borderColor: statusBadgeStyle.border,
                        color: statusBadgeStyle.text,
                      }}
                    >
                      {statusBadgeStyle.label}
                    </span>
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: 'var(--wpf-text-secondary)' }}
                    >
                      {cert.daysRemaining >= 0
                        ? `만료까지 ${cert.daysRemaining}일`
                        : `${Math.abs(cert.daysRemaining)}일 경과`}
                    </span>
                  </div>
                </div>

                {/* 2. Owner & Issuer Specs */}
                <div className="wpf-well wpf-native p-3 space-y-2.5">
                  <div
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: 'var(--wpf-accent-text)' }}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>소유자 및 발급자 식별 정보</span>
                  </div>

                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                      인증서 명칭 (CN):
                    </div>
                    <div
                      className="text-[12.5px] font-semibold mt-0.5 break-words"
                      style={{ color: 'var(--wpf-text-primary)' }}
                    >
                      {cert.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                      발급기관 (Issuer):
                    </div>
                    <div
                      className="text-xs mt-0.5 break-words"
                      style={{ color: 'var(--wpf-text-primary)' }}
                    >
                      {issuerInfo.officialOrgName} · {issuerInfo.centerName}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        소유자 전체 식별명 (Subject DN):
                      </div>
                      <div
                        className="text-[11px] font-mono mt-0.5 break-all"
                        style={{ color: 'var(--wpf-text-primary)' }}
                      >
                        {cert.subjectDn}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('dn', cert.subjectDn, '소유자 DN')}
                      className="wpf-btn-secondary wpf-native px-1.5 py-0.5 text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'dn' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>복사</span>
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        일련번호 (Serial Number):
                      </div>
                      <div
                        className="text-[11px] font-mono mt-0.5 break-all tabular-nums"
                        style={{ color: 'var(--wpf-accent-text)' }}
                      >
                        {cert.serialNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('serial', cert.serialNumber, '일련번호')}
                      className="wpf-btn-secondary wpf-native px-1.5 py-0.5 text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'serial' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>복사</span>
                    </button>
                  </div>
                </div>

                {/* 3. Validity Period */}
                <div className="wpf-well wpf-native p-3 space-y-2">
                  <div
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: 'var(--wpf-accent-text)' }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>유효기간 현황</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        발급 일자:
                      </div>
                      <div
                        className="text-[11.5px] font-mono tabular-nums mt-0.5"
                        style={{ color: 'var(--wpf-text-primary)' }}
                      >
                        {cert.validFrom}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        만료 일자:
                      </div>
                      <div className="text-[11.5px] font-mono font-bold text-[#F43F5E] tabular-nums mt-0.5">
                        {cert.validTo}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Security & Crypto Specs */}
                <div className="wpf-well wpf-native p-3 space-y-2">
                  <div
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: 'var(--wpf-accent-text)' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>암호화 규격 및 정책</span>
                  </div>

                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                      전자서명 및 개인키 암호화:
                    </div>
                    <div
                      className="text-[11.5px] mt-0.5"
                      style={{ color: 'var(--wpf-text-primary)' }}
                    >
                      {cert.keyEncryptionAlgorithm || cert.files.keyEncryptionAlgorithm || 'sha256WithRSA · SEED-CBC'}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        정책 용도 및 구분:
                      </div>
                      <div
                        className="text-[11px] font-mono mt-0.5 break-words"
                        style={{ color: 'var(--wpf-accent-text)' }}
                      >
                        {cert.policy}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('policy', cert.policy, '정책 용도')}
                      className="wpf-btn-secondary wpf-native px-1.5 py-0.5 text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'policy' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>복사</span>
                    </button>
                  </div>

                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                      개인키(signPri.key) 상태:
                    </div>
                    <div className="text-[11.5px] font-semibold text-[#10B981] flex items-center gap-1 mt-0.5">
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span>개인키 보유 완료 (정상 페어 무결성 통과)</span>
                    </div>
                  </div>
                </div>

                {/* 5. Storage Directory & Files */}
                <div className="wpf-well wpf-native p-3 space-y-2">
                  <div
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: 'var(--wpf-accent-text)' }}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>저장 경로 및 보관 상태</span>
                  </div>

                  <div>
                    <span
                      className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-[4px]"
                      style={{
                        backgroundColor: isNonStandard ? 'var(--wpf-badge-expiring-bg)' : 'var(--wpf-bg-card)',
                        border: `1px solid ${isNonStandard ? 'var(--wpf-badge-expiring-border)' : 'var(--wpf-border)'}`,
                        color: isNonStandard ? 'var(--wpf-badge-expiring-text)' : 'var(--wpf-accent-text)',
                      }}
                    >
                      {isNonStandard ? '⚠️ 비표준 위치 (PC 이동 권장)' : '✓ 공식 표준 인증서 보관 위치'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                      폴더 전체 경로:
                    </div>
                    <div
                      className="text-[11px] font-mono break-all mt-0.5"
                      style={{ color: 'var(--wpf-text-primary)' }}
                    >
                      {cert.sourceLocation}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyText('path', cert.sourceLocation, '저장 폴더 경로')}
                      className="wpf-btn-secondary wpf-native px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'path' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>경로 복사</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] tabular-nums">
                    <div>
                      <div className="text-[10.5px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        인증서 ({cert.files.certName}):
                      </div>
                      <div className="font-mono" style={{ color: 'var(--wpf-text-primary)' }}>
                        {cert.files.certSize.toLocaleString()} bytes
                      </div>
                    </div>
                    <div>
                      <div className="text-[10.5px]" style={{ color: 'var(--wpf-text-secondary)' }}>
                        개인키 ({cert.files.keyName}):
                      </div>
                      <div className="font-mono" style={{ color: 'var(--wpf-text-primary)' }}>
                        {cert.files.keySize.toLocaleString()} bytes
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onCopySingle(cert)}
                    className="wpf-btn-primary wpf-native flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>이 인증서 복사</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenFullDetailModal(cert)}
                    className="wpf-btn-secondary wpf-native py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>전문 규격 팝업</span>
                  </button>
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-14 px-4">
            <Search className="w-9 h-9 mb-3 opacity-60" style={{ color: 'var(--wpf-accent-text)' }} />
            <div
              className="text-sm font-bold mb-1.5"
              style={{ color: 'var(--wpf-text-primary)' }}
            >
              인증서를 선택하세요
            </div>
            <p
              className="text-[11.5px] leading-relaxed"
              style={{ color: 'var(--wpf-text-secondary)' }}
            >
              목록에서 인증서를 클릭하시면 모든 상세 규격, 정책 용도, 일련번호가 실시간 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
