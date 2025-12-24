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

const renderRichText = (text: string, sizeClass: string = "text-[13px]") => {
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
  return <div className={`rich-text-content ${sizeClass} leading-[1.5] overflow-visible font-medium`}>{result.length > 0 ? result : text}</div>;
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

  const getSource = (type: string) => {
    const sources: Record<string, Record<string, string>> = {
      en: { demo: '*(World Bank, 2025)', economy: '*(World Bank, 2025)', trade: '*(UN Comtrade, 2025)', edu: '*(UNESCO, 2025)', gov: '*(Official Portal, 2025)', crime: '*(UNODC, 2025)', literacy: '*(UNESCO, 2025)', tip: '*(US TIP, 2024)', mohre: '*(MOHRE, 2025)', icp: '*(ICP, 2025)' },
      ar: { demo: '*(البنك الدولي، 2025)', economy: '*(البنك الدولي، 2025)', trade: '*(كوم تريد، 2025)', edu: '*(اليونسكو، 2025)', gov: '*(البوابة الرسمية، 2025)', crime: '*(الأمم المتحدة، 2025)', literacy: '*(اليونسكو، 2025)', tip: '*(تقرير الاتجار، 2024)', mohre: '*(بيانات الوزارة، 2025)', icp: '*(بيانات الهيئة، 2025)' }
    };
    return sources[language]?.[type] || '';
  };

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full border-t border-gray-100">
      <p className="text-[8px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans" dir="ltr">2025 December 22</span>
      </p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest">{t('ministry')}</p>
    </div>
  );

  const HeaderBand = ({ country, reportId, title, flagUrl }: any) => {
    const flagSrc = flagUrl || `https://flagcdn.com/w320/ae.png`;
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

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <style>
        {`
          .report-root {
            font-family: "Sakkal Majalla", serif !important;
          }
          .report-root * {
            font-family: "Sakkal Majalla", serif !important;
          }
          .report-root .kpi-label {
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            font-weight: 900 !important;
          }
        `}
      </style>
      
      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl border border-white/20 ${isRTL ? 'left-6' : 'right-6'}`}>
         <button onClick={() => window.print()} className="bg-primary text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold active:scale-95">
            <Printer size={18} /> {t('printNow')}
         </button>
         <div className="w-px h-8 bg-gray-200 mx-1 self-center" />
         <button onClick={() => window.close()} className="bg-white text-gray-500 hover:text-red-500 p-2.5 rounded-xl transition-all border border-gray-100 hover:bg-red-50">
            <X size={20} />
         </button>
      </div>

      <div id="report-content" className="overflow-visible report-root">
        
        {/* PAGE 1: COVER */}
        <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
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
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                      <img src={data.flagUrl || `https://flagcdn.com/w320/ae.png`} className="w-full h-full object-cover" alt="flag" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-1">{t('subjectMarket')}</p>
                      <h2 className="text-4xl font-serif font-bold text-gray-900">{data.country}</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('reference')}</p><p className="font-mono text-base text-gray-800" dir="ltr">{report.id}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('date')}</p><p className="font-mono text-base text-gray-800" dir="ltr">{data.reportDate}</p></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('securityClass')}</p><span className="kpi-chip chip-restrict inline-flex items-center gap-2 px-3 py-1"><ShieldAlert size={12} /> {t('officialRestricted')}</span></div>
                </div>
              </div>
          </div>
          <div className="h-3 bg-primary w-full"></div>
        </div>

        {/* PAGE 2: PROFILE & ECONOMY */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={t('keyDemographics')} compact={true} />
          <div className="grid grid-cols-4 gap-3 mb-4">
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
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPI icon={Banknote} label={t('gdp')} value={data.gdp} sub={getSource('economy')} />
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} sub={getSource('economy')} />
            <KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" sub={getSource('tip')} />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2 flex items-center gap-2"><ArrowRightLeft size={14} /> {t('bilateralTrade')}</h4>
            <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col"><div className="flex items-center gap-2 mb-1 text-primary"><ArrowDownLeft size={16} /><p className="text-[10px] font-bold uppercase">{t('importsFromUae')}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1" dir="ltr">{data.economicStats.totalImportsFromUAE}</p><p className="text-[13px] text-gray-700 leading-snug font-bold">{data.economicStats.topImportProducts.join(', ')}</p></div>
                <div className="flex flex-col border-s border-gray-200 ps-8"><div className="flex items-center gap-2 mb-1 text-accent"><ArrowUpRight size={16} /><p className="text-[10px] font-bold uppercase">{t('exportsToUae')}</p></div><p className="text-xl font-serif font-bold text-gray-900 mb-1" dir="ltr">{data.economicStats.totalExportsToUAE}</p><p className="text-[13px] text-gray-700 leading-snug font-bold">{data.economicStats.topExportProducts.join(', ')}</p></div>
            </div>
          </div>
          <SectionHeader icon={GraduationCap} title={t('educationInsights')} compact={true} />
          <div className="grid grid-cols-3 gap-3">
            <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} sub={getSource('edu')} />
            <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} sub={getSource('edu')} />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-center shadow-sm">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{t('topUniversities')}</p>
              <ul className="text-[12px] text-gray-700 leading-snug space-y-1">
                {data.educationStats.topUniversities.slice(0, 5).map((u, i) => (
                  <li key={i} className="flex gap-1.5 items-start font-bold">
                    <span className="shrink-0 text-primary">•</span>
                    <span className="break-words leading-tight flex-1">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>

        {/* PAGE 3: UAE WORKFORCE ANALYSIS */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Building} title={t('domesticAnalysis')} subtitle={t('mohreData')} compact={true} />
          <div className="grid grid-cols-3 gap-3 mb-6">
            <KPI icon={Briefcase} label={t('totalPrivate')} value={data.uaeWorkforceStats.mohre.totalPrivate.value} sub={`${t('dataAsOf')} ${data.uaeWorkforceStats.mohre.totalPrivate.date}`} tone="ok" />
            <KPI icon={Users} label={t('totalDomestic')} value={data.uaeWorkforceStats.mohre.totalDomestic.value} sub={`${t('dataAsOf')} ${data.uaeWorkforceStats.mohre.totalDomestic.date}`} tone="ok" />
            <KPI icon={Activity} label={t('totalWorkersUaeLabel')} value={data.uaeWorkforceStats.custom.find(c => c.isTotal)?.value || 'N/A'} sub={getSource('mohre')} tone="info" />
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 border-b pb-2">{t('workersByEmirate')}</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={sortedMohreEmirates} layout="vertical" margin={{ left: isRTL ? 40 : 0, right: isRTL ? 0 : 40 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 700 }} orientation={isRTL ? 'right' : 'left'} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {sortedMohreEmirates.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                        ))}
                        <LabelList dataKey="value" position={isRTL ? 'left' : 'right'} style={{ fontSize: 10, fontWeight: 800, fill: '#1e3a8a' }} />
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 border-b pb-2">{t('workersBySector')}</h4>
              <div className="space-y-3">
                 {data.uaeWorkforceStats.mohre.bySector.slice(0, 8).map((sec, i) => (
                   <div key={i} className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-1">
                      <span className="font-bold text-gray-700">{sec.name}</span>
                      <span className="font-mono font-bold text-primary">{sec.value.toLocaleString()}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
          
          <SectionHeader icon={Shield} title={t('icpHeader')} subtitle={t('icpSubheader')} compact={true} />
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm">
             <div className="grid grid-cols-4 gap-4">
                {data.uaeWorkforceStats.icp.byEmirate.map((em, idx) => (
                   <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col items-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{em.name}</p>
                      <p className="text-lg font-bold text-primary-dark">{em.value.toLocaleString()}</p>
                   </div>
                ))}
             </div>
             <p className="text-[10px] text-gray-400 mt-4 italic">{t('icpDisclaimer')}</p>
          </div>
        </PageContainer>

        {/* PAGE 4: SOURCE MARKET ANALYSIS */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Hammer} title={t('sourceMarketAnalysis')} subtitle={t('workforceStats')} compact={true} />
          <div className="grid grid-cols-4 gap-3 mb-6">
            <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} sub={getSource('demo')} />
            <KPI icon={ArrowDownLeft} label={t('remittances')} value={data.economicStats.remittancesFromUAE} tone="info" />
            <KPI icon={Banknote} label={t('globalRemittances')} value={data.economicStats.remittancesGlobal} />
            <KPI icon={Building} label={t('avgWage')} value={data.averageWage} tone="info" />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
             <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 border-b pb-2">{t('migrationDestinations')}</h4>
                <div className="space-y-4">
                   {data.workforceStats.migrationDestinations.map((dest, i) => (
                     <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm font-bold">
                           <span>{dest.country}</span>
                           <span>{dest.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min(100, (i === 0 ? 100 : 100 - (i * 15)))}%` }}></div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col h-full">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 border-b pb-2">{t('availableSkills')}</h4>
                <div className="flex flex-wrap gap-2">
                   {data.workforceStats.availableSkills.map((skill, i) => (
                      <span key={i} className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold text-primary shadow-sm">{skill}</span>
                   ))}
                </div>
                <p className="mt-auto pt-4 text-[10px] text-gray-400 italic leading-relaxed">{t('skillsDisclaimer')}</p>
             </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
             <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 border-b pb-2">{t('sectorDistribution')}</h4>
             <div className="grid grid-cols-3 gap-6">
                {data.workforceStats.topSectors.map((sec, i) => (
                   <div key={i} className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{sec.name}</p>
                      <p className="text-xl font-bold text-primary-dark">{sec.value}%</p>
                   </div>
                ))}
             </div>
          </div>
        </PageContainer>

        {/* PAGE 5: INTERACTIONS & NEWS */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Calendar} title={t('recentInteractions')} subtitle={t('relationshipSummary')} compact={true} />
          <div className="space-y-4 mb-8">
             {data.recentInteractions.length === 0 ? (
                <div className="p-10 border border-dashed rounded-2xl text-center text-gray-400 italic">No recent interactions recorded.</div>
             ) : (
                data.recentInteractions.slice(0, 4).map(item => (
                   <div key={item.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20"></div>
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="text-[15px] font-bold text-primary-dark leading-snug">{item.title}</h4>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>
                      </div>
                      {renderRichText(item.details)}
                   </div>
                ))
             )}
          </div>

          <SectionHeader icon={MessageSquare} title={t('pointsDiscussion')} compact={true} />
          <div className="space-y-4">
             {data.pointsOfDiscussion.slice(0, 3).map(point => (
                <div key={point.id} className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 shadow-sm">
                   <h4 className="text-[14px] font-bold text-primary mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {point.title}
                   </h4>
                   {renderRichText(point.content)}
                </div>
             ))}
          </div>
        </PageContainer>

        {/* PAGE 6: AGREEMENTS */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Handshake} title={t('bilateralEngagement')} subtitle={t('keyAgreements')} compact={true} />
          <div className="space-y-5">
             {data.bilateralAgreements.length === 0 ? (
                <div className="p-10 border border-dashed rounded-2xl text-center text-gray-400 italic">{t('noAgreements')}</div>
             ) : (
                data.bilateralAgreements.map((agreement, i) => (
                   <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4 border-b pb-3 border-gray-200">
                         <div>
                            <h4 className="text-lg font-serif font-bold text-gray-900 mb-1">{agreement.title}</h4>
                            <div className="flex gap-4">
                               <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={12} /> {agreement.date}</span>
                               <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${agreement.status === 'Active' ? 'text-green-600' : 'text-amber-600'}`}>
                                  <Activity size={12} /> {t(agreement.status.toLowerCase() as any)}
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="text-[13px] leading-relaxed text-gray-700">
                         <p className="font-bold mb-1 opacity-60 uppercase text-[9px] tracking-widest">{t('keyProvisions')}</p>
                         {renderRichText(agreement.summary)}
                      </div>
                   </div>
                ))
             )}
          </div>
        </PageContainer>

        {/* PAGE 7: DELEGATIONS */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Users} title={t('relationsDelegations')} subtitle={t('ministryOfficials')} compact={true} />
          <div className="space-y-8">
             {['uae', 'partner'].map((type) => (
                <div key={type} className="bg-gray-50 rounded-3xl p-8 border border-gray-200 shadow-sm">
                   <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-8 border-b pb-3">{type === 'uae' ? t('uaeDelegation') : t('partnerDelegation')}</h4>
                   <div className="space-y-10">
                      {data.delegations[type as 'uae'|'partner'].map(member => (
                         <div key={member.id} className="flex gap-8 items-start avoid-break">
                            <div className="w-24 h-32 bg-white rounded-xl shadow-lg border-2 border-white overflow-hidden shrink-0">
                               {member.imageUrl ? (
                                  <img src={member.imageUrl} className="w-full h-full object-cover" />
                               ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><Users size={32} /></div>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h5 className="text-xl font-serif font-bold text-gray-900 mb-1">{member.name}</h5>
                               <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">{member.title}</p>
                               {renderRichText(member.bio, "text-[12px]")}
                            </div>
                         </div>
                      ))}
                      {data.delegations[type as 'uae'|'partner'].length === 0 && <div className="text-center text-gray-400 italic text-sm">No members recorded for this delegation.</div>}
                   </div>
                </div>
             ))}
          </div>
        </PageContainer>
      </div>
    </div>
  );
}