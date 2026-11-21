using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public partial class RenewalGuidanceDialog : Window
    {
        private readonly List<CertificateItem> _userCertificates;
        private List<RenewalInstitutionItem> _allMasterInstitutions = new();
        private string _selectedCategory = "ALL";

        public RenewalGuidanceDialog(IEnumerable<CertificateItem>? userCerts = null)
        {
            InitializeComponent();
            _userCertificates = userCerts?.ToList() ?? new List<CertificateItem>();
            InitializeMasterDirectory();
            ApplyFilter();
        }

        private void InitializeMasterDirectory()
        {
            _allMasterInstitutions = new List<RenewalInstitutionItem>
            {
                new()
                {
                    Id = "GPKI",
                    Name = "행정안전부 행정전자서명인증센터 (GPKI)",
                    ShortName = "행정안전부 GPKI",
                    Category = "GOV",
                    CategoryLabel = "정부·행정기관",
                    PortalName = "행정전자서명인증센터 공식 포털",
                    PortalUrl = "https://www.gpki.go.kr",
                    MenuGuide = "인증서 발급/관리 > 인증서 갱신 (만료 30일 전부터 가능)",
                    CallCenter = "02-818-7777 / 044-205-2000",
                    Description = "중앙부처, 지자체 공무원 및 정부기관 업무(온-나라, 전자결재 등) 비액티브엑스(HTML5)·보안토큰 인증 갱신 센터",
                    Notice = "Chrome/Edge 표준 웹 인증 및 모바일 공무원증 병행 체제로 전환 중입니다. 만료 전 온라인 갱신, 만료 후에는 기관 인증담당자(RA) 재발급이 필요합니다."
                },
                new()
                {
                    Id = "EPKI",
                    Name = "교육부 교육행정전자서명인증센터 (EPKI)",
                    ShortName = "교육부 EPKI",
                    Category = "EDU",
                    CategoryLabel = "교육청·학교",
                    PortalName = "교육행정전자서명인증센터 공식 포털",
                    PortalUrl = "https://www.epki.go.kr",
                    MenuGuide = "인증서 관리 > 인증서 갱신 (만료 30일 전부터 가능)",
                    CallCenter = "053-714-0777",
                    Description = "시도교육청, 초·중·고교 교원 및 국공립대 임직원(나이스 NEIS, K-에듀파인) HTML5 브라우저 표준 인증서 갱신 센터",
                    Notice = "만료 30일 전부터 비액티브엑스 웹 포털에서 온라인 갱신 가능하며, 만료 후에는 소속 학교 담당자 승인으로 신규 발급을 신청해야 합니다."
                },
                new()
                {
                    Id = "YESSIGN",
                    Name = "금융결제원 전자인증센터 (yessign)",
                    ShortName = "금융결제원 yessign",
                    Category = "BANK",
                    CategoryLabel = "은행·금융기관",
                    PortalName = "금융결제원 전자인증센터 공식 포털",
                    PortalUrl = "https://www.yessign.or.kr",
                    MenuGuide = "인증서 갱신 > 본인확인 및 암호 재설정",
                    CallCenter = "1577-5500",
                    Description = "시중 16개 은행(KB국민, 신한, 하나, 우리, NH농협, IBK기업 등) 이용자 공동인증서 갱신",
                    Notice = "주거래 은행 [인증센터]에서 갱신하며, 개인 사용자는 클라우드 금융인증서(3년)와 병행 발급할 수 있습니다. (2027.02.15부터 신규 RSA 3072-bit 적용)"
                },
                new()
                {
                    Id = "KICA",
                    Name = "한국정보인증 (SignGate / KICA)",
                    ShortName = "한국정보인증",
                    Category = "CORP",
                    CategoryLabel = "법인·공동인증",
                    PortalName = "한국정보인증 공식 웹사이트",
                    PortalUrl = "https://www.signgate.com",
                    MenuGuide = "인증서 갱신/발급 > 범용/사업자 인증서 갱신",
                    CallCenter = "1577-8787",
                    Description = "국내 1호 공인인증기관. 법인·개인사업자 범용 공동인증서 및 전자입찰/조달청 나라장터용 인증서 갱신",
                    Notice = "사업자 인증서 갱신 시 법인 서류 확인이 필요할 수 있으며, 2027.02.15 이후 신규·갱신 발급분부터 RSA 3072-bit 규격이 순차 적용됩니다."
                },
                new()
                {
                    Id = "CROSSCERT",
                    Name = "한국전자인증 (CrossCert)",
                    ShortName = "한국전자인증",
                    Category = "CORP",
                    CategoryLabel = "법인·공동인증",
                    PortalName = "한국전자인증 공식 웹사이트",
                    PortalUrl = "https://www.crosscert.com",
                    MenuGuide = "인증서 관리 > 갱신 신청",
                    CallCenter = "1566-0566",
                    Description = "글로벌 인증 및 국내 법인/개인 범용 공동인증서, 세금계산서 전용 인증서 갱신",
                    Notice = "만료일 30일 전부터 갱신 가능하며, 2027.02.15 이후 RSA 3072-bit 상향 규격이 적용됩니다."
                },
                new()
                {
                    Id = "SIGNKOREA",
                    Name = "코스콤 (SignKorea)",
                    ShortName = "코스콤 SignKorea",
                    Category = "STOCK",
                    CategoryLabel = "증권·금융투자",
                    PortalName = "SignKorea 공식 포털",
                    PortalUrl = "https://www.signkorea.com",
                    MenuGuide = "인증서 관리 > 증권/금융투자/범용 갱신",
                    CallCenter = "1577-7337",
                    Description = "증권사(키움, 미래에셋, 한국투자, 삼성증권 등) 주식거래 및 펀드/금융투자 전용 인증서 갱신",
                    Notice = "거래 증권사 HTS/MTS 인증센터에서도 갱신할 수 있으며, 2027.02.15부터 신규 RSA 3072-bit 규격으로 전환됩니다."
                },
                new()
                {
                    Id = "TRADESIGN",
                    Name = "한국무역정보통신 (TradeSign)",
                    ShortName = "무역정보통신 TradeSign",
                    Category = "CORP",
                    CategoryLabel = "무역·통관·전자입찰",
                    PortalName = "TradeSign 공식 포털",
                    PortalUrl = "https://www.tradesign.net",
                    MenuGuide = "인증서 관리 > 갱신 메뉴",
                    CallCenter = "1566-2119",
                    Description = "무역, 관세청 통관, 관세, 수출입, 전자입찰 특화 사업자 인증서 갱신 센터",
                    Notice = "수출입 무역업체 필수 인증서 갱신을 지원하며, 2027.02.15 RSA 3072-bit 적용 대상입니다."
                },
                new()
                {
                    Id = "INIPASS",
                    Name = "이니텍 기업·레거시 전자인증 (Inipass)",
                    ShortName = "이니텍 Inipass",
                    Category = "BANK",
                    CategoryLabel = "기업·금융 레거시 연계",
                    PortalName = "Inipass 공식 포털",
                    PortalUrl = "https://www.inipass.com",
                    MenuGuide = "기존 기업·금융 사설인증 연계 고객 유지 및 이관 안내",
                    CallCenter = "1566-4119",
                    Description = "기존 금융·기업 사설·레거시 연계 인증 유지 안내",
                    Notice = "기존 기업/금융 고객 전용 유지·이관 안내 대상입니다. 신규 개인 공동인증서 발급은 5대 공동인증기관 또는 주거래 은행 금융인증서를 이용하세요."
                }
            };

            // Calculate active matched certificates count per institution
            foreach (var inst in _allMasterInstitutions)
            {
                int active = 0, expiring = 0, expired = 0;

                foreach (var cert in _userCertificates)
                {
                    bool isMatch = false;
                    string issuerText = $"{cert.IssuerName} {cert.CaSignatureName}".ToLowerInvariant();
                    string holderText = $"{cert.SubjectDn} {cert.CommonName} {cert.Organization}".ToLowerInvariant();
                    string policyText = (cert.PolicyUsage ?? string.Empty).ToLowerInvariant();
                    bool hasExplicitIssuer = !string.IsNullOrWhiteSpace(issuerText) && !issuerText.Contains("알 수 없음");

                    bool isGpkiIssuer = issuerText.Contains("gpki") || issuerText.Contains("행정전자서명") || issuerText.Contains("정부") || issuerText.Contains("mpki");
                    bool isEpkiIssuer = issuerText.Contains("epki") || issuerText.Contains("교육부") || issuerText.Contains("교육행정전자서명");
                    bool isYessignIssuer = issuerText.Contains("yessign") || issuerText.Contains("금융결제원");
                    bool isKicaIssuer = issuerText.Contains("kica") || issuerText.Contains("한국정보인증") || issuerText.Contains("signgate");
                    bool isCrosscertIssuer = issuerText.Contains("crosscert") || issuerText.Contains("한국전자인증");
                    bool isSignkoreaIssuer = issuerText.Contains("signkorea") || issuerText.Contains("코스콤");
                    bool isTradesignIssuer = issuerText.Contains("tradesign") || issuerText.Contains("한국무역정보통신");
                    bool isInipassIssuer = issuerText.Contains("inipass") || issuerText.Contains("이니텍");

                    bool hasExplicitOtherNpkiCa = isKicaIssuer || isCrosscertIssuer || isSignkoreaIssuer || isTradesignIssuer || isInipassIssuer;
                    bool hasExplicitAnyNpkiCa = isYessignIssuer || hasExplicitOtherNpkiCa;

                    if (inst.Id == "GPKI")
                    {
                        isMatch = cert.Category == CertCategory.GPKI ||
                                  isGpkiIssuer ||
                                  (!hasExplicitAnyNpkiCa && cert.Category != CertCategory.NPKI && (holderText.Contains("gpki") || holderText.Contains("행정")));
                    }
                    else if (inst.Id == "EPKI")
                    {
                        isMatch = cert.Category == CertCategory.EPKI ||
                                  isEpkiIssuer ||
                                  (!hasExplicitAnyNpkiCa && cert.Category != CertCategory.NPKI && (holderText.Contains("epki") || holderText.Contains("교육")));
                    }
                    else if (inst.Id == "KICA")
                    {
                        isMatch = isKicaIssuer || (!hasExplicitAnyNpkiCa && !hasExplicitIssuer && (holderText.Contains("kica") || holderText.Contains("한국정보인증") || holderText.Contains("signgate")));
                    }
                    else if (inst.Id == "CROSSCERT")
                    {
                        isMatch = isCrosscertIssuer || (!hasExplicitAnyNpkiCa && !hasExplicitIssuer && (holderText.Contains("crosscert") || holderText.Contains("한국전자인증")));
                    }
                    else if (inst.Id == "SIGNKOREA")
                    {
                        isMatch = isSignkoreaIssuer ||
                                  (!hasExplicitAnyNpkiCa && policyText.Contains("증권")) ||
                                  (!hasExplicitAnyNpkiCa && !hasExplicitIssuer && (holderText.Contains("signkorea") || holderText.Contains("코스콤") || holderText.Contains("증권")));
                    }
                    else if (inst.Id == "TRADESIGN")
                    {
                        isMatch = isTradesignIssuer ||
                                  (!hasExplicitAnyNpkiCa && policyText.Contains("무역")) ||
                                  (!hasExplicitAnyNpkiCa && !hasExplicitIssuer && (holderText.Contains("tradesign") || holderText.Contains("한국무역정보통신") || holderText.Contains("무역")));
                    }
                    else if (inst.Id == "INIPASS")
                    {
                        isMatch = isInipassIssuer || (!hasExplicitAnyNpkiCa && !hasExplicitIssuer && (holderText.Contains("inipass") || holderText.Contains("이니텍")));
                    }
                    else if (inst.Id == "YESSIGN")
                    {
                        isMatch = isYessignIssuer ||
                                  (cert.Category == CertCategory.NPKI && !hasExplicitOtherNpkiCa);
                    }

                    if (isMatch)
                    {
                        if (cert.Status == ExpiryStatus.Expired || cert.RemainingDays <= 0) expired++;
                        else if (cert.Status == ExpiryStatus.ExpiringSoon || cert.RemainingDays <= 30) expiring++;
                        else active++;
                    }
                }

                inst.ActiveCertCount = active;
                inst.ExpiringCertCount = expiring;
                inst.ExpiredCertCount = expired;
            }
        }

        private void ApplyFilter()
        {
            var keyword = TxtSearchKeyword?.Text?.Trim().ToLower() ?? string.Empty;

            var filtered = _allMasterInstitutions.Where(inst =>
            {
                // Category match
                if (_selectedCategory != "ALL" && inst.Category != _selectedCategory) return false;

                // Keyword search
                if (!string.IsNullOrEmpty(keyword))
                {
                    string searchable = $"{inst.Name} {inst.ShortName} {inst.Description} {inst.PortalName}".ToLower();
                    if (!searchable.Contains(keyword)) return false;
                }

                return true;
            }).ToList();

            ItemsInstitutions.ItemsSource = null;
            ItemsInstitutions.ItemsSource = filtered;
        }

        private void CategoryRadio_Click(object sender, RoutedEventArgs e)
        {
            if (sender is RadioButton rb && rb.Tag is string cat)
            {
                _selectedCategory = cat;
                ApplyFilter();
            }
        }

        private void TxtSearchKeyword_TextChanged(object sender, TextChangedEventArgs e)
        {
            ApplyFilter();
        }

        private void BtnRefreshList_Click(object sender, RoutedEventArgs e)
        {
            InitializeMasterDirectory();
            ApplyFilter();
            UserFriendlyMessageHelper.ShowInfo("발급기관 및 인증서 상태가 최신으로 새로고침 되었습니다.", "새로고침 완료", this);
        }

        private void BtnCopyUrl_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is string url && !string.IsNullOrEmpty(url))
            {
                try
                {
                    Clipboard.SetText(url);
                    UserFriendlyMessageHelper.ShowInfo($"발급기관 갱신 포털 주소가 클립보드에 복사되었습니다.\n\n주소: {url}", "복사 완료", this);
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowError(ex, "클립보드 주소 복사", this);
                }
            }
        }

        private void BtnSearchNaver_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is string name && !string.IsNullOrEmpty(name))
            {
                try
                {
                    var searchUrl = $"https://search.naver.com/search.naver?query={Uri.EscapeDataString(name + " 공동인증서 갱신 센터")}";
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = searchUrl,
                        UseShellExecute = true
                    });
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowError(ex, "웹 브라우저 검색 열기", this);
                }
            }
        }

        private void BtnOpenPortal_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is string url && !string.IsNullOrEmpty(url))
            {
                try
                {
                    if (!Uri.TryCreate(url, UriKind.Absolute, out var validUri) ||
                        (validUri.Scheme != Uri.UriSchemeHttps && validUri.Scheme != Uri.UriSchemeHttp))
                    {
                        UserFriendlyMessageHelper.ShowWarning(
                            "안전하지 않은 프로토콜 주소입니다. https:// 또는 http://로 시작하는 공식 포털 주소만 열 수 있습니다.",
                            "보안 차단 안내",
                            "• 발급기관 URL이 올바른 웹 주소인지 확인해 주세요.",
                            this);
                        return;
                    }

                    Process.Start(new ProcessStartInfo
                    {
                        FileName = validUri.AbsoluteUri,
                        UseShellExecute = true
                    });
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowError(ex, "발급기관 갱신 포털 열기", this);
                }
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
