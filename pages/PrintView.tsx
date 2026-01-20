
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { Report, Delegate } from '../types';
import { PageContainer, HeaderBand, SectionHeader, KPI } from '../components/PrintUI';
// Fixed: Added missing Button import
import { Button } from '../components/ui/LayoutComponents';
// Fixed: Added missing icon imports (ShieldAlert, Home, BookOpen, Printer)
import { 
  Users, Globe, MapPin, Plane, Building, TrendingUp, 
  Search, Hammer, GraduationCap, Briefcase, Banknote, 
  FileText, MessageSquare, Newspaper, Star, UserCheck,
  ShieldAlert, Home, BookOpen, Printer
} from 'lucide-react';
import { format } from 'date-fns';

export default function PrintView() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  
  const getParamId = () => {
    const hash = window.location.hash;
    const parts = hash.split('/');
    return parts.length >= 3 && parts[1] === 'print' ? parts[2] : null;
  };

  const id = getParamId();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      MockService.getReportById(id).then(r => {
        if (r) setReport(r);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-20 text-center">Loading Report...</div>;
  if (!report) return <div className="p-20 text-center">Report Not Found.</div>;

  const data = report.data;

  const getSource = (type: string) => {
    if (type === 'mohre') return 'Source: MOHRE Registry';
    if (type === 'icp') return 'Source: ICP Residency Data';
    return 'Source: Open Data / AI Research';
  };

  return (
    <div className="bg-gray-100 py-10 no-print min-h-screen">
      <div className="print-only">
        {/* PAGE 1: Strategic Summary & Local Workforce */}
        <PageContainer footer={<p className="text-[8px] text-gray-400 text-center uppercase tracking-widest">{t('confidential')}</p>}>
          <HeaderBand country={data.country} reportId={report.id} title={report.title} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Globe} title={t('sectionProfile')} subtitle="National Demographics" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            <KPI icon={MapPin} label={t('capital')} value={data.capital} />
            <KPI icon={Users} label={t('population')} value={data.population} />
            <KPI icon={Globe} label={t('officialLanguage')} value={data.officialLanguage} />
            <KPI icon={Banknote} label={t('currency')} value={data.currency} />
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <KPI icon={TrendingUp} label={t('gdp')} value={data.gdp} />
            <KPI icon={Star} label={t('hdi')} value={data.hdi} />
            <KPI icon={ShieldAlert} label={t('crimeRate')} value={data.crimeRate} />
            <KPI icon={GraduationCap} label={t('literacyRate')} value={data.literacyRate} />
          </div>

          <SectionHeader icon={Users} title={t('sectionUaeWorkforce')} subtitle="MOHRE & ICP Integrated Analysis" />
          <div className="grid grid-cols-2 gap-6 mb-8">
            <KPI icon={Building} label={t('totalPrivate')} value={data.uaeWorkforceStats.mohre.totalPrivate.value} sub={`${t('dataAsOf')} ${data.uaeWorkforceStats.mohre.totalPrivate.date}`} tone="info" />
            <KPI icon={Home} label={t('totalDomestic')} value={data.uaeWorkforceStats.mohre.totalDomestic.value} sub={`${t('dataAsOf')} ${data.uaeWorkforceStats.mohre.totalDomestic.date}`} tone="info" />
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t('workersByEmirate')} (MOHRE)</h4>
                <div className="space-y-2">
                   {data.uaeWorkforceStats.mohre.byEmirate.map((em, i) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-1">
                         <span className="font-bold text-gray-700">{em.name}</span>
                         <span className="font-mono text-primary">{Number(em.value).toLocaleString()}</span>
                      </div>
                   ))}
                </div>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t('icpHeader')}</h4>
                <div className="space-y-2">
                   {data.uaeWorkforceStats.icp.byEmirate.map((em, i) => (
                      <div key={i} className="flex items-center justify-between text-xs pb-1">
                         <span className="font-bold text-gray-600">{em.name}</span>
                         <span className="font-mono text-accent">{Number(em.value).toLocaleString()}</span>
                      </div>
                   ))}
                </div>
                <p className="text-[8px] mt-4 text-gray-400 italic leading-tight">{t('icpDisclaimer')}</p>
             </div>
          </div>
        </PageContainer>

        {/* PAGE 2: Partner Market Analysis */}
        <PageContainer footer={<p className="text-[8px] text-gray-400 text-center uppercase tracking-widest">{t('confidential')}</p>}>
          <HeaderBand country={data.country} reportId={report.id} title={report.title} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Hammer} title={t('sectionWorkforce')} subtitle={`Labour Market Dynamics in ${data.country}`} />
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPI icon={Users} label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} sub={getSource('demo')} />
            <div className="col-span-2 kpi-card flex items-center justify-around py-4 shadow-sm">
               <div className="text-center">
                  <p className="text-[8px] font-bold text-gray-400 uppercase">{t('maleParticipation')}</p>
                  <p className="text-lg font-serif font-bold text-blue-600">{data.workforceStats.participationMale}%</p>
               </div>
               <div className="w-px h-8 bg-gray-100"></div>
               <div className="text-center">
                  <p className="text-[8px] font-bold text-gray-400 uppercase">{t('femaleParticipation')}</p>
                  <p className="text-lg font-serif font-bold text-pink-500">{data.workforceStats.participationFemale}%</p>
               </div>
            </div>
            <KPI icon={Banknote} label={t('avgWage')} value={data.averageWage} tone="ok" />
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
             <div>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b pb-1">{t('migrationDestinations')}</h4>
                <div className="space-y-3">
                   {data.workforceStats.migrationDestinations.map((dest, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-accent" />
                         <span className="text-xs font-bold text-gray-700 flex-1">{dest.country}</span>
                         <span className="text-xs font-mono text-gray-500">{dest.count}</span>
                      </div>
                   ))}
                </div>
             </div>
             <div>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b pb-1">{t('workersBySector')}</h4>
                <div className="space-y-3">
                   {data.workforceStats.topSectors.map((sec, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${sec.value}%` }} />
                         </div>
                         <span className="text-[10px] font-bold text-gray-600 w-24 text-right truncate">{sec.name}</span>
                         <span className="text-[10px] font-mono text-primary w-8">{sec.value}%</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
             <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hammer size={14} /> {t('availableSkills')}
             </h4>
             <div className="flex flex-wrap gap-2">
                {data.workforceStats.availableSkills.map((skill, i) => (
                   <span key={i} className="bg-white border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary-dark uppercase shadow-sm">
                      {skill}
                   </span>
                ))}
             </div>
             <p className="text-[8px] text-gray-400 mt-4 italic">{t('skillsDisclaimer')}</p>
          </div>
        </PageContainer>

        {/* PAGE 3: Economy, Trade & Education */}
        <PageContainer footer={<p className="text-[8px] text-gray-400 text-center uppercase tracking-widest">{t('confidential')}</p>}>
          <HeaderBand country={data.country} reportId={report.id} title={report.title} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={Briefcase} title={t('sectionEconomy')} subtitle="Bilateral Trade & Financial Flow" />
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPI icon={TrendingUp} label={t('inflation')} value={data.economicStats.inflation} tone="warn" />
            <KPI icon={ShieldAlert} label={t('tipRankLabel')} value={data.economicStats.tipRank} chip="Safety" tone="restrict" />
            <KPI icon={Banknote} label={t('remittances')} value={data.economicStats.remittancesFromUAE} tone="ok" />
            <KPI icon={Globe} label={t('globalRemittances')} value={data.economicStats.remittancesGlobal} />
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
             <div className="kpi-card bg-green-50/30 border-green-100">
                <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 border-b border-green-100 pb-1">{t('topExports')}</h4>
                <ul className="space-y-2">
                   {data.economicStats.topExportProducts.map((p, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                         <span className="text-green-500 font-bold">•</span> {p}
                      </li>
                   ))}
                </ul>
             </div>
             <div className="kpi-card bg-blue-50/30 border-blue-100">
                <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">{t('topImports')}</h4>
                <ul className="space-y-2">
                   {data.economicStats.topImportProducts.map((p, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                         <span className="text-green-500 font-bold">•</span> {p}
                      </li>
                   ))}
                </ul>
             </div>
          </div>

          <SectionHeader icon={GraduationCap} title={t('educationInsights')} subtitle="Academic Output & Standards" />
          <div className="grid grid-cols-2 gap-6 mb-6">
             <KPI icon={BookOpen} label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} />
             <KPI icon={GraduationCap} label={t('higherEducationEnrollment')} value={data.educationStats.higherEducationEnrollment} />
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{t('topUniversities')}</h4>
             <div className="grid grid-cols-1 gap-2">
                {data.educationStats.topUniversities.map((uni, i) => (
                   <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                      <span className="text-xs font-serif font-bold text-primary w-5">{i+1}</span>
                      <span className="text-xs font-bold text-gray-800">{uni}</span>
                   </div>
                ))}
             </div>
          </div>
        </PageContainer>

        {/* PAGE 4: Relationship & Interaction Log */}
        <PageContainer footer={<p className="text-[8px] text-gray-400 text-center uppercase tracking-widest">{t('confidential')}</p>}>
          <HeaderBand country={data.country} reportId={report.id} title={report.title} flagUrl={data.flagUrl} />
          
          <SectionHeader icon={MessageSquare} title={t('relationshipSummary')} subtitle="High-Level Diplomatic Engagement" />
          
          <div className="space-y-4 mb-8">
             {data.recentInteractions.map((ri, i) => (
                <div key={i} className="avoid-break p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                   <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-bold text-primary-dark">{ri.title}</h5>
                      <span className="text-[10px] font-mono text-gray-400">{ri.date}</span>
                   </div>
                   <div className="text-xs text-gray-600 leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: ri.details.replace(/\n/g, '<br/>') }} />
                </div>
             ))}
             {data.recentInteractions.length === 0 && <p className="text-xs text-gray-400 italic">No recent interactions recorded.</p>}
          </div>

          <SectionHeader icon={FileText} title={t('agreements')} subtitle="MoUs & Operational Protocols" />
          <div className="grid grid-cols-1 gap-4 mb-8">
             {data.bilateralAgreements.map((ag, i) => (
                <div key={i} className="avoid-break p-5 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                         <h5 className="text-sm font-bold text-gray-900">{ag.title}</h5>
                         <p className="text-[10px] text-gray-400 font-mono">{ag.date}</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${ag.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                         {ag.status === 'custom' ? ag.customStatusText : t(ag.status as any)}
                      </span>
                   </div>
                   <p className="text-xs text-gray-600 leading-relaxed italic">"{ag.summary}"</p>
                </div>
             ))}
          </div>
        </PageContainer>
      </div>

      {/* Control Overlay (Web View Only) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-white no-print z-[999]">
         <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('country')}</span>
            <span className="text-sm font-serif font-bold text-primary">{data.country}</span>
         </div>
         <div className="w-px h-8 bg-gray-200 mx-4" />
         {/* Fixed: Replaced missing Button components with imported version and added Printer icon */}
         <Button size="lg" onClick={() => window.print()} className="bg-primary-dark shadow-xl">
            <Printer size={20} /> {t('printNow')}
         </Button>
         <Button variant="outline" size="lg" onClick={() => window.close()}>
            {t('closeWindow')}
         </Button>
      </div>
    </div>
  );
}
