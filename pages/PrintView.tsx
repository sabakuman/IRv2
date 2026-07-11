import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, Building2,
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  GraduationCap, Briefcase, MessageSquare, FileText, Calendar, Activity,
  ArrowDownLeft, ArrowUpRight, BookOpen, Shield, ArrowRightLeft, Hammer,
  ExternalLink, Clock, Phone, Percent, CheckCircle
} from 'lucide-react';
import { PageContainer, SectionHeader, KPI } from '../components/PrintUI';
import { useLanguage } from '../context/LanguageContext';

const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

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
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
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
        result.push(<ul key={`list-${i}`} className="list-disc mb-1 ms-6">{listItems.map((item, idx) => (<li key={idx} dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
        inList = false;
      }
      if (trimmed) { result.push(<p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: processed.includes('\n') ? line : processed }} />); }
    }
  });
  if (inList) { result.push(<ul key="list-final" className="list-disc mb-1 ms-6">{listItems.map((item, idx) => (<li key={idx} dangerouslySetInnerHTML={{ __html: item }} />))}</ul>); }
  return <div className={`rich-text-content ${sizeClass} leading-[1.5] overflow-visible`}>{result.length > 0 ? result : text}</div>;
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
  const getParamId = () => {
    const hash = window.location.hash;
    const parts = hash.split('/');
    if (parts.length >= 3 && parts[1] === 'print') return parts[2];
    return undefined;
  };
  const id = getParamId();

  const { t, language, dir, setLanguage } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

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
      MockService.getReportById(id).then(r => {
        if (r) setReport(r);
        else setError(true);
      });
    }
  }, [id]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4 no-print" dir={dir}>
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">{t('reportNotFound')}</h2>
        <p className="text-sm">{t('reportNotFoundMsg')}</p>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">{t('closeWindow')}</button>
      </div>
    );
  }

  if (!report) return (
    <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse no-print" dir={dir}>
      {t('generatingDoc')}
    </div>
  );

  const { data } = report;
  const isRTL = language === 'ar';
  
  // Dynamic Year Logic
  const reportDateObj = data.reportDate ? new Date(data.reportDate) : new Date();
  const reportYear = reportDateObj.getFullYear();
  const reportMonth = reportDateObj.getMonth();
  const prevYear = reportYear - 1;

  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const defaultDateStr = language === 'ar' 
    ? `${monthsAr[reportMonth]} ${reportYear}`
    : `${monthsEn[reportMonth]} ${reportYear}`;

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

  const normalizeWageDisplay = (wage: string) => {
    if (!wage) return 'N/A';
    return wage;
  };

  const translateEmirate = (name: string) => {
    if (!isRTL) return name;
    const map: Record<string, string> = { 'Abu Dhabi': 'أبوظبي', 'Dubai': 'دبي', 'Sharjah': 'الشارقة', 'Ajman': 'عجمان', 'Umm Al Quwain': 'أم القيوين', 'Ras Al Khaimah': 'رأس الخيمة', 'Fujairah': 'الفجيرة' };
    return map[name] || name;
  };

  const translateCountryName = (country: string) => {
    if (!isRTL || !country) return country;
    const lower = country.toLowerCase().trim();
    const map: Record<string, string> = {
      'india': 'الهند',
      'pakistan': 'باكستان',
      'bangladesh': 'بنغلاديش',
      'philippines': 'الفلبين',
      'nepal': 'نيبال',
      'sri lanka': 'سريلانكا',
      'egypt': 'مصر',
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

  const HeaderBand = ({ country, reportId, title, flagUrl }: any) => {
    const getFlagCode = (c: string) => {
      const lower = c.toLowerCase();
      if (lower.includes('india')) return 'in';
      if (lower.includes('philippines')) return 'ph';
      if (lower.includes('pakistan')) return 'pk';
      if (lower.includes('bangladesh')) return 'bd';
      return 'ae';
    };
    const flagSrc = flagUrl || `https://flagcdn.com/w320/${getFlagCode(country)}.png`;
    return (
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
        <div className="flex items-center gap-3">
          <img src={flagSrc} className="h-6 w-auto shadow-sm object-cover" alt={country} />
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500">{title}</p>
            <p className="text-sm font-bold text-primary-dark uppercase">{country}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="kpi-chip chip-restrict flex items-center gap-1"><ShieldAlert size={12} /> Restricted</span>
          <span className="text-[9px] text-gray-400 font-mono">REF: {reportId}</span>
        </div>
      </div>
    );
  };

  const sortedMohreEmirates = [...data.uaeWorkforceStats.mohre.byEmirate].sort((a, b) => b.value - a.value);
  const sortedIcpEmirates = [...data.uaeWorkforceStats.icp.byEmirate].sort((a, b) => b.value - a.value);

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
    if (sorted.length <= limit) {
      return sorted;
    }
    const topLimit = sorted.slice(0, limit);
    const remaining = sorted.slice(limit);
    const uaeSum = remaining.reduce((sum, item) => sum + (item.uaeValue || 0), 0);
    const partnerSum = remaining.reduce((sum, item) => sum + (item.partnerValue || 0), 0);
    const remainingUaeAvg = Math.round(uaeSum / remaining.length);
    const remainingPartnerAvg = Math.round(partnerSum / remaining.length);
    
    topLimit.push({
      name: isRTL ? 'أخرى' : 'Other',
      uaeValue: remainingUaeAvg,
      partnerValue: remainingPartnerAvg
    });
    return topLimit;
  };

  const mappedSalarySectors = [...salarySectors].map(s => ({
    name: translateSectorName(s.name),
    uaeValue: Number(s.uaeValue || 0),
    partnerValue: Number(s.partnerValue || 0)
  }));
  const sortedSalarySectors = processSalarySectors(mappedSalarySectors, 10);

  // Find max value in salary sectors to set manual Y-axis max about 15-20% higher
  const maxSalaryVal = Math.max(
    ...sortedSalarySectors.slice(0, 11).flatMap(s => [s.uaeValue || 0, s.partnerValue || 0]),
    1
  );
  const manualMaxSalary = Math.ceil(maxSalaryVal * 1.22);

  // Custom label renderers to match the exact requirements of horizontal labels
  const wrapSectorName = (name: string): string[] => {
    if (!name) return [];
    let display = name;
    if (display.length > 18) {
      display = display.substring(0, 15) + '...';
    }
    const words = display.split(' ');
    if (words.length <= 1) {
      return [display];
    }
    // Find the split point that makes lines as equal as possible
    let bestDiff = Infinity;
    let bestIdx = 1;
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ').length;
      const l2 = words.slice(i).join(' ').length;
      const diff = Math.abs(l1 - l2);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return [
      words.slice(0, bestIdx).join(' '),
      words.slice(bestIdx).join(' ')
    ];
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
    return value && value.length > 18 ? value.substring(0, 15) + '...' : value;
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

  const totalMohreByCity = data.uaeWorkforceStats.mohre.byEmirate.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalIcpByCity = data.uaeWorkforceStats.icp.byEmirate.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const combinedTotalWorkers = data.uaeWorkforceStats.totalWorkersOverride !== undefined && data.uaeWorkforceStats.totalWorkersOverride !== null && data.uaeWorkforceStats.totalWorkersOverride !== 0
    ? data.uaeWorkforceStats.totalWorkersOverride
    : totalMohreByCity + totalIcpByCity;

  const processSectors = (sectorsList: { name: string; value: number }[], limit = 10) => {
    const sorted = [...sectorsList].sort((a, b) => b.value - a.value);
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

  const processedMohreSectors = processSectors(data.uaeWorkforceStats.mohre.bySector, 10);
  const maxMohreVal = Math.max(...processedMohreSectors.map(s => s.value), 1);

  const processedIcpSectors = processSectors(data.uaeWorkforceStats.icp.bySector || [], 10);
  const maxIcpVal = Math.max(...processedIcpSectors.map(s => s.value), 1);

  // Pagination Logic Constants
  const INT_CHUNK_SIZE = 5;
  const POINTS_CHUNK_SIZE = 3; // Discussion points are text-heavy, limit to 3 per page
  const AGR_CHUNK_SIZE = 6;

  // --- SORT RELATIONSHIP SUMMARY (RECENT INTERACTIONS) BY DATE DESCENDING (NEWEST FIRST) ---
  const sortedInteractions = [...data.recentInteractions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const interactionChunks = [];
  for (let i = 0; i < sortedInteractions.length; i += INT_CHUNK_SIZE) {
    interactionChunks.push(sortedInteractions.slice(i, i + INT_CHUNK_SIZE));
  }

  const pointsChunks = [];
  for (let i = 0; i < data.pointsOfDiscussion.length; i += POINTS_CHUNK_SIZE) {
    pointsChunks.push(data.pointsOfDiscussion.slice(i, i + POINTS_CHUNK_SIZE));
  }

  const updatesChunks = [];
  const previousUpdates = data.previousAgreementsAndUpdates || [];
  for (let i = 0; i < previousUpdates.length; i += POINTS_CHUNK_SIZE) {
    updatesChunks.push(previousUpdates.slice(i, i + POINTS_CHUNK_SIZE));
  }

  const sortedAgreements = [...data.bilateralAgreements].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const agreementChunks = [];
  for (let i = 0; i < sortedAgreements.length; i += AGR_CHUNK_SIZE) {
    agreementChunks.push(sortedAgreements.slice(i, i + AGR_CHUNK_SIZE));
  }

  const maxMigrationDest = Math.max(...data.workforceStats.migrationDestinations.map(d => parseFloat(d.count) || 0), 1);
  const maxPartnerSector = Math.max(...data.workforceStats.topSectors.map(s => s.value), 1);

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

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <style>
        {`
          .report-root { font-family: "Sakkal Majalla", serif !important; }
          .report-root * { font-family: "Sakkal Majalla", serif !important; }
        `}
      </style>

      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl border border-white/20 ${isRTL ? 'left-6' : 'right-6'}`}>
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
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white"><img src={data.flagUrl || `https://flagcdn.com/w320/${data.country.toLowerCase().includes('philippines')?'ph':'in'}.png`} className="w-full h-full object-cover" alt="flag" /></div>
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

        {/* PAGE 2: PROFILE & ECONOMY */}
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
            <KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" sub={getSource('tip')} />
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} sub={getSource('economy')} />
            <KPI icon={Banknote} label={t('gdp')} value={data.gdp} sub={getSource('economy')} />
            <KPI icon={ArrowRightLeft} label={isRTL ? "الحوالات السنوية من الإمارات" : "Annual Remittances from UAE"} value={data.economicStats.remittancesFromUAE || 'N/A'} sub={getSource('cbuae')} />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2 flex items-center gap-2"><ArrowRightLeft size={14} /> {t('bilateralTrade')} <span className="ms-2">{getSource('trade')}</span></h4>
            <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col"><div className="flex items-center gap-2 mb-1 text-primary"><ArrowUpRight size={16} /><p className="text-[10px] font-bold uppercase">{isRTL ? `الصادرات من الإمارات إلى (${data.country})` : `Imports to ${data.country} from the UAE`}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1">{data.economicStats.totalImportsFromUAE}</p><p className="text-[12px] text-gray-700 leading-snug font-medium">{data.economicStats.topImportProducts.join(', ')}</p></div>
                <div className="flex flex-col border-s border-gray-200 ps-8"><div className="flex items-center gap-2 mb-1 text-accent"><ArrowDownLeft size={16} /><p className="text-[10px] font-bold uppercase">{isRTL ? `الواردات  إلى  الإمارات من (${data.country})` : `Exports from ${data.country} to the UAE`}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1">{data.economicStats.totalExportsToUAE}</p><p className="text-[12px] text-gray-700 leading-snug font-medium">{data.economicStats.topExportProducts.join(', ')}</p></div>
            </div>
          </div>
          <SectionHeader icon={GraduationCap} title={t('educationInsights')} compact />
          <div className="grid grid-cols-3 gap-3">
            <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} sub={getSource('edu')} />
            <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} sub={getSource('edu')} />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-center shadow-sm">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{t('topUniversities')} <span className="ms-2">{getSource('edu')}</span></p>
              <ul className="text-[11px] text-gray-700 leading-snug space-y-1">
                {(data.educationStats.topUniversities || []).slice(0, 5).map((u, i) => (
                  <li key={i} className="flex gap-1.5 items-start">
                    <span className="shrink-0 font-bold text-primary opacity-60">•</span>
                    <span className="break-words leading-tight flex-1 font-medium">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>

        {/* PAGE 3: UAE WORKFORCE */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Building} title={`${t('sectionUaeWorkforce')} (${data.reportMonthYear || defaultDateStr})`} subtitle={t('domesticAnalysis')} compact />
          
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-1.5 flex items-center justify-between px-4 shadow-sm mb-2">
            <p className="text-[9px] font-extrabold text-primary-dark uppercase tracking-wider font-sans leading-none">
              {t('totalWorkforceInUaeLaborMarket')}
            </p>
            <p className="text-lg font-serif font-black text-primary-dark leading-none">
              {combinedTotalWorkers.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2 items-stretch">
            {/* CARD 1: MOHRE PRIVATE */}
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex flex-col justify-between shadow-sm min-h-[58px]">
              <span className="text-[8.5px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-8 overflow-hidden">
                {t('mohrePrivate')}
              </span>
              <span className="text-[14px] font-black block text-gray-900 font-mono leading-none">
                {data.uaeWorkforceStats.mohre.totalPrivate.value || 'N/A'}
              </span>
            </div>

            {/* CARD 2: MOHRE DOMESTIC */}
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex flex-col justify-between shadow-sm min-h-[58px]">
              <span className="text-[8.5px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-8 overflow-hidden">
                {t('mohreDomestic')}
              </span>
              <span className="text-[14px] font-black block text-gray-900 font-mono leading-none">
                {data.uaeWorkforceStats.mohre.totalDomestic.value || 'N/A'}
              </span>
            </div>

            {/* CARD 3: UNEMPLOYMENT INSURANCE */}
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex flex-col justify-between shadow-sm min-h-[58px]">
              <span className="text-[8.5px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-8 overflow-hidden">
                {t('unemploymentInsuranceCoverageRate')}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[14px] font-black text-gray-900 font-mono leading-none">
                  {data.uaeWorkforceStats.mohre.insuranceUnemploymentCoveredNum || 'N/A'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 font-sans leading-none">
                  {formatPctValue(data.uaeWorkforceStats.mohre.insuranceUnemploymentCoveredPct)}
                </span>
              </div>
            </div>

            {/* CARD 4: WPS WAGE TRANSFER */}
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex flex-col justify-between shadow-sm min-h-[58px]">
              <span className="text-[8.5px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-8 overflow-hidden">
                {t('wpsWageTransferRate')}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[14px] font-black text-gray-900 font-mono leading-none">
                  {data.uaeWorkforceStats.mohre.wpsWageTransferNum || 'N/A'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 font-sans leading-none">
                  {formatPctValue(data.uaeWorkforceStats.mohre.wpsWageTransferPct)}
                </span>
              </div>
            </div>
          </div>

          {/* The 4 Tiny Boxes Grid */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="bg-gray-50 border border-gray-200/60 rounded-lg p-2 flex flex-col justify-between shadow-sm min-h-[52px]">
              <span className="text-[8px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-7 overflow-hidden">{t('unemploymentInsuranceCoverageRate')}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats.mohre.insuranceUnemploymentCoveredNum || 'N/A'}</span>
                <span className="text-[9px] font-extrabold text-primary font-sans leading-none">{formatPctValue(data.uaeWorkforceStats.mohre.insuranceUnemploymentCoveredPct)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200/60 rounded-lg p-2 flex flex-col justify-between shadow-sm min-h-[52px]">
              <span className="text-[8px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-7 overflow-hidden">{t('insuranceUnemploymentExposed')}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats.mohre.insuranceUnemploymentExposedNum || 'N/A'}</span>
                <span className="text-[9px] font-extrabold text-amber-600 font-sans leading-none">{formatPctValue(data.uaeWorkforceStats.mohre.insuranceUnemploymentExposedPct)}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200/60 rounded-lg p-2 flex flex-col justify-between shadow-sm min-h-[52px]">
              <span className="text-[8px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-7 overflow-hidden">{t('insuranceRightsCovered')}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats.mohre.insuranceRightsCoveredNum || 'N/A'}</span>
                <span className="text-[9px] font-extrabold text-primary font-sans leading-none">{formatPctValue(data.uaeWorkforceStats.mohre.insuranceRightsCoveredPct)}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200/60 rounded-lg p-2 flex flex-col justify-between shadow-sm min-h-[52px]">
              <span className="text-[8px] font-extrabold text-gray-500 uppercase leading-tight mb-1 block h-7 overflow-hidden">{t('insuranceRightsExposed')}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-black text-gray-900 font-mono leading-none">{data.uaeWorkforceStats.mohre.insuranceRightsExposedNum || 'N/A'}</span>
                <span className="text-[9px] font-extrabold text-amber-600 font-sans leading-none">{formatPctValue(data.uaeWorkforceStats.mohre.insuranceRightsExposedPct)}</span>
              </div>
            </div>
          </div>

          {/* Two Other KPI Boxes - Made bigger per request */}
          <div className="grid grid-cols-2 gap-3 mb-2.5">
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between px-4 shadow-sm min-h-[44px]">
              <span className="text-[9px] font-black text-gray-600 uppercase leading-tight max-w-[70%]">{t('wageMedianComparison')}</span>
              <span className="text-[14px] font-sans font-black text-gray-950 leading-none shrink-0">{data.uaeWorkforceStats.mohre.wageMedianComparison || 'N/A'}</span>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between px-4 shadow-sm min-h-[44px]">
              <span className="text-[9px] font-black text-gray-600 uppercase leading-tight max-w-[70%]">{t('workersLaborStrikes')}</span>
              <span className="text-[14px] font-sans font-black text-gray-950 leading-none shrink-0">{data.uaeWorkforceStats.mohre.workersLaborStrikes || 'N/A'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-1.5">
            <div className="p-2 border border-gray-200 rounded-2xl bg-white flex flex-col items-center shadow-sm">
                <p className="text-center text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wider">{t('workersByEmirate')}</p>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sortedMohreEmirates} margin={{top: 12, right: 5, bottom: 16, left: 5}}>
                          <XAxis dataKey="name" tick={{fontSize: 8.5, fontWeight: 'bold', fill: '#374151'}} tickMargin={4} interval={0} height={18} axisLine={false} tickLine={false} tickFormatter={(val) => translateEmirate(val)} />
                          <YAxis hide />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            <LabelList dataKey="value" position="top" formatter={formatCompactNumber} style={{ fontSize: '7.5px', fill: '#333', fontWeight: 'bold' }} />
                            {sortedMohreEmirates.map((entry, index) => (<Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
            <div className="p-2 border border-gray-200 rounded-2xl bg-white flex flex-col items-center shadow-sm">
                <p className="text-center text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wider">{isRTL ? 'توزيع العاملين حسب الإمارة (ICP)' : 'Workers distribution by Emirate (ICP)'}</p>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sortedIcpEmirates} margin={{top: 12, right: 5, bottom: 16, left: 5}}>
                           <XAxis dataKey="name" tick={{fontSize: 8.5, fontWeight: 'bold', fill: '#374151'}} tickMargin={4} interval={0} height={18} axisLine={false} tickLine={false} tickFormatter={(val) => translateEmirate(val)} />
                           <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                             <LabelList dataKey="value" position="top" formatter={formatCompactNumber} style={{ fontSize: '7px', fill: '#444', fontWeight: 'bold' }} />
                             {sortedIcpEmirates.map((entry, index) => (<Cell key={`cell-${index}`} fill={BLUE_PALETTE[(index + 3) % BLUE_PALETTE.length]} />))}
                           </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* Sector distribution comparisons - Unified Inline Rows for compact space-saving */}
          <div className="grid grid-cols-2 gap-3 mb-1.5">
            <div className="border border-gray-200 rounded-2xl p-2 flex flex-col bg-white shadow-sm overflow-hidden text-ellipsis">
                <p className="text-[9px] font-extrabold text-gray-700 mb-1.5 uppercase tracking-wider leading-none">
                  {isRTL ? 'توزيع العمال حسب القطاع في (MOHRE)' : 'Workers distribution by sector (MOHRE)'}
                </p>
                <div className="space-y-0.5 overflow-hidden">
                  {processedMohreSectors.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-[7.5px] leading-tight py-0.5 border-b border-gray-100 last:border-0">
                        <span className="font-bold text-gray-700 truncate max-w-[100px]">{s.name}</span>
                        <div className="flex-1 mx-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(s.value / maxMohreVal) * 100}%` }}></div>
                        </div>
                        <span className="font-mono text-gray-900 font-bold shrink-0">{formatCompactNumber(s.value)}</span>
                      </div>
                  ))}
                </div>
            </div>
            
            <div className="border border-gray-200 rounded-2xl p-2 flex flex-col bg-white shadow-sm overflow-hidden text-ellipsis">
                <p className="text-[9px] font-extrabold text-gray-700 mb-1.5 uppercase tracking-wider leading-none">
                  {isRTL ? 'توزيع العمال حسب القطاع في (ICP)' : 'Workers distribution by sector (ICP)'}
                </p>
                <div className="space-y-0.5 overflow-hidden">
                  {processedIcpSectors.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-[7.5px] leading-tight py-0.5 border-b border-gray-100 last:border-0">
                        <span className="font-bold text-gray-700 truncate max-w-[100px]">{s.name}</span>
                        <div className="flex-1 mx-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(s.value / maxIcpVal) * 100}%` }}></div>
                        </div>
                        <span className="font-mono text-gray-900 font-bold shrink-0">{formatCompactNumber(s.value)}</span>
                      </div>
                  ))}
                </div>
            </div>
          </div>

          {/* Average Salary per Sector Comparison Chart */}
          <div className="p-2 py-1.5 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col items-center">
            <p className="text-center text-[9px] font-bold text-gray-700 mb-1 leading-relaxed max-w-xl">
              {isRTL 
                ? 'توزيع وسيط الرواتب مقارنة بوسيط سوق العمل على حسب القطاع' 
                : `Median salary distribution for this nationality compared to the labour market median based on skill level by sector (${data.country})`}
            </p>
            <div className="w-full">
              <div className="h-[135px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedSalarySectors.slice(0, 11)} barGap={4} barCategoryGap="20%" margin={{top: 15, right: 5, bottom: 15, left: 5}}>
                    <XAxis 
                      dataKey="name" 
                      tick={renderCustomXAxisTick} 
                      tickFormatter={formatSectorTick} 
                      tickMargin={2} 
                      interval={0} 
                      height={20} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis hide domain={[0, manualMaxSalary]} />
                    <Bar dataKey="uaeValue" name={isRTL ? 'وسيط سوق العمل (AED)' : 'Labour Market Wide (AED)'} radius={[4, 4, 0, 0]} fill="#10b981" barSize={7}>
                      <LabelList dataKey="uaeValue" content={renderUaeLabel} />
                    </Bar>
                    <Bar dataKey="partnerValue" name={isRTL ? `متوسط رواتب عمالة (${translateCountryName(data.country)})` : `${data.country} Sector Average (AED)`} radius={[4, 4, 0, 0]} fill="#2563eb" barSize={7}>
                      <LabelList dataKey="partnerValue" content={renderPartnerLabel} />
                    </Bar>
                    <Legend 
                      iconSize={8} 
                      wrapperStyle={{ fontSize: '8px', paddingTop: '3px' }} 
                      formatter={(value) => <span style={{ paddingLeft: '8px', paddingRight: '8px', display: 'inline-block' }}>{value}</span>}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </PageContainer>

        {/* PAGE 4: PARTNER WORKFORCE */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Users} title={`${t('workforceOf')} ${data.country}`} subtitle={t('sourceMarketAnalysis')} />
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} sub={getSource('demo')} />
            <div className="col-span-2 kpi-card flex flex-col items-center justify-center p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-b border-gray-100 pb-1.5 w-full justify-center">
                  <span>{t('genderDistribution')}</span>
                </p>
                <div className="flex items-center justify-around w-full">
                    <div className="text-center flex-1">
                      <p className="text-xs font-bold text-gray-700 uppercase mb-1">{t('maleParticipation')}</p>
                      <p className="text-2xl font-serif font-bold text-blue-600 leading-none">{data.workforceStats.participationMale}%</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs font-bold text-gray-700 uppercase mb-1">{t('femaleParticipation')}</p>
                      <p className="text-2xl font-serif font-bold text-pink-600 leading-none">{data.workforceStats.participationFemale}%</p>
                    </div>
                </div>
            </div>
            <KPI icon={Banknote} label={t('avgWage')} value={normalizeWageDisplay(data.averageWage)} tone="ok" sub={getSource('demo')} />
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="kpi-card p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2"><Plane size={16} /> {t('migrationDestinations')}</p>
                <div className="space-y-4">
                  {data.workforceStats.migrationDestinations.slice(0, 5).map((dest, i) => {
                    const val = parseFloat(dest.count) || 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-700">
                          <span>{dest.country}</span>
                          <span className="font-mono text-gray-500">{dest.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-dark rounded-full" style={{ width: `${(val / maxMigrationDest) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
            <div className="kpi-card p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} /> {t('workersBySector')}</p>
                <div className="space-y-4">
                  {data.workforceStats.topSectors.slice(0, 5).map((sec, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-gray-700">
                        <span>{sec.name}</span>
                        <span className="font-mono text-gray-500">{sec.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-dark rounded-full" style={{ width: `${(sec.value / maxPartnerSector) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 shadow-sm">
            <h4 className="text-sm font-bold text-primary-dark uppercase mb-4 flex items-center gap-2"><Hammer size={18} /> {t('availableSkills')}</h4>
            <div className="flex flex-wrap gap-3">
                {data.workforceStats.availableSkills.slice(0, 12).map((skill, i) => (<span key={i} className="bg-white border border-primary/20 text-primary-dark px-4 py-2 rounded-xl text-sm font-bold shadow-sm">{skill}</span>))}
            </div>
            <p className="text-[9px] text-gray-400 mt-4 italic">{t('skillsDisclaimer')}</p>
          </div>
        </PageContainer>

        {/* REMAINING PAGES: INTERACTIONS, POINTS, AGREEMENTS, DELEGATIONS */}
        {interactionChunks.map((chunk, cIdx) => (
          <PageContainer key={`int-${cIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={Handshake} title={`${t('relationshipSummary')}${interactionChunks.length > 1 ? ` (${cIdx + 1})` : ''}`} />
            <div className="flex flex-col gap-2 mt-2">
              {chunk.map((item, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50 shadow-sm flex flex-col avoid-break">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[8px] font-bold uppercase text-primary bg-primary/5 px-2 py-0.5 rounded">{item.type}</span>
                      <span className="text-[8px] font-mono text-gray-400">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-[12.5px] font-bold text-gray-900 mb-0.5 leading-tight">{item.title}</p>
                    {renderRichText(item.details)}
                </div>
              ))}
            </div>
          </PageContainer>
        ))}

        {pointsChunks.map((chunk, cIdx) => {
          // Dynamic title with page numbers (e.g., "محاور النقاش", "محاور النقاش 2")
          const pageTitle = cIdx === 0 
            ? t('pointsDiscussion') 
            : `${t('pointsDiscussion')} ${cIdx + 1}`;

          return (
            <PageContainer key={`pts-${cIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
              <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
              <SectionHeader icon={MessageSquare} title={pageTitle} />
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

        {updatesChunks.map((chunk, cIdx) => {
          const pageTitle = cIdx === 0 
            ? t('previousAgreementsAndUpdates') 
            : `${t('previousAgreementsAndUpdates')} ${cIdx + 1}`;

          return (
            <PageContainer key={`upd-${cIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
              <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
              <SectionHeader icon={CheckCircle} title={pageTitle} />
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

        {agreementChunks.length > 0 ? agreementChunks.map((chunk, pIdx) => (
          <PageContainer key={`agr-${pIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={FileText} title={`${t('keyAgreements')}${agreementChunks.length > 1 ? ` (${pIdx + 1})` : ''}`} />
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
            <SectionHeader icon={FileText} title={t('sectionAgreements')} />
            <div className="text-center py-40 text-gray-300 border-2 border-dashed rounded-3xl opacity-50"><p className="font-bold uppercase tracking-widest">{t('noAgreements')}</p></div>
          </PageContainer>
        )}

        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Users} title={t('sectionDelegation')} />
          <div className="grid grid-cols-1 gap-8 mt-4">
            <div className="avoid-break">
                <div className="flex items-center gap-4 mb-4 border-b-2 border-primary pb-2"><img src="https://flagcdn.com/w40/ae.png" className="h-5 w-auto" alt="UAE" /><p className="text-xs font-extrabold uppercase text-primary tracking-[0.2em]">{t('uaeDelegation')}</p></div>
                <div className="grid grid-cols-1 gap-4">
                  {data.delegations.uae.slice(0, 1).map((d) => (
                      <div key={d.id} className="flex gap-8 items-start p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-sm">
                        <div className="w-36 h-48 rounded-xl bg-gray-200 shrink-0 overflow-hidden border-4 border-white shadow-lg">{d.imageUrl ? <img src={d.imageUrl} className="w-full h-full object-cover" alt="portrait" /> : null}</div>
                        <div className="flex-1 pt-1"><p className="text-2xl font-serif font-bold text-gray-900 mb-1">{d.name}</p><p className="text-sm font-bold text-primary uppercase mb-3 tracking-[0.15em] border-b border-primary/10 pb-1 inline-block">{d.title}</p>{renderRichText(d.bio)}</div>
                      </div>
                  ))}
                </div>
            </div>
            <div className="avoid-break pt-2">
                <div className="flex items-center gap-4 mb-4 border-b-2 border-accent pb-2"><img src={data.flagUrl || `https://flagcdn.com/w40/${data.country.toLowerCase().includes('india')?'in':'ph'}.png`} className="h-5 w-auto" alt={data.country} /><p className="text-xs font-extrabold uppercase text-accent tracking-[0.2em]">{t('partnerDelegation')}</p></div>
                <div className="grid grid-cols-1 gap-4">
                  {data.delegations.partner.slice(0, 1).map((d) => (
                      <div key={d.id} className="flex gap-8 items-start p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-sm">
                        <div className="w-36 h-48 rounded-xl bg-gray-200 shrink-0 overflow-hidden border-4 border-white shadow-lg">{d.imageUrl ? <img src={d.imageUrl} className="w-full h-full object-cover" alt="portrait" /> : null}</div>
                        <div className="flex-1 pt-1"><p className="text-2xl font-serif font-bold text-gray-900 mb-1">{d.name}</p><p className="text-sm font-bold text-accent uppercase mb-3 tracking-[0.15em] border-b border-accent/10 pb-1 inline-block">{d.title}</p>{renderRichText(d.bio)}</div>
                      </div>
                  ))}
                </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
