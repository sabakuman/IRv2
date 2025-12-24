
import React from "react";
import { ShieldAlert } from "lucide-react";

export const PageContainer: React.FC<{
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}> = ({ children, footer, className = "" }) => (
  <div className={`w-[210mm] h-[297mm] bg-white mx-auto flex flex-col page-break relative overflow-hidden report-font ${className}`}>
    <div className="flex-1 overflow-visible">{children}</div>
    {footer && (
      <div className="mt-auto pt-4 border-t border-gray-100 pb-2">
        {footer}
      </div>
    )}
  </div>
);

export const HeaderBand = ({ country, reportId, flagUrl }: any) => {
  const getFlagCode = (c: string) => {
    const lower = (c || '').toLowerCase();
    if (lower.includes('india')) return 'in';
    if (lower.includes('philippines')) return 'ph';
    return 'ae'; 
  };
  const flagSrc = flagUrl || `https://flagcdn.com/w320/${getFlagCode(country)}.png`;

  return (
    <div className="flex items-center justify-between border-b-4 border-primary pb-4 mb-8">
      <div className="flex items-center gap-5">
        <img src={flagSrc} className="h-10 w-auto shadow-md rounded-sm" alt={country} />
        <div className="h-10 w-px bg-gray-200" />
        <div>
          {/* Header Cleaned: Only Country Name */}
          <h1 className="text-4xl font-bold text-primary-dark uppercase leading-none">{country}</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="bg-red-50 text-red-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-red-100">
          <ShieldAlert size={14} /> Restricted
        </span>
        <span className="text-xs text-gray-400 font-mono">REF: {reportId}</span>
      </div>
    </div>
  );
};

export const SectionHeader = ({ icon: Icon, title, subtitle, compact = false }: any) => (
  <div className={`avoid-break ${compact ? 'mb-4' : 'mb-6'}`}>
    <div className="flex items-center gap-4 border-b-4 border-accent pb-2">
      <div className={`rounded-xl bg-primary/10 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
        <Icon size={compact ? 20 : 26} className="text-primary-dark" />
      </div>
      <div className="flex-1">
        <h2 className={`font-bold text-primary-dark leading-tight ${compact ? 'text-xl' : 'text-2xl'}`}>
          {title}
        </h2>
        {subtitle && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export const KPI = ({ icon: Icon, label, value, sub }: any) => (
  <div className="kpi-card-report">
    <div className="kpi-icon-box">
      <Icon size={24} className="text-primary" />
    </div>
    <div className="kpi-text-box">
      <p className="kpi-label-report">{label}</p>
      <p className="kpi-value-report" dir="ltr">{value || 'N/A'}</p>
      {sub && <p className="text-[9px] text-gray-500 italic mt-0.5 leading-tight font-sans">{sub}</p>}
    </div>
  </div>
);
