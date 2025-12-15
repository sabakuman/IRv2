import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { 
  Globe, Briefcase, Users, FileText, TrendingUp, Building, 
  GraduationCap, Handshake, MapPin, 
  ShieldAlert, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, CheckCircle2
} from 'lucide-react';

const COLORS = ['#1e3a8a', '#ca8a04', '#15803d', '#475569', '#ea580c', '#7c3aed'];
const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

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
    // Wait for fonts and data to be fully ready before printing
    if (report) {
      document.fonts.ready.then(() => {
        const timer = setTimeout(() => {
           // window.print(); // Auto-print disabled for better UX, user can click button
        }, 1500); 
        return () => clearTimeout(timer);
      });
    }
  }, [report]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Report Not Found</h2>
        <p>The report you are trying to print could not be found or has been deleted.</p>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium">Close Window</button>
      </div>
    );
  }

  if (!report) return <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse">Generating Ministerial Document...</div>;

  const { data } = report;

  // --- Layout Helper Components ---

  const PageContainer = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
    <div className={`w-[210mm] min-h-[297mm] bg-white mx-auto relative print-safe-pad overflow-hidden flex flex-col ${className}`}>
      {/* Running Header */}
      <div className="absolute top-8 left-12 right-12 flex justify-between items-end border-b-2 border-primary/10 pb-2">
        <div className="flex items-center gap-2 opacity-60">
           <img src="https://flagcdn.com/w40/ae.png" className="h-3 w-auto" alt="UAE" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Ministry of Human Resources & Emiratisation</span>
        </div>
        <div className="text-[9px] text-gray-400 font-mono">
           REF: {report.id}
        </div>
      </div>

      <div className="mt-16 flex-1">
        {children}
      </div>

      <Footer />
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="flex items-end gap-4 border-b border-primary/20 pb-2 mb-8 mt-2">
      <div className="text-primary-dark mb-1">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h2 className="text-2xl font-serif font-bold text-primary-dark leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-accent font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const StatItem = ({ label, value, sub }: { label: string, value: string | number, sub?: string }) => (
    <div className="border-l-2 border-accent pl-4 py-1">
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
       <p className="text-lg font-bold text-gray-900 font-serif leading-tight">{value}</p>
       {sub && <p className="text-[10px] text-gray-500 italic">{sub}</p>}
    </div>
  );

  const DataCard = ({ title, children, className = '' }: { title?: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-gray-50/50 border border-gray-200 rounded-lg p-5 ${className}`}>
      {title && <h3 className="font-bold text-primary-dark text-sm uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">{title}</h3>}
      {children}
    </div>
  );

  const Footer = () => (
    <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center border-t border-gray-100 pt-3">
      <p className="font-bold text-red-800 text-[9px] tracking-[0.2em] uppercase flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded">
        <ShieldAlert size={10} /> Confidential / Official Use Only
      </p>
      <p className="text-[9px] text-gray-400 font-medium">Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  );

  // --- Pages ---

  // 1. Cover Page
  const CoverPage = () => (
    <div className="w-[210mm] h-[297mm] bg-white mx-auto relative flex flex-col overflow-hidden">
       {/* Decorative Background */}
       <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
       <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
       
       <div className="flex-1 flex flex-col justify-center px-16 relative z-10">
          <div className="mb-16 border-l-4 border-accent pl-8 py-2">
             <div className="flex items-center gap-3 mb-4">
               <img src="https://flagcdn.com/w160/ae.png" alt="UAE" className="h-8 w-auto shadow-sm" />
               <span className="h-8 w-px bg-gray-300"></span>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">United Arab Emirates<br/>Ministry of Human Resources & Emiratisation</p>
             </div>
             <h1 className="text-4xl font-serif font-medium text-gray-900 leading-tight">
                Labour Market<br/>Intelligence Report
             </h1>
          </div>

          <div className="space-y-12">
             <div className="flex items-center gap-8">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-gray-100">
                    <img 
                       src={`https://flagcdn.com/w320/${data.country === 'Philippines' ? 'ph' : data.country === 'India' ? 'in' : 'ae'}.png`} 
                       className="w-full h-full object-cover"
                       onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                </div>
                <div>
                   <p className="text-sm font-bold text-accent uppercase tracking-widest mb-1">Subject Country</p>
                   <h2 className="text-6xl font-serif font-bold text-primary-dark">{data.country}</h2>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                <div>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Report Date</p>
                   <p className="text-lg font-medium text-gray-800">{data.reportDate}</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Reference ID</p>
                   <p className="text-lg font-mono text-gray-800">{report.id}</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Classification</p>
                   <p className="text-sm font-bold text-red-700 bg-red-50 inline-block px-2 py-1 rounded">Restricted</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Prepared By</p>
                   <p className="text-sm font-medium text-gray-800">International Relations Dept.</p>
                </div>
             </div>
          </div>
       </div>
       
       <div className="h-4 bg-primary w-full"></div>
    </div>
  );

  // 2. Country Profile
  const ProfilePage = () => (
    <PageContainer className="page-break">
       <SectionHeader icon={Globe} title="Country Profile" subtitle="Strategic Overview" />
       
       <div className="grid grid-cols-3 gap-6 mb-8">
          <DataCard className="col-span-2" title="Key Demographics">
             <div className="grid grid-cols-2 gap-y-6 gap-x-8">
               <StatItem label="Capital City" value={data.capital} />
               <StatItem label="Total Population" value={data.population} />
               <StatItem label="Currency" value={data.currency} />
               <StatItem label="Flight Connectivity" value={data.directFlight ? "Direct Flights Available" : "Indirect Only"} sub="To UAE Airports" />
               <StatItem label="Human Dev. Index (HDI)" value={data.hdi} />
               <StatItem label="Official Language" value={data.officialLanguage} />
             </div>
          </DataCard>

          <div className="space-y-6">
             <DataCard title="Diplomatic Missions">
               <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-xs font-bold text-gray-500 uppercase">UAE Embassy</span>
                    </div>
                    <p className="font-serif text-lg text-primary-dark pl-4">{data.uaeEmbassyLocation || "N/A"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Foreign Embassy</span>
                    </div>
                    <p className="font-serif text-lg text-gray-800 pl-4">{data.foreignEmbassyLocation || "N/A"}</p>
                  </div>
               </div>
             </DataCard>

             <div className="bg-primary text-white p-5 rounded-lg shadow-sm">
                <p className="text-xs font-bold opacity-60 uppercase mb-2">Trafficking in Persons (TIP) Rank</p>
                <div className="text-3xl font-serif font-bold">{data.economicStats.tipRank}</div>
             </div>
          </div>
       </div>

       <SectionHeader icon={TrendingUp} title="Economic Landscape" subtitle="Trade & Education" />

       <div className="grid grid-cols-2 gap-6 mb-8">
          <DataCard title="Trade Statistics">
             <div className="space-y-4">
               <div className="flex justify-between items-center border-b border-gray-200 border-dashed pb-2">
                 <span className="text-sm text-gray-600">GDP (Current US$)</span>
                 <span className="font-bold text-primary-dark">{data.gdp}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-200 border-dashed pb-2">
                 <span className="text-sm text-gray-600">Inflation Rate</span>
                 <span className="font-bold text-gray-800">{data.economicStats.inflation}</span>
               </div>
               <div className="flex justify-between items-center pt-2">
                 <div className="text-center w-1/2 border-r border-gray-200">
                    <p className="text-xs text-gray-400 uppercase font-bold">Imports from UAE</p>
                    <p className="text-xl font-bold text-primary-dark mt-1">{data.economicStats.totalImportsFromUAE}</p>
                 </div>
                 <div className="text-center w-1/2">
                    <p className="text-xs text-gray-400 uppercase font-bold">Exports to UAE</p>
                    <p className="text-xl font-bold text-primary-dark mt-1">{data.economicStats.totalExportsToUAE}</p>
                 </div>
               </div>
             </div>
          </DataCard>

          <DataCard title="Education & Skills">
             <div className="mb-4">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-1">
                  <span>Primary Enrollment</span>
                  <span>{data.educationStats.primaryEnrollment}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: data.educationStats.primaryEnrollment.replace('%', '') + '%' }}></div>
                </div>
             </div>
             <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-1">
                  <span>Higher Ed. Enrollment</span>
                  <span>{data.educationStats.higherEducationEnrollment}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                   <div className="h-full bg-accent" style={{ width: data.educationStats.higherEducationEnrollment.replace('%', '') + '%' }}></div>
                </div>
             </div>
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Universities</p>
               <ul className="text-sm space-y-1">
                 {data.educationStats.topUniversities.slice(0,3).map((u, i) => (
                   <li key={i} className="flex items-start gap-2 text-gray-700">
                     <span className="text-accent">•</span> {u}
                   </li>
                 ))}
               </ul>
             </div>
          </DataCard>
       </div>
       
       <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Top Traded Commodities</h4>
          <div className="grid grid-cols-2 gap-8">
             <div>
                <p className="text-xs font-bold text-primary mb-2">Exports to UAE</p>
                <div className="flex flex-wrap gap-2">
                   {data.economicStats.topExportProducts.slice(0,5).map((p,i) => (
                      <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 shadow-sm">{p}</span>
                   ))}
                </div>
             </div>
             <div>
                <p className="text-xs font-bold text-accent mb-2">Imports from UAE</p>
                <div className="flex flex-wrap gap-2">
                   {data.economicStats.topImportProducts.slice(0,5).map((p,i) => (
                      <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 shadow-sm">{p}</span>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </PageContainer>
  );

  // 3. UAE Workforce
  const UAEWorkforcePage = () => (
     <PageContainer className="page-break">
        <SectionHeader icon={Building} title="Workforce in UAE" subtitle="Domestic Labour Market Analysis" />

        <div className="grid grid-cols-2 gap-6 mb-8">
           <div className="bg-primary text-white rounded-lg p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                 <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">MOHRE • Private Sector</p>
                 <p className="text-4xl font-serif font-bold">{data.uaeWorkforceStats.mohre.totalPrivate.value}</p>
                 <p className="text-[10px] mt-2 opacity-80">Data as of {data.uaeWorkforceStats.mohre.totalPrivate.date}</p>
              </div>
              <Briefcase className="absolute -bottom-4 -right-4 text-white opacity-10" size={100} />
           </div>
           <div className="bg-white border-2 border-accent text-gray-800 rounded-lg p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                 <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">MOHRE • Domestic Workers</p>
                 <p className="text-4xl font-serif font-bold">{data.uaeWorkforceStats.mohre.totalDomestic.value}</p>
                 <p className="text-[10px] mt-2 opacity-60">Data as of {data.uaeWorkforceStats.mohre.totalDomestic.date}</p>
              </div>
              <Users className="absolute -bottom-4 -right-4 text-accent opacity-10" size={100} />
           </div>
        </div>

        {/* Custom Stats Strip */}
        {data.uaeWorkforceStats.custom.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-8">
             {data.uaeWorkforceStats.custom.map((stat) => (
               <div key={stat.id} className="flex-1 min-w-[120px] bg-gray-50 border border-gray-100 rounded p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{stat.value}</p>
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider truncate">{stat.label}</p>
               </div>
             ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 h-[300px] mb-8">
           <div>
              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Distribution by Emirate (MOHRE)</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data.uaeWorkforceStats.mohre.byEmirate} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 9, fill: '#666', fontWeight: 600}} interval={0} axisLine={false} tickLine={false} />
                      <Bar dataKey="value" fill="#1e3a8a" radius={[0, 2, 2, 0]} barSize={16} isAnimationActive={false}>
                        {data.uaeWorkforceStats.mohre.byEmirate.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           <div>
              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Top Sectors (MOHRE)</h4>
              <div className="space-y-3">
                 {data.uaeWorkforceStats.mohre.bySector.slice(0,6).map((sector, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-600">{sector.name}</span>
                          <span className="font-bold text-gray-900">{sector.value}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${Math.min(sector.value, 100)}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ICP Data Section */}
        <div className="mt-auto border-t border-dashed border-gray-300 pt-6">
           <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">ICP DATA</div>
              <span className="text-xs text-gray-400 font-medium">Federal Authority for Identity and Citizenship</span>
           </div>
           
           <div className="grid grid-cols-4 gap-4">
              {data.uaeWorkforceStats.icp.byEmirate.slice(0, 4).map((e, i) => (
                 <div key={i} className="text-center p-3 border border-gray-100 rounded bg-gray-50/50">
                    <p className="font-serif font-bold text-lg text-gray-800">{e.value.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">{e.name}</p>
                 </div>
              ))}
           </div>
        </div>
     </PageContainer>
  );

  // 4. Partner Workforce
  const PartnerWorkforcePage = () => (
     <PageContainer className="page-break">
        <SectionHeader icon={Users} title="Partner Workforce" subtitle="Source Market Analysis" />

        <div className="grid grid-cols-3 gap-6 mb-8">
           <div className="col-span-1 bg-gray-900 text-white p-6 rounded-lg flex flex-col justify-center">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Workforce</p>
              <p className="text-3xl font-serif font-bold text-white">{data.workforceStats.totalWorkforce}</p>
              <div className="mt-6 flex gap-2 text-[10px]">
                 <div className="bg-white/10 px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Male {data.workforceStats.participationMale}%
                 </div>
                 <div className="bg-white/10 px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-400"></span> Female {data.workforceStats.participationFemale}%
                 </div>
              </div>
           </div>

           <div className="col-span-2 grid grid-cols-2 gap-6">
               <DataCard>
                  <div className="text-center">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg. Monthly Wage</p>
                     <p className="text-2xl font-serif font-bold text-green-700">{data.averageWage}</p>
                  </div>
               </DataCard>
               <DataCard>
                  <div className="text-center">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Min. Monthly Wage</p>
                     <p className="text-2xl font-serif font-bold text-gray-700">{data.minimumWage}</p>
                  </div>
               </DataCard>
               
               <div className="col-span-2 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">Global Migration Destinations</p>
                  <div className="flex justify-between items-end">
                     {data.workforceStats.migrationDestinations.map((d, i) => (
                        <div key={i} className="text-center flex-1 relative">
                           {i < data.workforceStats.migrationDestinations.length - 1 && (
                              <div className="absolute top-1/2 right-0 w-px h-8 bg-blue-200 -translate-y-1/2"></div>
                           )}
                           <p className="text-lg font-bold text-gray-800">{d.count}</p>
                           <p className="text-[10px] uppercase font-medium text-gray-500">{d.country}</p>
                        </div>
                     ))}
                  </div>
               </div>
           </div>
        </div>

        <div className="flex gap-8 mb-8 h-[300px]">
           <div className="w-1/2">
              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Sector Distribution</h4>
              <div className="h-[250px] w-full flex items-center">
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.workforceStats.topSectors}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          isAnimationActive={false}
                          stroke="none"
                        >
                          {data.workforceStats.topSectors.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-32 text-[10px] space-y-2">
                      {data.workforceStats.topSectors.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length]}}></div>
                            <span className="text-gray-600 font-medium">{s.name} <span className="text-gray-400">({s.value}%)</span></span>
                        </div>
                      ))}
                  </div>
              </div>
           </div>

           <div className="w-1/2">
              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Skills Availability</h4>
              <div className="bg-gray-50 rounded-lg p-5 h-[250px] overflow-hidden">
                 <div className="flex flex-wrap gap-2 content-start">
                    {data.workforceStats.availableSkills.map((skill, i) => (
                       <span key={i} className="bg-white text-gray-700 px-3 py-1.5 rounded border border-gray-200 text-xs font-medium shadow-sm">
                          {skill}
                       </span>
                    ))}
                 </div>
                 <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">
                       "These skills represent the primary categories of labor available for international deployment based on current vocational output."
                    </p>
                 </div>
              </div>
           </div>
        </div>
     </PageContainer>
  );

  // 5. Relations
  const RelationsPage = () => (
     <PageContainer className="page-break">
        <SectionHeader icon={Handshake} title="Relations & Delegations" subtitle="Bilateral Engagement" />

        {/* Agreements Table */}
        <div className="mb-10">
           <h3 className="font-bold text-primary-dark text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText size={16} /> Key Agreements & MoUs
           </h3>
           <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                       <th className="px-4 py-3">Title / Protocol</th>
                       <th className="px-4 py-3 w-24">Date</th>
                       <th className="px-4 py-3 w-24">Status</th>
                       <th className="px-4 py-3 w-1/3">Key Provisions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {data.bilateralAgreements.map((a, i) => (
                       <tr key={i} className="bg-white">
                          <td className="px-4 py-3 font-bold text-gray-800">{a.title}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.date}</td>
                          <td className="px-4 py-3">
                             {a.status === 'Active' ? (
                                <span className="flex items-center gap-1 text-green-700 text-[10px] font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                   <CheckCircle2 size={10} /> Active
                                </span>
                             ) : (
                                <span className="flex items-center gap-1 text-yellow-700 text-[10px] font-bold uppercase bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
                                   Pending
                                </span>
                             )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed">{a.summary}</td>
                       </tr>
                    ))}
                    {data.bilateralAgreements.length === 0 && (
                       <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs italic">No formal agreements recorded.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Interactions Grid */}
        <div className="mb-10">
           <h3 className="font-bold text-primary-dark text-sm uppercase tracking-wide mb-4">Recent High-Level Interactions</h3>
           <div className="grid grid-cols-2 gap-4">
              {data.recentInteractions.map((item, i) => (
                 <div key={i} className="border border-gray-200 rounded p-4 bg-gray-50/30">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded">{item.type}</span>
                       <span className="text-[10px] font-mono text-gray-400">{item.date}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-snug">{item.details}</p>
                 </div>
              ))}
           </div>
        </div>

        {/* Delegations */}
        <div className="mt-auto pt-6 border-t border-gray-200">
           <div className="flex gap-12">
              {/* UAE Column */}
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-6 border-b-2 border-primary pb-2">
                    <img src="https://flagcdn.com/w40/ae.png" className="h-4 w-auto" alt="UAE" />
                    <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs">UAE Delegation</h4>
                 </div>
                 <div className="space-y-6">
                    {data.delegations.uae.map(d => (
                       <div key={d.id} className="flex gap-4 items-start">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                             {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                             <p className="font-bold text-sm text-gray-900">{d.name}</p>
                             <p className="text-[10px] font-bold text-primary uppercase mb-1">{d.title}</p>
                             <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{d.bio}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Partner Column */}
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-6 border-b-2 border-accent pb-2">
                    <img src={`https://flagcdn.com/w40/${data.country === 'Philippines' ? 'ph' : data.country === 'India' ? 'in' : 'ae'}.png`} className="h-4 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Partner Delegation</h4>
                 </div>
                 <div className="space-y-6">
                    {data.delegations.partner.map(d => (
                       <div key={d.id} className="flex gap-4 items-start">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                             {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                             <p className="font-bold text-sm text-gray-900">{d.name}</p>
                             <p className="text-[10px] font-bold text-accent uppercase mb-1">{d.title}</p>
                             <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{d.bio}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
     </PageContainer>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="fixed top-4 right-4 z-50 flex gap-2 no-print">
         <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold" title="Print Now">
            <Printer size={18} /> Print Document
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-600 p-2.5 rounded-lg shadow-lg hover:bg-gray-100 transition-all border border-gray-200" title="Close">
            <X size={20} />
         </button>
      </div>
      <CoverPage />
      <ProfilePage />
      <UAEWorkforcePage />
      <PartnerWorkforcePage />
      <RelationsPage />
    </div>
  );
}