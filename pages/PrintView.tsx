
import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, Building2,
  Handshake, Landmark, Banknote, Printer, X, ShieldAlert,
  Briefcase, MessageSquare, FileText, CheckCircle, BookOpen, Shield
} from 'lucide-react';
import { PageContainer, SectionHeader, KPI, HeaderBand } from '../components/PrintUI';
import { useLanguage } from '../context/LanguageContext';

const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

const renderRichText = (text: string, sizeClass: string = "text-[18px]") => {
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
        result.push(<ul key={`list-${i}`} className="list-disc mb-3 ms-10">{listItems.map((item, idx) => (<li key={idx} className="mb-1" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
        inList = false;
      }
      if (trimmed) result.push(<p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: line }} />);
    }
  });
  if (inList) result.push(<ul key="list-final" className="list-disc mb-3 ms-10">{listItems.map((item, idx) => (<li key={idx} className="mb-1" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
  return <div className={`rich-text-content ${sizeClass} leading-relaxed report-font`}>{result.length > 0 ? result : text}</div>;
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

  if (error || !report) return <div className="h-screen flex items-center justify-center font-bold text-primary report-font">{!report ? t('generatingDoc') : t('reportNotFound')}</div>;

  const { data } = report;
  const isRTL = language === 'ar';
  const formatCompact = (val: any) => isNaN(Number(val)) ? val : new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(Number(val));
  const getSource = (type: string) => language === 'ar' ? '*(بيانات رسمية، 2025)' : '*(Official Data, 2025)';

  const DefaultFooter = () => (
    <div className="flex justify-between items-center w-full px-4 report-font">
      <p className="text-[10px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans" dir="ltr">2025 December 23</span>
      </p>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{t('ministry')}</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir={dir}>
      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-xl bg-white/90 shadow-xl border ${isRTL ? 'left-6' : 'right-6'}`}>
         <button onClick={() => window.print()} className="bg-primary text-white px-8 py-2.5 rounded-lg shadow-lg font-bold flex items-center gap-2"><Printer size={18} /> {t('printNow')}</button>
         <button onClick={() => window.close()} className="bg-white text-gray-500 p-2.5 rounded-lg border"><X size={18} /></button>
      </div>

      <div id="report-content" className="report-font">
        {/* --- PAGE 1: COVER --- */}
        <PageContainer className="shadow-2xl print:shadow-none mb-10 print:mb-0 justify-center px-16">
          <div className={`border-accent py-12 ${isRTL ? 'border-r-[15px] pr-12 text-right' : 'border-l-[15px] pl-12'}`}>
            <div className="flex items-center gap-5 mb-16 opacity-80">
              <img src="https://flagcdn.com/w40/ae.png" className="h-8 w-auto shadow-md" alt="UAE" />
              <span className="text-lg font-bold uppercase tracking-[0.3em] text-primary">UAE • MOHRE</span>
            </div>
            {/* Bold and +1 step bigger titles */}
            <h1 className="text-7xl font-black text-gray-900 leading-[1.1] mb-4">{t('loginTitle')}</h1>
            <p className="text-3xl text-gray-500 uppercase tracking-[0.2em] font-light">{t('strategicOverview')}</p>
          </div>
          <div className="bg-gray-50 rounded-[2.5rem] p-12 border-2 border-gray-100 max-w-2xl mt-12 shadow-sm">
            <div className="flex items-center gap-8 mb-12">
              <img src={data.flagUrl || `https://flagcdn.com/w320/in.png`} className="w-32 h-auto rounded-2xl border-4 border-white shadow-lg" alt="flag" />
              <div>
                <p className="text-base font-bold text-accent uppercase tracking-widest mb-1">{t('subjectMarket')}</p>
                <h2 className="text-6xl font-bold text-gray-900 leading-none">{data.country}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10 text-xl">
              <div><p className="text-gray-400 text-xs uppercase font-bold mb-1">Ref:</p><p className="font-mono text-gray-800">{report.id}</p></div>
              <div><p className="text-gray-400 text-xs uppercase font-bold mb-1">Date:</p><p className="font-mono text-gray-800">{data.reportDate}</p></div>
            </div>
          </div>
        </PageContainer>

        {/* --- PAGE 2: PROFILE & ECONOMY --- */}
        <PageContainer footer={<DefaultFooter />} className="shadow-2xl print:shadow-none mb-10 print:mb-0 px-12 pt-12">
          <HeaderBand country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={t('keyDemographics')} compact={true} />
          {/* Exact original grid (3 cols) */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <KPI icon={Landmark} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} />
            <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
            <KPI icon={Shield} label={t('crimeRate')} value={data.crimeRate} />
            <KPI icon={BookOpen} label={t('literacyRate')} value={data.literacyRate} />
          </div>
          <SectionHeader icon={TrendingUp} title={t('economicLandscape')} subtitle={t('tradeEducation')} compact={true} />
          <div className="grid grid-cols-2 gap-4">
            <KPI icon={Banknote} label={t('gdp')} value={data.gdp} />
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} />
            <div className="col-span-2"><KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" /></div>
          </div>
        </PageContainer>

        {/* --- PAGE 3: UAE WORKFORCE --- */}
        <PageContainer footer={<DefaultFooter />} className="shadow-2xl print:shadow-none mb-10 print:mb-0 px-12 pt-12">
          <HeaderBand country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          <SectionHeader icon={Building} title={t('sectionUaeWorkforce')} subtitle={t('domesticAnalysis')} />
          <div className="grid grid-cols-2 gap-6 mb-8">
            <KPI icon={Briefcase} label={t('mohrePrivate')} value={data.uaeWorkforceStats.mohre.totalPrivate.value} />
            <KPI icon={Users} label={t('mohreDomestic')} value={data.uaeWorkforceStats.mohre.totalDomestic.value} tone="warn" />
          </div>
          <div className="p-8 border-2 border-gray-100 rounded-[2rem] bg-white shadow-sm">
            <h3 className="text-lg font-bold text-primary-dark mb-6 text-center uppercase tracking-widest">{t('workersByEmirate')}</h3>
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...data.uaeWorkforceStats.mohre.byEmirate].sort((a,b)=>b.value-a.value)}>
                  <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 'bold'}} height={30} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <LabelList dataKey="value" position="top" formatter={formatCompact} style={{ fontSize: '11px', fill: '#1e3a8a', fontWeight: 'bold' }} />
                    {data.uaeWorkforceStats.mohre.byEmirate.map((_, i) => (<Cell key={i} fill={BLUE_PALETTE[i % BLUE_PALETTE.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </PageContainer>

        {/* --- PAGE 4: RELATIONSHIP --- */}
        <PageContainer footer={<DefaultFooter />} className="shadow-2xl print:shadow-none mb-10 print:mb-0 px-12 pt-12">
          <HeaderBand country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          <SectionHeader icon={Handshake} title={t('relationshipSummary')} subtitle={t('bilateralEngagement')} />
          <div className="space-y-6 mt-4">
            {data.recentInteractions.slice(0, 3).map((item, idx) => (
              <div key={idx} className="border-2 border-gray-100 rounded-[1.5rem] p-6 bg-gray-50 shadow-sm avoid-break">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase text-white bg-primary px-4 py-1.5 rounded-lg">{item.type}</span>
                  <span className="text-sm font-bold text-gray-400 font-sans" dir="ltr">{item.date}</span>
                </div>
                <h3 className="report-h3 !border-accent !ps-4 !text-xl mb-3">{item.title}</h3>
                {renderRichText(item.details, "text-[18px]")}
              </div>
            ))}
          </div>
        </PageContainer>

        {/* --- PAGE FINAL: DELEGATIONS --- */}
        <PageContainer footer={<DefaultFooter />} className="shadow-2xl print:shadow-none px-12 pt-12">
          <HeaderBand country={data.country} reportId={report.id} flagUrl={data.flagUrl} />
          <SectionHeader icon={Users} title={t('sectionDelegation')} />
          <div className="space-y-8 mt-6">
             <div className="border-b-4 border-primary pb-2 mb-4">
               <h3 className="text-3xl font-bold uppercase tracking-widest text-primary">{t('uaeDelegation')}</h3>
             </div>
             {data.delegations.uae.slice(0, 1).map((d) => (
               <div key={d.id} className="flex gap-10 items-start p-8 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 shadow-sm avoid-break">
                  <img src={d.imageUrl} className="w-40 h-52 rounded-2xl border-4 border-white shadow-md object-cover" alt="portrait" />
                  <div className="flex-1">
                    <h3 className="text-4xl font-bold text-gray-900 mb-1">{d.name}</h3>
                    <p className="text-xl font-bold text-primary uppercase mb-6 tracking-widest">{d.title}</p>
                    <div className="border-l-4 border-accent ps-6">{renderRichText(d.bio, "text-lg italic text-gray-700")}</div>
                  </div>
               </div>
             ))}
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
