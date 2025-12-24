
import React from "react";
import { ShieldAlert } from "lucide-react";

/* ===============================
   PAGE CONTAINER
================================ */
export const PageContainer: React.FC<{
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}> = ({
  children,
  footer,
  className = ""
}) => (
  <div className={`w-[210mm] h-[297mm] bg-white mx-auto flex flex-col page-break relative overflow-hidden report-font ${className}`}>
    <div className="px-12 pt-10 pb-20 flex-1 overflow-visible">{children}</div>

    {footer && (
      <div className="absolute bottom-6 left-12 right-12 h-10 flex flex-col justify-end bg-white">
        {footer}
      </div>
    )}
  </div>
);

/* ===============================
   HEADER BAND
================================ */
export const HeaderBand = ({
  country,
  reportId,
  flagUrl
}: {
  country: string;
  reportId: string;
  flagUrl?: string;
}) => {
  const getFlagCode = (c: string) => {
    const lower = c.toLowerCase();
    if (lower.includes('india')) return 'in';
    if (lower.includes('philippines')) return 'ph';
    if (lower.includes('pakistan')) return 'pk';
    if (lower.includes('bangladesh')) return 'bd';
    return 'ae'; 
  };
  
  const flagCode = getFlagCode(country);
  const flagSrc = flagUrl || `https://flagcdn.com/w40/${flagCode}.png`;

  return (
    <div className="flex items-center justify-between border-b-2 border-primary pb-3 mb-6">
      <div className="flex items-center gap-3">
        <img src={flagSrc} className="h-8 w-auto shadow-sm rounded-sm" alt={country} />
        <div className="h-8 w-px bg-gray-200" />
        <div>
          {/* Header Cleanup: Country Name only */}
          <h1 className="text-3xl font-bold text-primary-dark uppercase leading-none">
            {country}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="kpi-chip chip-restrict flex items-center gap-1">
          <ShieldAlert size={12} /> Restricted
        </span>
        <span className="text-[10px] text-gray-400 font-mono">
          REF: {reportId}
        </span>
      </div>
    </div>
  );
};

/* ===============================
   SECTION HEADER
================================ */
export const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  compact = false
}: {
  icon: any;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) => (
  <div className={`section-rail avoid-break ${compact ? 'mb-4 mt-2' : 'mb-6 mt-4'}`}>
    <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
      <div className={`rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
        <Icon size={compact ? 16 : 20} className="text-primary-dark" />
      </div>
      <div>
        <h2 className={`font-bold text-primary-dark leading-none ${compact ? 'text-xl' : 'text-2xl'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
);

/* ===============================
   KPI COMPONENT (REPORT)
================================ */
export const KPI = ({
  icon: Icon,
  label,
  value,
  sub,
  chip,
  tone = "info",
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  chip?: string;
  tone?: "ok" | "warn" | "info" | "restrict";
}) => (
  <div className="report-kpi-card">
    <div className="report-kpi-icon">
      <Icon size={18} className="text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <span className="report-kpi-label">{label}</span>
        {chip && (
          <span className={`kpi-chip ${tone === "ok" ? "chip-ok" : tone === "warn" ? "chip-warn" : tone === "restrict" ? "chip-restrict" : "chip-info"}`}>
            {chip}
          </span>
        )}
      </div>
      <p className="report-kpi-value truncate" dir="ltr">
        {value || 'N/A'}
      </p>
      {sub && <p className="text-[9px] text-gray-400 italic mt-0.5 leading-tight">{sub}</p>}
    </div>
  </div>
);
