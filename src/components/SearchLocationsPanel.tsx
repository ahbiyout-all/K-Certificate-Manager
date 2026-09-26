import React, { useState, useRef } from 'react';
import { 
  FolderSearch, 
  FolderPlus, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Laptop, 
  Folder, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { SearchPath } from '../types';
import { scanDirectoryHandle, groupUploadedCertFiles } from '../utils/certParser';
import { formatUserErrorMessage, parseUserFriendlyError } from '../utils/userFriendlyError';

interface SearchLocationsPanelProps {
  searchPaths: SearchPath[];
  onTogglePath: (id: string) => void;
  onAddCustomPath: (pathStr: string) => void;
  onCustomScannedCerts: (certs: any[]) => void;
  isScanning: boolean;
}

export const SearchLocationsPanel: React.FC<SearchLocationsPanelProps> = ({
  searchPaths,
  onTogglePath,
  onAddCustomPath,
  onCustomScannedCerts,
  isScanning,
}) => {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [customPathInput, setCustomPathInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFileSystemLoading, setIsFileSystemLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCustomPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPathInput.trim()) return;
    onAddCustomPath(customPathInput.trim());
    setCustomPathInput('');
  };

  // Modern Web File System Access API (showDirectoryPicker)
  const handlePickDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('현재 브라우저에서는 파일 시스템 직접 탐색 API를 지원하지 않습니다. 아래 [폴더 업로드] 버튼을 이용해 주세요.');
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsFileSystemLoading(true);
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
      });
      const scanned = await scanDirectoryHandle(dirHandle, dirHandle.name);
      if (scanned.length === 0) {
        alert(`선택한 폴더 [${dirHandle.name}]에서 signCert.der 또는 signPri.key 인증서 파일을 찾지 못했습니다.\n\n[도움말]\n• 올바른 NPKI/GPKI 인증서 하위 폴더를 선택했는지 확인해 주세요.`);
      } else {
        onCustomScannedCerts(scanned);
        alert(`선택한 폴더 [${dirHandle.name}]에서 총 ${scanned.length}개의 인증서를 성공적으로 불러왔습니다.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorInfo = parseUserFriendlyError(err, '인증서 폴더 탐색');
        alert(`${errorInfo.summary}\n\n[해결 방법 안내]\n${errorInfo.actionTip}`);
      }
    } finally {
      setIsFileSystemLoading(false);
    }
  };

  // Legacy HTML input webkitdirectory fallback
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsFileSystemLoading(true);
      try {
        const certs = await groupUploadedCertFiles(e.target.files);
        if (certs.length === 0) {
          alert('선택된 폴더에서 signCert.der 또는 signPri.key 파일을 찾지 못했습니다.');
        } else {
          onCustomScannedCerts(certs);
          alert(`총 ${certs.length}개의 인증서를 성공적으로 로드했습니다.`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFileSystemLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // Drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsFileSystemLoading(true);
      try {
        const certs = await groupUploadedCertFiles(e.dataTransfer.files);
        if (certs.length > 0) {
          onCustomScannedCerts(certs);
          alert(`${certs.length}개의 인증서를 드래그 앤 드롭으로 추가했습니다.`);
        } else {
          alert('드롭된 파일 중 signCert.der 파일이 감지되지 않았습니다.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFileSystemLoading(false);
      }
    }
  };

  const defaultPaths = searchPaths.filter(p => p.type !== 'custom');
  const customPaths = searchPaths.filter(p => p.type === 'custom');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header with expand toggle */}
      <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <FolderSearch className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
              인증서 위치 탐색 관리자
              <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                (기본 경로 자동 탐색 및 사용자 지정 디스크 지원)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Windows 표준 NPKI/GPKI 경로를 우선 탐색한 뒤, 추가 드라이브나 USB 폴더를 수동 지정할 수 있습니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
          title={isExpanded ? '접기' : '펼치기'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5">
          {/* Navigation Tabs: Step 1 (Default) vs Step 2 (Custom) */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('default')}
              className={`pb-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'default'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Laptop className="w-4 h-4" />
              1. 기본 인증서 위치 자동 탐색 ({defaultPaths.length}개 경로)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`pb-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              2. 사용자 직접 경로 지정 & 폴더 열기 ({customPaths.length}개 추가됨)
            </button>
          </div>

          {/* TAB 1: Default System Locations */}
          {activeTab === 'default' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>탐색할 기본 경로의 체크박스를 활성화하면 해당 폴더의 인증서가 자동으로 목록에 반영됩니다.</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  {isScanning ? (
                    <span className="text-blue-600 animate-pulse">탐색 수행 중...</span>
                  ) : (
                    <span className="text-emerald-600">탐색 완료</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {defaultPaths.map(path => (
                  <div
                    key={path.id}
                    className={`p-3 rounded-lg border transition-all ${
                      path.enabled
                        ? 'border-blue-200 bg-blue-50/40'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id={path.id}
                          checked={path.enabled}
                          onChange={() => onTogglePath(path.id)}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        <div>
                          <label htmlFor={path.id} className="text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer">
                            {path.name}
                          </label>
                          <div className="text-xs font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200/80 mt-1 break-all">
                            {path.path}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{path.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {path.countFound > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {path.countFound}개 발견
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            미발견
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Removable Media Notice Banner */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <HardDrive className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">이동식 저장 매체(USB) 연결 안내:</span> PC에 USB 메모리가 연결되어 있는 경우, 드라이브 루트의 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">NPKI</code> 또는 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">GPKI</code> 폴더를 자동으로 읽어들입니다. 연결되지 않은 경우 아래 [사용자 직접 경로 지정]에서 USB 드라이브 폴더를 직접 선택할 수 있습니다.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Directory / Direct Folder Picker */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Modern Web File System API Button */}
                <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    내 PC / USB 폴더 직접 선택 (추천)
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 max-w-xs">
                    브라우저 File System API를 통해 USB 메모리나 외장 드라이브의 인증서 폴더를 직접 선택하여 즉시 탐색합니다.
                  </p>
                  <button
                    type="button"
                    onClick={handlePickDirectory}
                    disabled={isFileSystemLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FolderSearch className="w-4 h-4" />
                    <span>{isFileSystemLoading ? '인증서 파일 분석 중...' : '로컬/USB 폴더 열기'}</span>
                  </button>
                </div>

                {/* Drag and drop / file input upload */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`p-4 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center ${
                    dragActive
                      ? 'border-blue-500 bg-blue-100/60'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    인증서 파일 / 폴더 업로드
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 max-w-xs">
                    <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">signCert.der</code> 및 <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">signPri.key</code> 파일이 있는 폴더를 드래그하거나 선택하세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>폴더 선택 업로드</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    /* @ts-ignore */
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
              </div>

              {/* Manual Path Text Input */}
              <form onSubmit={handleAddCustomPath} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label htmlFor="custom-path-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  직접 경로 문자열 입력하여 등록:
                </label>
                <div className="flex gap-2">
                  <input
                    id="custom-path-input"
                    type="text"
                    value={customPathInput}
                    onChange={e => setCustomPathInput(e.target.value)}
                    placeholder="예: D:\My_Backup\NPKI 또는 F:\행정전자서명인증서"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    경로 등록
                  </button>
                </div>
              </form>

              {/* List of user added custom paths */}
              {customPaths.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600">등록된 사용자 지정 경로:</div>
                  {customPaths.map(cp => (
                    <div key={cp.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cp.enabled}
                          onChange={() => onTogglePath(cp.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-mono text-slate-800 font-semibold">{cp.path}</span>
                      </div>
                      <span className="text-blue-600 font-medium">{cp.countFound}개 발견됨</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
