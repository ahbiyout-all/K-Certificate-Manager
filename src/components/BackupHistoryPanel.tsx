import React from 'react';
import { History, HardDrive, CheckCircle2, ShieldAlert, FileText, Clock, ArrowUpRight } from 'lucide-react';
import { BackupHistoryItem } from '../types';

interface BackupHistoryPanelProps {
  history: BackupHistoryItem[];
  onClearHistory: () => void;
}

export const BackupHistoryPanel: React.FC<BackupHistoryPanelProps> = ({
  history,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              최근 디스크 복사 및 백업 이력 ({history.length}건)
            </h3>
            <p className="text-xs text-slate-500">
              수행된 디스크 복사 세션과 SHA-256 무결성 검증 기록입니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          기록 지우기
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {history.map(item => (
          <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <span>{item.targetDisk}</span>
                  <span className="text-[11px] font-normal px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                    무결성 100% 정상
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  포함된 사용자 ({item.certificatesCount}명): <span className="font-medium text-slate-700">{item.certNames.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0 sm:self-center">
              <Clock className="w-3.5 h-3.5" />
              <span>{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
