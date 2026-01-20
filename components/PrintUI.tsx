
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
  <div className={`w-[210mm] h-[297mm] bg-white mx-auto flex flex-col page-break relative overflow-hidden ${className}`}>
    {/* Optimized safe-zone: pb-28 (7rem / 112px) is used to balance 
        content density and footer safety. */}
    <div className="px-12 pt-8 pb-28 flex-1 overflow-visible">{children}</div>

    {footer && (
      <div className="absolute bottom-6 left-12 right-12 h-16 flex flex-col justify-end bg-white">
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
  title,
  flagUrl
}: {
  country: string;
  reportId: string;
  title: string;
  flagUrl?: string;
}) => {
  const getFlagCode = (c: string) => {
    const lower = c.toLowerCase();
    if (lower.includes('india')) return 'in';
    if (lower.includes('philippines')) return 'ph';
    if (lower.includes('pakistan')) return 'pk';
    if (lower.includes('bangladesh')) return 'bd';
    if (lower.includes('vietnam')) return 'vn';
    return 'ae'; 
  };
  
  const flagCode = getFlagCode(country);
  const flagSrc = flagUrl || `https://flagcdn.com/w40/${flagCode}.png`;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
      <div className="flex items-center gap-3">
        <img src={flagSrc} className="h-6 w-auto shadow-sm" alt={country} />
        <div className="h-8 w-px bg-gray-200" />
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
            {title}
          </p>
          <p className="text-sm font-bold text-primary-dark uppercase">
            {country} • Internal Report
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="kpi-chip chip-restrict flex items-center gap-1">
          <ShieldAlert size={12} /> Restricted
        </span>
        <span className="text-[9px] text-gray-400 font-mono">
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
    <div className="flex items-end gap-3 border-b border-gray-200 pb-2">
      <div className={`rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
        <Icon size={compact ? 16 : 20} className="text-primary-dark" />
      </div>
      <div>
        <h2 className={`font-serif font-bold text-primary-dark leading-none ${compact ? 'text-xl' : 'text-2xl'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-accent mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
);

/* ===============================
   KPI COMPONENT
================================ */
export const KPI = ({
  icon: Icon,
  label,
  value,
  sub,
  chip,
  tone = "info",
  labelClassName,
}: {
  icon: any;
  label: string;
  value: string | number;
  // Fix: changed from string to React.ReactNode to allow JSX elements returned by getSource
  sub?: React.ReactNode;
  chip?: string;
  tone?: "ok" | "warn" | "info" | "restrict";
  labelClassName?: string;
}) => (
  <div className="kpi-card avoid-break h-full flex flex-col">
    <div className="kpi-row items-start">
      <div className="kpi-icon shrink-0 mt-0.5">
        <Icon size={16} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1.5">
          <p className={`kpi-label pr-1 leading-tight ${labelClassName || ''}`}>{label}</p>
          {chip && (
            <span
              className={`kpi-chip shrink-0 ml-1 ${
                tone === "ok"
                  ? "chip-ok"
                  : tone === "warn"
                  ? "chip-warn"
                  : tone === "restrict"
                  ? "chip-restrict"
                  : "chip-info"
              }`}
            >
              {chip}
            </span>
          )}
        </div>

        <p className="kpi-value break-words leading-tight text-sm font-sans text-gray-900" title={String(value)}>
           <span>{value || 'N/A'}</span>
        </p>
        
        {sub && <p className="kpi-sub mt-1.5 leading-tight">{sub}</p>}
      </div>
    </div>
  </div>
);
