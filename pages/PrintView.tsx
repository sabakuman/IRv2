
import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, Building2,
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  GraduationCap, Briefcase, MessageSquare, FileText, Calendar, Activity,
  ArrowDownLeft, ArrowUpRight, BookOpen, Shield, ArrowRightLeft, Hammer,
  ExternalLink
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
      if (trimmed) { result.push(<p key={i} className="mb-1 block" dangerouslySetInnerHTML={{ __html: processed.includes('\n') ? line : processed }} />); }
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
  
  if (!url) return <span className="text-[9px] text-gray-500 italic block">{label}</span>;
  
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

  const { t, language, dir } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

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
  const reportYear = data.reportDate ? new Date(data.reportDate).getFullYear() : 2025;
  const prevYear = reportYear - 1;
  const prevMonthAr = 'ديسمبر';
  const prevMonthEn = 'December';

  const formatCompactNumber = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const getSource = (type: string) => {
    const labels: Record<string, Record<string, string>> = {
      en: { 
        demo: `*(World Bank, ${reportYear})`, 
        economy: `*(World Bank, ${reportYear})`, 
        trade: `*(UN Comtrade, ${reportYear})`, 
        edu: `*(UNESCO, ${reportYear})`, 
        tip: `*(US TIP, ${prevYear})`,
        mohre: `*(Ministry Data, ${prevMonthEn} ${prevYear})`,
        cbuae: `Central Bank of the UAE, ${prevYear}`
      },
      ar: { 
        demo: `*(البنك الدولي، ${reportYear})`, 
        economy: `*(البنك الدولي، ${reportYear})`, 
        trade: `*(كوم تريد، ${reportYear})`, 
        edu: `*(اليونسكو، ${reportYear})`, 
        tip: `*(تقرير الاتجار، ${prevYear})`,
        mohre: `*(بيانات الوزارة، ${prevMonthAr} ${prevYear})`,
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

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full border-t border-gray-100">
      <p className="text-[8px] text-gray-400 font-sans block">
        {t('generatedOn')} <span className="font-sans">{new Date().toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US')}</span>
      </p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest block">{t('ministry')}</p>
    </div>
  );

  const HeaderBandInternal = ({ country, reportId, title, flagUrl }: any) => {
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
        <div className="flex items-center gap-4">
          <img src={flagSrc} className="h-6 w-auto shadow-sm object-cover" alt={country} />
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex flex-col">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 leading-tight block">{title}</p>
            <p className="text-sm font-bold text-primary-dark uppercase leading-tight block">{country}</p>
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

  const mohreSectors = data.uaeWorkforceStats.mohre.bySector;
  const maxMohreVal = Math.max(...mohreSectors.map(s => s.value), 1);

  // Pagination Logic Constants
  const INT_CHUNK_SIZE = 5;
  const POINTS_CHUNK_SIZE = 3; // Discussion points are text-heavy, limit to 3 per page
  const AGR_CHUNK_SIZE = 6;

  const interactionChunks = [];
  for (let i = 0; i < data.recentInteractions.length; i += INT_CHUNK_SIZE) {
    interactionChunks.push(data.recentInteractions.slice(i, i + INT_CHUNK_SIZE));
  }

  const pointsChunks = [];
  for (let i = 0; i < data.pointsOfDiscussion.length; i += POINTS_CHUNK_SIZE) {
    pointsChunks.push(data.pointsOfDiscussion.slice(i, i + POINTS_CHUNK_SIZE));
  }

  const sortedAgreements = [...data.bilateralAgreements].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const agreementChunks = [];
  for (let i = 0; i < sortedAgreements.length; i += AGR_CHUNK_SIZE) {
    agreementChunks.push(sortedAgreements.slice(i, i + AGR_CHUNK_SIZE));
  }

  const maxMigrationDest = Math.max(...data.workforceStats.migrationDestinations.map(d => parseFloat(d.count) || 0), 1);
  const maxPartnerSector = Math.max(...data.workforceStats.topSectors.map(s => s.value), 1);

  const getAgreementStatusDisplay = (agr: any) => {
    const status = String(agr.status || 'active').toLowerCase();
    
    if (status === 'active' || status.includes('ساري') || (status.includes('active') && !status.includes('in'))) {
      return { 
        label: isRTL ? 'ساري' : 'Active', 
        class: 'bg-green-100 text-green-800 border-green-200' 
      };
    }
    
    if (status === 'pending' || status.includes('تنفيذ') || status.includes('pending')) {
      return { 
        label: isRTL ? 'قيد التنفيذ' : 'Pending', 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      };
    }
    
    if (status === 'custom' || agr.customStatusText) {
      return { 
        label: agr.customStatusText || (isRTL ? 'مخصص' : 'Custom'), 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      };
    }

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
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary block">UAE • MOHRE</span>
                </div>
                <h1 className="text-[64px] font-serif font-extrabold text-gray-900 leading-[1.1] mb-4 block">{t('loginTitle')}</h1>
                <p className="text-2xl text-gray-500 font-light uppercase tracking-wider block">{t('strategicOverview')}</p>
              </div>
              <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 max-w-xl">
                <div className="flex items-center gap-8 mb-8">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white"><img src={data.flagUrl || `https://flagcdn.com/w320/${data.country.toLowerCase().includes('philippines')?'ph':'in'}.png`} className="w-full h-full object-cover" alt="flag" /></div>
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-1 block">{t('subjectMarket')}</p>
                      <h2 className="text-4xl font-serif font-bold text-gray-900 block">{data.country}</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1 block">{t('reference')}</p><p className="font-mono text-base text-gray-800 block">{report.id}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1 block">{t('date')}</p><p className="font-mono text-base text-gray-800 block">{data.reportDate}</p></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1 block">{t('securityClass')}</p><span className="kpi-chip chip-restrict inline-flex items-center gap-2 px-3 py-1"><ShieldAlert size={12} /> {t('officialRestricted')}</span></div>
                </div>
              </div>
          </div>
          <div className="h-3 bg-primary w-full"></div>
        </div>

        {/* PAGE 2: PROFILE & ECONOMY */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
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
                <div className="flex flex-col"><div className="flex items-center gap-2 mb-1 text-primary"><ArrowDownLeft size={16} /><p className="text-[10px] font-bold uppercase block">{isRTL ? `الواردات إلى ${data.country} من الإمارات` : `Imports to ${data.country} from the UAE`}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1 block">{data.economicStats.totalImportsFromUAE}</p><p className="text-[12px] text-gray-700 leading-snug font-medium block">{data.economicStats.topImportProducts.join(', ')}</p></div>
                <div className="flex flex-col border-s border-gray-200 ps-8"><div className="flex items-center gap-2 mb-1 text-accent"><ArrowUpRight size={16} /><p className="text-[10px] font-bold uppercase block">{isRTL ? `الصادرات من ${data.country} إلى الإمارات` : `Exports from ${data.country} to the UAE`}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1 block">{data.economicStats.totalExportsToUAE}</p><p className="text-[12px] text-gray-700 leading-snug font-medium block">{data.economicStats.topExportProducts.join(', ')}</p></div>
            </div>
          </div>
          <SectionHeader icon={GraduationCap} title={t('educationInsights')} compact />
          <div className="grid grid-cols-3 gap-3">
            <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} sub={getSource('edu')} />
            <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} sub={getSource('edu')} />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-center shadow-sm">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">{t('topUniversities')} <span className="ms-2">{getSource('edu')}</span></p>
              <ul className="text-[11px] text-gray-700 leading-snug space-y-1 block">
                {(data.educationStats.topUniversities || []).slice(0, 5).map((u, i) => (
                  <li key={i} className="flex gap-1.5 items-start">
                    <span className="shrink-0 font-bold text-primary opacity-60">•</span>
                    <span className="break-words leading-tight flex-1 font-medium block">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>

        {/* PAGE 3: UAE WORKFORCE */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Building} title={t('sectionUaeWorkforce')} subtitle={t('domesticAnalysis')} />
          <div className="grid grid-cols-2 gap-4 mb-3">
            <KPI icon={Briefcase} label={t('mohrePrivate')} value