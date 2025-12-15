import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, 
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  FileText, Briefcase, GraduationCap
} from 'lucide-react';
import { PageContainer, HeaderBand, SectionHeader, KPI } from '../components/PrintUI';

const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
const COLORS = ['#1e3a8a', '#ca8a04', '#15803d', '#475569', '#ea580c', '#7c3aed'];

export default function PrintView() {
  const { id } = useParams();
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
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4 no-print">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Report Not Found</h2>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">Close</button>
      </div>
    );
  }

  if (!report) return <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse no-print">Loading Document...</div>;

  const { data } = report;

  const DefaultFooter = () => (
    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
      <p className="text-[9px] text-gray-400">
        Generated on {new Date().toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <p className="text-[9px] text-gray-400 uppercase tracking-widest">
        Ministry of Human Resources & Emiratisation
      </p>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pb-12">
      <div className="fixed top-4 right-4 z-50 flex gap-2 no-print">
         <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold">
            <Printer size={18} /> Print
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-600 p-2.5 rounded-lg shadow-lg hover:bg-gray-100 transition-all border border-gray-200">
            <X size={20} />
         </button>
      </div>

      {/* --- PAGE 1: COVER --- */}
      <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
         
         <div className="flex-1 flex flex-col justify-center px-16 relative z-10">
            <div className="mb-12 border-l-[6px] border-accent pl-10 py-4">
               <div className="flex items-center gap-3 mb-6 opacity-60">
                 <img src="https://flagcdn.com/w40/ae.png" className="h-5 w-auto" alt="UAE" />
                 <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">UAE • MOHRE</span>
               </div>
               <h1 className="text-6xl font-serif font-medium text-gray-900 leading-[1.1] mb-2">
                  Labour Market<br/>
                  <span className="text-primary font-bold">Intelligence</span>
               </h1>
               <p className="text-xl text-gray-500 font-light mt-4">Bilateral Relations Briefing</p>
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
                     <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Subject Market</p>
                     <h2 className="text-4xl font-serif font-bold text-gray-900">{data.country}</h2>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                     <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Reference</p>
                     <p className="font-mono text-sm text-gray-800">{report.id}</p>
                  </div>
                  <div>
                     <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Date</p>
                     <p className="font-mono text-sm text-gray-800">{data.reportDate}</p>
                  </div>
                  <div className="col-span-2">
                     <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Security Classification</p>
                     <span className="kpi-chip chip-restrict inline-flex items-center gap-1">
                        <ShieldAlert size={10} /> Official / Restricted
                     </span>
                  </div>
               </div>
            </div>
         </div>
         <div className="h-3 bg-primary w-full"></div>
      </div>

      {/* --- PAGE 2: PROFILE & ECONOMY --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        <SectionHeader
          icon={Globe}
          title="Country Profile"
          subtitle="Strategic Overview"
        />

        <div className="grid grid-cols-2 gap-4 mb-8">
          <KPI icon={Landmark} label="Capital City" value={data.capital} />
          <KPI icon={Users} label="Population" value={data.population} />
          <KPI icon={Banknote} label="Currency" value={data.currency} />
          <KPI
            icon={Plane}
            label="Flight Connectivity"
            value={data.directFlight ? "Direct Flights" : "Indirect Only"}
            chip={data.directFlight ? "Connected" : "Limited"}
            tone={data.directFlight ? "ok" : "warn"}
            sub="To UAE Airports"
          />
          <KPI icon={Building} label="UAE Embassy" value={data.uaeEmbassyLocation || "N/A"} />
          <KPI icon={Globe} label="Official Language" value={data.officialLanguage} />
        </div>

        <SectionHeader
          icon={TrendingUp}
          title="Economic Landscape"
          subtitle="Trade & Education"
        />

        <div className="grid grid-cols-2 gap-4 mb-6">
           <KPI icon={Banknote} label="GDP (Current US$)" value={data.gdp} />
           <KPI icon={TrendingUp} label="Inflation Rate" value={data.economicStats.inflation} />
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
           <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-200 pb-2">Bilateral Trade Volume</h4>
           <div className="flex gap-8">
              <div className="flex-1">
                 <p className="text-xs text-primary font-bold mb-1">Imports from UAE</p>
                 <p className="text-xl font-serif font-bold text-gray-900">{data.economicStats.totalImportsFromUAE}</p>
                 <p className="text-[10px] text-gray-500 mt-1 truncate">{data.economicStats.topImportProducts.slice(0,3).join(', ')}</p>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex-1">
                 <p className="text-xs text-accent font-bold mb-1">Exports to UAE</p>
                 <p className="text-xl font-serif font-bold text-gray-900">{data.economicStats.totalExportsToUAE}</p>
                 <p className="text-[10px] text-gray-500 mt-1 truncate">{data.economicStats.topExportProducts.slice(0,3).join(', ')}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <KPI icon={GraduationCap} label="Higher Ed. Enrollment" value={data.educationStats.higherEducationEnrollment} />
           <KPI icon={ShieldAlert} label="TIP Ranking" value={data.economicStats.tipRank} chip="Watch List" tone="warn" />
        </div>
      </PageContainer>

      {/* --- PAGE 3: WORKFORCE --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        <SectionHeader
          icon={Building}
          title="Workforce in UAE"
          subtitle="MOHRE & ICP Data"
        />

        <div className="grid grid-cols-2 gap-4 mb-6">
           <KPI 
             icon={Briefcase} 
             label="Private Sector (MOHRE)" 
             value={data.uaeWorkforceStats.mohre.totalPrivate.value} 
             sub={`As of ${data.uaeWorkforceStats.mohre.totalPrivate.date}`} 
           />
           <KPI 
             icon={Users} 
             label="Domestic Workers (MOHRE)" 
             value={data.uaeWorkforceStats.mohre.totalDomestic.value} 
             sub={`As of ${data.uaeWorkforceStats.mohre.totalDomestic.date}`}
             tone="warn"
           />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8 h-48">
           <div className="col-span-2 border border-gray-200 rounded-xl p-4">
              <p className="kpi-label mb-2">Distribution by Emirate</p>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.uaeWorkforceStats.mohre.byEmirate} margin={{top: 5, right: 5, bottom: 5, left: -20}}>
                     <XAxis dataKey="name" tick={{fontSize: 9}} interval={0} />
                     <YAxis tick={{fontSize: 9}} />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.uaeWorkforceStats.mohre.byEmirate.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                        ))}
                     </Bar>
                  </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-center">
              <p className="kpi-label mb-2">Top Sectors</p>
              <div className="space-y-3">
                 {data.uaeWorkforceStats.mohre.bySector.slice(0,4).map((s, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-[10px] mb-1">
                          <span className="font-bold text-gray-700 truncate w-24">{s.name}</span>
                          <span className="font-mono text-gray-500">{s.value}%</span>
                       </div>
                       <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{width: `${Math.min(s.value, 100)}%`}}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <SectionHeader
          icon={Users}
          title="Partner Workforce"
          subtitle="Source Market Analysis"
        />

        <div className="grid grid-cols-3 gap-4 mb-6">
           <div className="col-span-1">
              <KPI icon={Users} label="Total Workforce" value={data.workforceStats.totalWorkforce} />
           </div>
           <div className="col-span-2 kpi-card flex items-center justify-around">
              <div className="text-center">
                 <p className="kpi-label mb-1">Male Participation</p>
                 <p className="text-xl font-bold text-blue-600">{data.workforceStats.participationMale}%</p>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                 <p className="kpi-label mb-1">Female Participation</p>
                 <p className="text-xl font-bold text-pink-600">{data.workforceStats.participationFemale}%</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <KPI icon={Banknote} label="Average Monthly Wage" value={data.averageWage} tone="ok" />
           <KPI icon={Banknote} label="Minimum Monthly Wage" value={data.minimumWage} />
        </div>

      </PageContainer>

      {/* --- PAGE 4: RELATIONS --- */}
      <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
        <HeaderBand country={data.country} reportId={report.id} />

        <SectionHeader
          icon={Handshake}
          title="Relations & Agreements"
          subtitle="Bilateral Engagement"
        />

        <div className="mb-8">
           <h3 className="kpi-label mb-4 border-b border-gray-200 pb-2">Key Bilateral Agreements</h3>
           <div className="space-y-3">
              {data.bilateralAgreements.map((agreement, idx) => (
                 <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start avoid-break">
                    <div>
                       <p className="text-sm font-bold text-gray-900">{agreement.title}</p>
                       <p className="text-[10px] text-gray-500 mt-1">{agreement.summary}</p>
                    </div>
                    <div className="text-right">
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${agreement.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {agreement.status}
                       </span>
                       <p className="text-[10px] font-mono text-gray-400 mt-1">{agreement.date}</p>
                    </div>
                 </div>
              ))}
              {data.bilateralAgreements.length === 0 && (
                 <p className="text-xs text-gray-400 italic text-center py-4">No specific agreements recorded.</p>
              )}
           </div>
        </div>

        <SectionHeader
          icon={Users}
          title="Delegations"
          subtitle="Key Officials"
        />

        <div className="grid grid-cols-2 gap-8">
           <div className="avoid-break">
              <div className="flex items-center gap-2 mb-4">
                 <img src="https://flagcdn.com/w40/ae.png" className="h-3 w-auto" alt="UAE" />
                 <p className="text-xs font-bold uppercase text-primary">UAE Delegation</p>
              </div>
              <div className="space-y-4">
                 {data.delegations.uae.map((d) => (
                    <div key={d.id} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                       <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                          {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">{d.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">{d.title}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="avoid-break">
              <div className="flex items-center gap-2 mb-4">
                 <Globe size={12} className="text-accent" />
                 <p className="text-xs font-bold uppercase text-accent">Partner Delegation</p>
              </div>
              <div className="space-y-4">
                 {data.delegations.partner.map((d) => (
                    <div key={d.id} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                       <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                          {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">{d.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">{d.title}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </PageContainer>
    </div>
  );
}