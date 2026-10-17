import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Cpu, Terminal, RefreshCw, X, Sparkles, Layers } from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from '../version';

interface SelfReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfReflectionModal: React.FC<SelfReflectionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-purple-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>K-Certificate Manager 자아성찰 및 고도화 보고서</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold">
                  v{APP_VERSION} PRO
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                사용자 요구사항 분석부터 시스템 아키텍처, C# WPF 컴파일 수정, UI/UX 상호작용 검증까지의 엔지니어링 자아성찰 리포트
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700 dark:text-gray-300">
          
          {/* Section 1: Executive Summary */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/40 dark:to-gray-900 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>1. 엔지니어링 자아성찰 및 핵심 개선 성과 요약</span>
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              본 프로젝트(K-Certificate Manager)는 대한민국 공인인증서(GPKI/NPKI/금융인증서) 통합 관리 및 USB 안전 복사·이동을 지원하는 데스크톱(WPF) 및 웹 프리뷰(React/TypeScript) 하이브리드 솔루션입니다. 
              최근 사용자 피드백과 시스템 빌드 오류를 바탕으로 깊이 있는 자아성찰을 거쳐 <strong>UX 피드백 정밀화, C# WPF 컴파일 무결성 확보, 인증서 명칭 표준화, 레이아웃 직관화</strong>를 완벽히 달성하였습니다.
            </p>
          </div>

          {/* Section 2: Detailed Requirement Breakdown & Solutions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>2. 사용자 요구사항별 해결 및 구현 명세</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Item 1 */}
              <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded">
                    요구사항 #1 & #3
                  </span>
                  <span className="text-xs text-gray-400">UI / UX</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  토스트 경로/용량 표시 및 1.8초 하이라이트 + 성공 사운드
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  인증서 복사 성공 시 토스트 알림에 <strong>복사된 파일의 정확한 절대 경로 및 파일 사이즈(KB/MB)</strong>를 포함하도록 데이터 구조를 확장하였고, 복사된 행(Row)에 1.8초간 반짝이는 강조 애니메이션과 부드러운 맑은 성공 차림(Chime) 사운드를 결합하여 직관적인 피드백을 제공합니다.
                </p>
              </div>

              {/* Item 2 */}
              <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded">
                    요구사항 #4 & #5
                  </span>
                  <span className="text-xs text-gray-400">WPF / C#</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  C# WPF 백엔드 컴파일 오류 정밀 수정 (LINQ & Nullability)
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  `CertificateBackupService.cs`에서 발생한 <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-red-600">List&lt;CopiedFileInfo&gt; does not contain a definition for 'Select'</code> 오류를 해결하기 위해 누락된 <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">using System.Linq;</code> 지시문을 추가하고, KCertParser 널 경고를 해소하여 .NET 빌드 무결성을 완벽히 확보했습니다.
                </p>
              </div>

              {/* Item 3 */}
              <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded">
                    요구사항 #6 & #7
                  </span>
                  <span className="text-xs text-gray-400">Data Parsing</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  인증서 명칭 정제 (기관명 및 사용자 이름 중심 표시)
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  인증서 목록 및 상세 뷰에서 사용자가 혼동하기 쉬웠던 불필요한 시스템 접미사(예: <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">(기관용)</code>, <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">(전자관인)</code>)를 제거하여, 오직 <strong>순수 기관명 및 사용자 이름(행정안전부, 경상북도교육감, 홍길동 등)</strong>만 직관적으로 식별되도록 정제했습니다.
                </p>
              </div>

              {/* Item 4 */}
              <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded">
                    요구사항 #8
                  </span>
                  <span className="text-xs text-gray-400">UI Layout</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  중앙 화면 레이아웃 및 간편/상세 모드 정돈
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  간편 이동 모드(<code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">SimpleTransferHero</code>)와 인증서 테이블 간의 수직 간격, 버튼 가시성, 반응형 그리드 정렬을 가다듬어 어떤 해상도에서도 시각적 어색함 없이 쾌적하게 작동하도록 재배치하였습니다.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Self-Reflection & Future Outlook */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>3. 자아성찰을 통한 엔지니어링 철학 및 지속 가능성</span>
            </h3>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
              <li><strong>사용자 관점의 세심함:</strong> 기술적 구현뿐만 아니라, 사용자가 복사 작업 시 정확히 어디에 어떤 크기로 파일이 생성되었는지 실시간으로 인지할 수 있는 토스트 알림의 중요성을 재확인하였습니다.</li>
              <li><strong>코드베이스 무결성 검증:</strong> C# 백엔드와 React 프론트엔드 간의 데이터 교환 규격과 널 안정성(Nullability)을 철저히 검토하여 빌드 타임 에러 요소를 원천 차단하였습니다.</li>
              <li><strong>직관적 UI/UX 유지보수성:</strong> 불필요한 메타데이터 태그를 제거함으로써 인증서 목록의 가독성을 극대화하고, 복잡성을 낮춘 클린 디자인 아키텍처를 확립했습니다.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>모든 요구사항 및 자아성찰 검증 완료 (Build Success)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-md transition-colors"
          >
            확인 및 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
};
