import React from "react";
import { ShieldAlert } from "lucide-react";

/* ===============================
   PAGE CONTAINER
================================ */
export const PageContainer = ({
  children,
  footer,
  className = ""
}: {
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) => (
  <div className={`w-[210mm] min-h-[297mm] bg-white mx-auto flex flex-col page-break ${className}`}>
    <div className="px-12 pt-8 flex-1">{children}</div>

    {footer && (
      <div className="mt-auto px-12 pb-6">{footer}</div>
    )}
  </div>
);

/* ===============================
   HEADER BAND
================================ */
export const HeaderBand = ({
  country,
  reportId,
}: {
  country: string;
  reportId: string;
}) => (
  <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
    <div className="flex items-center gap-3">
      {/* Fallback to flag if logo not available */}
      <img src="https://flagcdn.com/w40/ae.png" className="h-6 w-auto shadow-sm" alt="UAE" />
      <div className="h-8 w-px bg-gray-200" />
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
          Labour Market Intelligence
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
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  chip?: string;
  tone?: "ok" | "warn" | "info" | "restrict";
}) => (
  <div className="kpi-card avoid-break">
    <div className="kpi-row">
      <div className="kpi-icon">
        <Icon size={16} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <p className="kpi-label truncate pr-2">{label}</p>
          {chip && (
            <span
              className={`kpi-chip shrink-0 ${
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

        <p className="kpi-value truncate" title={String(value)}>{value || 'N/A'}</p>
        {sub && <p className="kpi-sub mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);