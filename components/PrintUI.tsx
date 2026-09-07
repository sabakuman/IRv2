
import React from "react";
import { ShieldAlert } from "lucide-react";

/* ===============================
   PAGE CONTAINER
================================ */
export const PageContainer: React.FC<{
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}> = ({
  children,
  footer,
  className = "",
  contentClassName = "px-12 pt-8 pb-28"
}) => (
  <div 
    className={`w-[210mm] h-[297mm] bg-white text-gray-900 mx-auto flex flex-col page-break relative overflow-hidden report-root ${className}`}
    style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
  >
    {/* Optimized safe-zone: pb-28 (7rem / 112px) is used to balance 
        content density and footer safety. */}
    <div className={`flex-1 overflow-visible ${contentClassName}`}>{children}</div>

    {footer && (
      <div className="absolute bottom-6 left-12 right-12 h-16 flex flex-col justify-end bg-white" style={{ backgroundColor: '#ffffff' }}>
        {footer}
      </div>
    )}
  </div>
);

/* ===============================
   HEADER BAND
================================ */
export const HeaderBand = ({
  country = '',
  reportId = '',
  title = '',
  flagUrl
}: {
  country?: string;
  reportId?: string;
  title?: string;
  flagUrl?: string;
}) => {
  const getFlagCode = (c: string = '') => {
    const lower = (c || '').toLowerCase();
    if (lower.includes('india')) return 'in';
    if (lower.includes('philippines')) return 'ph';
    if (lower.includes('pakistan')) return 'pk';
    if (lower.includes('bangladesh')) return 'bd';
    if (lower.includes('vietnam')) return 'vn';
    return 'ae'; 
  };
  
  const flagCode = getFlagCode(country || '');
  const flagSrc = flagUrl || `https://flagcdn.com/w40/${flagCode}.png`;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
      <div className="flex items-center gap-2.5">
        <img 
          src={flagSrc} 
          className="w-8 h-5 object-cover rounded border border-gray-300 shadow-2xs shrink-0" 
          style={{ width: '32px', height: '20px', minWidth: '32px', minHeight: '20px', objectFit: 'cover' }} 
          alt={country} 
        />
        <div className="h-6 w-px bg-gray-200" />
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 leading-none">
            {title}
          </p>
          <p className="text-xs font-bold text-primary-dark uppercase leading-tight mt-0.5">
            {country} • Internal Report
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="kpi-chip chip-restrict flex items-center gap-1 text-[8.5px] py-0.5 px-2">
          <ShieldAlert size={10} /> Restricted
        </span>
        <span className="text-[9px] text-gray-400 font-mono">
          REF: {reportId}
        </span>
      </div>
    </div>
  );
};

/* ===============================
   COMBINED PAGE HEADER (Unified for Page 3+)
   Merges HeaderBand + SectionHeader into a unified, space-saving,
   ministerial top band that prevents vertical overflows and allows
   more generous font sizes.
================================ */
export const CombinedHeaderBand = ({
  country,
  reportId,
  title,
  subtitle,
  icon: Icon,
  flagUrl,
  badge,
  isRTL = false,
}: {
  country: string;
  reportId: string;
  title: string;
  subtitle?: string;
  icon?: any;
  flagUrl?: string;
  badge?: string;
  isRTL?: boolean;
}) => {
  const getFlagCode = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('india')) return 'in';
    if (lower.includes('philippines')) return 'ph';
    if (lower.includes('pakistan')) return 'pk';
    if (lower.includes('bangladesh')) return 'bd';
    if (lower.includes('sri lanka')) return 'lk';
    if (lower.includes('nepal')) return 'np';
    if (lower.includes('indonesia')) return 'id';
    if (lower.includes('egypt')) return 'eg';
    if (lower.includes('jordan')) return 'jo';
    if (lower.includes('vietnam')) return 'vn';
    return 'ae'; 
  };
  
  const flagCode = getFlagCode(country || '');
  const flagSrc = flagUrl || `https://flagcdn.com/w40/${flagCode}.png`;

  return (
    <div className="flex items-center justify-between border-b-2 border-primary/20 pb-2 mb-3 avoid-break">
      {/* Section Identity: Icon + Page Title & Subtitle */}
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-serif font-extrabold text-primary-dark leading-tight">
              {title}
            </h2>
            {badge && (
              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[9px] font-bold uppercase tracking-wider text-accent mt-0.5 leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Country & Report Identification */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-end">
          <p className="text-[11px] font-bold text-gray-900 leading-tight uppercase">
            {country}
          </p>
          <p className="text-[8px] text-gray-400 font-mono">
            REF: {reportId}
          </p>
        </div>
        <img src={flagSrc} className="h-5 w-auto rounded-xs shadow-2xs border border-gray-200" alt={country} />
        <span className="kpi-chip chip-restrict flex items-center gap-1 text-[8px] py-0.5 px-1.5">
          <ShieldAlert size={9} /> {isRTL ? 'سري' : 'Restricted'}
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
