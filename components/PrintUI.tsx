
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
      <div className="mt-auto pt-6 border-t border-gray-100 pb-2">
        {footer}
      </div>
    )}
  </div>
);

export const HeaderBand = ({ country, reportId, title, flagUrl }: any) => {
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
        <div className="h-12 w-px bg-gray-200" />
        <div>
          <h1 className="text-4xl font-bold text-primary-dark uppercase leading-none">{country}</h1>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent mt-1">{title}</p>
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
  <div className={`avoid-break ${compact ? 'mb-6' : 'mb-8'}`}>
    <div className="flex items-center gap-4 border-b-4 border-accent pb-3">
      <div className={`rounded-xl bg-primary/10 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <Icon size={compact ? 22 : 32} className="text-primary-dark" />
      </div>
      <div className="flex-1">
        <h2 className={`font-bold text-primary-dark leading-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {title}
        </h2>
        {subtitle && <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export const KPI = ({ icon: Icon, label, value, sub, tone = "info" }: any) => (
  <div className="kpi-card avoid-break">
    <div className="kpi-icon-container">
      <Icon size={28} className="text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value truncate" dir="ltr">{value || 'N/A'}</p>
      {sub && <p className="text-[11px] text-gray-500 italic mt-1 leading-tight font-sans">{sub}</p>}
    </div>
  </div>
);
