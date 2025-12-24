
import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, Building2, Handshake, Landmark, 
  Banknote, Printer, X, AlertTriangle, ShieldAlert, GraduationCap, 
  Briefcase, MessageSquare, FileText, ArrowDownLeft, ArrowUpRight, 
  BookOpen, Shield, ArrowRightLeft, Hammer 
} from 'lucide-react';
import { PageContainer, SectionHeader, KPI, HeaderBand } from '../components/PrintUI';
import { useLanguage } from '../context/LanguageContext';

const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

const renderRichText = (text: string, sizeClass: string = "text-[20px]") => {
  if (!text) return null;
  const processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
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
        result.push(<ul key={`list-${i}`} className="list-disc mb-4 ms-10">{listItems.map((item, idx) => (<li key={idx} className="mb-1" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
        inList = false;
      }
      if (trimmed) result.push(<p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: line }} />);
    }
  });
  if (inList) result.push(<ul key="list-final" className="list-disc mb-4 ms-10">{listItems.map((item, idx) => (<li key={idx} className="mb-1" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
  return <div className={`rich-text-content ${sizeClass} leading-relaxed report-font`}>{result.length > 0 ? result : text}</div>;
};

export default function PrintView() {
  const getParamId = () => {
    const parts = window.location.hash.split('/');
    return parts.length >= 3 && parts[1] === 'print' ? parts[2] : undefined;
  };
  const id = getParamId();
  const { t, language, dir } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) MockService.getReportById(id).then(r => r ? setReport(r) : setError(true));
  }, [id]);

  if (error || !report) return <div className="h-screen flex items-center justify-center font-bold text-primary">{!report ? t('generatingDoc') : t('reportNotFound')}</div>;

  const { data } = report;
  const isRTL = language === 'ar';
  const formatCompact = (val: any) => isNaN(Number(val)) ? val : new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(Number(val));
  const getSource = (type: string) => language === 'ar' ? '*(بيانات رسمية، 2025)' : '*(Official Data, 2025)';

  return (
    <div className="bg-gray-50 min-h-screen" dir={dir}>
      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-2xl bg-white/90 shadow-2xl border ${isRTL ? 'left-6' : 'right-6'}`}>
         <button onClick={() => window.print()} className="bg-primary text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2"><Printer size={20} /> {t('printNow')}</button>
         <button onClick={() => window.close()} className="bg-white text-gray-500 p-3 rounded-xl border"><X size={20} /></button>
      </div>

      <div id="report-content" className="report-font">
        {/* --- COVER PAGE --- */}
        <PageContainer className="shadow-2xl print:shadow-none mb-10 print:mb-0 justify-center px-24">
          <div className={`border-accent py-12 ${isRTL ? 'border-r-[20px] pr-16 text-right' : 'border-l-[20px] pl-16'}`}>
            <div className="flex items-center gap-6 mb-16 opacity-80">
              <img src="https://flagcdn.com/w40/ae.png" className="h-10 w-auto shadow-md" alt="UAE" />
              <span className="text-xl font-bold uppercase tracking-[0.4em] text-primary">UAE • MOHRE</span>
            </div>
            {/* Bold and 2pt bigger titles */}
            <h1 className="text-8xl font-black text-gray-900 leading-tight mb-4">{t('loginTitle')}</h1>
            <p className="text-4xl text-gray-500 uppercase tracking-widest">{t('strategicOverview')}</p>
          </div>
          <div className="bg-gray-50 rounded-[3rem] p-16 border-4 border-gray-100 max-w-3xl mt-12 shadow-sm">
            <div className="flex items-center gap-10 mb-12">
              <img src={data.flagUrl || `https://flagcdn.com/w320/in.png`} className="w-40 h-auto rounded-3xl border-8 border-white shadow-xl" alt="flag" />
              <div>
                <p className="text-xl font-bold text-accent uppercase tracking-widest mb-2">{t('subjectMarket')}</p>
                <h2 className="text-7xl font-bold text-gray-900">{data.country}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-12 text-2xl">
              <div><p className="text-gray-400 uppercase font-bold mb-2">Ref:</p><p className="font-mono text-gray-800">{report.id}</p></div>
              <div><p className="text-gray-400 uppercase font-bold mb-2">Date:</p><p className="font-mono text-gray-800">{data.reportDate}</p></div>
            </div>
          </div>
        </PageContainer>

        {/* --- PAGE 2: PROFILE & ECONOMY --- */}
        <PageContainer className="shadow-2xl print:shadow-none mb-10 print:mb-0 px-16 pt-16">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={t('keyDemographics')} compact />
          <div className="grid grid-cols-2 gap-6 mb-10">
            <KPI icon={Landmark} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} />
            <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
            <KPI icon={Shield} label={t('crimeRate')} value={data.crimeRate} />
            <KPI icon={BookOpen} label={t('literacyRate')} value={data.literacyRate} />
          </div>
          <SectionHeader icon={TrendingUp} title={t('economicLandscape')} subtitle={t('tradeEducation')} compact />
          <div className="grid grid-cols-2 gap-6">
            <KPI icon={Banknote} label={t('gdp')} value={data.gdp} />
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} />
            <div className="col-span-2"><KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" /></div>
          </div>
        </PageContainer>

        {/* --- PAGE 3: UAE WORKFORCE --- */}
        <PageContainer className="shadow-2xl print:shadow-none mb-10 print:mb-0 px-16 pt-16">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Building} title={t('sectionUaeWorkforce')} subtitle={t('domesticAnalysis')} />
          <div className="grid grid-cols-2 gap-8 mb-12">
            <KPI icon={Briefcase} label={t('mohrePrivate')} value={data.uaeWorkforceStats.mohre.totalPrivate.value} />
            <KPI icon={Users} label={t('mohreDomestic')} value={data.uaeWorkforceStats.mohre.totalDomestic.value} tone="warn" />
          </div>
          <div className="grid grid-cols-1 gap-10">
            <div className="p-10 border-4 border-gray-100 rounded-[3rem] bg-white shadow-lg">
              <h3 className="text-2xl font-bold text-primary-dark mb-8 text-center uppercase tracking-widest">{t('workersByEmirate')}</h3>
              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...data.uaeWorkforceStats.mohre.byEmirate].sort((a,b)=>b.value-a.value)}>
                    <XAxis dataKey="name" tick={{fontSize: 14, fontWeight: 'bold'}} height={40} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      <LabelList dataKey="value" position="top" formatter={formatCompact} style={{ fontSize: '14px', fill: '#1e3a8a', fontWeight: 'bold' }} />
                      {data.uaeWorkforceStats.mohre.byEmirate.map((_, i) => (<Cell key={i} fill={BLUE_PALETTE[i % BLUE_PALETTE.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </PageContainer>

        {/* --- PAGE 4: RELATIONSHIP & AGREEMENTS --- */}
        <PageContainer className="shadow-2xl print:shadow-none mb-10 print:mb-0 px-16 pt-16">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Handshake} title={t('relationshipSummary')} subtitle={t('bilateralEngagement')} />
          <div className="space-y-8 mt-6">
            {data.recentInteractions.slice(0, 3).map((item, idx) => (
              <div key={idx} className="border-4 border-gray-100 rounded-[2.5rem] p-10 bg-gray-50 shadow-md avoid-break">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold uppercase text-white bg-primary px-6 py-2 rounded-xl">{item.type}</span>
                  <span className="text-xl font-bold text-gray-400 font-sans" dir="ltr">{item.date}</span>
                </div>
                <h3 className="report-h3 !border-accent !ps-6 !text-4xl mb-6">{item.title}</h3>
                {renderRichText(item.details, "text-[22px]")}
              </div>
            ))}
          </div>
        </PageContainer>

        {/* --- PAGE FINAL: DELEGATIONS --- */}
        <PageContainer className="shadow-2xl print:shadow-none px-16 pt-16">
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Users} title={t('sectionDelegation')} />
          <div className="space-y-12 mt-10">
             <div className="border-b-8 border-primary pb-4 mb-8">
               <h3 className="text-4xl font-bold uppercase tracking-widest text-primary">{t('uaeDelegation')}</h3>
             </div>
             {data.delegations.uae.slice(0, 1).map((d) => (
               <div key={d.id} className="flex gap-12 items-start p-12 bg-gray-50 rounded-[4rem] border-4 border-gray-100 shadow-xl avoid-break">
                  <img src={d.imageUrl} className="w-56 h-72 rounded-3xl border-8 border-white shadow-2xl object-cover" alt="portrait" />
                  <div className="flex-1">
                    <h3 className="text-6xl font-bold text-gray-900 mb-2">{d.name}</h3>
                    <p className="text-3xl font-bold text-primary uppercase mb-10 tracking-widest">{d.title}</p>
                    <div className="border-l-8 border-accent ps-10">{renderRichText(d.bio, "text-2xl italic text-gray-700")}</div>
                  </div>
               </div>
             ))}
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
