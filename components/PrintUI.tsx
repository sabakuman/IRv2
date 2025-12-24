
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
    <div className="px-12 pt-10 pb-28 flex-1 overflow-visible">{children}</div>

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
    return 'ae'; 
  };
  
  const flagCode = getFlagCode(country);
  const flagSrc = flagUrl || `https://flagcdn.com/w320/${flagCode}.png`;

  return (
    <div className="flex items-center justify-between border-b-4 border-primary pb-4 mb-8">
      <div className="flex items-center gap-4">
        <img src={flagSrc} className="h-8 w-auto shadow-md rounded-sm" alt={country} />
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <h1 className="text-3xl font-bold text-primary-dark uppercase leading-none">
            {country}
          </h1>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent mt-1">
            {title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="kpi-chip chip-restrict flex items-center gap-2 px-3 py-1 font-bold">
          <ShieldAlert size={14} /> Restricted
        </span>
        <span className="text-xs text-gray-400 font-mono">
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
  <div className={`avoid-break ${compact ? 'mb-6 mt-4' : 'mb-8 mt-6'}`}>
    <div className="flex items-center gap-4 border-b-4 border-accent pb-3">
      <div className={`rounded-xl bg-primary/10 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <Icon size={compact ? 20 : 28} className="text-primary-dark" />
      </div>
      <div className="flex-1">
        <h2 className={`font-bold text-primary-dark leading-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mt-1">
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
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  chip?: string;
  tone?: "ok" | "warn" | "info" | "restrict";
}) => (
  <div className="kpi-card avoid-break h-full">
    <div className="kpi-icon-box">
      <Icon size={24} className="text-primary" />
    </div>

    <div className="flex-1">
      <div className="flex justify-between items-center mb-0.5">
        <p className="kpi-label">{label}</p>
        {chip && (
          <span
            className={`kpi-chip shrink-0 text-[10px] ${
              tone === "ok" ? "chip-ok" : tone === "warn" ? "chip-warn" : tone === "restrict" ? "chip-restrict" : "chip-info"
            }`}
          >
            {chip}
          </span>
        )}
      </div>

      <p className="kpi-value">
         <span dir="ltr">{value || 'N/A'}</span>
      </p>
      
      {sub && <p className="text-[10px] text-gray-500 italic mt-1 font-sans">{sub}</p>}
    </div>
  </div>
);
