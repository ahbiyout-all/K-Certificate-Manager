import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  HardDrive, 
  CheckCircle2, 
  FolderTree, 
  FileKey,
  KeyRound
} from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                인증서 관리 및 이동식 매체 보안 지침
              </h3>
              <p className="text-xs text-slate-400">
                행정전자서명(GPKI) 인증업무지침 및 전자금융감독규정 준수 안내
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700">
          {/* Privacy Guarantee Box */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3 text-emerald-900">
            <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1 text-emerald-950">
                본 앱의 100% 클라이언트 로컬 처리 및 개인정보 보호 보증
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                본 웹 어플리케이션은 귀하의 인증서 파일(<code className="font-mono font-bold">signCert.der</code>)과 개인키 파일(<code className="font-mono font-bold">signPri.key</code>)을 <strong>외부 원격 서버로 일체 전송하지 않습니다</strong>. 모든 디렉토리 탐색, SHA-256 무결성 검증, 표준 NPKI/GPKI 복사 작업은 브라우저 내 샌드박스 메모리(Client-Side)에서만 안전하게 실행됩니다.
              </p>
            </div>
          </div>

          {/* Section 1: GPKI Government Certificate Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FileKey className="w-4 h-4 text-blue-600" />
              1. 공무원 행정전자서명(GPKI) 및 교육행정(EPKI) 보안수칙
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>PC 하드디스크 보관 금지:</strong> 공용 PC나 내부 업무용 PC의 로컬 디스크(C:\)에 인증서를 방치하지 마시고, 반드시 <strong>이동식 저장매체(보안 USB)</strong>에 복사하여 보관하십시오.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>이석 및 퇴근 시 매체 분리:</strong> 업무 종료 시 USB를 반드시 PC에서 분리하여 시건장치가 구비된 캐비닛 등에 안전하게 보관해야 합니다.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>인증서 분실/유출 시 조치:</strong> 인증서 저장 매체를 분실하였거나 비밀번호 노출이 의심될 경우, 즉시 <a href="https://www.gpki.go.kr" target="_blank" rel="noreferrer" className="text-blue-600 underline">행정전자서명인증센터(1544-6720)</a>에 인증서 폐기(효력정지)를 신청하십시오.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Banking NPKI Certificate Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              2. 은행 공동인증서(NPKI) 이동식 디스크 복사 권장 이유
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs leading-relaxed">
              <p>
                Windows 운영체제의 <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">AppData\LocalLow\NPKI</code> 경로는 사용자 모르게 악성코드나 화면 캡처 프로그램에 노출될 위험이 있습니다.
              </p>
              <p>
                인증서를 이동식 디스크(USB)로 복사한 뒤 금융 업무 시에만 연결하여 사용하고, PC에 남아있는 사본을 정리하면 안전한 금융거래 환경을 구축할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Section 3: USB Folder Structure Standard */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FolderTree className="w-4 h-4 text-purple-600" />
              3. USB 이동식 디스크 표준 폴더 구조 규격
            </h4>
            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto">
              <div className="text-slate-400 font-sans text-[11px] mb-1">
                ※ USB 드라이브 최상위에 아래 폴더가 생성되어야 인터넷뱅킹 및 정부24에서 인식됩니다:
              </div>
              <div>E:\ (이동식 USB 루트)</div>
              <div> ├── <span className="text-amber-300 font-bold">NPKI\</span> (은행 및 금융 공동인증서)</div>
              <div> │    └── yessign\USER\cn=홍길동...\</div>
              <div> │         ├── signCert.der (인증서)</div>
              <div> │         └── signPri.key  (개인키)</div>
              <div> └── <span className="text-blue-300 font-bold">GPKI\</span> (공무원 행정전자서명)</div>
              <div>      └── Certificate\class2\cn=이영희...\</div>
              <div>           ├── SignCert.der (서명인증서)</div>
              <div>           ├── SignPri.key  (서명개인키)</div>
              <div>           ├── kmCert.der   (암호화인증서)</div>
              <div>           └── kmPri.key    (암호화개인키)</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
