import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  FolderTree,
  FileKey,
  KeyRound,
  Smartphone,
  Globe,
  Scale,
} from 'lucide-react';
import {
  RSA_3072_TIMELINE,
  MOBILE_ID_DECREE_2026,
  GPKI_EPKI_MODERNIZATION_NOTES,
  KOREA_CERT_ECOSYSTEM_MATRIX,
  EcosystemCategory,
} from '../data/koreanCertTrends2026';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SecurityTab = 'rules' | 'trends' | 'matrix' | 'folders';

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SecurityTab>('rules');
  const [matrixFilter, setMatrixFilter] = useState<'all' | EcosystemCategory>('all');

  if (!isOpen) return null;

  const filteredMatrix = KOREA_CERT_ECOSYSTEM_MATRIX.filter((item) =>
    matrixFilter === 'all' ? true : item.category === matrixFilter
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                인증서 보안 수칙 · 2026 제도 동향
              </h3>
              <p className="text-xs text-slate-400">
                로컬 PKI 보안 보관 원칙, RSA 3072-bit 상향 일정, 모바일 신분증 법령 및 국내 인증서 비교
              </p>
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

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0">
          {[
            { id: 'rules' as const, label: '보안 수칙', Icon: Lock },
            { id: 'trends' as const, label: '2026 보안강도·법령 동향', Icon: Scale },
            { id: 'matrix' as const, label: '국내 인증서 전체 비교', Icon: Globe },
            { id: 'folders' as const, label: '표준 폴더 구조', Icon: FolderTree },
          ].map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto text-xs sm:text-sm text-slate-700">
          {activeTab === 'rules' && (
            <>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3 text-emerald-900">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-0.5 text-emerald-950">
                    외부 서버 전송 없음 (100% 내 기기 처리)
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    인증서(<code className="font-mono font-bold">signCert.der</code>)와 개인키(<code className="font-mono font-bold">signPri.key</code>)는 외부로 전송되지 않으며, 파싱·보안강도 진단·복사는 모두 내 브라우저 안에서만 실행됩니다.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <FileKey className="w-4 h-4 text-blue-600" />
                  1. 공무원·교육 인증서 (GPKI · EPKI)
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>보안 USB 보관 권장:</strong> 공용 PC 하드디스크에 남기지 말고 이동식 USB에 담아 사용하세요.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>퇴근·이석 시 USB 분리:</strong> 사용 후 USB를 분리해 잠금장치 있는 곳에 보관하세요.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>분실·유출 시 즉시 폐기:</strong>{' '}
                      <a href="https://www.gpki.go.kr" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        행정전자서명인증센터(1544-6720)
                      </a>
                      에 폐기를 신청하세요.
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  2. 은행·공동 인증서 (NPKI) 및 2027.02 보안강도 대비
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs leading-relaxed">
                  <p>
                    PC 기본 폴더(<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">AppData\LocalLow\NPKI</code>)보다 USB에 보관하면 악성코드 유출 위험을 줄일 수 있습니다.
                  </p>
                  <p className="text-slate-600">
                    2027.02.15 이후 신규/갱신 공동인증서는 <strong>RSA 3072-bit</strong>로 전환됩니다. 기존 2048-bit 인증서는 만료일까지 정상 사용 가능하며, 1024-bit·SHA-1 구형 인증서만 즉시 교체가 필요합니다.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-5">
              {/* RSA 3072-bit & PQC Roadmap */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between gap-2">
                  <span>1. 공동인증서 암호강도 상향 (RSA 3072-bit · 양자내성암호 로드맵)</span>
                  <span className="text-[11px] font-mono font-semibold text-blue-700">2027.02.15 시행</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {RSA_3072_TIMELINE.map((item) => (
                    <div
                      key={item.date}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">{item.date}</span>
                          <span className="font-semibold text-blue-700">{item.badge}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-1">{item.title}</div>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed mt-1">{item.summary}</p>
                      </div>
                      <div className="text-[11px] text-slate-700 pt-2 border-t border-slate-200 font-medium">
                        {item.actionTip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GPKI / EPKI Non-ActiveX & Cloud Modernization */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-sm">
                  2. GPKI · EPKI 비액티브엑스(Non-ActiveX) 및 공공 클라우드 연계
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {GPKI_EPKI_MODERNIZATION_NOTES.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                    >
                      <div className="font-bold text-xs text-slate-900">{note.title}</div>
                      <p className="text-[11.5px] text-slate-600 leading-relaxed">{note.detail}</p>
                      <div className="text-[11px] text-slate-800 pt-1.5 border-t border-slate-200 font-medium">
                        {note.checklist}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2026.08.28 Electronic Government Act Enforcement Decree - Mobile ID */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>3. {MOBILE_ID_DECREE_2026.lawTitle} — 모바일 신분증 8종 · 전자서명 통합</span>
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-700">
                    {MOBILE_ID_DECREE_2026.effectiveDate} 시행
                  </span>
                </h4>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {MOBILE_ID_DECREE_2026.summary}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                    {MOBILE_ID_DECREE_2026.securityRules.map((rule) => (
                      <div key={rule} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {MOBILE_ID_DECREE_2026.types.map((m) => (
                      <div key={m.name} className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="font-bold text-[11.5px] text-slate-900">{m.name}</div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">{m.legalBasis}</div>
                        <div className="text-[11px] text-slate-600 mt-1">{m.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    대한민국 전자서명 · 인증서 7대 체계 전체 비교
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    로컬 파일 기반 PKI(본 앱 직접 스캔·백업)와 클라우드/스마트폰 기반 인증서의 보관·유효기간 차이
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {[
                    { id: 'all' as const, label: '전체' },
                    { id: 'file_pki' as const, label: '파일형 PKI (앱 관리)' },
                    { id: 'cloud_mobile' as const, label: '클라우드·모바일' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMatrixFilter(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        matrixFilter === f.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">인증서 구분</th>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">운영 기관</th>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">저장 방식</th>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">유효기간</th>
                      <th className="py-2.5 px-3 font-bold">2026~2027 핵심 동향</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredMatrix.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 align-top">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {row.categoryLabel} · {row.statusTag}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{row.operators}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">{row.storageMethod}</td>
                        <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap tabular-nums">
                          <div>{row.validityPeriod}</div>
                          <div className="text-[10.5px] text-slate-500">{row.authMethod}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{row.trend2026Note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'folders' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  PC · USB 표준 인증서 폴더 구조
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  USB 최상위 및 Windows 사용자 경로에 아래 표준 구조가 유지되어야 은행·공공 웹 브라우저 모듈이 정상 인식합니다.
                </p>
              </div>
              <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs space-y-1.5 overflow-x-auto rounded-xl border border-slate-700">
                <div>E:\ (USB 이동식 디스크 최상위)</div>
                <div> ├── <span className="text-amber-300 font-bold">NPKI\</span> (은행·법인·증권 공동인증서)</div>
                <div> │    └── yessign\USER\cn=홍길동...\</div>
                <div> │         ├── signCert.der (공개키 인증서)</div>
                <div> │         └── signPri.key  (암호화된 개인키)</div>
                <div> ├── <span className="text-blue-300 font-bold">GPKI\</span> (행정기관 공무원 인증서)</div>
                <div> │    └── Certificate\class2\cn=홍길동...\  (개인/기관 class1·class2)</div>
                <div> │         ├── SignCert.der / SignPri.key (서명용)</div>
                <div> │         └── kmCert.der   / kmPri.key   (암호화용)</div>
                <div> └── <span className="text-emerald-300 font-bold">EPKI\</span> (교육부·학교 교직원 인증서)</div>
                <div>      └── USER\cn=김선생...\</div>
                <div className="pt-2 text-slate-400 border-t border-slate-800">
                  C:\Users\&lt;사용자&gt;\AppData\LocalLow\NPKI | EPKI · C:\GPKI\Certificate\
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            클라우드 금융인증서·간편인증·모바일 신분증은 스마트폰/클라우드 보안영역 전용으로 로컬 파일이 생성되지 않습니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer shrink-0"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
