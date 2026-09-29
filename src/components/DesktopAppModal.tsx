/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  CheckCircle2, 
  Download, 
  HardDrive, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  ExternalLink, 
  FolderOpen, 
  Zap, 
  FileCode, 
  Check
} from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from '../version';
import { BRANDING_ASSETS } from '../data/brandingAssets';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopAppModal: React.FC<DesktopAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'EDITIONS' | 'HOW_TO_RUN' | 'FEATURES'>('EDITIONS');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyLaunchCommand = () => {
    const text = `kcert-manager.cmd`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-400/40 bg-slate-800 shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={BRANDING_ASSETS.appIcon} 
                alt="K-인증서 매니저 데스크탑" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== BRANDING_ASSETS.rawAppIcon) {
                    target.src = BRANDING_ASSETS.rawAppIcon;
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">K-인증서 매니저 데스크탑 앱</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-semibold">
                  v{APP_VERSION} Native
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold hidden sm:inline-block">
                  C# WPF .NET 8
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                웹 브라우저 없이 Windows 네이티브 창으로 단독 구동되는 고성능 데스크톱 에디션
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex space-x-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('EDITIONS')}
            className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'EDITIONS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>데스크톱 3종 배포 에디션</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HOW_TO_RUN')}
            className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'HOW_TO_RUN'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>실행 방법 & 런처</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FEATURES')}
            className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FEATURES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>데스크톱 고유 특화 강점</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {activeTab === 'EDITIONS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <strong>망분리 PC 및 보안 업무 환경에 완벽 대응:</strong> 외부 인터넷 연결 없이 
                  Windows NPKI/GPKI 경로를 100% 로컬 파일시스템 수준에서 직접 안전하게 관리합니다.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. 풀버전 독립 실행형 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">
                        추천 · 독립형
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">~65MB</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                      <span>풀버전 데스크톱</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      .NET 8 런타임이 내장된 독립 단일 실행 파일. 사전 설치 없이 즉시 실행됩니다.
                    </p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700 break-all mb-3">
                      KCertManager.exe
                    </div>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>추가 런타임 설치 불필요</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>포터블 USB 휴대용 최적</span>
                    </li>
                  </ul>
                </div>

                {/* 2. 초경량 라이트 에디션 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        초경량 바이너리
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">~1.5MB</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                      <span>라이트 에디션</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      극소형 크기로 네트워크 전송 및 메신저 공유에 최적화된 프레임워크 종속형.
                    </p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700 break-all mb-3">
                      KCertManager-Lite.exe
                    </div>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>단 1~2MB 초소형 용량</span>
                    </li>
                    <li className="flex items-center gap-1 text-slate-500">
                      <span>※ .NET 8 런타임 필요</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Windows 정식 인스톨러 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-bold">
                        설치형 패키지
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">Inno Setup</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                      <span>정식 인스톨러</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      시작 메뉴 및 바탕화면 바로가기 등록, 찌꺼기 없는 100% 완전 삭제 언인스톨러 지원.
                    </p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700 break-all mb-3">
                      KCertManager_Setup_v{APP_VERSION}.exe
                    </div>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-1 text-purple-700">
                      <CheckCircle2 className="w-3 h-3 text-purple-500" />
                      <span>폴더 풀림(Unpacked) 전개</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-purple-500" />
                      <span>제어판 클린 언인스톨</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HOW_TO_RUN' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>원클릭 스마트 통합 런처 (권장)</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyLaunchCommand}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>명령어 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-[11px]">
                  루트 폴더에서 아래 런처를 실행하면 C# WPF 데스크톱 네이티브 바이너리를 1순위로 자동 감지하여 실행합니다:
                </p>
                <div className="p-2.5 bg-black/50 rounded text-emerald-400 font-bold text-xs select-all">
                  kcert-manager.cmd
                </div>
                <p className="text-slate-400 text-[11px] pt-1">
                  ※ 검은 콘솔창 없이 백그라운드로 즉시 띄우려면: <span className="text-blue-300">kcert-manager.vbs</span> 더블클릭
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>배포 빌드 산출물 위치</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-blue-700 min-w-28 shrink-0">WPF 데스크톱 폴더:</span>
                    <span className="font-mono text-slate-600">release\05_WpfDesktop\KCertManager.exe</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-purple-700 min-w-28 shrink-0">인스톨러 패키지:</span>
                    <span className="font-mono text-slate-600">release\07_Installer\KCertManager_Setup_v{APP_VERSION}.exe</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-emerald-700 min-w-28 shrink-0">순수 코어 DLL:</span>
                    <span className="font-mono text-slate-600">release\05_WpfDesktop\KCert.Core.dll</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FEATURES' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-xs">Windows WMI 실시간 핫플러그 (HardwareGuard)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  USB 메모리를 PC 본체에 꽂는 즉시 600ms 디바운스 필터를 거쳐 윈도우 볼륨 변경 이벤트를 실시간 포착하고, 
                  인증서 보관 여부를 백그라운드에서 즉각 분석합니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">브라우저 제약 없는 순수 파일시스템 트랜잭션</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  웹 브라우저의 다운로드 확인창이나 임시 디렉토리 이동 없이, C:\Users\...\AppData\LocalLow\NPKI 
                  실제 폴더와 USB 디렉토리 간에 직접 원자적(Atomic) 양방향 복사를 수행합니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-xs">순수 C# X.509 파서 & 5대 발급기관 역해석</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  금융결제원(yessign), 코스콤(SignKorea), 한국정보인증(SignGate), 한국전자인증(CrossCert), 한국무역정보통신(TradeSign) 
                  및 행정전자서명(GPKI), 교육전자서명(EPKI)의 OID를 자체 코어(`KCert.Core.dll`)로 완벽 역해석합니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>개발: <strong className="text-slate-700">{DEVELOPER_INFO.author}</strong></span>
            <span>·</span>
            <a 
              href={DEVELOPER_INFO.homepage} 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>공식 홈페이지 (CISNet)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
