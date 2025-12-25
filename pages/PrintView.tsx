
import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
// Import missing types for better type inference in map callbacks
import { Report, RecentInteraction, PointOfDiscussion } from '../types';
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
      if (trimmed) { result.push(<p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />); }
    }
  });
  if (inList) { result.push(<ul key="list-final" className="list-disc mb-1 ms-6">{listItems.map((item, idx) => (<li key={idx} dangerouslySetInnerHTML={{ __html: item }} />))}</ul>); }
  return <div className={`rich-text-content ${sizeClass} leading-[1.5] overflow-visible`}>{result}</div>;
};

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  if (!arr) return chunks;
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
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

  const interactionChunks = chunkArray(data.recentInteractions || [], 4);
  const pointsChunks = chunkArray(data.pointsOfDiscussion || [], 5);
  const agreementChunks = chunkArray([...(data.bilateralAgreements || [])].sort((a, b) => (b.date || '').localeCompare(a.date || [])), 6);

  const getSource = (type: string) => {
    const sources: any = {
      en: { demo: '*(World Bank, 2025)', economy: '*(World Bank, 2025)', trade: '*(UN Comtrade, 2025)', edu: '*(UNESCO, 2025)', tip: '*(US TIP, 2024)' },
      ar: { demo: '*(البنك الدولي، 2025)', economy: '*(البنك الدولي، 2025)', trade: '*(كوم تريد، 2025)', edu: '*(اليونسكو، 2025)', tip: '*(تقرير الاتجار، 2024)' }
    };
    return sources[language]?.[type] || '';
  };

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full">
      <p className="text-[8px] text-gray-400">{t('generatedOn')} {new Date().toLocaleDateString()}</p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">{t('ministry')}</p>
    </div>
  );

  const HeaderBand = ({ country, reportId, title, flagUrl }: any) => {
    const flagSrc = flagUrl || `https://flagcdn.com/w40/ae.png`;
    return (
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
        <div className="flex items-center gap-3">
          <img src={flagSrc} className="h-6 w-auto shadow-sm object-cover" alt={country} />
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">{title}</p>
            <p className="text-sm font-bold text-primary-dark uppercase">{country}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100 font-bold text-[10px]">
          <ShieldAlert size={12} /> RESTRICTED
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white report-root" dir={dir}>
      <style>{`
        .report-root { font-family: "Sakkal Majalla", serif !important; }
        .report-root * { font-family: "Sakkal Majalla", serif !important; }
        @media print { .no-print { display: none !important; } .page-break { break-after: page; } }
      `}</style>
      
      <div className="fixed top-6 right-6 flex gap-3 no-print z-50">
         <button onClick={() => window.print()} className="bg-primary text-white px-6 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2">
            <Printer size={18} /> {t('printNow')}
         </button>
      </div>

      {/* PAGE 1: COVER */}
      <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col justify-center px-20 shadow-xl print:shadow-none mb-8 print:mb-0 page-break">
        <div className={`border-accent py-6 ${isRTL ? 'border-r-[8px] pr-12 text-right' : 'border-l-[8px] pl-12'}`}>
          <img src="https://flagcdn.com/w80/ae.png" className="h-12 w-auto mb-8 opacity-80" alt="UAE" />
          <h1 className="text-[64px] font-bold text-gray-900 leading-[1.1] mb-4">{t('loginTitle')}</h1>
          <p className="text-2xl text-gray-500 font-light uppercase tracking-wider">{t('strategicOverview')}</p>
        </div>
        <div className="bg-gray-50 rounded-3xl p-10 mt-12 border border-gray-100 max-w-xl">
          <div className="flex items-center gap-8 mb-8">
            <img src={data.flagUrl || 'https://flagcdn.com/w160/ae.png'} className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl object-cover" />
            <div>
              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">{t('subjectMarket')}</p>
              <h2 className="text-4xl font-bold text-gray-900">{data.country}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t('reference')}</p><p className="font-mono">{report.id}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t('date')}</p><p className="font-mono">{data.reportDate}</p></div>
          </div>
        </div>
      </div>

      {/* PAGE 2: PROFILE & ECONOMY */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
        <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle={t('keyDemographics')} compact />
        <div className="grid grid-cols-4 gap-3 mb-6">
          <KPI icon={Landmark} label={t('capital')} value={data.capital} />
          <KPI icon={Users} label={t('population')} value={data.population} sub={getSource('demo')} />
          <KPI icon={Banknote} label={t('currency')} value={data.currency} />
          <KPI icon={Building} label={t('hdi')} value={data.hdi} sub={getSource('demo')} />
          <KPI icon={Shield} label={t('crimeRate')} value={data.crimeRate} />
          <KPI icon={BookOpen} label={t('literacyRate')} value={data.literacyRate} />
          <KPI icon={Building2} label={t('governmentType')} value={data.governmentType} />
          <KPI icon={Briefcase} label={t('workforceMinistry')} value={data.workforceMinistry} />
        </div>
        
        <SectionHeader icon={TrendingUp} title={t('economicLandscape')} subtitle={t('tradeEducation')} compact />
        <div className="grid grid-cols-4 gap-3 mb-6">
          <KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" sub={getSource('tip')} />
          <KPI icon={Banknote} label={t('gdp')} value={data.economicStats.gdp} sub={getSource('economy')} />
          <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} sub={getSource('economy')} />
          <KPI icon={ArrowRightLeft} label={t('remittances')} value={data.economicStats.remittancesFromUAE} sub={t('remittancesFromUaeLabel')} />
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <ArrowRightLeft size={14} /> {t('bilateralTrade')} <span className="text-[8px] text-gray-400 font-normal italic">{getSource('trade')}</span>
          </h4>
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1 text-primary"><ArrowDownLeft size={16} /><p className="text-[10px] font-bold uppercase">{t('exportsToUae')}</p></div>
              <p className="text-xl font-bold text-gray-900">{data.economicStats.totalExportsToUAE}</p>
              <p className="text-[11px] text-gray-600 italic leading-snug">{data.economicStats.topImportProducts.join(', ')}</p>
            </div>
            <div className="space-y-1 border-s border-gray-200 ps-10">
              <div className="flex items-center gap-2 mb-1 text-accent"><ArrowUpRight size={16} /><p className="text-[10px] font-bold uppercase">{t('importsFromUae')}</p></div>
              <p className="text-xl font-bold text-gray-900">{data.economicStats.totalImportsFromUAE}</p>
              <p className="text-[11px] text-gray-600 italic leading-snug">{data.economicStats.topExportProducts.join(', ')}</p>
            </div>
          </div>
        </div>

        <SectionHeader icon={GraduationCap} title={t('educationInsights')} compact />
        <div className="grid grid-cols-3 gap-3">
          <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} />
          <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} />
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
            <p className="text-[10px] font-bold text-gray-700 uppercase mb-2">{t('topUniversities')}</p>
            <ul className="text-[10px] text-gray-600 space-y-1">{data.educationStats.topUniversities.slice(0, 4).map((u, i) => (<li key={i} className="flex gap-1.5 items-start font-medium"><span className="text-primary">•</span><span className="truncate">{u}</span></li>))}</ul>
          </div>
        </div>
      </PageContainer>

      {/* PAGE 3: WORKFORCE IN UAE */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
        <SectionHeader icon={Users} title={t('sectionUaeWorkforce')} subtitle={t('domesticAnalysis')} />
        <div className="grid grid-cols-3 gap-4 mb-8">
           <KPI icon={Users} label={t('totalPrivate')} value={data.uaeWorkforceStats.mohre.totalPrivate.value} sub={t('dataAsOf') + ' ' + data.uaeWorkforceStats.mohre.totalPrivate.date} chip="MOHRE" />
           <KPI icon={Users} label={t('totalDomestic')} value={data.uaeWorkforceStats.mohre.totalDomestic.value} sub={t('dataAsOf') + ' ' + data.uaeWorkforceStats.mohre.totalDomestic.date} chip="MOHRE" />
           {data.uaeWorkforceStats.custom.map(stat => (
              <KPI key={stat.id} icon={TrendingUp} label={stat.label} value={stat.value} sub={t('dataAsOf') + ' ' + stat.date} tone={stat.isTotal ? "ok" : "info"} />
           ))}
        </div>
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b border-gray-100 pb-2">{t('workersByEmirate')}</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...data.uaeWorkforceStats.mohre.byEmirate].sort((a,b) => b.value - a.value)} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {data.uaeWorkforceStats.mohre.byEmirate.map((_, i) => <Cell key={i} fill={BLUE_PALETTE[i % 6]} />)}
                    <LabelList dataKey="value" position="right" style={{fontSize: 9, fontWeight: 800, fill: '#374151'}} formatter={(v:any) => new Intl.NumberFormat().format(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b border-gray-100 pb-2">{t('residentsByEmirate')}</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...data.uaeWorkforceStats.icp.byEmirate].sort((a,b) => b.value - a.value)} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18} fill="#4b5563">
                    <LabelList dataKey="value" position="right" style={{fontSize: 9, fontWeight: 800, fill: '#374151'}} formatter={(v:any) => new Intl.NumberFormat().format(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* PAGE 4: PARTNER WORKFORCE */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
        <SectionHeader icon={Briefcase} title={t('sectionWorkforce')} subtitle={t('sourceMarketAnalysis')} />
        <div className="grid grid-cols-4 gap-3 mb-10">
           <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} />
           <KPI icon={Activity} label={t('maleParticipation')} value={`${data.workforceStats.participationMale}%`} />
           <KPI icon={Activity} label={t('femaleParticipation')} value={`${data.workforceStats.participationFemale}%`} />
           <KPI icon={Banknote} label={t('avgWage')} value={data.averageWage} />
        </div>
        <div className="grid grid-cols-2 gap-12">
           <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-2">{t('migrationDestinations')}</h4>
              <div className="space-y-4">
                 {data.workforceStats.migrationDestinations.slice(0, 6).map((dest, idx) => (
                   <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tight"><span className="text-gray-600">{dest.country}</span><span className="text-primary">{dest.count}</span></div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min((parseFloat(dest.count) / 10) * 100, 100)}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-2">{t('sectorDistribution')}</h4>
              <div className="h-[280px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.workforceStats.topSectors} margin={{ right: 30 }}>
                       <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} />
                       <YAxis hide />
                       <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                          {data.workforceStats.topSectors.map((_, i) => <Cell key={i} fill={BLUE_PALETTE[i % 6]} />)}
                          <LabelList dataKey="value" position="top" style={{fontSize: 10, fontWeight: 800}} formatter={(v:any) => `${v}%`} />
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
        <div className="mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-200">
           <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2"><Hammer size={16} /> {t('availableSkills')}</h4>
           <div className="flex flex-wrap gap-2">{data.workforceStats.availableSkills.map((skill, i) => (<span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg shadow-sm"># {skill}</span>))}</div>
        </div>
      </PageContainer>

      {/* RELATIONSHIP & INTERACTIONS PAGES */}
      {interactionChunks.map((chunk, pIdx) => (
        <PageContainer key={`int-${pIdx}`} footer={<DefaultFooter />}>
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={Handshake} title={t('sectionInteractions')} subtitle={t('recentHighLevelInteractions')} />
          <div className="space-y-6">
            {chunk.map((item: RecentInteraction) => (
              <div key={item.id} className="bg-white border rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                  <h4 className="font-bold text-sm text-primary uppercase">{item.title}</h4>
                  <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded">{item.date}</span>
                </div>
                {renderRichText(item.details)}
              </div>
            ))}
          </div>
        </PageContainer>
      ))}

      {pointsChunks.map((chunk, pIdx) => (
        <PageContainer key={`pts-${pIdx}`} footer={<DefaultFooter />}>
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={MessageSquare} title={t('pointsDiscussion')} />
          <div className="space-y-6">
            {chunk.map((item: PointOfDiscussion) => (
              <div key={item.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm mb-3 text-primary-dark">{item.title}</h4>
                {renderRichText(item.content)}
              </div>
            ))}
          </div>
        </PageContainer>
      ))}

      {/* AGREEMENTS PAGE */}
      {agreementChunks.length > 0 ? agreementChunks.map((chunk, pIdx) => (
        <PageContainer key={`agr-${pIdx}`} footer={<DefaultFooter />}>
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={FileText} title={t('sectionAgreements')} subtitle={t('keyAgreements')} />
          <div className="space-y-8">
            {chunk.map((agreement, idx) => (
              <div key={idx} className="border-b last:border-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[15px] font-bold text-primary">{agreement.title}</h4>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${agreement.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>{agreement.status}</span>
                </div>
                <p className="text-[11px] text-gray-400 font-bold mb-3 uppercase tracking-wider">{t('date')}: {agreement.date}</p>
                {renderRichText(agreement.summary)}
              </div>
            ))}
          </div>
        </PageContainer>
      ) : (
        <PageContainer footer={<DefaultFooter />}>
          <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
          <SectionHeader icon={FileText} title={t('sectionAgreements')} />
          <div className="text-center py-40 text-gray-300 border-2 border-dashed rounded-3xl opacity-50"><p className="font-bold uppercase tracking-widest">{t('noAgreements')}</p></div>
        </PageContainer>
      )}

      {/* DELEGATION PAGE */}
      <PageContainer footer={<DefaultFooter />}>
        <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />
        <SectionHeader icon={Users} title={t('uaeDelegation')} subtitle={t('ministryOfficials')} />
        <div className="grid grid-cols-2 gap-4 mb-10">
          {data.delegations.uae.map(member => (
            <div key={member.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0 shadow-inner"><img src={member.imageUrl} className="w-full h-full object-cover" /></div>
              <div><h4 className="text-xs font-bold uppercase">{member.name}</h4><p className="text-[10px] text-primary-dark font-bold mb-2">{member.title}</p>{renderRichText(member.bio, "text-[9px]")}</div>
            </div>
          ))}
        </div>
        <SectionHeader icon={Users} title={t('partnerDelegation')} subtitle={t('counterpartOfficials')} />
        <div className="grid grid-cols-2 gap-4">
          {data.delegations.partner.map(member => (
            <div key={member.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0 shadow-inner"><img src={member.imageUrl} className="w-full h-full object-cover" /></div>
              <div><h4 className="text-xs font-bold uppercase">{member.name}</h4><p className="text-[10px] text-accent font-bold mb-2">{member.title}</p>{renderRichText(member.bio, "text-[9px]")}</div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
