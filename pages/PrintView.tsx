
import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, Building2,
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  GraduationCap, Briefcase, MessageSquare, FileText, Calendar, Activity,
  ArrowDownLeft, ArrowUpRight, BookOpen, Shield, ArrowRightLeft, Hammer
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

const renderRichText = (text: string, sizeClass: string = "text-[18px]") => {
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
        result.push(<ul key={`list-${i}`} className="list-disc mb-3 ms-10">{listItems.map((item, idx) => (<li key={idx} dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
        inList = false;
      }
      if (trimmed) { result.push(<p key={i} className="mb-3" dangerouslySetInnerHTML={{ __html: processed.includes('\n') ? line : processed }} />); }
    }
  });
  if (inList) { result.push(<ul key="list-final" className="list-disc mb-3 ms-10">{listItems.map((item, idx) => (<li key={idx} dangerouslySetInnerHTML={{ __html: item }} />))}</ul>); }
  return <div className={`rich-text-content ${sizeClass} leading-[1.8] overflow-visible report-font`}>{result.length > 0 ? result : text}</div>;
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

  const sortedAgreements = [...data.bilateralAgreements].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return !isNaN(dateA) && !isNaN(dateB) ? dateB - dateA : (b.date || '').localeCompare(a.date || '');
  });

  const formatCompactNumber = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const getSource = (type: string) => {
    const sources: Record<string, Record<string, string>> = {
      en: { demo: '*(World Bank, 2025)', economy: '*(World Bank, 2025)', trade: '*(UN Comtrade, 2025)', edu: '*(UNESCO, 2025)', gov: '*(Official Portal, 2025)', crime: '*(UNODC, 2025)', literacy: '*(UNESCO, 2025)', tip: '*(US TIP, 2024)', mohre: '*(MOHRE, 2025)', icp: '*(ICP, 2025)' },
      ar: { demo: '*(البنك الدولي، 2025)', economy: '*(البنك الدولي، 2025)', trade: '*(كوم تريد، 2025)', edu: '*(اليونسكو، 2025)', gov: '*(البوابة الرسمية، 2025)', crime: '*(الأمم المتحدة، 2025)', literacy: '*(اليونسكو، 2025)', tip: '*(تقرير الاتجار، 2024)', mohre: '*(بيانات الوزارة، 2025)', icp: '*(بيانات الهيئة، 2025)' }
    };
    return sources[language]?.[type] || '';
  };

  const translateEmirate = (name: string) => {
    if (!isRTL) return name;
    const map: Record<string, string> = { 'Abu Dhabi': 'أبوظبي', 'Dubai': 'دبي', 'Sharjah': 'الشارقة', 'Ajman': 'عجمان', 'Umm Al Quwain': 'أم القيوين', 'Ras Al Khaimah': 'رأس الخيمة', 'Fujairah': 'الفجيرة' };
    return map[name] || name;
  };

  const DefaultFooter = () => (
    <div className="pt-4 flex justify-between items-center bg-white w-full border-t-2 border-gray-100 report-font">
      <p className="text-[12px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans" dir="ltr">2025 December 23</span>
      </p>
      <p className="text-[12px] text-gray-400 uppercase tracking-widest font-bold">{t('ministry')}</p>
    </div>
  );

  const HeaderBand = ({ country, reportId, title, flagUrl }: any) => {
    const getFlagCode = (c: string) => {
      const lower = c.toLowerCase();
      if (lower.includes('india')) return 'in';
      if (lower.includes('philippines')) return 'ph';
      return 'ae';
    };
    const flagSrc = flagUrl || `https://flagcdn.com/w320/${getFlagCode(country)}.png`;
    return (
      <div className="flex items-center justify-between border-b-8 border-primary pb-6 mb-10 report-font">
        <div className="flex items-center gap-6">
          <img src={flagSrc} className="h-10 w-auto shadow-md object-cover" alt={country} />
          <div className="h-12 w-px bg-gray-200" />
          <div>
            <h1 className="text-4xl font-bold text-primary-dark uppercase leading-tight">{country}</h1>
            <p className="text-[18px] font-bold text-accent uppercase tracking-[0.2em]">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="kpi-chip chip-restrict flex items-center gap-2 px-4 py-2 font-bold text-sm"><ShieldAlert size={16} /> Restricted</span>
          <span className="text-sm text-gray-400 font-mono">REF: {reportId}</span>
        </div>
      </div>
    );
  };

  const mohreSectors = data.uaeWorkforceStats.mohre.bySector;
  const maxMohreVal = Math.max(...mohreSectors.map(s => s.value), 1);

  const CHUNK_SIZE_INTERACTIONS = 5; 
  const interactionChunks = [];
  for (let i = 0; i < data.recentInteractions.length; i += CHUNK_SIZE_INTERACTIONS) {
    interactionChunks.push(data.recentInteractions.slice(i, i + CHUNK_SIZE_INTERACTIONS));
  }

  const CHUNK_SIZE_POINTS = 5; 
  const pointsChunks = [];
  for (let i = 0; i < data.pointsOfDiscussion.length; i += CHUNK_SIZE_POINTS) {
    pointsChunks.push(data.pointsOfDiscussion.slice(i, i + CHUNK_SIZE_POINTS));
  }

  const CHUNK_SIZE_AGREEMENTS = 5;
  const agreementChunks = [];
  for (let i = 0; i < sortedAgreements.length; i += CHUNK_SIZE_AGREEMENTS) {
    agreementChunks.push(sortedAgreements.slice(i, i + CHUNK_SIZE_AGREEMENTS));
  }

  const sortedMohreEmirates = [...data.uaeWorkforceStats.mohre.byEmirate].sort((a, b) => b.value - a.value);
  const sortedIcpEmirates = [...data.uaeWorkforceStats.icp.byEmirate].sort((a, b) => b.value - a.value);

  const handlePrint = () => { window.print(); };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      {/* Floating Action Bar */}
      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl border border-white/20 ${isRTL ? 'left-6' : 'right-6'}`}>
         <button onClick={handlePrint} className="bg-primary text-white px-8 py-3 rounded-2xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-3 text-lg font-bold active:scale-95">
            <Printer size={22} /> {t('printNow')}
         </button>
         <div className="w-px h-10 bg-gray-200 mx-1 self-center" />
         <button onClick={() => window.close()} className="bg-white text-gray-500 hover:text-red-500 p-3 rounded-2xl transition-all border border-gray-100 hover:bg-red-50 shadow-sm">
            <X size={24} />
         </button>
      </div>

      <div id="report-content" className="overflow-visible report-font">
        {/* --- PAGE 1: COVER --- */}
        <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
          <div className="absolute inset-0 opacity-[0.05] z-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <svg viewBox="0 0 1000 500" className="w-[150%] h-auto text-primary fill-current">
                <path d="M50,250 Q250,50 500,250 T950,250" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M0,0 L1000,500 M1000,0 L0,500" stroke="currentColor" strokeWidth="0.5" />
              </svg>
          </div>
          <div className="flex-1 flex flex-col justify-center px-24 relative z-10">
              <div className={`mb-16 border-accent py-8 ${isRTL ? 'border-r-[15px] pr-16' : 'border-l-[15px] pl-16'}`}>
                <div className="flex items-center gap-6 mb-12 opacity-80">
                  <img src="https://flagcdn.com/w40/ae.png" className="h-10 w-auto shadow-md" alt="UAE" />
                  <span className="text-lg font-bold uppercase tracking-[0.4em] text-primary">UAE • MOHRE</span>
                </div>
                <h1 className="text-8xl font-bold text-gray-900 leading-[1] mb-8">{t('loginTitle')}</h1>
                <p className="text-4xl text-gray-500 font-light uppercase tracking-[0.3em]">{t('strategicOverview')}</p>
              </div>
              <div className="bg-gray-50 rounded-[3rem] p-16 border-4 border-gray-100 max-w-2xl shadow-xl">
                <div className="flex items-center gap-10 mb-14">
                    <div className="w-32 h-32 rounded-3xl border-8 border-white shadow-2xl overflow-hidden bg-white"><img src={data.flagUrl || `https://flagcdn.com/w320/in.png`} className="w-full h-full object-cover" alt="flag" /></div>
                    <div>
                      <p className="text-lg font-bold text-accent uppercase tracking-[0.3em] mb-2">{t('subjectMarket')}</p>
                      <h2 className="text-7xl font-bold text-gray-900 leading-none">{data.country}</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-12">
                    <div><p className="text-[14px] text-gray-400 uppercase tracking-widest font-bold mb-2">{t('reference')}</p><p className="font-mono text-2xl text-gray-800" dir="ltr">{report.id}</p></div>
                    <div><p className="text-[14px] text-gray-400 uppercase tracking-widest font-bold mb-2">{t('date')}</p><p className="font-mono text-2xl text-gray-800" dir="ltr">{data.reportDate}</p></div>
                    <div className="col-span-2"><p className="text-[14px] text-gray-400 uppercase tracking-widest font-bold mb-4">{t('securityClass')}</p><span className="kpi-chip chip-restrict inline-flex items-center gap-3 px-6 py-2.5 text-lg font-bold"><ShieldAlert size={20} /> {t('officialRestricted')}</span></div>
                </div>
              </div>
          </div>
          <div className="h-6 bg-primary w-full"></div>
        </div>

        {/* --- PAGE 2: PROFILE & ECONOMY --- */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={t('keyDemographics')} compact={true} />
          <div className="grid grid-cols-2 gap-6 mb-10">
            <KPI icon={Landmark} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} />
            <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
            <KPI icon={Shield} label={t('crimeRate')} value={data.crimeRate || 'N/A'} sub={getSource('crime')} />
            <KPI icon={BookOpen} label={t('literacyRate')} value={data.literacyRate || 'N/A'} sub={getSource('literacy')} />
            <KPI icon={Building2} label={t('governmentType')} value={data.governmentType || 'N/A'} sub={getSource('gov')} />
            <KPI icon={Briefcase} label={t('workforceMinistry')} value={data.workforceMinistry || 'N/A'} sub={getSource('gov')} />
          </div>
          
          <SectionHeader icon={TrendingUp} title={t('economicLandscape')} subtitle={t('tradeEducation')} compact={true} />
          <div className="grid grid-cols-2 gap-6 mb-10">
            <KPI icon={Banknote} label={t('gdp')} value={data.gdp} sub={getSource('economy')} />
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} sub={getSource('economy')} />
            <div className="col-span-2"><KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" sub={getSource('tip')} /></div>
          </div>
          
          <div className="bg-gray-50 rounded-[2.5rem] p-10 border-4 border-gray-100 mb-10 shadow-md">
            <h4 className="text-xl font-bold text-gray-700 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-4 flex items-center gap-4">
                <ArrowRightLeft size={24} /> {t('bilateralTrade')} <span className="text-xs text-gray-400 font-normal italic font-sans">{getSource('trade')}</span>
            </h4>
            <div className="grid grid-cols-2 gap-12">
                <div className="flex flex-col"><div className="flex items-center gap-3 mb-4 text-primary"><ArrowDownLeft size={24} /><p className="text-sm font-bold uppercase tracking-widest">{t('importsFromUae')}</p></div><p className="text-4xl font-bold text-gray-900 mb-4" dir="ltr">{data.economicStats.totalImportsFromUAE}</p><p className="text-lg text-gray-700 leading-snug font-medium italic border-s-4 border-primary ps-4">{data.economicStats.topImportProducts.join(', ')}</p></div>
                <div className="flex flex-col border-s-4 border-gray-200 ps-12"><div className="flex items-center gap-3 mb-4 text-accent"><ArrowUpRight size={24} /><p className="text-sm font-bold uppercase tracking-widest">{t('exportsToUae')}</p></div><p className="text-4xl font-bold text-gray-900 mb-4" dir="ltr">{data.economicStats.totalExportsToUAE}</p><p className="text-lg text-gray-700 leading-snug font-medium italic border-s-4 border-accent ps-4">{data.economicStats.topExportProducts.join(', ')}</p></div>
            </div>
          </div>
        </PageContainer>

        {/* --- PAGE 3: EDUCATION & UAE WORKFORCE --- */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={GraduationCap} title={t('educationInsights')} compact={true} />
          <div className="grid grid-cols-2 gap-6 mb-10">
            <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} sub={getSource('edu')} />
            <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} sub={getSource('edu')} />
            <div className="col-span-2 bg-gray-50 border-4 border-gray-100 rounded-3xl p-8 shadow-inner">
              <p className="text-lg font-bold text-gray-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div> {t('topUniversities')} <span className="text-xs text-gray-400 font-normal italic font-sans ms-auto">{getSource('edu')}</span>
              </p>
              <ul className="text-xl text-gray-800 leading-relaxed space-y-4 font-bold grid grid-cols-1 md:grid-cols-2">
                {data.educationStats.topUniversities.slice(0, 10).map((u, i) => (
                  <li key={i} className="flex gap-4 items-start border-b border-gray-200 pb-2 last:border-0">
                    <span className="shrink-0 text-accent">{i+1}.</span>
                    <span className="break-words leading-tight flex-1">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <SectionHeader icon={Building} title={t('sectionUaeWorkforce')} subtitle={t('domesticAnalysis')} />
          <div className="grid grid-cols-2 gap-8 mb-8">
            <KPI icon={Briefcase} label={t('mohrePrivate')} value={data.uaeWorkforceStats.mohre.totalPrivate.value} sub={getSource('mohre')} />
            <KPI icon={Users} label={t('mohreDomestic')} value={data.uaeWorkforceStats.mohre.totalDomestic.value} sub={getSource('mohre')} tone="warn" />
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="p-8 border-4 border-gray-100 rounded-[2.5rem] bg-white flex flex-col items-center shadow-lg">
                <p className="text-center text-sm font-bold text-primary mb-6 uppercase tracking-[0.3em]">{t('workersByEmirate')}</p>
                <div className="h-48 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sortedMohreEmirates} margin={{top: 30, right: 10, bottom: 0, left: 10}}>
                          <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 'bold'}} interval={0} height={20} axisLine={false} tickLine={false} tickFormatter={(val) => translateEmirate(val)} />
                          <YAxis hide />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            <LabelList dataKey="value" position="top" formatter={formatCompactNumber} style={{ fontSize: '12px', fill: '#1e3a8a', fontWeight: 'bold', fontFamily: 'Inter' }} />
                            {sortedMohreEmirates.map((entry, index) => (<Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
            <div className="p-8 border-4 border-gray-100 rounded-[2.5rem] bg-white flex flex-col items-center shadow-lg">
                <p className="text-center text-sm font-bold text-accent mb-6 uppercase tracking-[0.3em]">{t('residentsByEmirate')}</p>
                <div className="h-48 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sortedIcpEmirates} margin={{top: 30, right: 10, bottom: 0, left: 10}}>
                          <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 'bold'}} interval={0} height={20} axisLine={false} tickLine={false} tickFormatter={(val) => translateEmirate(val)} />
                          <YAxis hide />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            <LabelList dataKey="value" position="top" formatter={formatCompactNumber} style={{ fontSize: '12px', fill: '#b45309', fontWeight: 'bold', fontFamily: 'Inter' }} />
                            {sortedIcpEmirates.map((entry, index) => (<Cell key={`cell-${index}`} fill={BLUE_PALETTE[(index + 3) % BLUE_PALETTE.length]} />))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>
        </PageContainer>

        {/* --- PAGE 4+: RELATIONSHIP SUMMARY --- */}
        {interactionChunks.map((chunk, cIdx) => (
          <PageContainer key={`int-${cIdx}`} footer={<DefaultFooter />}>
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={Handshake} title={t('relationshipSummary')} subtitle={t('bilateralEngagement')} />
            <div className="space-y-8 mt-10">
              {chunk.map((item, idx) => (
                <div key={idx} className="border-4 border-gray-100 rounded-[2rem] p-10 bg-gray-50 shadow-md avoid-break">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold uppercase text-white bg-primary px-5 py-2 rounded-xl shadow-sm">{item.type}</span>
                      <span className="text-lg font-bold text-gray-400 font-sans" dir="ltr">{formatDate(item.date)}</span>
                    </div>
                    <h3 className="report-h3 !border-accent !ps-6 !mb-6 !text-3xl">{item.title}</h3>
                    {renderRichText(item.details)}
                </div>
              ))}
            </div>
          </PageContainer>
        ))}

        {/* --- PAGE 5+: POINTS OF DISCUSSION --- */}
        {pointsChunks.map((chunk, cIdx) => (
          <PageContainer key={`pts-${cIdx}`} footer={<DefaultFooter />}>
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={MessageSquare} title={t('pointsDiscussion')} />
            <div className="space-y-10 mt-12">
              {chunk.map((point, idx) => (
                <div key={idx} className="flex gap-8 bg-white border-4 border-gray-100 p-10 rounded-[2.5rem] shadow-lg avoid-break">
                    <div className="w-6 h-6 bg-accent rounded-full shrink-0 mt-3 shadow-md" />
                    <div className="flex-1">
                      <h3 className="report-h3 !border-none !ps-0 !text-4xl">{point.title}</h3>
                      <div className="mt-6">
                        {renderRichText(point.content)}
                      </div>
                    </div>
                </div>
              ))}
            </div>
          </PageContainer>
        ))}

        {/* --- PAGE 6+: AGREEMENTS --- */}
        {agreementChunks.map((chunk, cIdx) => (
          <PageContainer key={`agr-${cIdx}`} footer={<DefaultFooter />}>
            <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
            <SectionHeader icon={FileText} title={t('keyAgreements')} subtitle={t('bilateralTrade')} />
            <div className="space-y-10 mt-12">
              {chunk.map((agreement, idx) => (
                <div key={idx} className="bg-gray-50 border-4 border-gray-100 rounded-[2.5rem] p-10 grid grid-cols-12 gap-10 items-start shadow-xl avoid-break">
                    <div className="col-span-4 border-e-2 border-gray-200 pe-6">
                      <h3 className="report-h3 !border-primary !mb-4 !text-3xl">{agreement.title}</h3>
                      <p className="text-lg font-bold text-gray-500 font-sans" dir="ltr">{formatDate(agreement.date)}</p>
                      <div className="mt-8">
                        <span className={`text-xs font-bold px-6 py-2.5 rounded-2xl uppercase border-4 ${agreement.status === 'Active' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                          {agreement.status === 'Active' ? t('active') : t('pending')}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-8">
                      {renderRichText(agreement.summary)}
                    </div>
                </div>
              ))}
            </div>
          </PageContainer>
        ))}

        {/* --- PAGE FINAL: DELEGATIONS --- */}
        <PageContainer footer={<DefaultFooter />}>
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Users} title={t('sectionDelegation')} />
          
          <div className="space-y-16 mt-12">
            <div className="avoid-break">
                <div className="flex items-center gap-6 mb-10 border-b-8 border-primary pb-5">
                  <img src="https://flagcdn.com/w40/ae.png" className="h-8 w-auto shadow-md" alt="UAE" />
                  <p className="text-2xl font-bold uppercase text-primary tracking-[0.3em]">{t('uaeDelegation')}</p>
                </div>
                <div className="grid grid-cols-1 gap-10">
                  {data.delegations.uae.map((d) => (
                      <div key={d.id} className="flex gap-12 items-start p-10 bg-gray-50 rounded-[3rem] border-4 border-gray-100 shadow-xl relative overflow-visible">
                        <div className="w-48 h-64 rounded-3xl bg-gray-200 shrink-0 overflow-hidden border-8 border-white shadow-2xl">
                            {d.imageUrl ? <img src={d.imageUrl} className="w-full h-full object-cover" alt="portrait" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 uppercase text-xs font-bold">No Portrait</div>}
                        </div>
                        <div className="flex-1 pt-4">
                            <h3 className="text-5xl font-bold text-gray-900 mb-2">{d.name}</h3>
                            <p className="text-2xl font-bold text-primary uppercase mb-8 tracking-[0.15em] border-b-4 border-primary/10 pb-2 inline-block">{d.title}</p>
                            <div className="border-l-8 border-accent ps-8">
                               {renderRichText(d.bio, "text-2xl italic text-gray-700")}
                            </div>
                        </div>
                      </div>
                  ))}
                </div>
            </div>

            <div className="avoid-break pt-10">
                <div className="flex items-center gap-6 mb-10 border-b-8 border-accent pb-5">
                  <img src={data.flagUrl || `https://flagcdn.com/w40/ae.png`} className="h-8 w-auto shadow-md" alt={data.country} />
                  <p className="text-2xl font-bold uppercase text-accent tracking-[0.3em]">{t('partnerDelegation')}</p>
                </div>
                <div className="grid grid-cols-1 gap-10">
                  {data.delegations.partner.map((d) => (
                      <div key={d.id} className="flex gap-12 items-start p-10 bg-gray-50 rounded-[3rem] border-4 border-gray-100 shadow-xl relative overflow-visible">
                        <div className="w-48 h-64 rounded-3xl bg-gray-200 shrink-0 overflow-hidden border-8 border-white shadow-2xl">
                            {d.imageUrl ? <img src={d.imageUrl} className="w-full h-full object-cover" alt="portrait" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 uppercase text-xs font-bold">No Portrait</div>}
                        </div>
                        <div className="flex-1 pt-4">
                            <h3 className="text-5xl font-bold text-gray-900 mb-2">{d.name}</h3>
                            <p className="text-2xl font-bold text-accent uppercase mb-8 tracking-[0.15em] border-b-4 border-accent/10 pb-2 inline-block">{d.title}</p>
                            <div className="border-l-8 border-primary ps-8">
                               {renderRichText(d.bio, "text-2xl italic text-gray-700")}
                            </div>
                        </div>
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
