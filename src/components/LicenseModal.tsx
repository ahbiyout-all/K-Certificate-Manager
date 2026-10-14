import React, { useState } from 'react';
import { Shield, FileText, CheckCircle, ExternalLink, X, Copy, Check, BookOpen, Building2, Globe } from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from '../version';
import { BRANDING_ASSETS } from '../data/brandingAssets';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LicenseLang = 'kr' | 'en' | 'both';

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'opensource' | 'security'>('main');
  const [lang, setLang] = useState<LicenseLang>('both');

  if (!isOpen) return null;

  const licenseSummaryKR = `[한국어 라이선스 정의 - LICENSE_KR.txt]
K-Certificate Manager (K-인증서 매니저) v${APP_VERSION}
Copyright (c) 2026 ${DEVELOPER_INFO.author} (${DEVELOPER_INFO.blog}). All rights reserved.
Company: CISNet (${DEVELOPER_INFO.homepage})

본 소프트웨어는 대한민국 공무원, 교직원, 금융 및 기업 사용자의 공인/공동인증서(GPKI, EPKI, NPKI) 관리 및 안전한 이동을 위해 무료(Free License)로 배포됩니다.
1. 제1조(사용 허가): 개인, 공공기관, 교육기관, 기업 등 모든 사용자에게 영구 무료 사용 및 배포가 허가됩니다.
2. 제2조(보안 보장): 100% 오프라인 로컬 환경에서 구동되며 인증서 및 개인정보를 외부로 전송하지 않습니다.
3. 제3조(저작권 보존): 소스 코드, 바이너리 및 문서의 저작권 표기(${DEVELOPER_INFO.author})는 수정·삭제할 수 없습니다.
4. 제4조(보증 부인): 본 소프트웨어는 "있는 그대로(AS-IS)" 제공됩니다.`;

  const licenseSummaryEN = `[English License Definition - LICENSE_EN.txt]
K-Certificate Manager v${APP_VERSION}
Copyright (c) 2026 ${DEVELOPER_INFO.author} (${DEVELOPER_INFO.blog}). All rights reserved.
Company: CISNet (${DEVELOPER_INFO.homepage})

This software is permanently distributed free of charge (Free License) for civil servants, educators, financial users, and enterprise professionals to safely manage and transfer Accredited/Joint Digital Certificates (GPKI, EPKI, NPKI).
1. Article 1 (Grant of License): Free perpetual use, copying, and distribution for individuals, public agencies, schools, and enterprises.
2. Article 2 (Security Guarantee): Operates 100% offline locally with zero external network transmission or telemetry.
3. Article 3 (Copyright Notice): The copyright notice (${DEVELOPER_INFO.author}) may not be altered or removed.
4. Article 4 (Disclaimer of Warranty): Provided "AS IS" without warranty of any kind.`;

  const getCopyText = () => {
    if (lang === 'kr') return licenseSummaryKR;
    if (lang === 'en') return licenseSummaryEN;
    return `${licenseSummaryKR}\n\n--------------------------------------------------------------------------------\n\n${licenseSummaryEN}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSourceLibraries = [
    {
      name: 'React 19 & React DOM',
      license: 'MIT License',
      copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates',
      purposeKR: '사용자 인터페이스 렌더링 프레임워크',
      purposeEN: 'User interface rendering framework',
      url: 'https://react.dev/',
    },
    {
      name: 'Vite 6',
      license: 'MIT License',
      copyright: 'Copyright (c) 2019-present Evan You & Vite Contributors',
      purposeKR: '차세대 프론트엔드 빌드 도구 및 번들러',
      purposeEN: 'Next-generation frontend build tool and bundler',
      url: 'https://vitejs.dev/',
    },
    {
      name: 'Tailwind CSS v4',
      license: 'MIT License',
      copyright: 'Copyright (c) Tailwind Labs, Inc.',
      purposeKR: '유틸리티 우선 CSS 스타일링 시스템',
      purposeEN: 'Utility-first CSS styling framework',
      url: 'https://tailwindcss.com/',
    },
    {
      name: 'Lucide React',
      license: 'ISC License',
      copyright: 'Copyright (c) Lucide Contributors',
      purposeKR: '직관적이고 일관된 UI 벡터 아이콘 라이브러리',
      purposeEN: 'Consistent and clean vector icon library',
      url: 'https://lucide.dev/',
    },
    {
      name: 'JSZip',
      license: 'MIT / Dual GPLv3',
      copyright: 'Copyright (c) Stuart Knightley, David Duponchel',
      purposeKR: '인증서 백업 ZIP 아카이브 생성 및 파싱 라이브러리',
      purposeEN: 'Certificate backup ZIP archive generation and parsing',
      url: 'https://stuk.github.io/jszip/',
    },
    {
      name: 'Motion (Framer Motion)',
      license: 'MIT License',
      copyright: 'Copyright (c) Framer B.V.',
      purposeKR: '고성능 UI 전환 및 모달 애니메이션',
      purposeEN: 'High-performance UI transitions and modal animations',
      url: 'https://motion.dev/',
    },
    {
      name: '.NET / WPF Runtime Libraries',
      license: 'MIT License',
      copyright: 'Copyright (c) .NET Foundation and Contributors',
      purposeKR: 'Windows 네이티브 데스크톱 에디션(KCertManager.exe) 런타임',
      purposeEN: 'Windows Native Desktop Edition (KCertManager.exe) runtime',
      url: 'https://dotnet.microsoft.com/',
    },
  ];

  const showKR = lang === 'kr' || lang === 'both';
  const showEN = lang === 'en' || lang === 'both';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-400/40 bg-slate-800 shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={BRANDING_ASSETS.appIcon} 
                alt="K-인증서 매니저 아이콘" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">
                  {lang === 'en'
                    ? 'Software License & Legal Notice'
                    : '소프트웨어 라이선스 & 법적 고지 (KR / EN)'}
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-400/30 rounded font-semibold">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {lang === 'en'
                  ? 'K-Certificate Manager Terms of Use, Copyright & Open Source Licenses (Korean / English)'
                  : '한국어(Korean) 및 영어(English) 2종 라이선스 정의 · 이용 약관 및 오픈소스 고지'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Language Definition Switcher (한국어 / 영어 2종류 지원) */}
            <div className="inline-flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-[11px]">
              <Globe className="w-3.5 h-3.5 text-blue-400 ml-1.5 mr-1 shrink-0" />
              <button
                type="button"
                onClick={() => setLang('both')}
                className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  lang === 'both'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="한국어 및 영어 2종 병기 (Korean + English)"
              >
                한·영 병기
              </button>
              <button
                type="button"
                onClick={() => setLang('kr')}
                className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  lang === 'kr'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="한국어 라이선스 정의 (LICENSE_KR.txt)"
              >
                한국어 (KR)
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English License Definition (LICENSE_EN.txt)"
              >
                English (EN)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'main'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? 'License Agreement'
                : lang === 'kr'
                ? '라이선스 계약서 (한국어)'
                : '라이선스 계약서 (KR / EN)'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('opensource')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'opensource'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? `Open Source Libraries (${openSourceLibraries.length})`
                : `오픈소스 라이브러리 (${openSourceLibraries.length})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? 'Security & Disclaimer'
                : lang === 'kr'
                ? '보안 및 보증 부인'
                : '보안 및 보증 부인 (Security & Disclaimer)'}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[64vh] overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {activeTab === 'main' && (
            <div className="space-y-4">
              {/* Brand Logo & Copyright Box */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-700 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-blue-400/40 bg-slate-800 shrink-0">
                  <img 
                    src={BRANDING_ASSETS.logo} 
                    alt="K-인증서 매니저 공식 로고" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-white flex items-center gap-2 flex-wrap">
                    <span>K-인증서 매니저 (K-Certificate Manager)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/30 text-blue-300 border border-blue-400/40 rounded-full font-mono">
                      v{APP_VERSION}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                      KR / EN Dual License
                    </span>
                  </h3>
                  {showKR && (
                    <p className="text-xs text-slate-300 mt-1">
                      공무원·행정(GPKI/EPKI) 및 금융(NPKI) 공인전자서명 인증서 통합 관리 체계
                    </p>
                  )}
                  {showEN && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Integrated Management System for Korean Accredited/Joint Digital Certificates (GPKI, EPKI, NPKI)
                    </p>
                  )}
                </div>
              </div>

              {/* Copyright Box */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {lang === 'en' ? 'Copyright Notice' : '저작권 고지 (Copyright Notice)'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono">
                      {lang === 'kr' ? 'LICENSE_KR.txt' : lang === 'en' ? 'LICENSE_EN.txt' : 'LICENSE.txt (KR + EN)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>
                      {copied
                        ? lang === 'en'
                          ? 'Copied!'
                          : '복사 완료'
                        : lang === 'en'
                        ? 'Copy License Text'
                        : '라이선스 전문 복사'}
                    </span>
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-white p-3 rounded border border-slate-200">
                  {`Copyright (c) 2026 ${DEVELOPER_INFO.author} (${DEVELOPER_INFO.blog})\nCompany: CISNet (${DEVELOPER_INFO.homepage})\nAll rights reserved.`}
                </p>
              </div>

              {/* 1. Korean License Definition */}
              {showKR && (
                <div className="space-y-2.5 border border-blue-200/80 bg-blue-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                    <h4 className="font-bold text-blue-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">한국어</span>
                      <span>K-인증서 매니저 소프트웨어 라이선스 정의 (Korean License Definition)</span>
                    </h4>
                    <code className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      LICENSE_KR.txt
                    </code>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 bg-white border border-blue-200 rounded-lg">
                      <h5 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        제 1 조 (사용 허가 및 권한)
                      </h5>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        본 소프트웨어는 개인, 행정기관/공공기관, 교육기관(초·중·고·대학교), 비영리단체 및 영리 기업을 포함한 모든 사용자에게 영구적으로 <strong>무료(Free License)</strong>로 제공됩니다. 개인 및 사내 업무용 복제, 설치, 실행 및 배포가 자유롭게 허가됩니다.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <h5 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm">
                        제 2 조 (저작권 및 출처 표기 보존)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        본 소프트웨어의 소스 코드, 실행 바이너리 및 문서에 포함된 저작권 표기(<strong>{DEVELOPER_INFO.author}</strong>)와 라이선스 고지문은 임의로 수정하거나 삭제할 수 없습니다.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <h5 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm">
                        제 3 조 (배포 및 라이선스 동반 의무)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        본 소프트웨어를 설치 프로그램 또는 무설치 포터블 형태로 재배포할 수 있으며, 배포 시 한국어/영어 라이선스 고지 파일(<code>LICENSE.txt</code>, <code>LICENSE_KR.txt</code>, <code>LICENSE_EN.txt</code>)이 함께 유지되어야 합니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. English License Definition */}
              {showEN && (
                <div className="space-y-2.5 border border-indigo-200/80 bg-indigo-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2">
                    <h4 className="font-bold text-indigo-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">English</span>
                      <span>K-Certificate Manager Software License Definition</span>
                    </h4>
                    <code className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      LICENSE_EN.txt
                    </code>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 bg-white border border-indigo-200 rounded-lg">
                      <h5 className="font-bold text-indigo-900 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                        <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                        Article 1 (Grant of License and Permissions)
                      </h5>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        This software is permanently distributed <strong>Free of Charge (Free License)</strong> to all users, including individuals, government/public agencies, educational institutions, non-profit organizations, and commercial enterprises. Unrestricted copying, installation, execution, and internal/external distribution are permitted.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <h5 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm">
                        Article 2 (Preservation of Copyright Notice)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        The copyright notice (<strong>{DEVELOPER_INFO.author}</strong>) and license notices contained within the source code, executable binaries, and documentation of this software may not be modified or removed.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <h5 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm">
                        Article 3 (Redistribution & Accompanying License Files)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Users may redistribute this software in installer or unpacked portable format, provided that the official Korean/English license files (<code>LICENSE.txt</code>, <code>LICENSE_KR.txt</code>, <code>LICENSE_EN.txt</code>) are retained with the distribution.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Links */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-bold text-white block">{DEVELOPER_INFO.author} · CISNet</span>
                    <span className="text-[11px] text-slate-400">K-Certificate Manager (KR / EN Dual License)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={DEVELOPER_INFO.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                  >
                    <span>{lang === 'en' ? 'Company Website' : '공식 홈페이지'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={DEVELOPER_INFO.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition-colors"
                  >
                    <span>{lang === 'en' ? 'Tech Blog' : '개발자 블로그'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'opensource' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 space-y-1">
                {showKR && (
                  <p>
                    • <strong>[한국어]</strong> K-인증서 매니저는 다음의 검증된 오픈소스 라이브러리를 포함하며 각 고유 라이선스 조항을 준수합니다.
                  </p>
                )}
                {showEN && (
                  <p>
                    • <strong>[English]</strong> K-Certificate Manager incorporates the following verified open source libraries and complies with their respective license terms.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {openSourceLibraries.map((lib, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{lib.name}</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-mono font-semibold">
                        {lib.license}
                      </span>
                    </div>
                    {showKR && <p className="text-xs text-slate-700">{lib.purposeKR}</p>}
                    {showEN && <p className="text-xs text-slate-500">{lib.purposeEN}</p>}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>{lib.copyright}</span>
                      <a
                        href={lib.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>{lang === 'en' ? 'Website' : '웹사이트'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              {showKR && (
                <div className="space-y-3 border border-emerald-200/80 bg-emerald-50/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">한국어</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">보안 보장 및 보증의 부인 (Korean)</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                      제 2 조: 100% 로컬 오프라인 처리 및 외부 전송 차단 보증
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      본 소프트웨어는 사용자의 개인키(<code>signPri.key</code>), 공개키 인증서(<code>signCert.der</code>), 비밀번호 및 일체의 개인정보를 외부 원격 서버로 전송하거나 수집하지 않습니다(Zero-Network / Zero-Telemetry). 모든 탐색, 백업, 복사 및 삭제 작업은 사용자 PC와 지정된 USB 드라이브 내에서만 수행됩니다.
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                    <h4 className="font-bold text-amber-900 text-xs sm:text-sm">
                      제 4 조: 보증의 부인 및 책임의 한계 (AS-IS)
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      본 소프트웨어는 상품성 및 특정 목적에의 적합성에 대한 명시적·묵시적 보증 없이 "있는 그대로(AS-IS)" 제공됩니다. 저작권자 및 개발사는 본 소프트웨어의 사용 또는 사용 불능으로 인해 발생하는 직접적·간접적 손해에 대해 법적 책임을 지지 않으므로, 작업 전 중요 인증서를 반드시 백업하시기 바랍니다.
                    </p>
                  </div>
                </div>
              )}

              {showEN && (
                <div className="space-y-3 border border-indigo-200/80 bg-indigo-50/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">English</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">Security Guarantee & Disclaimer of Warranty (English)</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                      Article 2: 100% Local Offline Processing & Zero Telemetry Guarantee
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      This software is engineered to operate in a 100% offline local environment and never transmits or collects user private keys (<code>signPri.key</code>), public certificates (<code>signCert.der</code>), passwords, or personal information to any external server. All operations are performed strictly within the local PC and designated USB storage devices.
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                    <h4 className="font-bold text-amber-900 text-xs sm:text-sm">
                      Article 4: Disclaimer of Warranty and Limitation of Liability (AS-IS)
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR DEVELOPER BE LIABLE FOR ANY CLAIM OR DAMAGES ARISING FROM THE USE OF THIS SOFTWARE.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span>라이선스 정의 파일:</span>
            <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">LICENSE_KR.txt</code>
            <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">LICENSE_EN.txt</code>
            <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">docs/LICENSE.md</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer self-end sm:self-auto"
          >
            {lang === 'en' ? 'Close' : '확인 및 닫기'}
          </button>
        </div>
      </div>
    </div>
  );
};
