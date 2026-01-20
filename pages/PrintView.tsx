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
  ExternalLink, MapPin
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

const translateEmirate = (name: string): string => {
  const translations: Record<string, string> = {
    'Abu Dhabi': 'أبوظبي',
    'Dubai': 'دبي',
    'Sharjah': 'الشارقة',
    'Ajman': 'عجمان',
    'Umm Al Quwain': 'أم القيوين',
    'Ras Al Khaimah': 'رأس الخيمة',
    'Fujairah': 'الفجيرة',
  };
  return translations[name] || name;
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
  
  const reportYear = data.reportDate ? new Date(data.reportDate).getFullYear() : 2026;

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

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full border-t border-gray-100">
      <p className="text-[9px] text-gray-400 font-sans">
        {isRTL ? `تم الإنشاء بتاريخ ${formatDate(data.reportDate || '')}` : `Created on ${formatDate(data.reportDate || '')}`}
      </p>
      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Ministry of Human Resources & Emiratisation</p>
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
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 leading-tight">
              {isRTL ? 'تقرير الوضع الحالي للتعاون في مجال القوى العاملة' : 'Current Status of Labor Cooperation Report'}
            </p>
            <p className="text-sm font-bold text-gray-800 uppercase leading-tight">{country}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-gray-400 font-mono uppercase">REF: {reportId}</span>
          <span className="kpi-chip chip-restrict flex items-center gap-1 font-bold"><ShieldAlert size={12} /> RESTRICTED</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <div id="report-content" className="overflow-visible report-root">
        
        {/* PAGE 1: COVER PAGE */}
        <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
          <div className="absolute top-16 right-20 flex items-center gap-4">
             <span className="text-[14px] font-bold text-primary tracking-[0.2em]">UAE • MOHRE</span>
             <img src="https://flagcdn.com/w160/ae.png" className="h-8 w-auto border shadow-sm" alt="UAE Flag" />
          </div>

          <div className="absolute top-44 bottom-44 right-20 w-[6px] bg-[#F59E0B] rounded-full"></div>

          <div className={`flex-1 flex flex-col justify-center px-28 relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
             <h1 className="text-[54px] font-serif font-extrabold text-[#111827] leading-[1.2] mb-6">
                {isRTL ? (
                   <>
                      تقرير الوضع الحالي للتعاون في<br />
                      مجال القوى العاملة
                   </>
                ) : (
                   <>
                      Report on the Current Status of<br />
                      Labor Market Cooperation
                   </>
                )}
             </h1>
             <p className="text-2xl text-gray-400 font-light mb-20">
                {isRTL ? 'نظرة استراتيجية عامة' : 'General Strategic Overview'}
             </p>

             <div className="bg-gray-50/80 backdrop-blur-sm rounded-[32px] p-12 border border-gray-100 max-w-2xl relative shadow-sm">
                <div className="absolute -top-10 right-10 flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-white shadow-xl border border-gray-100 p-2 flex items-center justify-center overflow-hidden">
                      <img 
                        src={data.flagUrl || `https://flagcdn.com/w160/${data.country.toLowerCase().includes('bang') ? 'bd' : 'in'}.png`} 
                        className="w-full h-full object-cover rounded-lg" 
                      />
                   </div>
                </div>

                <div className="space-y-10">
                   <div>
                      <p className="text-[10px] text-accent uppercase tracking-[0.2em] font-extrabold mb-1">
                        {isRTL ? 'الدولة محل التقرير' : 'Country Under Report'}
                      </p>
                      <h2 className="text-5xl font-serif font-bold text-gray-900">{data.country}</h2>
                   </div>

                   <div className="grid grid-cols-2 gap-12 pt-4 border-t border-gray-200/50">
                      <div>
                         <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">{isRTL ? 'مرجع:' : 'Reference:'}</p>
                         <p className="font-mono text-sm text-gray-700">{report.id}</p>
                      </div>
                      <div>
                         <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">{isRTL ? 'التاريخ' : 'Date'}</p>
                         <p className="font-mono text-sm text-gray-700">{formatDate(data.reportDate || '')}</p>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-gray-200/50 flex flex-col gap-2">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">{isRTL ? 'التصنيف' : 'Classification'}</p>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-100 rounded-full w-fit">
                         <ShieldAlert size={14} className="text-red-500" />
                         <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{isRTL ? 'رسمي / مقيد' : 'OFFICIAL / RESTRICTED'}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="h-4 bg-primary-dark w-full mt-auto"></div>
        </div>

        {/* PAGE 2: DEMOGRAPHICS & ECONOMY */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={isRTL ? 'البيانات السكانية الرئيسية' : 'Key Demographic Data'} compact />
          <div className="grid grid-cols-4 gap-4 mb-10">
            <KPI icon={MapPin} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} sub={getSource('demo')} />
            <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
            
            <KPI icon={Shield} label={t('crimeRate')} value={data.crimeRate} sub={getSource('demo')} />
            <KPI icon={BookOpen} label={t('literacyRate')} value={data.literacyRate} sub={getSource('demo')} />
            <KPI icon={Landmark} label={t('governmentType')} value={data.governmentType} />
            <KPI icon={Briefcase} label={t('workforceMinistry')} value={data.workforceMinistry} />
          </div>

          <SectionHeader icon={TrendingUp} title={t('sectionEconomy')} subtitle={isRTL ? 'التجارة والتعليم' : 'Trade and Education'} compact />
          <div className="grid grid-cols-4 gap-4 mb-8">
             <KPI icon={ShieldAlert} label={t('tipRank')} value={data.economicStats.tipRank} sub={getSource('tip')} />
             <KPI icon={Activity} label={t('inflation')} value={data.economicStats.inflation} sub={getSource('economy')} />
             <KPI icon={TrendingUp} label={t('gdp')} value={data.economicStats.gdp} sub={getSource('economy')} />
             <KPI icon={ArrowRightLeft} label={t('remittances')} value={data.economicStats.remittancesFromUAE} sub={isRTL ? 'مصرف الإمارات المركزي، 2025' : 'Central Bank UAE, 2025'} />
          </div>

          <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 mb-12">
             <div className="flex items-center justify-between mb-6 border-b pb-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
                   <ArrowRightLeft size={14} /> {isRTL ? 'إحصاءات التجارة' : 'Trade Statistics'} {getSource('trade')}
                </h4>
             </div>
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-3">
                   <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                      <ArrowDownLeft size={12} className="text-blue-500" /> {isRTL ? `الواردات إلى ${data.country} من الإمارات` : `Imports to ${data.country} from UAE`}
                   </p>
                   <p className="text-2xl font-serif font-bold text-gray-900">{data.economicStats.totalImportsFromUAE}</p>
                   <p className="text-[11px] text-gray-500 leading-relaxed italic">{data.economicStats.topImportProducts.join(', ')}</p>
                </div>
                <div className="space-y-3 border-l ps-10">
                   <p className="text-[10px] font-bold text-accent uppercase flex items-center gap-1">
                      <ArrowUpRight size={12} className="text-orange-500" /> {isRTL ? `الصادرات من ${data.country} إلى الإمارات` : `Exports from ${data.country} to UAE`}
                   </p>
                   <p className="text-2xl font-serif font-bold text-gray-900">{data.economicStats.totalExportsToUAE}</p>
                   <p className="text-[11px] text-gray-500 leading-relaxed italic">{data.economicStats.topExportProducts.join(', ')}</p>
                </div>
             </div>
          </div>

          <SectionHeader icon={GraduationCap} title={t('educationDetails')} subtitle={isRTL ? 'التعليم والمهارات' : 'Education & Skills'} compact />
          <div className="grid grid-cols-3 gap-6">
             <div className="kpi-card p-6">
                <p className="kpi-label uppercase text-[10px] text-gray-400 font-bold mb-4">{t('higherEducationEnrollment')}</p>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary"><GraduationCap size={24} /></div>
                   <div>
                      <p className="text-2xl font-bold font-serif">{data.educationStats.higherEducationEnrollment || 'N/A'}</p>
                      {getSource('edu')}
                   </div>
                </div>
             </div>
             <div className="kpi-card p-6">
                <p className="kpi-label uppercase text-[10px] text-gray-400 font-bold mb-4">{t('primaryEnrollment')}</p>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary"><BookOpen size={24} /></div>
                   <div>
                      <p className="text-2xl font-bold font-serif">{data.educationStats.primaryEnrollment || 'N/A'}</p>
                      {getSource('edu')}
                   </div>
                </div>
             </div>
             <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex-1">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                   {isRTL ? 'أفضل 5 جامعات' : 'Top 5 Universities'} {getSource('edu')}
                </h4>
                <ul className="space-y-1.5">
                   {data.educationStats.topUniversities.map((uni, i) => (
                      <li key={i} className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                         <span className="w-1 h-1 bg-primary rounded-full"></span> {uni}
                      </li>
                   ))}
                </ul>
             </div>
          </div>
        </PageContainer>

        {/* PAGE 3: UAE WORKFORCE (Charts) */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Briefcase} title={isRTL ? 'القوى العاملة في دولة الإمارات' : 'Workforce in the UAE'} subtitle={isRTL ? 'تحليل سوق العمل المحلي' : 'Local Labor Market Analysis'} compact />
          
          <div className="grid grid-cols-2 gap-4 mb-8">
             <KPI icon={Building} label={isRTL ? 'وزارة الموارد البشرية والتوطين • القطاع الخاص' : 'MOHRE • Private Sector'} value={data.uaeWorkforceStats.mohre.totalPrivate.value} sub={isRTL ? `*(بيانات الوزارة، ${data.uaeWorkforceStats.mohre.totalPrivate.date})` : `*(MOHRE Data, ${data.uaeWorkforceStats.mohre.totalPrivate.date})`} />
             <KPI icon={Users} label={isRTL ? 'وزارة الموارد البشرية والتوطين • العمالة المساعدة' : 'MOHRE • Domestic Workers'} value={data.uaeWorkforceStats.mohre.totalDomestic.value} sub={isRTL ? `*(بيانات الوزارة، ${data.uaeWorkforceStats.mohre.totalDomestic.date})` : `*(MOHRE Data, ${data.uaeWorkforceStats.mohre.totalDomestic.date})`} />
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
             <div className="bg-white border rounded-[24px] p-6">
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-6 text-center">{isRTL ? 'توزيع العمال حسب الإمارة (MOHRE)' : 'Workers by Emirate (MOHRE)'}</h5>
                <div className="h-[180px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.uaeWorkforceStats.mohre.byEmirate} margin={{ top: 20, bottom: 20 }}>
                         <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                            {data.uaeWorkforceStats.mohre.byEmirate.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                            ))}
                            <LabelList dataKey="name" position="bottom" style={{ fontSize: '8px', fontWeight: 'bold' }} formatter={(val: string) => isRTL ? translateEmirate(val) : val} />
                            <LabelList dataKey="value" position="top" style={{ fontSize: '8px', fill: '#666' }} />
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-white border rounded-[24px] p-6">
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-6 text-center">{isRTL ? 'توزيع العاملين حسب الإمارة (ICP)' : 'Residency by Emirate (ICP)'}</h5>
                <div className="h-[180px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.uaeWorkforceStats.icp.byEmirate} margin={{ top: 20, bottom: 20 }}>
                         <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]}>
                            {data.uaeWorkforceStats.icp.byEmirate.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} opacity={0.8} />
                            ))}
                            <LabelList dataKey="name" position="bottom" style={{ fontSize: '8px', fontWeight: 'bold' }} formatter={(val: string) => isRTL ? translateEmirate(val) : val} />
                            <LabelList dataKey="value" position="top" style={{ fontSize: '8px', fill: '#666' }} />
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-6">{isRTL ? 'توزيع العمال حسب القطاع' : 'Workers by Sector'}</h5>
                <div className="space-y-4">
                   {data.uaeWorkforceStats.mohre.bySector.map((sec, i) => {
                      const max = Math.max(...data.uaeWorkforceStats.mohre.bySector.map(s => s.value), 1);
                      const perc = (sec.value / max) * 100;
                      return (
                         <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-600">
                               <span>{sec.name}</span>
                               <span>{sec.value.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${perc}%` }}></div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             <div className="space-y-4">
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-4 ps-2">{t('additionalIndicators')}</h5>
                {data.uaeWorkforceStats.custom.map((stat) => (
                   <div key={stat.id} className="kpi-card p-4 flex justify-between items-center border-l-4 border-primary">
                      <div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{stat.label}</p>
                         <p className="text-[8px] text-gray-400 uppercase tracking-tighter">{stat.date}</p>
                      </div>
                      <p className="text-xl font-bold font-serif text-gray-900">{stat.value}</p>
                   </div>
                ))}
             </div>
          </div>
        </PageContainer>

        {/* PAGE 4: PARTNER COUNTRY WORKFORCE */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBandInternal country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Users} title={isRTL ? `القوى العاملة لدى ${data.country}` : `Workforce of ${data.country}`} subtitle={isRTL ? 'تحليل سوق المصدر' : 'Source Market Analysis'} compact />
          
          <div className="grid grid-cols-4 gap-4 mb-10">
             <div className="col-span-2 kpi-card p-6 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary"><Users size={28} /></div>
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{isRTL ? 'إجمالي القوى العاملة' : 'TOTAL WORKFORCE'}</p>
                   <p className="text-3xl font-bold font-serif">{data.workforceStats.totalWorkforce}</p>
                   {getSource('demo')}
                </div>
             </div>
             <div className="kpi-card p-6 flex flex-col justify-center items-center text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">{isRTL ? 'ذكور' : 'MALE'}</p>
                <p className="text-2xl font-bold font-serif text-blue-600">{data.workforceStats.participationMale}%</p>
             </div>
             <div className="kpi-card p-6 flex flex-col justify-center items-center text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">{isRTL ? 'إناث' : 'FEMALE'}</p>
                <p className="text-2xl font-bold font-serif text-accent">{data.workforceStats.participationFemale}%</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
             <div className="bg-white border rounded-[24px] p-6">
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-6 flex items-center gap-2"><Plane size={14} /> {isRTL ? 'وجهات العمل الرئيسية' : 'Primary Labor Destinations'}</h5>
                <div className="space-y-6">
                   {data.workforceStats.migrationDestinations.map((dest, i) => {
                      const counts = data.workforceStats.migrationDestinations.map(d => {
                         const n = parseFloat(d.count.replace(/[^0-9.]/g, ''));
                         return isNaN(n) ? 0 : n;
                      });
                      const max = Math.max(...counts, 1);
                      const val = parseFloat(dest.count.replace(/[^0-9.]/g, '')) || 0;
                      return (
                         <div key={i} className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                               <span className="text-gray-700">{dest.country}</span>
                               <span className="text-primary font-mono">{dest.count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${(val/max)*100}%` }}></div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
             <div className="bg-white border rounded-[24px] p-6">
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-6 flex items-center gap-2"><Briefcase size={14} /> {isRTL ? 'توزيع العمال حسب القطاع' : 'Workforce by Sector'}</h5>
                <div className="space-y-6">
                   {data.workforceStats.topSectors.map((sec, i) => {
                      const max = Math.max(...data.workforceStats.topSectors.map(s => s.value), 1);
                      return (
                         <div key={i} className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                               <span className="text-gray-700">{sec.name}</span>
                               <span className="text-gray-400">{sec.value}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                               <div className="h-full bg-primary-dark" style={{ width: `${(sec.value/max)*100}%` }}></div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>

          <div className="bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
             <h4 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-primary-dark mb-6 flex items-center gap-2">
                <Hammer size={16} /> {isRTL ? 'توافر المهارات' : 'Available Skills'}
             </h4>
             <div className="flex flex-wrap gap-4">
                {data.workforceStats.availableSkills.map((skill, i) => (
                   <div key={i} className="bg-white border rounded-[16px] px-6 py-3 text-[13px] font-bold text-gray-800 shadow-sm">
                      {skill}
                   </div>
                ))}
             </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}