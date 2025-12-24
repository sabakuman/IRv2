
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
      <div className="mt-auto pt-3 border-t border-gray-100 pb-1">
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
    <div className="flex items-center justify-between border-b-2 border-primary pb-3 mb-6">
      <div className="flex items-center gap-4">
        <img src={flagSrc} className="h-8 w-auto shadow-sm rounded-sm" alt={country} />
        <div className="h-8 w-px bg-gray-200" />
        <div>
          {/* Header Cleaned: Only Country Name, bold and slightly bigger */}
          <h1 className="text-3xl font-bold text-primary-dark uppercase leading-none">{country}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-red-50 text-red-700 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-red-100">
          <ShieldAlert size={12} /> Restricted
        </span>
        <span className="text-[10px] text-gray-400 font-mono">REF: {reportId}</span>
      </div>
    </div>
  );
};

export const SectionHeader = ({ icon: Icon, title, subtitle, compact = false }: any) => (
  <div className={`avoid-break ${compact ? 'mb-3' : 'mb-5'}`}>
    <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
      <div className={`rounded bg-primary/5 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
        <Icon size={compact ? 16 : 20} className="text-primary-dark" />
      </div>
      <div className="flex-1">
        <h2 className={`font-bold text-primary-dark leading-tight ${compact ? 'text-lg' : 'text-xl'}`}>
          {title}
        </h2>
        {subtitle && <p className="text-[9px] font-bold uppercase tracking-wider text-accent mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export const KPI = ({ icon: Icon, label, value, sub }: any) => (
  <div className="report-kpi-card">
    <div className="report-kpi-icon">
      <Icon size={18} className="text-primary" />
    </div>
    <div className="report-kpi-text">
      <p className="report-kpi-label">{label}</p>
      <p className="report-kpi-value" dir="ltr">{value || 'N/A'}</p>
      {sub && <p className="text-[8px] text-gray-400 italic mt-0.5 leading-tight">{sub}</p>}
    </div>
  </div>
);
