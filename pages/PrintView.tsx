import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report, ReportData, EMPTY_REPORT_DATA } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, Building2,
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  GraduationCap, Briefcase, MessageSquare, FileText, Calendar, Activity,
  ArrowDownLeft, ArrowUpRight, BookOpen, Shield, ArrowRightLeft, Hammer,
  ExternalLink, Clock, Phone, Percent, CheckCircle, Edit3
} from 'lucide-react';
import { PageContainer, SectionHeader, KPI } from '../components/PrintUI';
import { ExecutiveBriefPage } from '../components/ExecutiveBriefPage';
import { WorkforceWageAnalytics } from '../components/WorkforceWageAnalytics';
import { useLanguage } from '../context/LanguageContext';

const BLUE_PALETTE = ['#2563eb', '#3b82f6', '#60a5fa', '#38bdf8', '#7dd3fc', '#93c5fd'];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const renderRichText = (text: string, sizeClass: string = "text-[12px]") => {
  if (!text) return null;
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-bold">$1</strong>');
  processed = processed.replace(/\*(.*?)\*/g, '<em class="text-gray-700 italic">$1</em>');
  const lines = processed.split('\n');
  const result: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      if (!inList) { inList = true; listItems = []; }
      listItems.push(trimmed.substring(2));
    } else {
      if (inList) {
        result.push(<ul key={`list-${i}`} className="list-disc mb-1 ms-6 text-gray-800">{listItems.map((item, idx) => (<li key={idx} className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
        inList = false;
      }
      if (trimmed) { result.push(<p key={i} className="mb-1 text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: processed.includes('\n') ? line : processed }} />); }
    }
  });
  if (inList) { result.push(<ul key="list-final" className="list-disc mb-1 ms-6 text-gray-800">{listItems.map((item, idx) => (<li key={idx} className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>); }
  return <div className={`rich-text-content ${sizeClass} text-gray-800 leading-[1.5] overflow-visible`}>{result.length > 0 ? result : text}</div>;
};

// Helper for clickable references with specific logic for Ministry/CBUAE
const SourceLink = ({ label, type }: { label: string, type: string }) => {
  const urls: Record<string, string> = {
    demo: 'https://data.worldbank.org',
    economy: 'https://data.worldbank.org',
    trade: 'https://comtradeplus.un.org',
    edu: 'https://uis.unesco.org',
    tip: 'https://www.state.gov/trafficking-in-persons-report/'
  };

  const url = urls[type];
  
  if (!url) return <span className="text-[9px] text-gray-500 italic">{label}</span>;
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-[9px] text-primary hover:text-accent font-bold italic underline flex items-center gap-0.5 inline-flex"
    >
      {label} <ExternalLink size={8} />
    </a>
  );
};

export default function PrintView() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getCleanId = () => {
    if (routeId) {
      return routeId.split('?')[0].split('#')[0];
    }
    const hash = window.location.hash || '';
    const cleanHash = hash.includes('?') ? hash.substring(0, hash.indexOf('?')) : hash;
    const parts = cleanHash.split('/');
    const printIdx = parts.indexOf('print');
    if (printIdx !== -1 && parts[printIdx + 1]) {
      return parts[printIdx + 1].split('?')[0].split('#')[0];
    }
    const pathParts = window.location.pathname.split('/');
    const pIdx = pathParts.indexOf('print');
    if (pIdx !== -1 && pathParts[pIdx + 1]) {
      return pathParts[pIdx + 1].split('?')[0].split('#')[0];
    }
    return undefined;
  };

  const id = getCleanId();

  const { t, language, dir, setLanguage } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for lang query parameter - with HashRouter, it's in the hash
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    const params = new URLSearchParams(queryIndex !== -1 ? hash.substring(queryIndex) : '');
    const langParam = params.get('lang');
    if (langParam && (langParam === 'en' || langParam === 'ar') && langParam !== language) {
      setLanguage(langParam as any);
    }
  }, [language, setLanguage]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(false);
      MockService.getReportById(id)
        .then(r => {
          if (r && r.data) {
            setReport(r);
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch(err => {
          console.error("Failed to load report:", err);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-primary font-serif gap-3 no-print" dir={dir}>
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-base font-medium">{t('generatingDoc')}</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4 no-print" dir={dir}>
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">{t('reportNotFound')}</h2>
        <p className="text-sm">{t('reportNotFoundMsg')}</p>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/reports')} 
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {language === 'ar' ? 'العودة للتقارير' : 'Back to Reports'}
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border"
          >
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border"
          >
            {language === 'ar' ? 'إعادة تحميل' : 'Reload'}
          </button>
        </div>
      </div>
    );
  }

  const rawData: any = (report && report.data) ? report.data : {};
  const data: ReportData = {
    ...EMPTY_REPORT_DATA,
    ...rawData,
    country: rawData.country || '',
    economicStats: {
      ...EMPTY_REPORT_DATA.economicStats,
      ...(rawData.economicStats || {})
    },
    educationStats: {
      ...EMPTY_REPORT_DATA.educationStats,
      ...(rawData.educationStats || {})
    },
    workforceStats: {
      ...EMPTY_REPORT_DATA.workforceStats,
      ...(rawData.workforceStats || {}),
      migrationDestinations: rawData.workforceStats?.migrationDestinations || [],
      topSectors: rawData.workforceStats?.topSectors || [],
      availableSkills: rawData.workforceStats?.availableSkills || []
    },
    uaeWorkforceStats: {
      ...EMPTY_REPORT_DATA.uaeWorkforceStats,
      ...(rawData.uaeWorkforceStats || {}),
      workersHistory: {
        ...EMPTY_REPORT_DATA.uaeWorkforceStats?.workersHistory,
        ...(rawData.uaeWorkforceStats?.workersHistory || {})
      },
      mohre: {
        ...EMPTY_REPORT_DATA.uaeWorkforceStats?.mohre,
        ...(rawData.uaeWorkforceStats?.mohre || {}),
        totalPrivate: {
          ...EMPTY_REPORT_DATA.uaeWorkforceStats?.mohre?.totalPrivate,
          ...(rawData.uaeWorkforceStats?.mohre?.totalPrivate || {})
        },
        totalDomestic: {
          ...EMPTY_REPORT_DATA.uaeWorkforceStats?.mohre?.totalDomestic,
          ...(rawData.uaeWorkforceStats?.mohre?.totalDomestic || {})
        },
        byEmirate: (rawData.uaeWorkforceStats?.mohre?.byEmirate && rawData.uaeWorkforceStats.mohre.byEmirate.length > 0)
          ? rawData.uaeWorkforceStats.mohre.byEmirate
          : EMPTY_REPORT_DATA.uaeWorkforceStats.mohre.byEmirate,
        bySector: rawData.uaeWorkforceStats?.mohre?.bySector || []
      },
      icp: {
        ...EMPTY_REPORT_DATA.uaeWorkforceStats?.icp,
        ...(rawData.uaeWorkforceStats?.icp || {}),
        byEmirate: (rawData.uaeWorkforceStats?.icp?.byEmirate && rawData.uaeWorkforceStats.icp.byEmirate.length > 0)
          ? rawData.uaeWorkforceStats.icp.byEmirate
          : EMPTY_REPORT_DATA.uaeWorkforceStats.icp.byEmirate,
        bySector: rawData.uaeWorkforceStats?.icp?.bySector || []
      },
      salaryBySector: (rawData.uaeWorkforceStats?.salaryBySector && rawData.uaeWorkforceStats.salaryBySector.length > 0)
        ? rawData.uaeWorkforceStats.salaryBySector
        : EMPTY_REPORT_DATA.uaeWorkforceStats.salaryBySector
    },
    delegations: {
      uae: rawData.delegations?.uae || [],
      partner: rawData.delegations?.partner || []
    },
    recentInteractions: rawData.recentInteractions || [],
    pointsOfDiscussion: rawData.pointsOfDiscussion || [],
    previousAgreementsAndUpdates: rawData.previousAgreementsAndUpdates || [],
    bilateralAgreements: rawData.bilateralAgreements || [],
    customSections: rawData.customSections || [],
    relatedNews: rawData.relatedNews || [],
    keyIssues: rawData.keyIssues || [],
    recommendations: rawData.recommendations || [],
    pendingMatters: rawData.pendingMatters || [],
    attentionNotes: rawData.attentionNotes || []
  };

  const isRTL = language === 'ar';
  
  // Dynamic Year Logic
  const reportDateObj = data.reportDate ? new Date(data.reportDate) : new Date();
  const reportYear = !isNaN(reportDateObj.getFullYear()) ? reportDateObj.getFullYear() : new Date().getFullYear();
  const reportMonth = !isNaN(reportDateObj.getMonth()) ? reportDateObj.getMonth() : new Date().getMonth();
  const prevYear = reportYear - 1;

  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const defaultDateStr = language === 'ar' 
    ? `${monthsAr[reportMonth] || ''} ${reportYear}`
    : `${monthsEn[reportMonth] || ''} ${reportYear}`;

  const formatCompactNumber = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const formatAsOfDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    
    // Handle YYYY-MM from month input
    const monthMatch = dateStr.match(/^(\d{4})-(\d{2})/);
    if (monthMatch) {
      const y = parseInt(monthMatch[1]);
      const m = parseInt(monthMatch[2]);
      
      if (language === 'ar') {
        return `${monthsAr[m - 1]} ${y}`;
      }
      return `${monthsEn[m - 1]} ${y}`;
    }
    return dateStr;
  };

  const getSource = (type: string, dateOverride?: string) => {
    const formattedDate = formatAsOfDate(dateOverride);
    
    const labels: Record<string, Record<string, string>> = {
      en: { 
        demo: `*(World Bank, ${reportYear})`, 
        economy: `*(World Bank, ${reportYear})`, 
        trade: `*(UN Comtrade, ${reportYear})`, 
        edu: `*(UNESCO, ${reportYear})`, 
        tip: `*(US TIP, ${prevYear})`,
        mohre: `*(Ministry Data, ${formattedDate || defaultDateStr})`,
        cbuae: `Central Bank of the UAE, ${prevYear}`
      },
      ar: { 
        demo: `*(البنك الدولي، ${reportYear})`, 
        economy: `*(البنك الدولي، ${reportYear})`, 
        trade: `*(كوم تريد، ${reportYear})`, 
        edu: `*(اليونسكو، ${reportYear})`, 
        tip: `*(تقرير الاتجار، ${prevYear})`,
        mohre: `*(بيانات الوزارة، ${formattedDate || defaultDateStr})`,
        cbuae: `مصرف الإمارات المركزي، ${prevYear}`
      }
    };

    const label = labels[language]?.[type] || '';
    return <SourceLink label={label} type={type} />;
  };

  const formatWageValueWithAED = (val: string | undefined) => {
    if (!val) return '—';
    const trimmed = val.trim();
    if (!trimmed) return '—';
    if (trimmed.toLowerCase().includes('aed') || trimmed.includes('د.إ') || trimmed.toLowerCase().includes('usd') || trimmed.includes('$')) {
      return trimmed;
    }
    return `${trimmed} AED`;
  };

  const normalizeWageDisplay = (wage: string) => {
    if (!wage) return isRTL ? 'لا يوجد' : 'N/A';
    return wage;
  };

  const translateEmirate = (name: string) => {
    if (!isRTL) return name;
    const map: Record<string, string> = { 'Abu Dhabi': 'أبوظبي', 'Dubai': 'دبي', 'Sharjah': 'الشارقة', 'Ajman': 'عجمان', 'Umm Al Quwain': 'أم القيوين', 'Ras Al Khaimah': 'رأس الخيمة', 'Fujairah': 'الفجيرة' };
    return map[name] || name;
  };

  const translateCountryName = (country: string = '') => {
    if (!isRTL || !country) return country || '';
    const lower = (country || '').toLowerCase().trim();
    const map: Record<string, string> = {
      'india': 'الهند',
      'republic of india': 'الهند',
      'pakistan': 'باكستان',
      'islamic republic of pakistan': 'باكستان',
      'bangladesh': 'بنغلاديش',
      'people\'s republic of bangladesh': 'بنغلاديش',
      'philippines': 'الفلبين',
      'republic of the philippines': 'الفلبين',
      'nepal': 'نيبال',
      'sri lanka': 'سريلانكا',
      'egypt': 'مصر',
      'arab republic of egypt': 'مصر',
      'uganda': 'أوغندا',
      'kenya': 'كينيا',
      'ethiopia': 'إثيوبيا',
      'indonesia': 'إندونيسيا',
      'vietnam': 'فيتنام',
      'partner': 'الدولة الشريكة'
    };
    return map[lower] || country;
  };

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full border-t border-gray-100">
      <p className="text-[8px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans">{new Date().toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US')}</span>
      </p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest">{t('ministry')}</p>
    </div>
  );

  const HeaderBand = ({ country = '', reportId = '', title = '', flagUrl }: any) => {
    const getFlagCode = (c: string = '') => {
      const lower = (c || '').toLowerCase();
      if (lower.includes('india')) return 'in';
      if (lower.includes('philippines')) return 'ph';
      if (lower.includes('pakistan')) return 'pk';
      if (lower.includes('bangladesh')) return 'bd';
      if (lower.includes('sri lanka')) return 'lk';
      if (lower.includes('nepal')) return 'np';
      if (lower.includes('indonesia')) return 'id';
      if (lower.includes('egypt')) return 'eg';
      if (lower.includes('jordan')) return 'jo';
      if (lower.includes('vietnam')) return 'vn';
      return 'ae';
    };
    const flagSrc = flagUrl || `https://flagcdn.com/w40/${getFlagCode(country)}.png`;
    return (
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <img 
            src={flagSrc} 
            className="w-8 h-5 rounded border border-gray-300 object-cover shadow-2xs shrink-0" 
            style={{ width: '32px', height: '20px', minWidth: '32px', minHeight: '20px', objectFit: 'cover' }} 
            alt={country} 
          />
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 leading-none">{title}</p>
            <p className="text-xs font-bold text-primary-dark uppercase leading-tight mt-0.5">{country}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="kpi-chip chip-restrict flex items-center gap-1 text-[8.5px] py-0.5 px-2">
            <ShieldAlert size={10} /> {isRTL ? 'سري' : 'Restricted'}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">REF: {reportId}</span>
        </div>
      </div>
    );
  };

  const sortedMohreEmirates = [...(data.uaeWorkforceStats?.mohre?.byEmirate || [])].sort((a, b) => b.value - a.value);
  const sortedIcpEmirates = [...(data.uaeWorkforceStats?.icp?.byEmirate || [])].sort((a, b) => b.value - a.value);

  // Unified Emirate Data combining MOHRE and ICP
  const mohreList = data.uaeWorkforceStats?.mohre?.byEmirate || [];
  const icpList = data.uaeWorkforceStats?.icp?.byEmirate || [];
  const mohreMap = new Map(mohreList.map(e => [e.name, Number(e.value || 0)]));
  const icpMap = new Map(icpList.map(e => [e.name, Number(e.value || 0)]));

  const standardEmirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
  const allNames = Array.from(new Set([
    ...standardEmirates,
    ...mohreList.map(e => e.name),
    ...icpList.map(e => e.name)
  ]));

  const combinedEmirates = allNames.map(name => {
    const mohre = mohreMap.get(name) || 0;
    const icp = icpMap.get(name) || 0;
    return {
      name,
      mohre,
      icp,
      total: mohre + icp
    };
  }).sort((a, b) => b.total - a.total);

  const translateSectorName = (name: string) => {
    if (!isRTL) {
      const map: Record<string, string> = {
        'الإنشاءات': 'Construction',
        'التجزئة': 'Retail',
        'الخدمات': 'Services',
        'الضيافة': 'Hospitality',
        'الصناعة': 'Manufacturing',
        'النقل': 'Transportation',
        'أخرى': 'Other',
        'اخرى': 'Other',
      };
      return map[name] || name;
    } else {
      const map: Record<string, string> = {
        'Construction': 'الإنشاءات',
        'Retail': 'التجزئة',
        'Services': 'الخدمات',
        'Hospitality': 'الضيافة',
        'Manufacturing': 'الصناعة',
        'Transportation': 'النقل',
        'Other': 'أخرى',
      };
      return map[name] || name;
    }
  };

  const formatPctValue = (val: string | undefined | null) => {
    if (val === undefined || val === null || val === '') return '-%';
    const trimmed = String(val).trim();
    if (trimmed === '-%' || trimmed === '-') return '-%';
    if (trimmed.endsWith('%')) return trimmed;
    return `${trimmed}%`;
  };

  const salarySectors = (data.uaeWorkforceStats.salaryBySector && data.uaeWorkforceStats.salaryBySector.length > 0)
    ? data.uaeWorkforceStats.salaryBySector
    : [
        { name: isRTL ? 'الإنشاءات' : 'Construction', uaeValue: 4500, partnerValue: 1200 },
        { name: isRTL ? 'التجزئة' : 'Retail', uaeValue: 3800, partnerValue: 950 },
        { name: isRTL ? 'الخدمات' : 'Services', uaeValue: 4200, partnerValue: 1100 },
        { name: isRTL ? 'الضيافة' : 'Hospitality', uaeValue: 3500, partnerValue: 800 },
        { name: isRTL ? 'الصناعة' : 'Manufacturing', uaeValue: 5000, partnerValue: 1400 },
        { name: isRTL ? 'النقل' : 'Transportation', uaeValue: 4800, partnerValue: 1300 },
      ];

  const processSalarySectors = (sectors: { name: string; uaeValue: number; partnerValue: number }[], limit = 10) => {
    const sorted = [...sectors].sort((a, b) => b.uaeValue - a.uaeValue);
    return sorted.slice(0, limit);
  };

  const mappedSalarySectors = [...salarySectors].map(s => ({
    name: translateSectorName(s.name),
    uaeValue: Number(s.uaeValue || 0),
    partnerValue: Number(s.partnerValue || 0)
  }));
  const sortedSalarySectors = processSalarySectors(mappedSalarySectors, 10);

  // Find max value in salary sectors to set manual Y-axis max about 15-20% higher
  const maxSalaryVal = Math.max(
    ...sortedSalarySectors.slice(0, 10).flatMap(s => [s.uaeValue || 0, s.partnerValue || 0]),
    1
  );
  const manualMaxSalary = Math.ceil(maxSalaryVal * 1.22);

  // Custom label renderers to match the exact requirements of horizontal labels
  const wrapSectorName = (name: string): string[] => {
    if (!name) return [];
    const words = name.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + word.length + 1 <= 16) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const renderCustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const name = payload?.value || '';
    const lines = wrapSectorName(name);
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={4}
          fill="#374151"
          textAnchor="middle"
          style={{ fontSize: '7.5px', fontWeight: 700 }}
        >
          {lines.map((line, idx) => (
            <tspan key={idx} x={0} dy={idx === 0 ? 0 : 8.5}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  const formatSectorTick = (value: string) => {
    return value;
  };

  const renderUaeLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const cx = x + width / 2 - 4.5;
    const cy = y - 11;
    return (
      <text
        x={cx}
        y={cy}
        fill="#10b981"
        textAnchor="middle"
        style={{ fontSize: '7.5px', fontWeight: 700 }}
      >
        {Number(value).toLocaleString()}
      </text>
    );
  };

  const renderPartnerLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const cx = x + width / 2 + 4.5;
    const cy = y - 5;
    return (
      <text
        x={cx}
        y={cy}
        fill="#2563eb"
        textAnchor="middle"
        style={{ fontSize: '7.5px', fontWeight: 700 }}
      >
        {Number(value).toLocaleString()}
      </text>
    );
  };

  const totalMohreByCity = (data.uaeWorkforceStats?.mohre?.byEmirate || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalIcpByCity = (data.uaeWorkforceStats?.icp?.byEmirate || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  const combinedTotalWorkers = data.uaeWorkforceStats?.totalWorkersOverride !== undefined && data.uaeWorkforceStats?.totalWorkersOverride !== null && data.uaeWorkforceStats?.totalWorkersOverride !== 0
    ? data.uaeWorkforceStats.totalWorkersOverride
    : totalMohreByCity + totalIcpByCity;

  const processSectors = (sectorsList: { name: string; value: number }[], limit = 10) => {
    const safeList = Array.isArray(sectorsList) ? sectorsList : [];
    const sorted = [...safeList].sort((a, b) => b.value - a.value);
    if (sorted.length <= limit) {
      return sorted;
    }
    const topLimit = sorted.slice(0, limit);
    const remaining = sorted.slice(limit);
    const remainingSum = remaining.reduce((sum, item) => sum + (item.value || 0), 0);
    if (remainingSum > 0) {
      topLimit.push({
        name: isRTL ? 'أخرى' : 'Other',
        value: remainingSum
      });
    }
    return topLimit;
  };

  const processedMohreSectors = processSectors(data.uaeWorkforceStats?.mohre?.bySector || [], 10);
  const maxMohreVal = Math.max(...processedMohreSectors.map(s => s.value), 1);

  const processedIcpSectors = processSectors(data.uaeWorkforceStats?.icp?.bySector || [], 10);
  const maxIcpVal = Math.max(...processedIcpSectors.map(s => s.value), 1);

  const parseNumericCount = (c: any): number => {
    if (typeof c === 'number') return c;
    if (!c) return 0;
    const sanitized = String(c).replace(/,/g, '').replace(/[^\d.-]/g, '');
    return parseFloat(sanitized) || 0;
  };

  const processMigrationDestinations = (destList: { country: string; count: string }[], limit = 5) => {
    const parsed = (destList || [])
      .map(d => ({
        country: d.country,
        count: d.count,
        numericVal: parseNumericCount(d.count)
      }))
      .filter(d => d.country && d.country.trim() !== '');

    // Sort descending by numeric value (the bigger the longer, goes down descending)
    const sorted = [...parsed].sort((a, b) => b.numericVal - a.numericVal);

    // Max 5 items
    return sorted.slice(0, limit);
  };

  // Pagination Logic Constants
  const INT_CHUNK_SIZE = 5;
  const POINTS_CHUNK_SIZE = 3; // Discussion points are text-heavy, limit to 3 per page
  const AGR_CHUNK_SIZE = 6;

  // Helper for Category Rank: UAE GOV (1), MOHRE (2), OTHER (3)
  const getCategoryRank = (cat?: string) => {
    const c = (cat || '').toUpperCase().trim();
    if (c === 'UAE GOV' || c.includes('UAE') || c.includes('GOV') || c.includes('حكومة')) return 1;
    if (c === 'MOHRE' || c.includes('MOHRE') || c.includes('وزارة') || c.includes('موارد')) return 2;
    return 3; // OTHER
  };

  // --- SORT RELATIONSHIP SUMMARY (RECENT INTERACTIONS) BY DATE AND CATEGORY & TYPE ---
  const sortOrder = data.interactionSortOrder || 'date_category';
  const sortedInteractions = [...(data.recentInteractions || [])].sort((a, b) => {
    if (sortOrder === 'category_date') {
      const catRankA = getCategoryRank(a.category);
      const catRankB = getCategoryRank(b.category);
      if (catRankA !== catRankB) return catRankA - catRankB;
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.type || '').localeCompare(b.type || '');
    }

    // Default: Sort by Date descending (newest first), then by Category rank (UAE GOV -> MOHRE -> OTHER), then Type
    const dateCompare = (b.date || '').localeCompare(a.date || '');
    if (dateCompare !== 0) return dateCompare;
    const catRankA = getCategoryRank(a.category);
    const catRankB = getCategoryRank(b.category);
    if (catRankA !== catRankB) return catRankA - catRankB;
    return (a.type || '').localeCompare(b.type || '');
  });

  const interactionChunks = [];
  for (let i = 0; i < sortedInteractions.length; i += INT_CHUNK_SIZE) {
    interactionChunks.push(sortedInteractions.slice(i, i + INT_CHUNK_SIZE));
  }

  const pointsChunks = [];
  const rawPoints = data.pointsOfDiscussion || [];
  for (let i = 0; i < rawPoints.length; i += POINTS_CHUNK_SIZE) {
    pointsChunks.push(rawPoints.slice(i, i + POINTS_CHUNK_SIZE));
  }

  const updatesChunks = [];
  const previousUpdates = data.previousAgreementsAndUpdates || [];
  for (let i = 0; i < previousUpdates.length; i += POINTS_CHUNK_SIZE) {
    updatesChunks.push(previousUpdates.slice(i, i + POINTS_CHUNK_SIZE));
  }

  const sortedAgreements = [...(data.bilateralAgreements || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const agreementChunks = [];
  for (let i = 0; i < sortedAgreements.length; i += AGR_CHUNK_SIZE) {
    agreementChunks.push(sortedAgreements.slice(i, i + AGR_CHUNK_SIZE));
  }

  const processedMigrationDests = processMigrationDestinations(data.workforceStats?.migrationDestinations || [], 5);
  const maxMigrationDest = Math.max(...processedMigrationDests.map(d => d.numericVal), 1);
  const sortedPartnerSectors = [...(data.workforceStats?.topSectors || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
  const maxPartnerSector = Math.max(...sortedPartnerSectors.map(s => s.value || 0), 1);

  /**
   * REFINED STATUS BADGE LOGIC
   * Strictly matches the requested rules: Green for Active, Yellow for Pending/Custom.
   */
  const getAgreementStatusDisplay = (agr: any) => {
    // Force lowercase for strict checking
    const status = String(agr.status || 'active').toLowerCase();
    
    // Rule: active badge text and color (GREEN)
    if (status === 'active' || status.includes('ساري') || (status.includes('active') && !status.includes('in'))) {
      return { 
        label: isRTL ? 'ساري' : 'Active', 
        class: 'bg-green-100 text-green-800 border-green-200' 
      };
    }
    
    // Rule: pending badge text and color (YELLOW)
    if (status === 'pending' || status.includes('تنفيذ') || status.includes('pending')) {
      return { 
        label: isRTL ? 'قيد التنفيذ' : 'Pending', 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      };
    }
    
    // Rule: custom status (YELLOW)
    if (status === 'custom' || agr.customStatusText) {
      return { 
        label: agr.customStatusText || (isRTL ? 'مخصص' : 'Custom'), 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      };
    }

    // Default fallback (Green for active is the safest default per logic)
    return { label: isRTL ? 'ساري' : 'Active', class: 'bg-green-100 text-green-800 border-green-200' };
  };

  /**
   * Helper for Category Display in Relationship Summary (ملخص العلاقة)
   * Handles UAE GOV, MOHRE, and OTHER
   */
  const getCategoryDisplay = (cat?: string) => {
    const rank = getCategoryRank(cat);
    if (rank === 1) {
      return {
        label: isRTL ? 'حكومة الإمارات' : 'UAE GOV',
        shortLabel: 'UAE GOV',
        badgeClass: 'bg-amber-100/90 text-amber-950 border-amber-300 font-black shadow-2xs'
      };
    }
    if (rank === 2) {
      return {
        label: isRTL ? 'وزارة الموارد البشرية (MOHRE)' : 'MOHRE',
        shortLabel: 'MOHRE',
        badgeClass: 'bg-[#162e4a] text-white border-[#162e4a] font-black shadow-2xs'
      };
    }
    return {
      label: isRTL ? 'جهة أخرى (OTHER)' : 'OTHER',
      shortLabel: 'OTHER',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-300 font-bold shadow-2xs'
    };
  };

  /**
   * Helper for Meeting Type Bubble:
   * "u know where it says meeting i jjust want another tiny buble next to it showing what is the meeting type so more of type not catogory"
   */
  const getMeetingTypeBubble = (item: any) => {
    if (item.meetingType && item.meetingType.trim()) {
      return item.meetingType.trim();
    }
    const combined = `${item.type || ''} ${item.title || ''}`.toLowerCase();
    if (combined.includes('jcm') || combined.includes('joint committee') || combined.includes('مشتركة')) {
      return isRTL ? 'اللجنة المشتركة (JCM)' : 'Joint Committee (JCM)';
    }
    if (combined.includes('tcm') || combined.includes('technical') || combined.includes('ministerial') || combined.includes('فنية') || combined.includes('وزارية')) {
      return isRTL ? 'اللجنة الوزارية / الفنية (TCM)' : 'Ministerial / Technical (TCM)';
    }
    if (combined.includes('consultation') || combined.includes('تشاور')) {
      return isRTL ? 'اجتماع تشاوري' : 'Consultation Session';
    }
    if (combined.includes('bilateral') || combined.includes('ثنائي')) {
      return isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting';
    }
    if (combined.includes('summit') || combined.includes('قمة')) {
      return isRTL ? 'قمة وزارية' : 'Ministerial Summit';
    }
    const isMeeting = (item.type || '').toLowerCase().includes('meet') || 
                      (item.type || '').includes('اجتماع') || 
                      (item.type || '').includes('لقاء');
    if (isMeeting) {
      return isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting';
    }
    return null;
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <style>
        {`
          .report-root { font-family: "Sakkal Majalla", serif !important; }
          .report-root * { font-family: "Sakkal Majalla", serif !important; }
        `}
      </style>

      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl border border-white/20 ${isRTL ? 'left-6' : 'right-6'}`}>
         <button 
           onClick={() => navigate(`/wizard/${report.id}`)} 
           className="bg-white text-primary hover:bg-gray-50 border border-primary/20 px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm font-bold active:scale-95"
           title={isRTL ? 'تعديل التقرير في صفحة المعالج' : 'Edit Report in Wizard'}
         >
            <Edit3 size={17} /> {isRTL ? 'تعديل التقرير' : 'Edit Report'}
         </button>
         <button onClick={() => window.print()} className="bg-primary text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold active:scale-95">
            <Printer size={18} /> {t('printNow')}
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-500 hover:text-red-500 p-2.5 rounded-xl transition-all border border-gray-100 hover:bg-red-50">
            <X size={20} />
         </button>
      </div>

      <div id="report-content" className="overflow-visible report-root">
        {/* PAGE 1: COVER */}
        <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
          <div className="absolute inset-0 opacity-[0.03] z-0 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 1000 500" className="w-[150%] h-auto text-primary fill-current">
                <path d="M50,250 Q250,50 500,250 T950,250" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M0,0 L1000,500 M1000,0 L0,500" stroke="currentColor" strokeWidth="0.5" />
              </svg>
          </div>
          <div className="flex-1 flex flex-col justify-center px-20 relative z-10">
              <div className={`mb-12 border-accent py-6 ${isRTL ? 'border-r-[8px] pr-12' : 'border-l-[8px] pl-12'}`}>
                <div className="flex items-center gap-4 mb-8 opacity-60">
                  <img src="https://flagcdn.com/w40/ae.png" className="h-6 w-auto" alt="UAE" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">UAE • MOHRE</span>
                </div>
                <h1 className="text-[64px] font-serif font-extrabold text-gray-900 leading-[1.1] mb-4">{t('loginTitle')}</h1>
                <p className="text-2xl text-gray-500 font-light uppercase tracking-wider">{t('strategicOverview')}</p>
              </div>
              <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 max-w-xl">
                <div className="flex items-center gap-8 mb-8">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white"><img src={data.flagUrl || `https://flagcdn.com/w320/${(data.country || '').toLowerCase().includes('philippines')?'ph':'in'}.png`} className="w-full h-full object-cover" alt="flag" /></div>
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-1">{t('subjectMarket')}</p>
                      <h2 className="text-4xl font-serif font-bold text-gray-900">{data.country}</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('reference')}</p><p className="font-mono text-base text-gray-800">{report.id}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('date')}</p><p className="font-mono text-base text-gray-800">{data.reportDate}</p></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('securityClass')}</p><span className="kpi-chip chip-restrict inline-flex items-center gap-2 px-3 py-1"><ShieldAlert size={12} /> {t('officialRestricted')}</span></div>
                </div>
              </div>
          </div>
          <div className="h-3 bg-primary w-full"></div>
        </div>

        {/* PAGE 2: EXECUTIVE BRIEF (الملخص التنفيذي) */}
        <ExecutiveBriefPage 
          report={report}
          data={data}
          combinedTotalWorkers={combinedTotalWorkers}
          isRTL={isRTL}
          t={t}
          footer={<DefaultFooter />}
          onEditAttentionNotes={() => navigate(`/wizard/${report.id}`)}
        />

        {/* PAGE 3: PROFILE & ECONOMY */}
        {data.sectionVisibility?.profileEconomy !== false && (
          <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={t('keyDemographics')} compact />
          <div className="grid grid-cols-4 gap-3 mb-4">
            <KPI icon={Landmark} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} />
            <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
            <KPI icon={Shield} label={t('crimeRate')} value={data.crimeRate || 'N/A'} sub={getSource('demo')} />
            <KPI icon={BookOpen} label={t('literacyRate')} value={data.literacyRate || 'N/A'} sub={getSource('demo')} />
            <KPI icon={Building2} label={t('governmentType')} value={data.governmentType || 'N/A'} />
            <KPI icon={Briefcase} label={t('workforceMinistry')} value={data.workforceMinistry || 'N/A'} />
            <KPI icon={MessageSquare} label={t('officialLanguage')} value={data.officialLanguage || 'N/A'} />
            <KPI icon={Plane} label={t('directFlight')} value={data.directFlight ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')} />
            <KPI icon={Users} label={t('totalWorkersInUae')} value={data.totalWorkersInUae || 'N/A'} />
            <KPI icon={Percent} label={t('unemploymentRate')} value={data.unemploymentRate || 'N/A'} sub={getSource('demo')} />
          </div>
          <SectionHeader icon={TrendingUp} title={t('economicLandscape')} subtitle={t('tradeEducation')} compact />
          <div className="grid grid-cols-4 gap-3 mb-4">
            <KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats?.tipRank || '—'} tone="warn" sub={getSource('tip')} />
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats?.inflation || '—'} sub={getSource('economy')} />
            <KPI icon={Banknote} label={t('gdp')} value={data.gdp} sub={getSource('economy')} />
            <KPI icon={ArrowRightLeft} label={isRTL ? "الحوالات السنوية من الإمارات" : "Annual Remittances from UAE"} value={data.economicStats?.remittancesFromUAE || 'N/A'} sub={getSource('cbuae')} />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2 flex items-center gap-2"><ArrowRightLeft size={14} /> {t('bilateralTrade')} <span className="ms-2">{getSource('trade')}</span></h4>
            <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col"><div className="flex items-center gap-2 mb-1 text-primary"><ArrowUpRight size={16} /><p className="text-[10px] font-bold uppercase">{isRTL ? `الصادرات من الإمارات إلى (${data.country})` : `Imports to ${data.country} from the UAE`}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1">{data.economicStats?.totalImportsFromUAE || '—'}</p><p className="text-[12px] text-gray-700 leading-snug font-medium">{Array.isArray(data.economicStats?.topImportProducts) ? data.economicStats.topImportProducts.join(', ') : (data.economicStats?.topImportProducts || '')}</p></div>
                <div className="flex flex-col border-s border-gray-200 ps-8"><div className="flex items-center gap-2 mb-1 text-accent"><ArrowDownLeft size={16} /><p className="text-[10px] font-bold uppercase">{isRTL ? `الواردات  إلى  الإمارات من (${data.country})` : `Exports from ${data.country} to the UAE`}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1">{data.economicStats?.totalExportsToUAE || '—'}</p><p className="text-[12px] text-gray-700 leading-snug font-medium">{Array.isArray(data.economicStats?.topExportProducts) ? data.economicStats.topExportProducts.join(', ') : (data.economicStats?.topExportProducts || '')}</p></div>
            </div>
          </div>
          <SectionHeader icon={GraduationCap} title={t('educationInsights')} compact />
          <div className="grid grid-cols-3 gap-3">
            <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats?.higherEducationEnrollment || '—'} sub={getSource('edu')} />
            <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats?.primaryEnrollment || '—'} sub={getSource('edu')} />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-center shadow-sm">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{t('topUniversities')} <span className="ms-2">{getSource('edu')}</span></p>
              <ul className="text-[11px] text-gray-700 leading-snug space-y-1">
                {(data.educationStats?.topUniversities || []).slice(0, 5).map((u, i) => (
                  <li key={i} className="flex gap-1.5 items-start">
                    <span className="shrink-0 font-bold text-primary opacity-60">•</span>
                    <span className="break-words leading-tight flex-1 font-medium">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>
        )}

        {/* PAGE 4: UAE WORKFORCE */}
        {data.sectionVisibility?.uaeWorkforce !== false && (
          <PageContainer footer={<DefaultFooter />} contentClassName="px-8 pt-4 pb-12" className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={Building} title={`${t('sectionUaeWorkforce')} (${data.reportMonthYear || defaultDateStr})`} subtitle={t('domesticAnalysis')} compact />
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg py-1 px-3 flex items-center justify-between shadow-2xs mb-1.5">
            <p className="text-[9px] font-black text-primary-dark uppercase tracking-wider font-sans leading-none">
              {t('totalWorkforceInUaeLaborMarket')}
            </p>
            <p className="text-[15.5px] font-serif font-black text-primary-dark leading-none">
              {combinedTotalWorkers.toLocaleString()}
            </p>
          </div>

          {/* ROW 1: WORKFORCE BREAKDOWN & CORE PROTECTION */}
          <div className="grid grid-cols-4 gap-2 mb-1.5 items-stretch">
            {/* CARD 1: MOHRE PRIVATE */}
            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2 flex flex-col justify-between shadow-2xs min-h-[46px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('mohrePrivate')}
              </span>
              <span className="text-[12.5px] font-black block text-gray-900 font-mono leading-none mt-0.5 pt-0.5 border-t border-gray-100">
                {data.uaeWorkforceStats?.mohre?.totalPrivate?.value || (isRTL ? 'لا يوجد' : 'N/A')}
              </span>
            </div>

            {/* CARD 2: MOHRE DOMESTIC */}
            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2 flex flex-col justify-between shadow-2xs min-h-[46px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('mohreDomestic')}
              </span>
              <span className="text-[12.5px] font-black block text-gray-900 font-mono leading-none mt-0.5 pt-0.5 border-t border-gray-100">
                {data.uaeWorkforceStats?.mohre?.totalDomestic?.value || (isRTL ? 'لا يوجد' : 'N/A')}
              </span>
            </div>

            {/* CARD 3: WPS WAGE TRANSFER */}
            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2 flex flex-col justify-between shadow-2xs min-h-[46px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('wpsWageTransferRate')}
              </span>
              <div className="flex items-baseline justify-between mt-0.5 pt-0.5 border-t border-gray-100 gap-1">
                <span className="text-[12.5px] font-black text-gray-900 font-mono leading-none">
                  {data.uaeWorkforceStats?.mohre?.wpsWageTransferNum || (isRTL ? 'لا يوجد' : 'N/A')}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 font-sans leading-none">
                  {formatPctValue(data.uaeWorkforceStats?.mohre?.wpsWageTransferPct)}
                </span>
              </div>
            </div>

            {/* CARD 4: UNEMPLOYMENT INSURANCE (COVERED) */}
            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2 flex flex-col justify-between shadow-2xs min-h-[46px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('unemploymentInsuranceCoverageRate')}
              </span>
              <div className="flex items-baseline justify-between mt-0.5 pt-0.5 border-t border-gray-100 gap-1">
                <span className="text-[12.5px] font-black text-gray-900 font-mono leading-none">
                  {data.uaeWorkforceStats?.mohre?.insuranceUnemploymentCoveredNum || (isRTL ? 'لا يوجد' : 'N/A')}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 font-sans leading-none">
                  {formatPctValue(data.uaeWorkforceStats?.mohre?.insuranceUnemploymentCoveredPct)}
                </span>
              </div>
            </div>
          </div>

          {/* ROW 2: INSURANCE EXPOSURES & WORKER RIGHTS */}
          <div className="grid grid-cols-3 gap-2 mb-1.5 items-stretch">
            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 flex flex-col justify-between shadow-2xs min-h-[42px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('insuranceUnemploymentExposed')}
              </span>
              <div className="flex items-baseline justify-between mt-0.5 pt-0.5 border-t border-gray-100 gap-1">
                <span className="text-[12.5px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats?.mohre?.insuranceUnemploymentExposedNum || (isRTL ? 'لا يوجد' : 'N/A')}</span>
                <span className="text-[10px] font-extrabold text-amber-600 font-sans leading-none">{formatPctValue(data.uaeWorkforceStats?.mohre?.insuranceUnemploymentExposedPct)}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 flex flex-col justify-between shadow-2xs min-h-[42px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('insuranceRightsCovered')}
              </span>
              <div className="flex items-baseline justify-between mt-0.5 pt-0.5 border-t border-gray-100 gap-1">
                <span className="text-[12.5px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats?.mohre?.insuranceRightsCoveredNum || (isRTL ? 'لا يوجد' : 'N/A')}</span>
                <span className="text-[10px] font-extrabold text-emerald-600 font-sans leading-none">{formatPctValue(data.uaeWorkforceStats?.mohre?.insuranceRightsCoveredPct)}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 flex flex-col justify-between shadow-2xs min-h-[42px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('insuranceRightsExposed')}
              </span>
              <div className="flex items-baseline justify-between mt-0.5 pt-0.5 border-t border-gray-100 gap-1">
                <span className="text-[12.5px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats?.mohre?.insuranceRightsExposedNum || (isRTL ? 'لا يوجد' : 'N/A')}</span>
                <span className="text-[10px] font-extrabold text-amber-600 font-sans leading-none">{formatPctValue(data.uaeWorkforceStats?.mohre?.insuranceRightsExposedPct)}</span>
              </div>
            </div>
          </div>

          {/* ROW 3: LABOR COMPLAINTS & STRIKES */}
          <div className="grid grid-cols-3 gap-2 mb-1.5 items-stretch">
            {/* TOTAL COMPLAINTS CURRENT YEAR */}
            <div className="bg-white border border-primary/30 rounded-lg py-1.5 px-2.5 flex flex-col justify-between shadow-2xs min-h-[40px]">
              <span className="text-[8px] font-extrabold text-primary uppercase leading-[1.2] block break-words">
                {t('totalComplaintsCurrentYear')}
              </span>
              <span className="text-[13px] font-black block text-primary font-mono leading-none mt-0.5 pt-0.5 border-t border-primary/10">
                {data.uaeWorkforceStats?.mohre?.totalComplaintsCurrentYear || '0'}
              </span>
            </div>

            {/* LABOR COMPLAINTS UNDER REVIEW */}
            <div className="bg-white border border-amber-200 rounded-lg py-1.5 px-2.5 flex flex-col justify-between shadow-2xs min-h-[40px]">
              <span className="text-[8px] font-extrabold text-amber-700 uppercase leading-[1.2] block break-words">
                {t('laborComplaintsUnderReview')}
              </span>
              <span className="text-[13px] font-black block text-amber-600 font-mono leading-none mt-0.5 pt-0.5 border-t border-amber-100">
                {data.uaeWorkforceStats?.mohre?.laborComplaintsUnderReview || '0'}
              </span>
            </div>

            {/* STRIKES */}
            <div className="bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 flex flex-col justify-between shadow-2xs min-h-[40px]">
              <span className="text-[8px] font-extrabold text-gray-600 uppercase leading-[1.2] block break-words">
                {t('workersLaborStrikes')}
              </span>
              <span className="text-[13px] font-black block text-gray-900 font-mono leading-none mt-0.5 pt-0.5 border-t border-gray-100">
                {data.uaeWorkforceStats?.mohre?.workersLaborStrikes || '0'}
              </span>
            </div>
          </div>

          {/* 3-YEAR WORKFORCE COMPARISON & TREND (ON TOP OF BLUE TABLE) */}
          {(() => {
            const history = data.uaeWorkforceStats?.workersHistory || {};
            const currentYearLabel = history.yearCurrent || (typeof data.reportDate === 'string' && data.reportDate.includes('-') ? data.reportDate.split('-')[0] : '2024');
            const prevYearLabel = history.yearPrevious || (parseInt(currentYearLabel) ? (parseInt(currentYearLabel) - 1).toString() : '2023');
            const twoYearsAgoLabel = history.yearTwoYearsAgo || (parseInt(currentYearLabel) ? (parseInt(currentYearLabel) - 2).toString() : '2022');

            const currentYearVal = (history.totalCurrent !== undefined && history.totalCurrent !== null && history.totalCurrent > 0)
              ? history.totalCurrent
              : combinedTotalWorkers;

            const prevYearVal = history.totalPrevious || 0;
            const twoYearsAgoVal = history.totalTwoYearsAgo || 0;

            let pctChange: number | null = null;
            let diffVal: number | null = null;
            let isIncrease: boolean | null = null;

            const baseVal = Number(prevYearVal) > 0 ? Number(prevYearVal) : Number(twoYearsAgoVal);
            if (baseVal > 0) {
              diffVal = Number(currentYearVal) - baseVal;
              pctChange = (diffVal / baseVal) * 100;
              isIncrease = diffVal >= 0;
            }

            return (
              <div className="border border-sky-200 bg-sky-50/50 rounded-lg p-1 mb-1 shadow-2xs">
                <div className="flex items-center justify-between mb-0.5 pb-0.5 border-b border-sky-100">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={11} className="text-primary shrink-0" />
                    <span className="text-[8.5px] font-black text-primary-dark uppercase tracking-wider font-sans leading-none">
                      {t('workersThreeYearTrend')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-white border border-sky-100 rounded-lg py-0.5 px-1 shadow-2xs">
                    <span className="text-[7.5px] font-bold text-gray-500 block mb-0.5 font-sans">
                      {isRTL ? `عام ${twoYearsAgoLabel}` : `Year ${twoYearsAgoLabel}`}
                    </span>
                    <span className="text-[11.5px] font-black text-gray-800 font-mono leading-none block">
                      {twoYearsAgoVal > 0 ? twoYearsAgoVal.toLocaleString() : '---'}
                    </span>
                  </div>

                  <div className="bg-white border border-sky-100 rounded-lg py-0.5 px-1 shadow-2xs">
                    <span className="text-[7.5px] font-bold text-gray-500 block mb-0.5 font-sans">
                      {isRTL ? `عام ${prevYearLabel}` : `Year ${prevYearLabel}`}
                    </span>
                    <span className="text-[11.5px] font-black text-gray-800 font-mono leading-none block">
                      {prevYearVal > 0 ? prevYearVal.toLocaleString() : '---'}
                    </span>
                  </div>

                  <div className="bg-white border border-primary/40 rounded-lg py-0.5 px-1 shadow-2xs ring-1 ring-primary/20">
                    <span className="text-[7.5px] font-black text-primary block mb-0.5 font-sans">
                      {isRTL ? `عام ${currentYearLabel} (الحالي)` : `Year ${currentYearLabel} (Current)`}
                    </span>
                    <span className="text-[11.5px] font-black text-primary-dark font-mono leading-none block">
                      {Number(currentYearVal).toLocaleString()}
                    </span>
                  </div>

                  <div className={`border rounded-lg py-0.5 px-1 shadow-2xs flex flex-col justify-center ${
                    pctChange !== null 
                      ? (isIncrease 
                          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200' 
                          : 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-200')
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className={`text-[7px] font-black block mb-0.5 font-sans leading-tight ${
                      pctChange !== null 
                        ? (isIncrease ? 'text-emerald-800' : 'text-rose-800') 
                        : 'text-gray-500'
                    }`}>
                      {pctChange !== null 
                        ? (isRTL 
                            ? (isIncrease ? 'معدل ومقدار النمو' : 'معدل ومقدار التراجع') 
                            : (isIncrease ? 'Growth Rate' : 'Decline Rate'))
                        : (isRTL ? 'معدل التغير' : 'Change Rate')}
                    </span>
                    {pctChange !== null && diffVal !== null ? (
                      <div className="flex items-baseline justify-center gap-1 leading-none">
                        <span className={`text-[10.5px] font-black font-mono ${isIncrease ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncrease ? '▲' : '▼'} {isIncrease ? `+${pctChange.toFixed(1)}%` : `${pctChange.toFixed(1)}%`}
                        </span>
                        <span className={`text-[7.5px] font-extrabold font-mono ${isIncrease ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ({diffVal >= 0 ? `+${diffVal.toLocaleString()}` : diffVal.toLocaleString()})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10.5px] font-black text-gray-400 font-mono leading-none block">
                        ---
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Skilled / Unskilled Median Wage Table */}
          {((data.uaeWorkforceStats?.mohre?.skilledPartnerWage || 
             data.uaeWorkforceStats?.mohre?.skilledUaeWage || 
             data.uaeWorkforceStats?.mohre?.unskilledPartnerWage || 
             data.uaeWorkforceStats?.mohre?.unskilledUaeWage)) && (
            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-2xs mb-1">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#00a4e4] text-white text-[8.5px] font-extrabold">
                    <th className="py-0.5 px-2 border border-white/20 font-sans tracking-wider w-1/3">
                      {isRTL ? 'المستوى المهاري' : 'Skill Level'}
                    </th>
                    <th className="py-0.5 px-2 border border-white/20 font-sans tracking-wider w-1/3">
                      {isRTL ? `وسيط الراتب للعمال من ${translateCountryName(data.country)} في الإمارات` : `Median Wage for ${data.country} Workers in the UAE`}
                    </th>
                    <th className="py-0.5 px-2 border border-white/20 font-sans tracking-wider w-1/3">
                      {isRTL ? 'وسيط الراتب لسوق العمل' : 'Labor Market Median Wage'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#0c567c] text-white text-[9.5px] font-bold">
                    <td className="py-0.5 px-2 border border-white/10 font-sans">
                      {isRTL ? 'ماهر' : 'Skilled'}
                    </td>
                    <td className="py-0.5 px-2 border border-white/10 font-mono">
                      {formatWageValueWithAED(data.uaeWorkforceStats?.mohre?.skilledPartnerWage)}
                    </td>
                    <td className="py-0.5 px-2 border border-white/10 font-mono">
                      {formatWageValueWithAED(data.uaeWorkforceStats?.mohre?.skilledUaeWage)}
                    </td>
                  </tr>
                  <tr className="bg-[#2d3e50] text-white text-[9.5px] font-bold">
                    <td className="py-0.5 px-2 border border-white/10 font-sans">
                      {isRTL ? 'غير ماهر' : 'Unskilled'}
                    </td>
                    <td className="py-0.5 px-2 border border-white/10 font-mono">
                      {formatWageValueWithAED(data.uaeWorkforceStats?.mohre?.unskilledPartnerWage)}
                    </td>
                    <td className="py-0.5 px-2 border border-white/10 font-mono">
                      {formatWageValueWithAED(data.uaeWorkforceStats?.mohre?.unskilledUaeWage)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {/* WORKFORCE DISTRIBUTION & WAGE RANGES (MOHRE × ICP) - Architectural Grid Theme */}
          <WorkforceWageAnalytics
            data={data}
            isRTL={isRTL}
            t={t}
            formatCompactNumber={formatCompactNumber}
            translateEmirate={translateEmirate}
            translateCountryName={translateCountryName}
            combinedTotalWorkers={combinedTotalWorkers}
          />
        </PageContainer>
        )}

        {/* PAGE 5: PARTNER WORKFORCE */}
        {data.sectionVisibility?.partnerWorkforce !== false && (
          <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={Users} title={`${t('workforceOf')} ${data.country}`} subtitle={t('sourceMarketAnalysis')} compact />
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats?.totalWorkforce || '—'} sub={getSource('demo')} />
              <div className="col-span-2 kpi-card flex flex-col items-center justify-center p-3 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-b border-gray-100 pb-1.5 w-full justify-center">
                    <span>{t('genderDistribution')}</span>
                  </p>
                  <div className="flex items-center justify-around w-full">
                      <div className="text-center flex-1">
                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">{t('maleParticipation')}</p>
                        <p className="text-2xl font-serif font-bold text-blue-600 leading-none">{data.workforceStats?.participationMale || '0'}%</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200"></div>
                      <div className="text-center flex-1">
                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">{t('femaleParticipation')}</p>
                        <p className="text-2xl font-serif font-bold text-pink-600 leading-none">{data.workforceStats?.participationFemale || '0'}%</p>
                      </div>
                  </div>
              </div>
              <KPI icon={Banknote} label={t('avgWage')} value={normalizeWageDisplay(data.averageWage)} tone="ok" sub={getSource('demo')} />
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="kpi-card p-4 shadow-sm">
                  <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2"><Plane size={16} /> {t('migrationDestinations')}</p>
                  <div className="space-y-3.5">
                    {processedMigrationDests.map((dest, i) => {
                      const barWidth = Math.max(5, Math.min(100, (dest.numericVal / maxMigrationDest) * 100));
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-gray-700">
                            <span>{dest.country}</span>
                            <span className="font-mono text-gray-600 font-bold">{dest.count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300" 
                              style={{ width: `${barWidth}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>
              <div className="kpi-card p-4 shadow-sm">
                  <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} /> {t('workersBySector')}</p>
                  <div className="space-y-3.5">
                    {sortedPartnerSectors.slice(0, 5).map((sec, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-700">
                          <span>{sec.name}</span>
                          <span className="font-mono text-gray-600 font-bold">{sec.value}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300" 
                            style={{ width: `${(sec.value / maxPartnerSector) * 100}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 shadow-sm">
              <h4 className="text-sm font-bold text-primary-dark uppercase mb-4 flex items-center gap-2"><Hammer size={18} /> {t('availableSkills')}</h4>
              <div className="flex flex-wrap gap-3">
                  {(data.workforceStats?.availableSkills || []).slice(0, 12).map((skill, i) => (<span key={i} className="bg-white border border-primary/20 text-primary-dark px-4 py-2 rounded-xl text-sm font-bold shadow-sm">{skill}</span>))}
              </div>
              <p className="text-[9px] text-gray-400 mt-4 italic">{t('skillsDisclaimer')}</p>
            </div>
          </PageContainer>
        )}

        {/* REMAINING PAGES: INTERACTIONS, POINTS, AGREEMENTS, DELEGATIONS */}
        {data.sectionVisibility?.interactions !== false && interactionChunks.map((chunk, cIdx) => (
          <PageContainer key={`int-${cIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader 
              icon={Handshake} 
              title={`${t('relationshipSummary')}${interactionChunks.length > 1 ? ` (${cIdx + 1})` : ''}`} 
              compact 
            />
            <div className="flex flex-col gap-2 mt-2">
              {chunk.map((item, idx) => (
                <div key={idx} className="border border-gray-200/80 rounded-xl p-3 bg-white shadow-2xs flex flex-col avoid-break">
                    <div className="flex justify-between items-center mb-1.5 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Category Badge: UAE GOV, MOHRE, OTHER */}
                        {(() => {
                          const catInfo = getCategoryDisplay(item.category);
                          return (
                            <span className={`text-[8.5px] uppercase px-2 py-0.5 rounded border tracking-wider ${catInfo.badgeClass}`}>
                              {catInfo.label}
                            </span>
                          );
                        })()}

                        {/* 2. Type Badge: e.g. Meeting / اجتماع */}
                        <span className="text-[8px] font-bold uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                          {item.type || (isRTL ? 'اجتماع' : 'Meeting')}
                        </span>

                        {/* 3. Tiny bubble next to it showing what is the meeting type! */}
                        {(() => {
                          const meetingBubble = getMeetingTypeBubble(item);
                          if (!meetingBubble) return null;
                          return (
                            <span className="text-[7.5px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs inline-flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span>
                              {meetingBubble}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 font-bold shrink-0">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-[12.5px] font-bold text-gray-900 mb-0.5 leading-tight">{item.title}</p>
                    {renderRichText(item.details)}
                </div>
              ))}
            </div>
          </PageContainer>
        ))}

        {/* DISCUSSION POINTS */}
        {data.sectionVisibility?.discussionPoints !== false && pointsChunks.map((chunk, cIdx) => {
          // Dynamic title with page numbers (e.g., "محاور النقاش", "محاور النقاش 2")
          const pageTitle = cIdx === 0 
            ? t('pointsDiscussion') 
            : `${t('pointsDiscussion')} ${cIdx + 1}`;

          return (
            <PageContainer key={`pts-${cIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
              <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
              <SectionHeader icon={MessageSquare} title={pageTitle} compact />
              <div className="flex flex-col gap-2 mt-2">
                {chunk.map((point, idx) => (
                  <div key={idx} className="flex gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm avoid-break">
                      <span className="text-accent font-bold text-lg leading-none">•</span>
                      <div className="flex-1">
                        <strong className="block text-[12.5px] text-gray-900 mb-0.5 uppercase tracking-wide leading-tight">{point.title}</strong>
                        {renderRichText(point.content)}
                      </div>
                  </div>
                ))}
              </div>
            </PageContainer>
          );
        })}

        {/* PREVIOUS UPDATES */}
        {data.sectionVisibility?.previousUpdates !== false && updatesChunks.map((chunk, cIdx) => {
          const pageTitle = cIdx === 0 
            ? t('previousAgreementsAndUpdates') 
            : `${t('previousAgreementsAndUpdates')} ${cIdx + 1}`;

          return (
            <PageContainer key={`upd-${cIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
              <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
              <SectionHeader icon={CheckCircle} title={pageTitle} compact />
              <div className="flex flex-col gap-2 mt-2">
                {chunk.map((point, idx) => (
                  <div key={idx} className="flex gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm avoid-break">
                      <span className="text-primary font-bold text-lg leading-none">•</span>
                      <div className="flex-1">
                        <strong className="block text-[12.5px] text-gray-900 mb-0.5 uppercase tracking-wide leading-tight">{point.title}</strong>
                        {renderRichText(point.content)}
                      </div>
                  </div>
                ))}
              </div>
            </PageContainer>
          );
        })}

        {/* BILATERAL AGREEMENTS */}
        {data.sectionVisibility?.agreements !== false && (agreementChunks.length > 0 ? agreementChunks.map((chunk, pIdx) => (
          <PageContainer key={`agr-${pIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={FileText} title={`${t('keyAgreements')}${agreementChunks.length > 1 ? ` (${pIdx + 1})` : ''}`} compact />
            <div className="space-y-3 mt-4">
              {chunk.map((agreement, idx) => {
                const statusInfo = getAgreementStatusDisplay(agreement);
                return (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 grid grid-cols-12 gap-3 items-start shadow-sm avoid-break">
                      <div className="col-span-3"><p className="text-[12.5px] font-bold text-gray-900 leading-tight">{agreement.title}</p><p className="text-[8px] font-mono font-bold text-gray-500 mt-1">{formatDate(agreement.date)}</p></div>
                      <div className="col-span-7">{renderRichText(agreement.summary)}</div>
                      <div className="col-span-2 text-end"><span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusInfo.class}`}>{statusInfo.label}</span></div>
                  </div>
                );
              })}
            </div>
          </PageContainer>
        )) : (
          <PageContainer footer={<DefaultFooter />}>
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={FileText} title={t('sectionAgreements')} compact />
            <div className="text-center py-40 text-gray-300 border-2 border-dashed rounded-3xl opacity-50"><p className="font-bold uppercase tracking-widest">{t('noAgreements')}</p></div>
          </PageContainer>
        ))}

        {/* DELEGATIONS SECTION */}
        {data.sectionVisibility?.delegation !== false && (() => {
          const uaeList = data.delegations?.uae || [];
          const partnerList = data.delegations?.partner || [];
          
          // Helper to render meeting badge for a delegate
          const renderMeetingBadge = (d: any) => {
            const hasMet = !!d.metBefore || !!(d.meetingYear || d.meetingLocation);
            if (hasMet) {
              const details = [
                d.meetingYear ? (isRTL ? `عام ${d.meetingYear}` : `Year ${d.meetingYear}`) : null,
                d.meetingLocation ? (isRTL ? `المكان: ${d.meetingLocation}` : `Location: ${d.meetingLocation}`) : null
              ].filter(Boolean).join(' • ');

              return (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 mb-2.5 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                  <span className="font-extrabold text-emerald-800">
                    {isRTL ? 'تم اللقاء به مسبقاً:' : 'Previously Met:'}
                  </span>
                  <span className="text-emerald-950 font-semibold">
                    {details || (isRTL ? 'نعم' : 'Yes')}
                  </span>
                </div>
              );
            }
            return (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-600 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></span>
                <span>{isRTL ? 'لم يتم اللقاء به مسبقاً (أول لقاء رسمي)' : 'First Official Meeting'}</span>
              </div>
            );
          };

          // Primary delegation page
          const pages: Array<{
            uae: typeof uaeList;
            partner: typeof partnerList;
            isFirstPage: boolean;
          }> = [];

          pages.push({
            uae: uaeList.slice(0, 1),
            partner: partnerList.slice(0, 1),
            isFirstPage: true
          });

          // Subsequent pages for additional delegates
          const remainingUae = uaeList.slice(1);
          const remainingPartner = partnerList.slice(1);

          let uIdx = 0;
          let pIdx = 0;
          while (uIdx < remainingUae.length || pIdx < remainingPartner.length) {
            const pageUae: typeof uaeList = [];
            const pagePartner: typeof partnerList = [];
            let count = 0;

            while (count < 2 && (uIdx < remainingUae.length || pIdx < remainingPartner.length)) {
              if (uIdx < remainingUae.length) {
                pageUae.push(remainingUae[uIdx++]);
                count++;
              }
              if (count < 2 && pIdx < remainingPartner.length) {
                pagePartner.push(remainingPartner[pIdx++]);
                count++;
              }
            }

            pages.push({
              uae: pageUae,
              partner: pagePartner,
              isFirstPage: false
            });
          }

          return pages.map((pageData, pIndex) => (
            <PageContainer key={`delegation-page-${pIndex}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
              <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
              <SectionHeader 
                icon={Users} 
                title={pageData.isFirstPage ? t('sectionDelegation') : `${t('sectionDelegation')} (${isRTL ? 'تابع' : 'Continued'})`} 
                compact 
              />
              <div className="grid grid-cols-1 gap-6 mt-4">
                {pageData.uae.length > 0 && (
                  <div className="avoid-break">
                    <div className="flex items-center gap-4 mb-3 border-b-2 border-primary pb-2">
                      <img src="https://flagcdn.com/w40/ae.png" className="h-5 w-auto" alt="UAE" />
                      <p className="text-xs font-extrabold uppercase text-primary tracking-[0.2em]">{t('uaeDelegation')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {pageData.uae.map((d) => (
                        <div key={d.id} className="flex gap-6 items-start p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100 shadow-sm">
                          <div className="w-32 h-44 rounded-xl bg-gray-200 shrink-0 overflow-hidden border-4 border-white shadow-md">
                            {d.imageUrl ? <img src={d.imageUrl} className="w-full h-full object-cover" alt="portrait" /> : null}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-xl font-serif font-bold text-gray-900 mb-0.5">{d.name}</p>
                            <p className="text-xs font-bold text-primary uppercase mb-2 tracking-[0.15em] border-b border-primary/10 pb-1 inline-block">{d.title}</p>
                            {renderRichText(d.bio)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pageData.partner.length > 0 && (
                  <div className="avoid-break pt-1">
                    <div className="flex items-center gap-4 mb-3 border-b-2 border-accent pb-2">
                      <img src={data.flagUrl || `https://flagcdn.com/w40/${(data.country || '').toLowerCase().includes('india')?'in':'ph'}.png`} className="h-5 w-auto" alt={data.country} />
                      <p className="text-xs font-extrabold uppercase text-accent tracking-[0.2em]">{t('partnerDelegation')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {pageData.partner.map((d) => (
                        <div key={d.id} className="flex gap-6 items-start p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100 shadow-sm">
                          <div className="w-32 h-44 rounded-xl bg-gray-200 shrink-0 overflow-hidden border-4 border-white shadow-md">
                            {d.imageUrl ? <img src={d.imageUrl} className="w-full h-full object-cover" alt="portrait" /> : null}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-xl font-serif font-bold text-gray-900 mb-0.5">{d.name}</p>
                            <div className="mb-2">
                              <p className="text-xs font-bold text-accent uppercase tracking-[0.15em] border-b border-accent/10 pb-0.5 inline-block">{d.title}</p>
                            </div>
                            {/* WHERE & WHEN WE MET DISPLAY */}
                            {renderMeetingBadge(d)}
                            {renderRichText(d.bio)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PageContainer>
          ));
        })()}
      </div>
    </div>
  );
}
