/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  KeyRound, 
  FolderSearch, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Download,
  Copy
} from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from '../version';

interface CoreSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoreSpecModal: React.FC<CoreSpecModalProps> = ({ isOpen, onClose }) => {
  const [activeEngine, setActiveEngine] = useState<'PARSER' | 'DISCOVERY' | 'HARDWARE'>('PARSER');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copySpecSummary = () => {
    const text = `[KCert.Core.dll 기술 명세 요약]
- 버전: v${APP_VERSION} (.NET 8.0 제로 의존성 순수 창작 DLL)
- 저작권: ${DEVELOPER_INFO.author} (${DEVELOPER_INFO.blog})
- 홈페이지: ${DEVELOPER_INFO.homepage}
- 3대 모듈:
  1. KCert.Core.Parser: OID 역해석 (5대 NPKI 기관 및 GPKI/EPKI) 및 키페어 검증
  2. KCert.Core.Discovery: AppData\\LocalLow 등 표준 경로 BFS 안전 탐색
  3. KCert.Core.HardwareGuard: WMI VolumeChange 감시, 600ms 마운트 디바운스, 읽기전용 락 감지`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">KCert.Core.dll 순수 창작 코어 명세</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-semibold">
                  .NET 8.0 Class Library
                </span>
              </div>
              <p className="text-xs text-slate-400">외부 서드파티 제로(Zero-Dependency) · 네트워크 통신 제로(Zero-Network)</p>
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

        {/* 3 Engine Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveEngine('PARSER')}
            className={`p-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeEngine === 'PARSER'
                ? 'border-blue-600 bg-white text-blue-700'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>1. 파서 (Parser)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEngine('DISCOVERY')}
            className={`p-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeEngine === 'DISCOVERY'
                ? 'border-blue-600 bg-white text-blue-700'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderSearch className="w-3.5 h-3.5" />
            <span>2. 탐색 (Discovery)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEngine('HARDWARE')}
            className={`p-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeEngine === 'HARDWARE'
                ? 'border-blue-600 bg-white text-blue-700'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>3. 가드 (Hardware)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700">
          {activeEngine === 'PARSER' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-blue-950">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>KCert.Core.Parser : 정책 OID 역해석 및 인증서 무결성 검증</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  금융결제원(yessign), 코스콤(SignKorea), 한국정보인증(KICA), 한국전자인증(CrossCert), 한국무역정보통신(Tradesign) 5대 공인인증기관 및 행정자치부 GPKI, 교육부 EPKI의 정책 OID를 역해석합니다.
                </p>
              </div>

              {/* OID Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-2.5 font-bold text-xs text-slate-700 border-b border-slate-200">
                  대한민국 공인/공동/행정 인증서 OID 매핑 규격
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">구분</th>
                        <th className="p-2">발급기관</th>
                        <th className="p-2 font-mono">대표 OID (Certificate Policy)</th>
                        <th className="p-2">용도 및 비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2 font-bold text-blue-600">NPKI</td>
                        <td className="p-2">금융결제원</td>
                        <td className="p-2 font-mono text-slate-600">1.2.410.200005.1.1.1</td>
                        <td className="p-2">개인 은행/보험/신용카드 인터넷뱅킹용</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-blue-600">NPKI</td>
                        <td className="p-2">코스콤 (SignKorea)</td>
                        <td className="p-2 font-mono text-slate-600">1.2.410.200004.5.2.1.2</td>
                        <td className="p-2">증권/보험/선물 거래용 범용 인증서</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-blue-600">NPKI</td>
                        <td className="p-2">한국정보인증 (KICA)</td>
                        <td className="p-2 font-mono text-slate-600">1.2.410.200004.5.1.1.5</td>
                        <td className="p-2">법인/기업 전자세금계산서 및 조달청용</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-emerald-600">GPKI</td>
                        <td className="p-2">행정안전부</td>
                        <td className="p-2 font-mono text-slate-600">1.2.410.100001.2.1.1</td>
                        <td className="p-2">정부 공무원 행정전자서명 및 전자정부용</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-purple-600">EPKI</td>
                        <td className="p-2">교육부</td>
                        <td className="p-2 font-mono text-slate-600">1.2.410.100001.5.2.1.1</td>
                        <td className="p-2">전국 초·중·고 교육행정(NEIS) 및 교직원용</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Calculation */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-xs text-slate-800">정밀 무결성 및 상태 산출 규칙</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-green-50 text-green-800 rounded border border-green-200">
                    <div className="font-bold">Valid</div>
                    <div className="text-[10px] text-green-700">잔여 30일 초과 정상</div>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-800 rounded border border-amber-200">
                    <div className="font-bold">ExpiringSoon</div>
                    <div className="text-[10px] text-amber-700">30일 이내 만료 임박</div>
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-800 rounded border border-rose-200">
                    <div className="font-bold">Expired</div>
                    <div className="text-[10px] text-rose-700">유효기간 종료 폐기 대상</div>
                  </div>
                  <div className="p-2 bg-slate-100 text-slate-800 rounded border border-slate-300">
                    <div className="font-bold">Corrupted</div>
                    <div className="text-[10px] text-slate-600">ASN.1 헤더 손상 감지</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeEngine === 'DISCOVERY' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <FolderSearch className="w-4 h-4 text-emerald-600" />
                  <span>KCert.Core.Discovery : 지능형 표준 경로 자동 수집 및 BFS 탐색</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Windows 시스템 권한 거부(Access Denied) 예외를 완벽히 우회하며, AppData\LocalLow, 사용자 홈, C:\ 루트 및 연결된 모든 USB 드라이브를 순회합니다.
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-xs text-slate-800">표준 탐색 대상 위치:</div>
                <div className="font-mono text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                  <div>1. %USERPROFILE%\AppData\LocalLow\[NPKI | GPKI | EPKI] (최신 기본 경로)</div>
                  <div>2. %USERPROFILE%\[NPKI | GPKI | EPKI] (구버전 호환 경로)</div>
                  <div>3. C:\[NPKI | GPKI | EPKI] (루트 직하 금융결제원 경로)</div>
                  <div>4. [Drive]:\[NPKI | GPKI | EPKI] (이동식 USB 전체)</div>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-xs text-slate-800">안전 BFS 방어 기능:</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <code>System Volume Information</code>, <code>$RECYCLE.BIN</code>, <code>Windows</code> 등 시스템 특수 디렉터리 접근 시 비동기 예외를 스킵하고 순회 큐(Queue)를 유지하여 프로그램 다운 현상을 100% 방지합니다.
                </p>
              </div>
            </div>
          )}

          {activeEngine === 'HARDWARE' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1 text-purple-950">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span>KCert.Core.HardwareGuard : WMI 핫플러그 감시 & 쓰기방지 락 프로브</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  USB 삽입·제거 이벤트를 백그라운드 WMI 비동기 스레드로 실시간 감지하며, 600ms 지연 마운트 디바운스를 적용하여 파일 입출력 오류를 원천 차단합니다.
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-xs text-slate-800">하드웨어 가드 핵심 기술:</div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div>• <strong>WMI 비동기 모니터링:</strong> <code>Win32_VolumeChangeEvent</code> 쿼리로 이벤트 실시간 캐치</div>
                  <div>• <strong>600ms 스마트 디바운스:</strong> 윈도우 OS가 USB 드라이브를 인식한 직후 마운트 지연 시간 대기</div>
                  <div>• <strong>읽기전용 락 비파괴 프로브:</strong> 물리적 쓰기 금지 락(Read-Only Switch) 및 NTFS 권한 상태를 사전 진단</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>문서 위치:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[11px] text-slate-700">
              docs/KCERT_CORE_DLL_SPEC.md
            </code>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copySpecSummary}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨!' : '요약 복사'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
