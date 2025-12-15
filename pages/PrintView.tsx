import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import {
  Globe, Briefcase, Users, FileText, TrendingUp, Building,
  Handshake,
  ShieldAlert, Landmark, Plane, Banknote,
  Printer, X, AlertTriangle, CheckCircle2, GraduationCap
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
        if (r) setReport(r);
        else setError(true);
      });
    }
  }, [id]);

  useEffect(() => {
    if (report) {
      document.fonts.ready.then(() => {
        const t = setTimeout(() => {
          // window.print();
        }, 700);
        return () => clearTimeout(t);
      });
    }
  }, [report]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Report Not Found</h2>
        <p>The report you are trying to print could not be found or has been deleted.</p>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium"
        >
          Close Window
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse">
        Generating Ministerial Document...
      </div>
    );
  }

  const { data } = report;

  // -----------------------------
  // Helpers (fix chopped text)
  // -----------------------------
  const countryFlagCode = useMemo(() => {
    if (data.country === 'Philippines') return 'ph';
    if (data.country === 'India') return 'in';
    return 'ae';
  }, [data.country]);

  // Dynamically scale “value” text so long things (capitals, labels) fit the box
  const valueSizeClass = (value?: string | number) => {
    const s = String(value ?? '');
    const len = s.length;
    if (len >= 28) return 'text-sm';
    if (len >= 22) return 'text-base';
    if (len >= 16) return 'text-lg';
    return 'text-xl';
  };

  const chipClass = (tone?: 'ok' | 'warn' | 'info' | 'restrict') => {
    switch (tone) {
      case 'ok': return 'bg-green-50 text-green-800 border-green-200';
      case 'warn': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'restrict': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  // -----------------------------
  // Layout Components
  // -----------------------------
  const Footer = () => (
    <div className="mt-auto px-12 pb-6 pt-4 border-t border-gray-100 flex justify-between items-center">
      <p className="font-bold text-red-800 text-[9px] tracking-[0.2em] uppercase flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded border border-red-100">
        <ShieldAlert size={10} /> Confidential / Official Use Only
      </p>
      <p className="text-[9px] text-gray-400 font-medium">
        Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );

  const PageContainer = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
    <div className={`w-[210mm] min-h-[297mm] bg-white mx-auto flex flex-col overflow-hidden ${className}`}>
      {/* Header (IN FLOW - avoids overlap) */}
      <div className="px-12 pt-8">
        <div className="flex justify-between items-end border-b-2 border-primary/10 pb-2">
          <div className="flex items-center gap-2 opacity-70">
            <img src="https://flagcdn.com/w40/ae.png" className="h-3 w-auto" alt="UAE" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Ministry of Human Resources & Emiratisation
            </span>
          </div>
          <div className="text-[9px] text-gray-400 font-mono">
            REF: {report.id}
          </div>
        </div>
      </div>

      <div className="px-12 pt-6 flex-1">
        {children}
      </div>

      <Footer />
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="mb-6">
      <div className="flex items-end gap-3 border-b border-gray-200 pb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary-dark" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-serif font-bold text-primary-dark leading-none">{title}</h2>
          {subtitle && (
            <p className="text-[10px] text-accent font-extrabold uppercase tracking-widest mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <img
            src={`https://flagcdn.com/w40/${countryFlagCode}.png`}
            className="h-4 w-auto"
            alt="flag"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${chipClass('restrict')}`}>
            Restricted
          </span>
        </div>
      </div>
    </div>
  );

  const DataCard = ({ title, children, className = '' }: { title?: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-gray-50/50 border border-gray-200 rounded-xl p-5 ${className}`}>
      {title && (
        <h3 className="font-bold text-primary-dark text-[11px] uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );

  // KPI: fixes chopped labels/values by allowing wrap + break-words
  const KPI = ({
    icon: Icon,
    label,
    value,
    sub,
    chip,
    tone = 'info'
  }: {
    icon: any;
    label: string;
    value: string | number;
    sub?: string;
    chip?: string;
    tone?: 'ok' | 'warn' | 'info' | 'restrict';
  }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-gray-50">
          <Icon size={18} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* label can wrap */}
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 whitespace-normal break-words">
              {label}
            </p>
            {chip && (
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${chipClass(tone)}`}>
                {chip}
              </span>
            )}
          </div>

          {/* value can wrap + auto size */}
          <p className={`${valueSizeClass(value)} font-serif font-bold text-gray-900 leading-snug whitespace-normal break-words`}>
            {value}
          </p>

          {sub && (
            <p className="text-[10px] text-gray-500 italic whitespace-normal break-words mt-0.5">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // -----------------------------
  // Pages
  // -----------------------------
  const CoverPage = () => (
    <div className="w-[210mm] h-[297mm] bg-white mx-auto relative flex flex-col overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="flex-1 flex flex-col justify-center px-16 relative z-10">
        <div className="mb-16 border-l-4 border-accent pl-8 py-2">
          <div className="flex items-center gap-3 mb-4">
            <img src="https://flagcdn.com/w160/ae.png" alt="UAE" className="h-8 w-auto shadow-sm" />
            <span className="h-8 w-px bg-gray-300"></span>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              United Arab Emirates<br />Ministry of Human Resources & Emiratisation
            </p>
          </div>
          <h1 className="text-4xl font-serif font-medium text-gray-900 leading-tight">
            Labour Market<br />Intelligence Report
          </h1>
        </div>

        <div className="space-y-12">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-gray-100">
              <img
                src={`https://flagcdn.com/w320/${countryFlagCode}.png`}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                alt="Subject flag"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-accent uppercase tracking-widest mb-1">Subject Market</p>
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
              <p className="text-sm font-bold text-red-700 bg-red-50 inline-block px-2 py-1 rounded border border-red-100">
                Official / Restricted
              </p>
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

  const ProfilePage = () => (
    <PageContainer className="page-break">
      <SectionHeader icon={Globe} title="Country Profile" subtitle="Strategic Overview" />

      <div className="grid grid-cols-3 gap-6 mb-8">
        <DataCard className="col-span-2" title="Key Demographics">
          <div className="grid grid-cols-2 gap-4">
            <KPI icon={Landmark} label="Capital City" value={data.capital} />
            <KPI icon={Users} label="Total Population" value={data.population} />
            <KPI icon={Banknote} label="Currency" value={data.currency} />
            {/* ✅ remove word CONNECTED, and allow wrapping */}
            <KPI
              icon={Plane}
              label="Flight Connectivity"
              value={data.directFlight ? 'Yes, Direct Flights Available' : 'Indirect Only'}
              sub="To UAE airports"
            />
            <KPI icon={TrendingUp} label="Human Development Index (HDI)" value={data.hdi} />
            <KPI icon={Globe} label="Official Language" value={data.officialLanguage} />
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
                <p className="font-serif text-lg text-primary-dark pl-4 whitespace-normal break-words">
                  {data.uaeEmbassyLocation || "N/A"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Foreign Embassy</span>
                </div>
                <p className="font-serif text-lg text-gray-800 pl-4 whitespace-normal break-words">
                  {data.foreignEmbassyLocation || "N/A"}
                </p>
              </div>
            </div>
          </DataCard>

          <div className="bg-primary text-white p-5 rounded-xl shadow-sm border border-primary/10">
            <p className="text-xs font-bold opacity-70 uppercase mb-2">Trafficking in Persons (TIP) Rank</p>
            <div className="text-3xl font-serif font-bold">{data.economicStats.tipRank}</div>
          </div>
        </div>
      </div>

      <SectionHeader icon={TrendingUp} title="Economic Landscape" subtitle="Trade & Education" />

      <div className="grid grid-cols-2 gap-6 mb-8">
        <DataCard title="Trade Statistics">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 border-dashed pb-2 gap-4">
              <span className="text-sm text-gray-600">GDP (Current US$)</span>
              <span className="font-bold text-primary-dark whitespace-normal break-words text-right">{data.gdp}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 border-dashed pb-2 gap-4">
              <span className="text-sm text-gray-600">Inflation Rate</span>
              <span className="font-bold text-gray-800 whitespace-normal break-words text-right">{data.economicStats.inflation}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="text-center w-1/2 border-r border-gray-200">
                <p className="text-xs text-gray-400 uppercase font-bold">Imports from UAE</p>
                <p className="text-xl font-bold text-primary-dark mt-1 whitespace-normal break-words">
                  {data.economicStats.totalImportsFromUAE}
                </p>
              </div>
              <div className="text-center w-1/2">
                <p className="text-xs text-gray-400 uppercase font-bold">Exports to UAE</p>
                <p className="text-xl font-bold text-primary-dark mt-1 whitespace-normal break-words">
                  {data.economicStats.totalExportsToUAE}
                </p>
              </div>
            </div>
          </div>
        </DataCard>

        <DataCard title="Education & Skills">
          {/* ✅ Labels won’t chop: allow wrap */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-1 gap-3">
              <span className="whitespace-normal break-words">Primary School Enrollment</span>
              <span>{data.educationStats.primaryEnrollment}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: data.educationStats.primaryEnrollment.replace('%', '') + '%' }}></div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-1 gap-3">
              <span className="whitespace-normal break-words">Higher Education Enrollment</span>
              <span>{data.educationStats.higherEducationEnrollment}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: data.educationStats.higherEducationEnrollment.replace('%', '') + '%' }}></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
              <GraduationCap size={14} className="text-primary" />
              Top 5 Universities
            </p>

            {/* ✅ show 5 not 3 */}
            <ul className="text-sm space-y-1">
              {data.educationStats.topUniversities.slice(0, 5).map((u, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-accent">•</span>
                  <span className="whitespace-normal break-words">{u}</span>
                </li>
              ))}
            </ul>
          </div>
        </DataCard>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Top Traded Commodities
        </h4>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-primary mb-2">Exports to UAE</p>
            <div className="flex flex-wrap gap-2">
              {data.economicStats.topExportProducts.slice(0, 5).map((p, i) => (
                <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 shadow-sm whitespace-normal break-words">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-accent mb-2">Imports from UAE</p>
            <div className="flex flex-wrap gap-2">
              {data.economicStats.topImportProducts.slice(0, 5).map((p, i) => (
                <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 shadow-sm whitespace-normal break-words">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );

  const UAEWorkforcePage = () => (
    <PageContainer className="page-break">
      <SectionHeader icon={Building} title="Workforce in UAE" subtitle="MOHRE & ICP Data" />

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-primary text-white rounded-xl p-6 shadow-sm relative overflow-hidden border border-primary/10">
          <div className="relative z-10">
            <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">
              MOHRE • Private Sector
            </p>
            <p className="text-4xl font-serif font-bold whitespace-normal break-words">
              {data.uaeWorkforceStats.mohre.totalPrivate.value}
            </p>
            <p className="text-[10px] mt-2 opacity-80">
              Data as of {data.uaeWorkforceStats.mohre.totalPrivate.date}
            </p>
          </div>
          <Briefcase className="absolute -bottom-4 -right-4 text-white opacity-10" size={100} />
        </div>

        <div className="bg-white border-2 border-accent text-gray-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">
              MOHRE • Domestic Workers
            </p>
            <p className="text-4xl font-serif font-bold whitespace-normal break-words">
              {data.uaeWorkforceStats.mohre.totalDomestic.value}
            </p>
            <p className="text-[10px] mt-2 opacity-60">
              Data as of {data.uaeWorkforceStats.mohre.totalDomestic.date}
            </p>
          </div>
          <Users className="absolute -bottom-4 -right-4 text-accent opacity-10" size={100} />
        </div>
      </div>

      {/* ✅ Two charts: MOHRE + ICP */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <DataCard title="Workers by Emirate (MOHRE)">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.uaeWorkforceStats.mohre.byEmirate} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false} fill="#1e3a8a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Residents by Emirate (ICP)">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.uaeWorkforceStats.icp.byEmirate} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {data.uaeWorkforceStats.icp.byEmirate.map((_, idx) => (
                    <Cell key={idx} fill={BLUE_PALETTE[idx % BLUE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <DataCard title="Workers by Sector (Top 5)">
          <div className="space-y-3">
            {data.uaeWorkforceStats.mohre.bySector.slice(0, 5).map((sector, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1 gap-3">
                  <span className="font-medium text-gray-600 whitespace-normal break-words">{sector.name}</span>
                  <span className="font-bold text-gray-900">{sector.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(sector.value, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title="Additional Indicators">
          <div className="flex justify-between items-center gap-4 border-b border-gray-200 border-dashed pb-2 mb-3">
            <span className="text-sm text-gray-600">Total Workers in UAE</span>
            <span className="font-serif font-bold text-xl text-gray-900 whitespace-normal break-words text-right">
              {data.uaeWorkforceStats.custom?.[0]?.value || "N/A"}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 italic">
            ICP figures reflect residency records; MOHRE reflects registered labour relations in the private sector.
          </p>
        </DataCard>
      </div>
    </PageContainer>
  );

  const PartnerWorkforcePage = () => (
    <PageContainer className="page-break">
      <SectionHeader icon={Users} title="Partner Workforce" subtitle="Source Market Analysis" />

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 bg-gray-900 text-white p-6 rounded-xl flex flex-col justify-center">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Workforce</p>
          <p className="text-3xl font-serif font-bold text-white whitespace-normal break-words">{data.workforceStats.totalWorkforce}</p>
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
              <p className="text-2xl font-serif font-bold text-green-700 whitespace-normal break-words">{data.averageWage}</p>
            </div>
          </DataCard>
          <DataCard>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Min. Monthly Wage</p>
              <p className="text-2xl font-serif font-bold text-gray-700 whitespace-normal break-words">{data.minimumWage}</p>
            </div>
          </DataCard>

          <div className="col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
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
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
            Sector Distribution
          </h4>
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
                    {data.workforceStats.topSectors.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-40 text-[10px] space-y-2">
              {data.workforceStats.topSectors.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm mt-0.5" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-gray-600 font-medium whitespace-normal break-words">
                    {s.name} <span className="text-gray-400">({s.value}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/2">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
            Skills Availability
          </h4>
          <div className="bg-gray-50 rounded-xl p-5 h-[250px] overflow-hidden border border-gray-200">
            <div className="flex flex-wrap gap-2 content-start">
              {data.workforceStats.availableSkills.map((skill, i) => (
                <span key={i} className="bg-white text-gray-700 px-3 py-1.5 rounded border border-gray-200 text-xs font-medium shadow-sm whitespace-normal break-words">
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                "These skills represent primary categories of labor available for international deployment based on current vocational output."
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );

  const RelationsPage = () => (
    <PageContainer className="page-break">
      <SectionHeader icon={Handshake} title="Relations & Delegations" subtitle="Bilateral Engagement" />

      <div className="mb-10">
        <h3 className="font-bold text-primary-dark text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
          <FileText size={16} /> Key Agreements & MoUs
        </h3>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
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
                  <td className="px-4 py-3 font-bold text-gray-800 whitespace-normal break-words">{a.title}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.date}</td>
                  <td className="px-4 py-3">
                    {a.status === 'Active' ? (
                      <span className="flex items-center gap-1 text-green-700 text-[10px] font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full w-fit border border-green-200">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-700 text-[10px] font-bold uppercase bg-yellow-50 px-2 py-0.5 rounded-full w-fit border border-yellow-200">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed whitespace-normal break-words">{a.summary}</td>
                </tr>
              ))}
              {data.bilateralAgreements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs italic">
                    No formal agreements recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="font-bold text-primary-dark text-sm uppercase tracking-wide mb-4">Recent High-Level Interactions</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.recentInteractions.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded">
                  {item.type}
                </span>
                <span className="text-[10px] font-mono text-gray-400">{item.date}</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1 whitespace-normal break-words">{item.title}</h4>
              <p className="text-xs text-gray-500 leading-snug whitespace-normal break-words">{item.details}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-primary pb-2">
              <img src="https://flagcdn.com/w40/ae.png" className="h-4 w-auto" alt="UAE" />
              <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs">UAE Delegation</h4>
            </div>
            <div className="space-y-6">
              {data.delegations.uae.map(d => (
                <div key={d.id} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                    {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" alt={d.name} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 whitespace-normal break-words">{d.name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase mb-1 whitespace-normal break-words">{d.title}</p>
                    <p className="text-[10px] text-gray-500 leading-tight whitespace-normal break-words">{d.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-accent pb-2">
              <img
                src={`https://flagcdn.com/w40/${countryFlagCode}.png`}
                className="h-4 w-auto"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                alt="Partner flag"
              />
              <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Partner Delegation</h4>
            </div>
            <div className="space-y-6">
              {data.delegations.partner.map(d => (
                <div key={d.id} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                    {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" alt={d.name} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 whitespace-normal break-words">{d.name}</p>
                    <p className="text-[10px] font-bold text-accent uppercase mb-1 whitespace-normal break-words">{d.title}</p>
                    <p className="text-[10px] text-gray-500 leading-tight whitespace-normal break-words">{d.bio}</p>
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
        <button
          onClick={() => window.print()}
          className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold"
          title="Print Now"
        >
          <Printer size={18} /> Print Document
        </button>
        <button
          onClick={() => window.close()}
          className="bg-white text-gray-600 p-2.5 rounded-lg shadow-lg hover:bg-gray-100 transition-all border border-gray-200"
          title="Close"
        >
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
