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
        <h2 className="text-xl font-bold text-gray-800">Report Not Found</h2>
        <p className="text-sm">The requested report could not be found.</p>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">Close Window</button>
      </div>
    );
  }

  if (!report) return (
    <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse no-print" dir={dir}>
      Generating Document...
    </div>
  );

  const { data } = report;
  const isRTL = language === 'ar';
  
  const reportYear = data.reportDate ? new Date(data.reportDate).getFullYear() : 2025;

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
        tip: `*(US TIP, ${reportYear - 1})`
      },
      ar: { 
        demo: `*(البنك الدولي، ${reportYear})`, 
        economy: `*(البنك الدولي، ${reportYear})`, 
        trade: `*(كوم تريد، ${reportYear})`, 
        edu: `*(اليونسكو، ${reportYear})`, 
        tip: `*(تقرير الاتجار، ${reportYear - 1})`
      }
    };
    const label = labels[language]?.[type] || '';
    return <SourceLink label={label} type={type} />;
  };

  const translateEmirate = (name: string) => {
    if (!isRTL) return name;
    const map: Record<string, string> = { 'Abu Dhabi': 'أبوظبي', 'Dubai': 'دبي', 'Sharjah': 'الشارقة', 'Ajman': 'عجمان', 'Umm Al Quwain': 'أم القيوين', 'Ras Al Khaimah': 'رأس الخيمة', 'Fujairah': 'الفجيرة' };
    return map[name] || name;
  };

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full border-t border-gray-100">
      <p className="text-[8px] text-gray-400 font-sans">
        Generated on <span className="font-sans">{new Date().toLocaleDateString()}</span>
      </p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest">Ministry of Human Resources & Emiratisation</p>
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
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 leading-tight">{title}</p>
            <p className="text-sm font-bold text-primary-dark uppercase leading-tight">{country}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="kpi-chip chip-restrict flex items-center gap-1"><ShieldAlert size={12} /> Restricted</span>
          <span className="text-[9px] text-gray-400 font-mono">REF: {reportId}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <div id="report-content" className="overflow-visible report-root">
        {/* PAGE 1: COVER */}
        <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
          <div className="flex-1 flex flex-col justify-center px-20 relative z-10">
              <div className={`mb-12 border-accent py-6 ${isRTL ? 'border-r-[8px] pr-12' : 'border-l-[8px] pl-12'}`}>
                <h1 className="text-[64px] font-serif font-extrabold text-gray-900 leading-[1.1] mb-4">Bilateral Relations Portal</h1>
                <p className="text-2xl text-gray-500 font-light uppercase tracking-wider">Strategic Overview</p>
              </div>
              <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 max-w-xl">
                <div className="flex items-center gap-8 mb-8">
                    <h2 className="text-4xl font-serif font-bold text-gray-900">{data.country}</h2>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Reference</p><p className="font-mono text-base text-gray-800">{report.id}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Date</p><p className="font-mono text-base text-gray-800">{formatDate(data.reportDate || '')}</p></div>
                </div>
              </div>
          </div>
          <div className="h-3 bg-primary w-full"></div>
        </div>

        {/* PAGE 2: PROFILE & PARTNER WORKFORCE */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} title="Relations Overview" flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle="Key Demographics" compact />
          <div className="grid grid-cols-4 gap-3 mb-6">
            <KPI icon={Landmark} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} />
            <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
          </div>

          <SectionHeader icon={Users} title={t('sectionWorkforce')} subtitle="Partner Workforce Context" compact />
          <div className="grid grid-cols-3 gap-3 mb-6">
             <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} sub={getSource('demo')} />
             <KPI icon={Briefcase} label={t('avgWage')} value={data.averageWage} />
             <KPI icon={Briefcase} label={t('minWage')} value={data.minimumWage} />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <Hammer size={12} /> {t('availableSkills')}
             </h4>
             <div className="flex flex-wrap gap-1.5">
                {data.workforceStats.availableSkills.map((skill, i) => (
                  <span key={i} className="kpi-chip chip-info px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider">{skill}</span>
                ))}
             </div>
          </div>
        </PageContainer>

        {/* PAGE 3: ECONOMY & EDUCATION */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} title="Economy & Skills" flagUrl={data.flagUrl} />
          
          <SectionHeader icon={TrendingUp} title={t('sectionEconomy')} subtitle="Economic Indicators" compact />
          <div className="grid grid-cols-3 gap-3 mb-6">
             <KPI icon={Activity} label={t('inflation')} value={data.economicStats.inflation} sub={getSource('economy')} />
             <KPI icon={Plane} label={t('exportsToUae')} value={data.economicStats.totalExportsToUAE} sub={getSource('trade')} />
             <KPI icon={ArrowDownLeft} label={t('importsFromUae')} value={data.economicStats.totalImportsFromUAE} sub={getSource('trade')} />
             <KPI icon={Shield} label={t('tipRank')} value={data.economicStats.tipRank} sub={getSource('tip')} />
             <KPI icon={Banknote} label={t('remittances')} value={data.economicStats.remittancesFromUAE} />
             <KPI icon={Globe} label={t('remittancesGlobal')} value={data.economicStats.remittancesGlobal} sub={getSource('economy')} />
          </div>

          <SectionHeader icon={GraduationCap} title={t('educationDetails')} subtitle="Skills Pipeline" compact />
          <div className="grid grid-cols-2 gap-3 mb-6">
             <KPI icon={BookOpen} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} sub={getSource('edu')} />
             <KPI icon={GraduationCap} label={t('higherEducationEnrollment')} value={data.educationStats.higherEducationEnrollment} sub={getSource('edu')} />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <Building2 size={12} /> {t('topUniversities')}
             </h4>
             <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                {data.educationStats.topUniversities.map((uni, i) => (
                   <li key={i} className="text-[11px] font-bold text-gray-700 list-disc ms-4">{uni}</li>
                ))}
             </ul>
             <div className="mt-4 pt-3 border-t border-gray-200">
                {getSource('edu')}
             </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}