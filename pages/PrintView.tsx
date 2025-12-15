import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, 
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  GraduationCap, Briefcase, MessageSquare, FileText, Calendar
} from 'lucide-react';
import { PageContainer, HeaderBand, SectionHeader, KPI } from '../components/PrintUI';
import { useLanguage } from '../context/LanguageContext';

const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

export default function PrintView() {
  const { id } = useParams();
  const { t, language, dir } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      MockService.getReportById(id).then(r => {
        if (r) {
          setReport(r);
        } else {
          setError(true);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (report) {
      document.fonts.ready.then(() => {
         // Auto-print disabled for dev experience
      });
    }
  }, [report]);

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

  const DefaultFooter = () => (
    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
      <p className="text-[9px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans" dir="ltr">{new Date().toLocaleDateString(language === 'ar' ? "en-GB" : "en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </p>
      <p className="text-[9px] text-gray-400 uppercase tracking-widest">
        {t('ministry')}
      </p>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pb-12" dir={dir}>
      <div className={`fixed top-4 z-50 flex gap-2 no-print ${isRTL ? 'left-4' : 'right-4'}`}>
         <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold">
            <Printer size={18} /> {t('printNow')}
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-600 p-2.5 rounded-lg shadow-lg hover:bg-gray-100 transition-all border border-gray-200">
            <X size={20} />
         </button>
      </div>

      {/* --- PAGE 1: COVER --- */}
      <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
         {/* Background Elements */}
         <div className={`absolute top-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/2 ${isRTL ? 'left-0 -translate-x-1/3' : 'right-0 translate-x-1/3'}`}></div>
         
         <div className="flex-1 flex flex-col justify-center px-16 relative z-10">
            <div className={`mb-12 border-accent py-4 ${isRTL ? 'border-r-[6px] pr-10' : 'border-l-[6px] pl-10'}`}>
               <div className="flex items-center gap-3 mb-6 opacity-60">
                 <img src="https://flagcdn.com/w40/ae.png" className="h-5 w-auto" alt="UAE" />
                 <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">UAE • MOHRE</span>
               </div>
               <h1 className="text-6xl font-serif font-medium text-gray-900 leading-[1.1] mb-2">
                  {t('loginTitle')}
               </h1>
               <p className="text-xl text-gray-500 font-light mt-4">{t('strategicOverview')}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 max-w-lg">
               <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                      <img 
                         src={`https://flagcdn.com/w320/${data.country === 'Philippines' ? 'ph' : data.country === 'India' ? 'in' : 'ae'}.png`} 
                         className="w-full h-full object-cover"
                         onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">{t('subjectMarket')}</p>
                     <h2 className="text-4xl font-serif font-bold text-gray-900">{data.country}</h2>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                     <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('reference')}</p>
                     <p className="font-mono text-sm text-gray-800 font-sans" dir="ltr">{report.id}</p>
                  </div>
                  <div>
                     <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('date')}</p>
                     <p className="font-mono text-sm text-gray-800 font-sans" dir="ltr">{data.reportDate}</p>
                  </div>
                  <div className="col-span-2">
                     <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('securityClass')}</p>
                     <span className="kpi-chip chip-restrict inline-flex items-center gap-1">
                        <ShieldAlert size={10} /> {t('officialRestricted')}
                     </span>
                  </div>
               </div>
            </div>
            
            <div className="mt-12 border-t border-gray-100 pt-6">
               <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">{t('preparedBy')}</p>
               <p className="text-sm font-bold text-primary">{t('ministry')}</p>
               <p className="text-xs text-gray-500">{t('intRelationsDept')}</p>
            </div>
         </div>
         <div className="h-3 bg-primary w-full"></div>
      </div>

      {/* --- PAGE 2: COMPREHENSIVE OVERVIEW --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        {/* Section 1: Country Profile */}
        <SectionHeader
          icon={Globe}
          title={t('sectionProfile')}
          subtitle={t('keyDemographics')}
          compact={true}
        />
        <div className="grid grid-cols-3 gap-3 mb-4">
          <KPI icon={Landmark} label={t('capital')} value={data.capital} />
          <KPI icon={Users} label={t('population')} value={data.population} />
          <KPI icon={Globe} label={t('officialLanguage')} value={data.officialLanguage} />
          <KPI icon={Banknote} label={t('currency')} value={data.currency} />
          <KPI
            icon={Plane}
            label={t('flightConnectivity')}
            value={data.directFlight ? t('yesDirect') : t('noDirect')}
            sub={t('toUaeAirports')}
            tone={data.directFlight ? "ok" : "warn"}
          />
           <KPI icon={Building} label={t('hdi')} value={data.hdi} />
        </div>
        
        <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
           <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-200 pb-1">
              {t('diplomaticMissions')}
           </h4>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <p className="text-[10px] text-primary font-bold mb-0.5">{t('uaeEmbassy')}</p>
                 <p className="text-sm font-serif font-bold text-gray-900">{data.uaeEmbassyLocation || t('notAvailable')}</p>
              </div>
              <div>
                 <p className="text-[10px] text-accent font-bold mb-0.5">{t('foreignEmbassy')}</p>
                 <p className="text-sm font-serif font-bold text-gray-900">{data.foreignEmbassyLocation || t('notAvailable')}</p>
              </div>
           </div>
        </div>

        {/* Section 2: Economic Landscape */}
        <SectionHeader
          icon={TrendingUp}
          title={t('economicLandscape')}
          subtitle={t('tradeEducation')}
          compact={true}
        />
        <div className="grid grid-cols-3 gap-3 mb-4">
           <KPI icon={Banknote} label={t('gdp')} value={data.gdp} />
           <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} />
           <KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} tone="warn" />
        </div>
        
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-4">
           <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-200 pb-1">{t('bilateralTrade')}</h4>
           <div className="flex gap-4">
              <div className="flex-1">
                 <p className="text-[10px] text-primary font-bold mb-0.5">{t('importsFromUae')}</p>
                 <p className="text-lg font-serif font-bold text-gray-900 leading-none" dir="ltr">{data.economicStats.totalImportsFromUAE}</p>
                 <p className="text-[9px] text-gray-500 mt-1 truncate">{data.economicStats.topImportProducts.slice(0,3).join(', ')}</p>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex-1">
                 <p className="text-[10px] text-accent font-bold mb-0.5">{t('exportsToUae')}</p>
                 <p className="text-lg font-serif font-bold text-gray-900 leading-none" dir="ltr">{data.economicStats.totalExportsToUAE}</p>
                 <p className="text-[9px] text-gray-500 mt-1 truncate">{data.economicStats.topExportProducts.slice(0,3).join(', ')}</p>
              </div>
           </div>
        </div>

        {/* Section 3: Education */}
        <SectionHeader
          icon={GraduationCap}
          title={t('educationInsights')}
          subtitle=""
          compact={true}
        />
        <div className="grid grid-cols-3 gap-3 mb-4">
           <KPI icon={GraduationCap} label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} />
           <KPI icon={GraduationCap} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} />
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex flex-col justify-center">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500 mb-1">{t('topUniversities')}</p>
              <ul className="text-[10px] text-gray-700 leading-tight space-y-0.5">
                 {data.educationStats.topUniversities.slice(0,5).map((u, i) => (
                    <li key={i} className="break-words">• {u}</li>
                 ))}
              </ul>
           </div>
        </div>

        {/* Section 4: Partner Workforce */}
        <SectionHeader
          icon={Users}
          title={`${t('sectionWorkforce')}: ${data.country}`}
          subtitle={t('sourceMarketAnalysis')}
          compact={true}
        />
        <div className="grid grid-cols-4 gap-3">
           <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} />
           <div className="col-span-2 kpi-card flex items-center justify-around">
              <div className="text-center">
                 <p className="kpi-label mb-1">{t('maleParticipation')}</p>
                 <p className="text-lg font-serif font-bold text-blue-600 leading-none" dir="ltr">{data.workforceStats.participationMale}%</p>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="text-center">
                 <p className="kpi-label mb-1">{t('femaleParticipation')}</p>
                 <p className="text-lg font-serif font-bold text-pink-600 leading-none" dir="ltr">{data.workforceStats.participationFemale}%</p>
              </div>
           </div>
           <KPI icon={Banknote} label={t('avgWage')} value={data.averageWage} tone="ok" />
        </div>

      </PageContainer>

      {/* --- PAGE 3: UAE WORKFORCE (Standalone) --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        <SectionHeader
          icon={Building}
          title={t('sectionUaeWorkforce')}
          subtitle={t('domesticAnalysis')}
        />

        <div className="grid grid-cols-2 gap-4 mb-6">
           <KPI 
             icon={Briefcase} 
             label={t('mohrePrivate')} 
             value={data.uaeWorkforceStats.mohre.totalPrivate.value} 
             sub={`${t('dataAsOf')} ${data.uaeWorkforceStats.mohre.totalPrivate.date}`} 
           />
           <KPI 
             icon={Users} 
             label={t('mohreDomestic')} 
             value={data.uaeWorkforceStats.mohre.totalDomestic.value} 
             sub={`${t('dataAsOf')} ${data.uaeWorkforceStats.mohre.totalDomestic.date}`}
             tone="warn"
           />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
           {/* MOHRE Chart */}
           <div className="p-4 border border-gray-200 rounded-xl">
              <p className="kpi-label mb-2 text-center text-xs text-primary">{t('workersByEmirate')}</p>
              <div className="h-48 w-full" dir="ltr">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={data.uaeWorkforceStats.mohre.byEmirate} margin={{top: 5, right: 30, bottom: 5, left: -20}}>
                        <XAxis dataKey="name" tick={{fontSize: 9}} interval={0} height={30} />
                        <YAxis tick={{fontSize: 9}} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                           {data.uaeWorkforceStats.mohre.byEmirate.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                           ))}
                        </Bar>
                     </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* ICP Chart */}
           <div className="p-4 border border-gray-200 rounded-xl">
              <p className="kpi-label mb-2 text-center text-xs text-accent">{t('residentsByEmirate')}</p>
              <p className="text-[10px] text-gray-400 text-center mb-2">{t('icpHeader')}</p>
              <div className="h-48 w-full" dir="ltr">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={data.uaeWorkforceStats.icp.byEmirate} margin={{top: 5, right: 30, bottom: 5, left: -20}}>
                        <XAxis dataKey="name" tick={{fontSize: 9}} interval={0} height={30} />
                        <YAxis tick={{fontSize: 9}} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                           {data.uaeWorkforceStats.icp.byEmirate.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={BLUE_PALETTE[(index + 2) % BLUE_PALETTE.length]} />
                           ))}
                        </Bar>
                     </BarChart>
                 </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-gray-400 italic mt-2 text-center px-4">{t('icpDisclaimer')}</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
           <div className="border border-gray-200 rounded-xl p-4">
              <p className="kpi-label mb-3">{t('workersBySector')} (Top 5)</p>
              <div className="space-y-3">
                 {data.uaeWorkforceStats.mohre.bySector.slice(0,5).map((s, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-[10px] mb-1">
                          <span className="font-bold text-gray-700 truncate w-32">{s.name}</span>
                          <span className="font-mono text-gray-500 font-sans" dir="ltr">{s.value}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden" dir="ltr">
                          <div className="h-full bg-primary" style={{width: `${Math.min(s.value, 100)}%`}}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="kpi-label mb-3">{t('additionalIndicators')}</p>
              <div className="space-y-4">
                 {data.uaeWorkforceStats.custom.slice(0, 4).map((stat) => (
                    <div key={stat.id} className="flex justify-between items-end border-b border-gray-200 pb-2 last:border-0">
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">{stat.label}</p>
                          <p className="text-[9px] text-gray-400 font-sans">{stat.date}</p>
                       </div>
                       <p className="text-lg font-serif font-bold text-gray-900 font-sans" dir="ltr">{stat.value}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </PageContainer>

      {/* --- PAGE 4: RELATIONS (Combined) --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        <SectionHeader
          icon={Handshake}
          title={t('relationsDelegations')}
          subtitle={t('bilateralEngagement')}
        />

        {/* Agreements */}
        <div className="mb-8 avoid-break">
           <h3 className="kpi-label mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
              <FileText size={12} /> {t('keyAgreements')}
           </h3>
           
           <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 mb-2 px-3">
             <div className="col-span-5">{t('titleProtocol')}</div>
             <div className="col-span-5">{t('keyProvisions')}</div>
             <div className="col-span-2 text-end">{t('status')}</div>
           </div>

           <div className="space-y-3">
              {data.bilateralAgreements.map((agreement, idx) => (
                 <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                       <p className="text-sm font-bold text-gray-900">{agreement.title}</p>
                       <p className="text-[10px] font-mono text-gray-400 mt-0.5 font-sans" dir="ltr">{agreement.date}</p>
                    </div>
                    <div className="col-span-5">
                       <p className="text-xs text-gray-600 leading-snug">{agreement.summary}</p>
                    </div>
                    <div className="col-span-2 text-end">
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${agreement.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {agreement.status === 'Active' ? t('active') : t('pending')}
                       </span>
                    </div>
                 </div>
              ))}
              {data.bilateralAgreements.length === 0 && (
                 <p className="text-xs text-gray-400 italic text-center py-2">{t('noAgreements')}</p>
              )}
           </div>
        </div>

        {/* Interactions */}
        <div className="mb-8 avoid-break">
           <h3 className="kpi-label mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Calendar size={12} /> {t('recentHighLevelInteractions')}
           </h3>
           <div className="grid grid-cols-2 gap-4">
              {data.recentInteractions.map((item, idx) => (
                 <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-1">
                       <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-1.5 py-0.5 rounded">{item.type}</span>
                       <span className="text-[9px] font-mono text-gray-400 font-sans" dir="ltr">{item.date}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-snug line-clamp-3">{item.details}</p>
                 </div>
              ))}
              {data.recentInteractions.length === 0 && (
                 <div className="col-span-2 text-center py-2 text-xs text-gray-400 italic">{t('notAvailable')}</div>
              )}
           </div>
        </div>

        {/* Discussion Points */}
        <div className="avoid-break">
           <h3 className="kpi-label mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
              <MessageSquare size={12} /> {t('pointsDiscussion')}
           </h3>
           <ul className="space-y-2">
              {data.pointsOfDiscussion.map((point, idx) => (
                 <li key={idx} className="flex gap-3 text-xs text-gray-700 items-start">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <div>
                       <strong className="block text-gray-900">{point.title}</strong>
                       <span className="text-gray-600">{point.content}</span>
                    </div>
                 </li>
              ))}
              {data.pointsOfDiscussion.length === 0 && (
                 <li className="text-center py-2 text-xs text-gray-400 italic">{t('notAvailable')}</li>
              )}
           </ul>
        </div>
      </PageContainer>

      {/* --- PAGE 5: DELEGATIONS (Standalone) --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        <SectionHeader
          icon={Users}
          title={t('sectionDelegation')}
          subtitle=""
        />

        <div className="grid grid-cols-2 gap-8 mt-8">
           <div className="avoid-break">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-primary pb-2">
                 <img src="https://flagcdn.com/w40/ae.png" className="h-4 w-auto" alt="UAE" />
                 <p className="text-xs font-bold uppercase text-primary tracking-widest">{t('uaeDelegation')}</p>
              </div>
              <div className="space-y-6">
                 {data.delegations.uae.map((d) => (
                    <div key={d.id} className="flex gap-4 items-start">
                       <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                          {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">{d.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{d.title}</p>
                          <p className="text-[10px] text-gray-400 leading-tight line-clamp-2 italic">{d.bio}</p>
                       </div>
                    </div>
                 ))}
                 {data.delegations.uae.length === 0 && <p className="text-xs text-gray-400 italic">{t('notAvailable')}</p>}
              </div>
           </div>

           <div className="avoid-break">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-accent pb-2">
                 <Globe size={14} className="text-accent" />
                 <p className="text-xs font-bold uppercase text-accent tracking-widest">{t('partnerDelegation')}</p>
              </div>
              <div className="space-y-6">
                 {data.delegations.partner.map((d) => (
                    <div key={d.id} className="flex gap-4 items-start">
                       <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                          {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">{d.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{d.title}</p>
                          <p className="text-[10px] text-gray-400 leading-tight line-clamp-2 italic">{d.bio}</p>
                       </div>
                    </div>
                 ))}
                 {data.delegations.partner.length === 0 && <p className="text-xs text-gray-400 italic">{t('notAvailable')}</p>}
              </div>
           </div>
        </div>
      </PageContainer>
    </div>
  );
}