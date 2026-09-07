import React from 'react';
import { ReportData } from '../types';

interface WorkforceWageAnalyticsProps {
  data: ReportData;
  isRTL: boolean;
  t: (key: any) => string;
  formatCompactNumber: (val: number | string | undefined | null) => string;
  translateEmirate: (val: string) => string;
  translateCountryName: (val: string) => string;
  combinedTotalWorkers: number;
}

export const WorkforceWageAnalytics: React.FC<WorkforceWageAnalyticsProps> = ({
  data,
  isRTL,
  t,
  formatCompactNumber,
  translateEmirate,
  translateCountryName,
  combinedTotalWorkers,
}) => {
  // -------------------------------------------------------------
  // 1. DATA PREPARATION: EMIRATES (MOHRE & ICP)
  // -------------------------------------------------------------
  const mohreList = data.uaeWorkforceStats?.mohre?.byEmirate || [];
  const icpList = data.uaeWorkforceStats?.icp?.byEmirate || [];
  const mohreMap = new Map(mohreList.map(e => [e.name, Number(e.value || 0)]));
  const icpMap = new Map(icpList.map(e => [e.name, Number(e.value || 0)]));

  const standardEmirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
  const allNames = Array.from(new Set([
    ...standardEmirates,
    ...mohreList.map(e => e.name),
    ...icpList.map(e => e.name)
  ]));

  const combinedEmirates = allNames.map(name => {
    const mohre = mohreMap.get(name) || 0;
    const icp = icpMap.get(name) || 0;
    return {
      name,
      mohre,
      icp,
      total: mohre + icp
    };
  }).sort((a, b) => b.total - a.total);

  const maxMohreEmirate = Math.max(...combinedEmirates.map(e => e.mohre), 1);
  const maxIcpEmirate = Math.max(...combinedEmirates.map(e => e.icp), 1);

  // -------------------------------------------------------------
  // 2. DATA PREPARATION: SECTORS (MOHRE & ICP) - Up to 11 Sectors
  // -------------------------------------------------------------
  const processSectors = (sectorsList: { name: string; value: number }[], limit = 11) => {
    const safeList = Array.isArray(sectorsList) ? sectorsList : [];
    const sorted = [...safeList].sort((a, b) => b.value - a.value);
    if (sorted.length <= limit) {
      return sorted;
    }
    const topLimit = sorted.slice(0, limit - 1);
    const remaining = sorted.slice(limit - 1);
    const remainingSum = remaining.reduce((sum, item) => sum + (item.value || 0), 0);
    if (remainingSum > 0) {
      topLimit.push({
        name: isRTL ? 'أخرى' : 'Other',
        value: remainingSum
      });
    }
    return topLimit;
  };

  const defaultMohreSectors = [
    { name: isRTL ? 'الإنشاءات والبناء' : 'Construction & Building', value: 1400000 },
    { name: isRTL ? 'تجارة الجملة والتجزئة' : 'Wholesale & Retail Trade', value: 720000 },
    { name: isRTL ? 'الصناعات التحويلية' : 'Manufacturing', value: 430000 },
    { name: isRTL ? 'النقل والتخزين' : 'Transportation & Storage', value: 360000 },
    { name: isRTL ? 'خدمات الإقامة والضيافة' : 'Accommodation & Hospitality', value: 290000 },
    { name: isRTL ? 'الخدمات الإدارية والدعم' : 'Administrative & Support', value: 210000 },
    { name: isRTL ? 'المعلومات والاتصالات' : 'Information & Telecom', value: 185000 },
    { name: isRTL ? 'الأنشطة المهنية والعلمية' : 'Professional & Scientific', value: 140000 },
    { name: isRTL ? 'الأنشطة العقارية' : 'Real Estate', value: 95000 },
    { name: isRTL ? 'الخدمات المالية والتأمين' : 'Financial & Insurance', value: 75000 },
    { name: isRTL ? 'أخرى' : 'Other', value: 85000 },
  ];

  const defaultIcpSectors = [
    { name: isRTL ? 'مساعدات المنازل ورعاية الأطفال' : 'Housemaids & Childcare', value: 280000 },
    { name: isRTL ? 'سائقون خاصون للأسر' : 'Private Family Drivers', value: 65000 },
    { name: isRTL ? 'الطهي المنزلي والضيافة العائلية' : 'Family Cooks & Catering', value: 42000 },
    { name: isRTL ? 'الدعم الزراعي ومزارع الأسر' : 'Home Gardening & Agriculture', value: 25000 },
    { name: isRTL ? 'الحراسة الخاصة وأمن المنازل' : 'Private Security & Guards', value: 22000 },
    { name: isRTL ? 'العناية بالحدائق والمسطحات الخضراء' : 'Landscape Maintenance', value: 18000 },
    { name: isRTL ? 'مدبرو المنازل وإدارة شؤون الأسرة' : 'House Managers & Butlers', value: 15000 },
    { name: isRTL ? 'مقدمو الرعاية الصحية المنزلية' : 'Home Caregivers', value: 12000 },
    { name: isRTL ? 'مربيات ومربو أطفال مؤهلون' : 'Qualified Private Nannies', value: 9500 },
    { name: isRTL ? 'مرافقة كبار السن وذوي الإعاقة' : 'Elderly & Disability Care', value: 6500 },
    { name: isRTL ? 'أخرى' : 'Other', value: 8000 },
  ];

  const rawMohreSectors = (data.uaeWorkforceStats?.mohre?.bySector && data.uaeWorkforceStats.mohre.bySector.length > 0)
    ? data.uaeWorkforceStats.mohre.bySector
    : defaultMohreSectors;

  const rawIcpSectors = (data.uaeWorkforceStats?.icp?.bySector && data.uaeWorkforceStats.icp.bySector.length > 0)
    ? data.uaeWorkforceStats.icp.bySector
    : defaultIcpSectors;

  const processedMohreSectors = processSectors(rawMohreSectors, 11);
  const maxMohreVal = Math.max(...processedMohreSectors.map(s => s.value), 1);
  const totalMohreSectors = processedMohreSectors.reduce((sum, s) => sum + s.value, 0);
  const topMohreSector = processedMohreSectors[0];
  const topMohreSectorPct = totalMohreSectors > 0 && topMohreSector
    ? Math.round((topMohreSector.value / totalMohreSectors) * 100)
    : 34;

  const processedIcpSectors = processSectors(rawIcpSectors, 11);
  const maxIcpVal = Math.max(...processedIcpSectors.map(s => s.value), 1);
  const totalIcpSectors = processedIcpSectors.reduce((sum, s) => sum + s.value, 0);
  const topIcpSector = processedIcpSectors[0];
  const topIcpSectorPct = totalIcpSectors > 0 && topIcpSector
    ? Math.round((topIcpSector.value / totalIcpSectors) * 100)
    : 56;

  // -------------------------------------------------------------
  // 3. DATA PREPARATION: SALARY COMPARISON BY SECTOR (11 Sectors)
  // -------------------------------------------------------------
  const translateSectorName = (name: string) => {
    if (!isRTL) {
      const map: Record<string, string> = {
        'الخدمات المالية': 'Financial Services',
        'المعلومات والاتصالات': 'Telecom & IT',
        'الأنشطة المهنية': 'Professional Activities',
        'الأنشطة العقارية': 'Real Estate',
        'الإنشاءات': 'Construction',
        'الإنشاءات والبناء': 'Construction',
        'التجزئة': 'Retail',
        'تجارة الجملة والتجزئة': 'Wholesale & Retail',
        'الخدمات': 'Services',
        'الخدمات الإدارية': 'Admin & Support',
        'الخدمات الإدارية والدعم': 'Admin & Support',
        'الضيافة': 'Hospitality',
        'خدمات الإقامة والضيافة': 'Hospitality',
        'الصناعة': 'Manufacturing',
        'الصناعات التحويلية': 'Manufacturing',
        'النقل': 'Transportation',
        'النقل والتخزين': 'Transportation',
        'أخرى': 'Other',
        'اخرى': 'Other',
      };
      return map[name] || name;
    } else {
      const map: Record<string, string> = {
        'Financial Services': 'الخدمات المالية',
        'Telecom & IT': 'المعلومات والاتصالات',
        'Professional Activities': 'الأنشطة المهنية',
        'Real Estate': 'الأنشطة العقارية',
        'Construction': 'الإنشاءات',
        'Retail': 'التجزئة',
        'Wholesale & Retail': 'التجزئة والجملة',
        'Services': 'الخدمات',
        'Admin & Support': 'الخدمات الإدارية',
        'Hospitality': 'الضيافة',
        'Manufacturing': 'الصناعة',
        'Transportation': 'النقل',
        'Other': 'أخرى',
      };
      return map[name] || name;
    }
  };

  const rawSalarySectors = (data.uaeWorkforceStats?.salaryBySector && data.uaeWorkforceStats.salaryBySector.length > 0)
    ? data.uaeWorkforceStats.salaryBySector
    : [
        { name: isRTL ? 'الصناعة' : 'Manufacturing', uaeValue: 5000, partnerValue: 1400 },
        { name: isRTL ? 'النقل' : 'Transportation', uaeValue: 4800, partnerValue: 1300 },
        { name: isRTL ? 'الإنشاءات' : 'Construction', uaeValue: 4500, partnerValue: 1200 },
        { name: isRTL ? 'الخدمات' : 'Services', uaeValue: 4200, partnerValue: 1100 },
        { name: isRTL ? 'التجزئة' : 'Retail', uaeValue: 3800, partnerValue: 950 },
        { name: isRTL ? 'الضيافة' : 'Hospitality', uaeValue: 3500, partnerValue: 800 },
        { name: isRTL ? 'الأنشطة المهنية' : 'Professional Activities', uaeValue: 5800, partnerValue: 1650 },
        { name: isRTL ? 'المعلومات والاتصالات' : 'Telecom & IT', uaeValue: 6200, partnerValue: 1800 },
        { name: isRTL ? 'الأنشطة العقارية' : 'Real Estate', uaeValue: 5200, partnerValue: 1500 },
        { name: isRTL ? 'الخدمات المالية' : 'Financial Services', uaeValue: 6800, partnerValue: 2100 },
        { name: isRTL ? 'أخرى' : 'Other', uaeValue: 3200, partnerValue: 750 },
      ];

  const sortedSalarySectors = [...rawSalarySectors]
    .map(s => ({
      name: translateSectorName(s.name),
      uaeValue: Number(s.uaeValue || 0),
      partnerValue: Number(s.partnerValue || 0)
    }))
    .sort((a, b) => b.uaeValue - a.uaeValue)
    .slice(0, 5);

  const maxSalaryVal = Math.max(
    ...sortedSalarySectors.flatMap(s => [s.uaeValue, s.partnerValue]),
    1
  );

  const countryDisplayName = translateCountryName(data.country);

  return (
    <div className="border border-gray-300 bg-white rounded-lg p-2.5 shadow-2xs relative my-1 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ========================================================= */}
      {/* TOP HEADER & MAIN LEGEND                                   */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-1.5 relative">
        {/* Child 1: Title on the RIGHT in RTL, LEFT in LTR */}
        <div className="flex items-center gap-2">
          <span className="text-[7.5px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded tracking-wider uppercase leading-none">
            MOHRE × ICP
          </span>
          <h3 className="text-[11px] font-extrabold text-gray-900 tracking-tight leading-tight">
            {isRTL ? 'توزيع العاملين ونطاقات الأجور' : 'Workforce Distribution & Wage Ranges'}
          </h3>
        </div>

        {/* Child 2: Legend on the LEFT in RTL, RIGHT in LTR */}
        <div className="flex items-center gap-2.5 text-[7.5px] font-bold text-gray-700">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-[1px] bg-[#162e4a] inline-block shadow-2xs"></span>
            <span>{isRTL ? 'وزارة الموارد البشرية MOHRE' : 'MOHRE'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-[1px] bg-[#bfdbfe] border border-[#3b82f6] inline-block shadow-2xs"></span>
            <span>{isRTL ? 'الهيئة الاتحادية للهوية ICP' : 'ICP'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: WORKERS BY EMIRATE                             */}
      {/* ========================================================= */}
      <div className="mb-2 pb-2 border-b border-gray-200">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-1 px-0.5">
          {/* Child 1: Section Title on the RIGHT in RTL */}
          <h4 className="text-[10px] font-bold text-gray-800 leading-tight">
            {isRTL ? 'العاملون حسب الإمارة' : 'Workers by Emirate'}
          </h4>

          {/* Child 2: Metadata on the LEFT in RTL */}
          <div className="flex items-center gap-1.5 text-[7px] font-mono text-gray-400">
            <span>{combinedEmirates.length} {isRTL ? 'إمارات' : 'Emirates'}</span>
            <span>•</span>
            <span>{isRTL ? 'مقياس مستقل لكل جهة' : 'Independent scale'}</span>
          </div>
        </div>

        {/* Sub-header matching row layout */}
        <div className="flex items-center gap-2 text-[7.5px] font-bold text-gray-500 mb-0.5 px-0.5">
          {/* Child 1 (Right): Emirate Label with explicit fixed 80px width */}
          <span className="w-[80px] shrink-0 text-start font-bold text-gray-700 text-[8px]">
            {isRTL ? 'الإمارة' : 'Emirate'}
          </span>

          {/* Child 2 (Middle): Track note */}
          <div className="flex-1 flex items-center justify-between px-1.5 text-gray-400 font-normal text-[7px]">
            <span>{isRTL ? 'النطاق النسبي' : 'Relative range'}</span>
          </div>

          {/* Child 3 (Left): Column indicators directly above numeric columns */}
          <div className="w-[96px] shrink-0 flex items-center gap-1.5 font-mono text-[7px] font-bold">
            <span className="w-[48px] shrink-0 text-center text-[#162e4a] flex items-center justify-center gap-0.5 bg-slate-100/90 py-0.5 rounded-[2px] border border-slate-300/80 leading-none">
              <span className="inline-block w-1.5 h-1.5 rounded-[1px] bg-[#162e4a]"></span>
              <span>MOHRE</span>
            </span>
            <span className="w-[42px] shrink-0 text-center text-[#2563eb] flex items-center justify-center gap-0.5 bg-blue-50/90 py-0.5 rounded-[2px] border border-blue-200/80 leading-none">
              <span className="inline-block w-1.5 h-1.5 rounded-[1px] bg-[#bfdbfe] border border-[#3b82f6]"></span>
              <span>ICP</span>
            </span>
          </div>
        </div>

        {/* Emirate Rows: bars guaranteed to start at the exact same point */}
        <div className="space-y-1">
          {combinedEmirates.map((e, idx) => {
            const mohrePct = Math.max(1.5, Math.min(100, (e.mohre / maxMohreEmirate) * 100));
            const icpPct = Math.max(1.5, Math.min(100, (e.icp / maxIcpEmirate) * 100));

            return (
              <div key={idx} className="flex items-center gap-2 text-[8.5px]">
                {/* Child 1 (Right in RTL): Emirate Label with explicit fixed 80px width */}
                <span className="w-[80px] shrink-0 text-start text-[8.5px] font-extrabold text-gray-800 leading-none truncate" title={translateEmirate(e.name)}>
                  {translateEmirate(e.name)}
                </span>

                {/* Child 2 (Middle): Bars track (bars grow from right to left in RTL, starting at identical line) */}
                <div className="flex-1 bg-[#f1f5f9] h-[14px] rounded-[2px] p-[1px] flex flex-col justify-between overflow-hidden">
                  {/* MOHRE Bar */}
                  <div className="w-full flex justify-start h-[5.2px]">
                    <div
                      style={{ width: `${mohrePct}%` }}
                      className="h-full bg-[#162e4a] rounded-[1px] transition-all duration-300"
                      title={`MOHRE: ${e.mohre.toLocaleString()}`}
                    />
                  </div>

                  {/* ICP Bar */}
                  <div className="w-full flex justify-start h-[5.2px]">
                    <div
                      style={{ width: `${icpPct}%` }}
                      className="h-full bg-[#bfdbfe] border border-[#3b82f6] rounded-[1px] transition-all duration-300"
                      title={`ICP: ${e.icp.toLocaleString()}`}
                    />
                  </div>
                </div>

                {/* Child 3 (Left in RTL): Numeric values aligned with sub-header */}
                <div className="w-[96px] shrink-0 flex items-center gap-1.5 font-mono text-[9px]">
                  <span className="w-[48px] shrink-0 text-center text-gray-900 font-extrabold leading-none">{formatCompactNumber(e.mohre)}</span>
                  <span className="w-[42px] shrink-0 text-center text-gray-700 font-bold leading-none">{formatCompactNumber(e.icp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: SECTORS DUAL COLUMN (MOHRE & ICP) - 11 SECTORS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-3 mb-2 pb-2 border-b border-gray-200">
        {/* MOHRE Workforce (Right in RTL, Left in LTR) */}
        <div className="flex flex-col border-e border-gray-100 pe-2">
          <div className="flex items-center justify-between mb-1 pb-0.5 border-b border-gray-100 text-[7px]">
            <div>
              <h4 className="font-bold text-gray-800 leading-tight text-[9.2px]">
                {isRTL ? 'العمالة حسب القطاع MOHRE' : 'Workforce by Sector (MOHRE)'}
              </h4>
              <p className="text-[6.5px] text-gray-400 leading-none mt-0.5">
                {isRTL
                  ? `${topMohreSector?.name || 'الإنشاءات'} تستحوذ على ${topMohreSectorPct}% من العمالة.`
                  : `${topMohreSector?.name || 'Construction'} accounts for ${topMohreSectorPct}%`}
              </p>
            </div>
            <span className="font-mono text-gray-400 font-bold">
              {processedMohreSectors.length} {isRTL ? 'قطاعات' : 'sectors'} • {formatCompactNumber(totalMohreSectors)}
            </span>
          </div>

          <div className="space-y-1">
            {processedMohreSectors.map((s, idx) => {
              const pct = Math.max(2, Math.min(100, (s.value / maxMohreVal) * 100));
              const isOther = s.name === 'أخرى' || s.name === 'Other';

              return (
                <div key={idx} className="flex items-center gap-1.5 text-[8px]">
                  {/* Child 1 (Right): Sector name with guaranteed fixed width */}
                  <span className="w-28 shrink-0 text-start font-bold text-gray-800 truncate leading-tight" title={s.name}>
                    {s.name}
                  </span>

                  {/* Child 2 (Middle): Bar track (starts at exact same point, grows from right to left in RTL) */}
                  <div className="flex-1 bg-[#f1f5f9] h-[11.5px] rounded-[1px] overflow-hidden flex justify-start">
                    <div
                      style={{
                        width: `${pct}%`,
                        background: isOther
                          ? 'repeating-linear-gradient(-45deg, #162e4a, #162e4a 2px, transparent 2px, transparent 6px)'
                          : '#162e4a',
                      }}
                      className={`h-full rounded-[1px] ${isOther ? 'border border-[#162e4a]' : ''} transition-all duration-300`}
                      title={`${s.name}: ${s.value.toLocaleString()}`}
                    />
                  </div>

                  {/* Child 3 (Left): Number */}
                  <span className="w-[34px] shrink-0 text-center font-mono font-bold text-gray-800 text-[8.5px] leading-none">
                    {formatCompactNumber(s.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ICP Domestic Workforce (Left in RTL, Right in LTR) */}
        <div className="flex flex-col ps-0.5">
          <div className="flex items-center justify-between mb-1 pb-0.5 border-b border-gray-100 text-[7px]">
            <div>
              <h4 className="font-bold text-gray-800 leading-tight text-[9.2px]">
                {isRTL ? 'العمالة حسب القطاع ICP' : 'Workforce by Sector (ICP)'}
              </h4>
              <p className="text-[6.5px] text-gray-400 leading-none mt-0.5">
                {isRTL
                  ? `${topIcpSector?.name || 'مساعدات المنازل'} وحدها تمثل ${topIcpSectorPct}% من الفئة.`
                  : `${topIcpSector?.name || 'Domestic'} accounts for ${topIcpSectorPct}%`}
              </p>
            </div>
            <span className="font-mono text-gray-400 font-bold">
              {processedIcpSectors.length} {isRTL ? 'قطاعات' : 'sectors'} • {formatCompactNumber(totalIcpSectors)}
            </span>
          </div>

          <div className="space-y-1">
            {processedIcpSectors.map((s, idx) => {
              const pct = Math.max(2, Math.min(100, (s.value / maxIcpVal) * 100));
              const isOther = s.name === 'أخرى' || s.name === 'Other';

              return (
                <div key={idx} className="flex items-center gap-1.5 text-[8px]">
                  {/* Child 1 (Right): Sector name with guaranteed fixed width */}
                  <span className="w-28 shrink-0 text-start font-bold text-gray-800 truncate leading-tight" title={s.name}>
                    {s.name}
                  </span>

                  {/* Child 2 (Middle): Bar track (starts at exact same point, grows from right to left in RTL) */}
                  <div className="flex-1 bg-[#f1f5f9] h-[11.5px] rounded-[1px] overflow-hidden flex justify-start">
                    <div
                      style={{
                        width: `${pct}%`,
                        background: isOther
                          ? 'repeating-linear-gradient(-45deg, #3b82f6, #3b82f6 2px, transparent 2px, transparent 6px)'
                          : '#bfdbfe',
                      }}
                      className="h-full rounded-[1px] border border-[#3b82f6] transition-all duration-300"
                      title={`${s.name}: ${s.value.toLocaleString()}`}
                    />
                  </div>

                  {/* Child 3 (Left): Number */}
                  <span className="w-[34px] shrink-0 text-center font-mono font-bold text-gray-800 text-[8.5px] leading-none">
                    {formatCompactNumber(s.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: MEDIAN SALARY COMPARISON (5 KEY SECTORS)        */}
      {/* ========================================================= */}
      <div>
        {/* Section Title */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          {/* Child 1 (Right): Title */}
          <h4 className="text-[10.5px] font-extrabold text-gray-900 leading-tight">
            {isRTL ? 'وسيط الرواتب مقابل وسيط سوق العمل حسب القطاع' : 'Median Wage vs Market Median by Sector'}
          </h4>

          {/* Child 2 (Left): Meta */}
          <div className="flex items-center gap-1.5 text-[7.5px] font-mono text-gray-500 font-bold">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {sortedSalarySectors.length} {isRTL ? 'قطاعات رئيسية' : 'Key Sectors'}
            </span>
          </div>
        </div>

        {/* Sub-header: Column labels aligned EXACTLY above the rows and numbers */}
        <div className="flex items-center gap-2 text-[7.5px] font-bold text-gray-500 mb-1 px-0.5">
          {/* Child 1 (Right): Sector label with fixed 115px width */}
          <span className="w-[115px] shrink-0 text-start font-extrabold text-gray-700 text-[8px]">
            {isRTL ? 'القطاع' : 'Sector'}
          </span>

          {/* Child 2 (Middle): Over the bars track - starts at the exact same point as the bars */}
          <div className="flex-1 flex items-center justify-between px-1.5 text-gray-400 font-normal text-[7px]">
            <span>{isRTL ? 'النطاق • مقارنة وسيط الرواتب بمتوسط السوق' : 'Range • Wage vs Market Median'}</span>
            <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200/80 font-bold text-[7px] leading-none">
              {isRTL ? 'درهم إماراتي / شهرياً' : 'AED / Monthly'}
            </span>
          </div>

          {/* Child 3 (Left): The 3 Column Headers directly above the 3 numbers */}
          <div className="w-[168px] shrink-0 flex items-center gap-1.5 font-mono text-[7.5px] font-bold">
            {/* 1. وسيط السوق (Market median) */}
            <span
              className="w-[56px] shrink-0 text-center text-[#162e4a] font-bold bg-slate-100/90 py-0.5 rounded-[2px] border border-slate-300/80 leading-none truncate px-1"
              title={isRTL ? 'وسيط السوق' : 'Market'}
            >
              {isRTL ? 'وسيط السوق' : 'Market'}
            </span>

            {/* 2. عمالة الدولة الشريكة */}
            <span
              className="w-[64px] shrink-0 text-center text-[#2563eb] font-bold bg-blue-50/90 py-0.5 rounded-[2px] border border-blue-200/80 leading-none truncate px-1"
              title={isRTL ? `عمالة ${countryDisplayName}` : `${countryDisplayName}`}
            >
              {isRTL ? `عمالة ${countryDisplayName}` : `${countryDisplayName}`}
            </span>

            {/* 3. النسبة */}
            <span className="w-[36px] shrink-0 text-center text-gray-600 font-bold py-0.5 leading-none">
              {isRTL ? 'النسبة' : 'Ratio'}
            </span>
          </div>
        </div>

        {/* Wage Comparison Rows (5 Key Sectors) - Perfectly Aligned Bars & Enforced Font Size */}
        <div className="space-y-1.5">
          {sortedSalarySectors.map((s, idx) => {
            const uaePct = Math.max(2, Math.min(100, (s.uaeValue / maxSalaryVal) * 100));
            const partnerPct = Math.max(2, Math.min(100, (s.partnerValue / maxSalaryVal) * 100));
            const ratioPct = s.uaeValue > 0 ? Math.round((s.partnerValue / s.uaeValue) * 100) : 0;

            return (
              <div key={idx} className="flex items-center gap-2 text-[8.5px]">
                {/* Child 1 (Right): Sector Name with exact fixed 115px width */}
                <span className="w-[115px] shrink-0 text-start text-[8.5px] font-extrabold text-gray-800 leading-tight truncate" title={s.name}>
                  {s.name}
                </span>

                {/* Child 2 (Middle): Bars track - guaranteed to start at the EXACT same point for every row */}
                <div className="flex-1 bg-[#f1f5f9] h-[14px] rounded-[2px] p-[1px] flex flex-col justify-between overflow-hidden">
                  {/* Market Wage Bar */}
                  <div className="w-full flex justify-start h-[5.2px]">
                    <div
                      style={{ width: `${uaePct}%` }}
                      className="h-full bg-[#162e4a] rounded-[1px] transition-all duration-300"
                      title={`${isRTL ? 'وسيط سوق العمل' : 'Market Median'}: AED ${s.uaeValue.toLocaleString()}`}
                    />
                  </div>

                  {/* Nationality Wage Bar */}
                  <div className="w-full flex justify-start h-[5.2px]">
                    <div
                      style={{ width: `${partnerPct}%` }}
                      className="h-full bg-[#bfdbfe] border border-[#3b82f6] rounded-[1px] transition-all duration-300"
                      title={`${countryDisplayName}: AED ${s.partnerValue.toLocaleString()}`}
                    />
                  </div>
                </div>

                {/* Child 3 (Left): The 3 Numbers matching the headers directly above - Bigger font */}
                <div className="w-[168px] shrink-0 flex items-center gap-1.5 font-mono text-[9.5px]">
                  {/* 1. وسيط السوق */}
                  <span className="w-[56px] shrink-0 text-center text-[#162e4a] font-black leading-none">
                    {Number(s.uaeValue).toLocaleString()}
                  </span>

                  {/* 2. عمالة الدولة الشريكة */}
                  <span className="w-[64px] shrink-0 text-center text-[#2563eb] font-black leading-none">
                    {Number(s.partnerValue).toLocaleString()}
                  </span>

                  {/* 3. النسبة */}
                  <span className="w-[36px] shrink-0 text-center text-gray-700 font-bold leading-none text-[9px]">
                    {ratioPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Legend & Methodology Footer */}
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-gray-100 text-[7px]">
          <span className="text-gray-400 font-normal truncate max-w-[430px]">
            {isRTL
              ? 'القيم مجمعة من سجلات وزارة الموارد البشرية والتوطين والهيئة الاتحادية للهوية والجنسية، الأرقام مقربة والنسب محسوبة على إجمالي كل جهة.'
              : 'Data aggregated from MOHRE and ICP registries. Numbers rounded and ratios computed against total per entity.'}
          </span>

          <div className="flex items-center gap-2.5 text-[7px] font-bold text-gray-600 shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#162e4a] inline-block"></span>
              <span>{isRTL ? 'وسيط سوق العمل' : 'Market Median'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#bfdbfe] border border-[#3b82f6] inline-block"></span>
              <span>{isRTL ? `وسيط رواتب عمالة ${countryDisplayName}` : `${countryDisplayName} Median Wage`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
