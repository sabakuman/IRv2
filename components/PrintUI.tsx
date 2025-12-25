
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
    <div className="px-12 pt-10 pb-28 flex-1 overflow-visible">{children}</div>
    {footer && (
      <div className="absolute bottom-6 left-12 right-12 h-16 flex flex-col justify-end bg-white border-t border-gray-100">
        {footer}
      </div>
    )}
  </div>
);

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
export const KPI: React.FC<{
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  chip?: string;
  tone?: "ok" | "warn" | "info" | "restrict";
  labelClassName?: string;
}> = ({
  icon: Icon,
  label,
  value,
  sub,
  chip,
  tone = "info",
  labelClassName,
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
            <span className={`kpi-chip shrink-0 ml-1 ${
              tone === "ok" ? "chip-ok" : 
              tone === "warn" ? "chip-warn" : 
              tone === "restrict" ? "chip-restrict" : "chip-info"
            }`}>
              {chip}
            </span>
          )}
        </div>
        <p className="kpi-value break-words leading-tight text-sm font-sans text-gray-900">
           {value || 'N/A'}
        </p>
        {sub && <p className="kpi-sub mt-1.5 leading-tight">{sub}</p>}
      </div>
    </div>
  </div>
);
