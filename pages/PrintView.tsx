import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { 
  Globe, Briefcase, Users, FileText, TrendingUp, Building, 
  GraduationCap, MessageSquare, Handshake, MapPin, Calendar, 
  ShieldAlert, Landmark, Plane, Banknote, BookOpen, Layers,
  Printer, X, AlertTriangle
} from 'lucide-react';

const COLORS = ['#1e40af', '#eab308', '#10b981', '#6b7280', '#f97316', '#8b5cf6'];
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
      // Use document.fonts.ready to ensure web fonts (Inter/Serif) are loaded
      // This prevents the PDF from having fallback fonts
      document.fonts.ready.then(() => {
        const timer = setTimeout(() => {
           window.print();
        }, 1000); // 1s buffer for charts to render animation-less
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

  if (!report) return <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse">Generating Report Document...</div>;

  const { data } = report;

  // --- Layout Helper Components ---

  const PageContainer = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
    <div className={`w-[210mm] min-h-[297mm] bg-white mx-auto relative print-safe-pad overflow-hidden ${className}`}>
      {children}
      <Footer />
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="flex items-center gap-4 border-b-2 border-primary pb-4 mb-8 mt-4">
      <div className="bg-primary/5 p-3 rounded-full border border-primary/10 text-primary">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-2xl font-serif font-bold text-primary-dark tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const StatBox = ({ label, value, sub, icon: Icon }: { label: string, value: string | number, sub?: string, icon?: any }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
      <div className="relative z-10">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-2">
          {Icon && <Icon size={12} />} {label}
        </p>
        <p className="text-xl font-bold text-primary-dark">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className="absolute -bottom-4 -right-4 text-gray-50 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
        {Icon && <Icon size={64} />}
      </div>
    </div>
  );

  const Footer = () => (
    <div className="absolute bottom-6 left-0 right-0 px-12 flex justify-between items-center text-[9px] text-gray-400 border-t border-gray-100 pt-4">
      <p className="font-bold text-red-700 tracking-widest uppercase flex items-center gap-1">
        <ShieldAlert size={10} /> Confidential / Internal Use Only
      </p>
      <p>{report.id} • Generated on {new Date().toLocaleDateString()}</p>
    </div>
  );

  // --- Pages ---

  // 1. Cover Page
  const CoverPage = () => (
    <div className="w-[210mm] h-[297mm] bg-white mx-auto relative flex flex-col items-center justify-center overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-0 left-0 w-full h-32 bg-primary"></div>
       <div className="absolute bottom-0 right-0 w-2/3 h-full bg-gray-50 -z-10 skew-x-12 translate-x-20"></div>
       
       <div className="text-center z-10 p-12 w-full">
          <div className="mb-12">
             <img src="https://flagcdn.com/w160/ae.png" alt="UAE" className="h-24 w-auto mx-auto drop-shadow-xl" />
             <div className="mt-8">
               <h1 className="text-lg font-serif font-medium text-gray-600 uppercase tracking-[0.2em] mb-2">Ministry of Human Resources & Emiratisation</h1>
               <div className="h-1 w-24 bg-accent mx-auto"></div>
             </div>
          </div>

          <div className="mb-16">
             <div className="inline-block border-2 border-primary/20 p-2 rounded-full mb-6 bg-white shadow-lg">
                <img 
                   src={`https://flagcdn.com/w160/${data.country === 'Philippines' ? 'ph' : data.country === 'India' ? 'in' : 'ae'}.png`} 
                   className="w-24 h-24 rounded-full object-cover"
                   onError={(e) => e.currentTarget.style.display = 'none'}
                />
             </div>
             <h2 className="text-6xl font-serif font-bold text-primary-dark mb-4 leading-tight">{data.country}</h2>
             <p className="text-2xl text-gray-500 font-light">Bilateral Labour Market Intelligence Report</p>
          </div>

          <div className="bg-white shadow-diplomatic px-8 py-4 rounded-xl inline-flex items-center gap-8 border border-gray-100">
             <div className="text-left">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Report Date</p>
                <p className="text-lg font-bold text-primary">{data.reportDate}</p>
             </div>
             <div className="h-8 w-px bg-gray-200"></div>
             <div className="text-left">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Reference ID</p>
                <p className="text-lg font-bold text-primary">{report.id}</p>
             </div>
          </div>
       </div>
       
       <div className="absolute bottom-12 text-center w-full">
         <p className="text-xs font-bold text-red-600 tracking-[0.3em] uppercase">Confidential Document</p>
       </div>
    </div>
  );

  // 2. Country Profile & Economy
  const ProfilePage = () => (
    <PageContainer className="page-break">
       <SectionHeader icon={Globe} title="Country Profile" subtitle="Strategic Overview & Demographics" />
       
       {/* Top Cards */}
       <div className="grid grid-cols-4 gap-4 mb-8">
          <StatBox label="Capital" value={data.capital} icon={Landmark} />
          <StatBox label="Population" value={data.population} icon={Users} />
          <StatBox label="Currency" value={data.currency} icon={Banknote} />
          <StatBox label="Flight Conn." value={data.directFlight ? "Direct" : "Indirect"} icon={Plane} />
       </div>

       {/* Map / Key Info Split */}
       <div className="flex gap-8 mb-8">
          <div className="w-1/3 bg-primary/5 rounded-xl p-6 border border-primary/10">
             <h3 className="font-serif font-bold text-primary mb-4 flex items-center gap-2"><MapPin size={18} /> Diplomatic Presence</h3>
             <div className="space-y-4">
               <div>
                  <p className="text-xs text-gray-500 uppercase">UAE Embassy</p>
                  <p className="font-bold text-gray-800">{data.uaeEmbassyLocation || "N/A"}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase">Foreign Embassy</p>
                  <p className="font-bold text-gray-800">{data.foreignEmbassyLocation || "N/A"}</p>
               </div>
               <div className="pt-4 border-t border-primary/10">
                  <p className="text-xs text-gray-500 uppercase">Official Language</p>
                  <p className="font-bold text-gray-800">{data.officialLanguage}</p>
               </div>
             </div>
          </div>

          <div className="flex-1">
             <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                   <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Briefcase size={16} /> Economic Indicators</h4>
                   <ul className="space-y-3 text-sm">
                      <li className="flex justify-between border-b border-gray-200 pb-1"><span>GDP</span> <span className="font-bold text-primary">{data.gdp}</span></li>
                      <li className="flex justify-between border-b border-gray-200 pb-1"><span>HDI</span> <span className="font-bold">{data.hdi}</span></li>
                      <li className="flex justify-between border-b border-gray-200 pb-1"><span>Inflation</span> <span className="font-bold">{data.economicStats.inflation}</span></li>
                      <li className="flex justify-between"><span>TIP Rank</span> <span className="font-bold">{data.economicStats.tipRank}</span></li>
                   </ul>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                   <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><GraduationCap size={16} /> Education</h4>
                   <ul className="space-y-3 text-sm">
                      <li className="flex justify-between border-b border-gray-200 pb-1"><span>Primary Enrollment</span> <span className="font-bold">{data.educationStats.primaryEnrollment}</span></li>
                      <li className="flex justify-between border-b border-gray-200 pb-1"><span>Higher Ed.</span> <span className="font-bold">{data.educationStats.higherEducationEnrollment}</span></li>
                   </ul>
                   <p className="text-xs text-gray-500 mt-2 font-bold uppercase">Top University</p>
                   <p className="text-sm truncate">{data.educationStats.topUniversities[0]}</p>
                </div>
             </div>
          </div>
       </div>

       {/* Trade Stats */}
       <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-serif font-bold text-primary mb-4 flex items-center gap-2"><TrendingUp size={20} /> Bilateral Trade & Remittances</h3>
          <div className="grid grid-cols-3 gap-8">
             <div className="text-center border-r border-gray-100">
                <p className="text-3xl font-bold text-primary-dark">{data.economicStats.totalExportsToUAE}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Exports to UAE</p>
             </div>
             <div className="text-center border-r border-gray-100">
                <p className="text-3xl font-bold text-primary-dark">{data.economicStats.totalImportsFromUAE}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Imports from UAE</p>
             </div>
             <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{data.economicStats.remittancesFromUAE}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Remittances (From UAE)</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-gray-100">
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Exports to UAE</p>
                <div className="flex flex-wrap gap-2">
                   {data.economicStats.topExportProducts.slice(0, 4).map((p, i) => (
                      <span key={i} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-100">{p}</span>
                   ))}
                </div>
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Imports from UAE</p>
                <div className="flex flex-wrap gap-2">
                   {data.economicStats.topImportProducts.slice(0, 4).map((p, i) => (
                      <span key={i} className="bg-orange-50 text-orange-800 text-xs px-2 py-1 rounded border border-orange-100">{p}</span>
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
        <SectionHeader icon={Building} title="Workforce in UAE" subtitle="MOHRE & ICP Statistics" />

        <div className="grid grid-cols-2 gap-6 mb-8">
           <div className="bg-blue-900 text-white rounded-xl p-6 shadow-diplomatic relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Briefcase size={80} /></div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wide mb-1">Total Private Sector</p>
              <p className="text-4xl font-bold">{data.uaeWorkforceStats.mohre.totalPrivate.value}</p>
              <p className="text-xs mt-2 opacity-60">Source: MOHRE • {data.uaeWorkforceStats.mohre.totalPrivate.date}</p>
           </div>
           <div className="bg-accent text-white rounded-xl p-6 shadow-diplomatic relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={80} /></div>
              <p className="text-yellow-100 text-sm font-medium uppercase tracking-wide mb-1">Total Domestic Workers</p>
              <p className="text-4xl font-bold">{data.uaeWorkforceStats.mohre.totalDomestic.value}</p>
              <p className="text-xs mt-2 opacity-60">Source: MOHRE • {data.uaeWorkforceStats.mohre.totalDomestic.date}</p>
           </div>
        </div>

        {/* Custom Stats Grid */}
        <div className="mb-8 bg-gray-50 border border-gray-100 rounded-xl p-4">
           <div className="flex justify-around divide-x divide-gray-200">
              {data.uaeWorkforceStats.custom.map((stat) => (
                 <div key={stat.id} className="text-center px-4 flex-1">
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">{stat.label}</p>
                 </div>
              ))}
           </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-8 mb-6">
           <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-primary mb-4 text-center text-sm uppercase">Distribution by Emirate (MOHRE)</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data.uaeWorkforceStats.mohre.byEmirate} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 9, fill: '#666'}} interval={0} />
                      <Bar dataKey="value" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
           <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-primary mb-4 text-center text-sm uppercase">Top Sectors (MOHRE)</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data.uaeWorkforceStats.mohre.bySector} margin={{ bottom: 20 }}>
                      <XAxis dataKey="name" tick={{fontSize: 9, fill: '#666'}} interval={0} />
                      <YAxis hide />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false}>
                        {data.uaeWorkforceStats.mohre.bySector.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* ICP Small Section */}
        <div className="border-t-2 border-dashed border-gray-200 pt-6">
           <h4 className="font-bold text-gray-400 uppercase text-xs mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> ICP Data Overview</h4>
           <div className="grid grid-cols-4 gap-4">
              {data.uaeWorkforceStats.icp.byEmirate.slice(0, 4).map((e, i) => (
                 <div key={i} className="text-center">
                    <div className="h-1 bg-orange-200 w-full mb-1 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500" style={{ width: '60%' }}></div>
                    </div>
                    <p className="font-bold text-sm text-gray-700">{e.value}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{e.name}</p>
                 </div>
              ))}
           </div>
        </div>
     </PageContainer>
  );

  // 4. Partner Workforce
  const PartnerWorkforcePage = () => (
     <PageContainer className="page-break">
        <SectionHeader icon={Users} title="Partner Workforce" subtitle="Internal Market & Migration" />

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 flex justify-between items-center">
           <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Total Workforce</p>
              <p className="text-3xl font-bold text-primary-dark">{data.workforceStats.totalWorkforce}</p>
           </div>
           <div className="h-12 w-px bg-gray-200"></div>
           <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Avg. Monthly Wage</p>
              <p className="text-3xl font-bold text-green-600">{data.averageWage}</p>
           </div>
           <div className="h-12 w-px bg-gray-200"></div>
           <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Min. Monthly Wage</p>
              <p className="text-3xl font-bold text-gray-700">{data.minimumWage}</p>
           </div>
        </div>

        <div className="flex gap-8 mb-8">
           <div className="w-1/2">
              <h4 className="font-bold text-primary mb-4 text-sm uppercase border-b pb-2">Top Migration Destinations</h4>
              <ul className="space-y-4">
                 {data.workforceStats.migrationDestinations.map((d, i) => (
                    <li key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                          <span className="font-medium text-gray-700">{d.country}</span>
                       </div>
                       <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">{d.count}</span>
                    </li>
                 ))}
              </ul>
           </div>
           <div className="w-1/2">
              <h4 className="font-bold text-primary mb-4 text-sm uppercase border-b pb-2">Sector Distribution</h4>
              <div className="h-[200px] w-full flex items-center gap-4">
                 <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.workforceStats.topSectors}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {data.workforceStats.topSectors.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 </div>
                 <div className="w-32 text-xs space-y-1">
                    {data.workforceStats.topSectors.map((s, i) => (
                       <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length]}}></div>
                          <span className="text-gray-600">{s.name} ({s.value}%)</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
           <h4 className="font-bold text-primary mb-4 text-sm uppercase flex items-center gap-2"><Briefcase size={16} /> Available Skills for Migration</h4>
           <div className="flex flex-wrap gap-2">
              {data.workforceStats.availableSkills.map((skill, i) => (
                 <span key={i} className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium border border-blue-100">
                    {skill}
                 </span>
              ))}
           </div>
        </div>
     </PageContainer>
  );

  // 5. Relations & Delegations
  const RelationsPage = () => (
     <PageContainer className="page-break">
        <SectionHeader icon={Handshake} title="Relations & Delegations" subtitle="Diplomatic Engagement" />

        {/* Agreements Table */}
        <div className="mb-8">
           <h3 className="font-serif font-bold text-lg text-primary mb-4">Bilateral Agreements</h3>
           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                    <tr>
                       <th className="p-3">Title</th>
                       <th className="p-3">Date</th>
                       <th className="p-3">Status</th>
                       <th className="p-3">Summary</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {data.bilateralAgreements.map((a, i) => (
                       <tr key={i}>
                          <td className="p-3 font-bold text-primary">{a.title}</td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">{a.date}</td>
                          <td className="p-3">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${a.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {a.status}
                             </span>
                          </td>
                          <td className="p-3 text-gray-600">{a.summary}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Recent Interactions (Timeline-ish) */}
        <div className="mb-8">
           <h3 className="font-serif font-bold text-lg text-primary mb-4">Recent Interactions</h3>
           <div className="space-y-4">
              {data.recentInteractions.map((item, i) => (
                 <div key={i} className="flex gap-4">
                    <div className="w-24 text-right pt-1">
                       <p className="font-bold text-sm text-gray-700">{item.date}</p>
                       <p className="text-[10px] text-gray-400 uppercase">{item.type}</p>
                    </div>
                    <div className="relative flex-1 border-l-2 border-primary/20 pl-4 pb-4">
                       <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary"></div>
                       <h4 className="font-bold text-primary-dark">{item.title}</h4>
                       <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Delegations Grid */}
        <div className="mt-8 pt-8 border-t border-gray-200">
           <div className="grid grid-cols-2 gap-12">
              <div>
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-primary/20 pb-2">
                    <img src="https://flagcdn.com/w40/ae.png" className="h-5 w-auto shadow-sm" alt="UAE" />
                    UAE Delegation
                 </h4>
                 <div className="space-y-6">
                    {data.delegations.uae.map(d => (
                       <div key={d.id} className="flex gap-4">
                          <div className="w-16 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                             {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                             <p className="font-bold text-base text-gray-900">{d.name}</p>
                             <p className="text-xs font-bold text-primary uppercase mb-2">{d.title}</p>
                             <p className="text-[10px] text-gray-500 leading-tight line-clamp-3">{d.bio}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div>
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                   <img src={`https://flagcdn.com/w40/${data.country === 'Philippines' ? 'ph' : data.country === 'India' ? 'in' : 'ae'}.png`} className="h-5 w-auto shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
                   Partner Delegation
                 </h4>
                 <div className="space-y-6">
                    {data.delegations.partner.map(d => (
                       <div key={d.id} className="flex gap-4">
                          <div className="w-16 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                             {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                             <p className="font-bold text-base text-gray-900">{d.name}</p>
                             <p className="text-xs font-bold text-gray-500 uppercase mb-2">{d.title}</p>
                             <p className="text-[10px] text-gray-500 leading-tight line-clamp-3">{d.bio}</p>
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
         <button onClick={() => window.print()} className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-all" title="Print Now">
            <Printer size={20} />
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-600 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all" title="Close">
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