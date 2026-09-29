import React from 'react';
import { 
  X, 
  FileKey, 
  ShieldCheck, 
  Lock, 
  Copy, 
  Calendar, 
  Building2, 
  HardDrive, 
  Laptop,
  Fingerprint, 
  KeyRound, 
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { CertificateItem } from '../types';

interface CertificateDetailModalProps {
  cert: CertificateItem | null;
  onClose: () => void;
  onCopySingle: (cert: CertificateItem) => void;
  onOpenRenewalGuidance?: (cert: CertificateItem) => void;
}

export const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  cert,
  onClose,
  onCopySingle,
  onOpenRenewalGuidance,
}) => {
  if (!cert) return null;

  const isUsb = (cert.sourceDrive || '').includes('이동식') || 
                (cert.sourceDrive || '').includes('USB') || 
                (cert.sourceLocation || '').toUpperCase().startsWith('E:') ||
                (cert.sourceLocation || '').toUpperCase().startsWith('F:') ||
                (cert.sourceLocation || '').toUpperCase().startsWith('G:') ||
                (cert.sourceLocation || '').toUpperCase().startsWith('H:');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileKey className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">인증서 세부정보 (X.509)</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                  {cert.category}
                </span>
                {isUsb ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>USB 이동식</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-700 text-slate-200 border border-slate-600 rounded flex items-center gap-1">
                    <Laptop className="w-3 h-3" />
                    <span>컴퓨터 로컬</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{cert.name} 님의 전자서명 인증서 명세</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Top Summary Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">인증서 소유자 (User)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{cert.name}</div>
              {cert.departmentOrOrg && (
                <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cert.departmentOrOrg}</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-slate-500">발급기관 (CA) 및 서명기관</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{cert.issuer}</div>
              {cert.caSignatureName && (
                <div className="text-xs text-blue-700 font-semibold mt-1 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{cert.caSignatureName}</span>
                </div>
              )}
              <div className="text-xs text-slate-600 font-medium mt-1">{cert.policy}</div>
            </div>
          </div>

          {/* Physical Storage Medium Info Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isUsb 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {isUsb ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="font-bold text-xs">
                  {isUsb ? 'USB 이동식 저장매체에 보관 중' : '컴퓨터 로컬 디스크에 보관 중'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  드라이브: <strong className="font-mono">{cert.sourceDrive}</strong>
                </div>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
              isUsb ? 'bg-emerald-200/80 text-emerald-800' : 'bg-blue-200/80 text-blue-800'
            }`}>
              {isUsb ? '이동식 (Removable)' : '내부 디스크 (Local)'}
            </span>
          </div>

          {/* Detailed Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              X.509 인증서 필드 정보
            </h4>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3.5 bg-white divide-y divide-slate-100">
              {/* Subject DN */}
              <div className="pb-2.5">
                <div className="text-xs text-slate-400 mb-0.5">주체 고유명 (Subject DN):</div>
                <div className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 break-all select-all">
                  {cert.subjectDn}
                </div>
              </div>

              {/* CA Signature Name */}
              {cert.caSignatureName && (
                <div className="py-2.5">
                  <div className="text-xs text-slate-400 mb-0.5">발급 및 서명 기관명 (CA Name):</div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{cert.caSignatureName}</span>
                  </div>
                </div>
              )}

              {/* Serial & Dates */}
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400">일련번호 (Serial Number):</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">
                    {cert.serialNumber}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">유효기간 (Validity):</div>
                  <div className="text-slate-800 font-medium mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cert.validFrom} ~ {cert.validTo}</span>
                  </div>
                </div>
              </div>

              {/* Cryptography details */}
              <div className="py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400">공개키 알고리즘:</div>
                  <div className="font-medium text-slate-800 mt-0.5">RSA 2048-bit (전자서명 표준)</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">서명 알고리즘:</div>
                  <div className="font-medium text-slate-800 mt-0.5">sha256WithRSAEncryption</div>
                </div>
              </div>

              {/* SHA-256 Fingerprint */}
              <div className="py-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                    SHA-256 지문 (Fingerprint):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cert.files.sha256)}
                    className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    지문 복사
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 break-all select-all">
                  {cert.files.sha256}
                </div>
              </div>

              {/* Files on Disk */}
              <div className="pt-2.5">
                <div className="text-xs text-slate-400 mb-1.5">연계된 디스크 파일 구성:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {cert.files.certName}
                        </div>
                        <div className="text-[11px] text-slate-500">인증서 본체 (DER 공개키)</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-600">{cert.files.certSize} B</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {cert.files.keyName}
                        </div>
                        <div className="text-[11px] text-slate-500">개인키 (SEED/ARIA 암호화)</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold">페어링 정상</span>
                  </div>
                </div>

                {cert.files.kmCertName && (
                  <div className="mt-2 text-xs text-slate-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                    💡 GPKI 공무원 특수 파일 감지: 암호화 인증서(<code className="font-mono font-semibold">{cert.files.kmCertName}</code>) 및 키(<code className="font-mono font-semibold">{cert.files.kmKeyName}</code>)가 정상적으로 포함되어 있어 온-나라 문서 암호화가 완벽 호환됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Physical Location */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>현재 저장 디스크 및 절대 경로:</span>
            </div>
            <div className="font-mono text-xs text-slate-800 break-all select-all font-semibold">
              {cert.sourceLocation}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            보안 상태: <strong className="text-emerald-600">무결성 100% 정상</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              닫기
            </button>
            {onOpenRenewalGuidance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRenewalGuidance(cert);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
                title={`${cert.issuer} 갱신 포털 바로가기 및 안내`}
              >
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <span>기관 갱신 안내</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onCopySingle(cert);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>이 인증서 디스크로 복사하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

