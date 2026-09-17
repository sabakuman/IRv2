import React from 'react';
import { Report, ReportData } from '../types';
import { PageContainer, HeaderBand } from './PrintUI';
import { 
  Calendar, Mail, FileText, Users, AlertTriangle, 
  CheckCircle, ArrowRightLeft, ShieldAlert, TrendingUp, 
  Building, Clock, Briefcase, Hash, Info, Layers, ExternalLink, UserCheck, Edit3
} from 'lucide-react';

interface ExecutiveBriefPageProps {
  report: Report;
  data: ReportData;
  combinedTotalWorkers: number;
  isRTL: boolean;
  t: (key: any) => string;
  footer?: React.ReactNode;
  onEditAttentionNotes?: () => void;
}

export const ExecutiveBriefPage: React.FC<ExecutiveBriefPageProps> = ({
  report,
  data,
  combinedTotalWorkers,
  isRTL,
  t,
  footer,
  onEditAttentionNotes
}) => {
  const summaryText = (data.summary || '').trim();

  // Helper for Missing Data Banner / Text
  const renderMissing = (customMsg?: string) => (
    <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1 text-amber-800 text-[10px] font-medium flex items-center gap-1.5 leading-tight">
      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
      <span>{customMsg || (isRTL ? 'غير محدد — يرجى استكماله في حقل "الملخص" بصفحة الإدخال' : 'Not specified — please complete in the "Summary" field')}</span>
    </div>
  );

  // -------------------------------------------------------------
  // 1. LAST MEETING (اللقاء الأخير)
  // Priority to user input in data.lastMeeting, then fallback to sortedInteractions[0]
  // -------------------------------------------------------------
  const sortedInteractions = [...(data.recentInteractions || [])].sort((a, b) => {
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });
  const fallbackMeeting = sortedInteractions[0];

  const userMeeting = data.lastMeeting;
  const hasUserMeeting = !!(userMeeting && (userMeeting.title || userMeeting.date || userMeeting.type));

  const meetingDate = hasUserMeeting ? (userMeeting?.date || '') : (fallbackMeeting?.date || '');
  const rawMeetingType = hasUserMeeting ? (userMeeting?.type || '') : (fallbackMeeting?.type || '');
  const meetingTitle = hasUserMeeting ? (userMeeting?.title || '') : (fallbackMeeting?.title || '');
  const meetingCoverage = hasUserMeeting ? (userMeeting?.coverage || '') : (fallbackMeeting?.details || '');

  const getMeetingTypeDisplay = (typeStr: string = '', titleStr: string = '') => {
    if (hasUserMeeting && userMeeting?.type && userMeeting.type.trim()) {
      return userMeeting.type.trim();
    }
    if (!hasUserMeeting && fallbackMeeting?.meetingType && fallbackMeeting.meetingType.trim()) {
      return fallbackMeeting.meetingType.trim();
    }
    const combined = `${typeStr} ${titleStr}`.toLowerCase();
    if (combined.includes('jcm') || combined.includes('joint committee') || combined.includes('مشتركة')) {
      return isRTL ? 'اللجنة المشتركة (JCM)' : 'Joint Committee (JCM)';
    }
    if (combined.includes('tcm') || combined.includes('technical') || combined.includes('ministerial') || combined.includes('فنية') || combined.includes('وزارية')) {
      return isRTL ? 'اللجنة الوزارية / الفنية (TCM)' : 'Ministerial / Technical Committee (TCM)';
    }
    if (combined.includes('bilateral') || combined.includes('ثنائي')) {
      return isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting';
    }
    return typeStr || (isRTL ? 'أخرى' : 'Other');
  };

  const hasAnyMeeting = hasUserMeeting || !!fallbackMeeting;

  // -------------------------------------------------------------
  // 2. LAST CORRESPONDENCE (آخر مراسلة)
  // Priority to data.lastCorrespondence entered by user
  // -------------------------------------------------------------
  let correspondence = data.lastCorrespondence;
  if (!correspondence || (!correspondence.subject && !correspondence.ref)) {
    const correspondenceInteraction = sortedInteractions.find(i => {
      const text = `${i.type} ${i.title}`.toLowerCase();
      return text.includes('letter') || text.includes('email') || text.includes('correspondence') || 
             text.includes('مراسلة') || text.includes('خطاب') || text.includes('كتاب') || text.includes('مذكرة');
    });

    if (correspondenceInteraction) {
      correspondence = {
        direction: isRTL ? 'صادرة' : 'outgoing',
        date: correspondenceInteraction.date,
        ref: 'REF/MOHRE/' + (correspondenceInteraction.date?.split('-')[0] || '2024'),
        subject: correspondenceInteraction.title,
        status: 'awaiting_reply'
      };
    }
  }

  // -------------------------------------------------------------
  // 3. RELATIONSHIP ONE-LINER (ملخص مسار العلاقات الثنائية)
  // -------------------------------------------------------------
  const generateOneLiner = (): string => {
    if (summaryText && summaryText.split('\n')[0].length > 10 && summaryText.split('\n')[0].split(/\s+/).length <= 25) {
      return summaryText.split('\n')[0];
    }
    
    const activeAgreementsCount = (data.bilateralAgreements || []).filter(a => a.status === 'active').length;
    const workersCountStr = combinedTotalWorkers > 0 
      ? (combinedTotalWorkers >= 1000 ? `${Math.round(combinedTotalWorkers / 1000)} ألف` : combinedTotalWorkers.toString()) 
      : '';

    if (isRTL) {
      if (workersCountStr && activeAgreementsCount > 0) {
        return `شراكة عمالية استراتيجية تضم أكثر من ${workersCountStr} عامل ومؤطرة بـ ${activeAgreementsCount} اتفاقيات نافذة لتعزيز الاستقرار وحماية الحقوق.`;
      }
      if (workersCountStr) {
        return `علاقات عمالية متميزة تحتضن أكثر من ${workersCountStr} عامل وتستند إلى التنسيق المستمر لتطوير منظومة الاستقدام والحماية.`;
      }
      return `علاقات تعاون عمالي ثنائية مبنية على التنسيق المؤسسي المستمر وتطوير أطر استقدام وحماية القوى العاملة.`;
    } else {
      if (workersCountStr && activeAgreementsCount > 0) {
        return `A strategic labour partnership covering over ${workersCountStr} workers, anchored by ${activeAgreementsCount} active agreements advancing market stability.`;
      }
      return `A bilateral labour partnership grounded in continuous inter-ministerial coordination and transparent recruitment protocols.`;
    }
  };

  const relationshipOneLiner = generateOneLiner();

  // -------------------------------------------------------------
  // 4. KEY NUMBERS (الأرقام والمؤشرات الجوهرية)
  // Replaced "الاتفاقيات السارية" with "هل توجد مذكرة تفاهم موقعة مع الوزارة؟"
  // References for labour data set to "معلومات سوق العمل"
  // -------------------------------------------------------------
  const workersHistory = data.uaeWorkforceStats?.workersHistory || {};
  let growthPctText = isRTL ? 'مستقر' : 'Stable';
  if (workersHistory.totalCurrent && workersHistory.totalPrevious && workersHistory.totalPrevious > 0) {
    const diff = workersHistory.totalCurrent - workersHistory.totalPrevious;
    const pct = ((diff / workersHistory.totalPrevious) * 100).toFixed(1);
    growthPctText = `${diff >= 0 ? '+' : ''}${pct}%`;
  }

  const rawInsuranceCoverage = data.uaeWorkforceStats?.mohre?.insuranceUnemploymentCoveredPct || 
                                data.uaeWorkforceStats?.mohre?.insuranceRightsCoveredPct;
  const insuranceCoverageText = rawInsuranceCoverage ? (rawInsuranceCoverage.includes('%') ? rawInsuranceCoverage : `${rawInsuranceCoverage}%`) : null;

  // MOU Signed With MOHRE Logic (User Input or Heuristic)
  const mouInput = data.mouSignedWithMohre;
  const hasMouExplicit = !!(mouInput && (mouInput.signed !== undefined && mouInput.signed !== ''));
  
  let isMouSigned: boolean = false;
  let mouWhen: string = '';
  let mouType: string = '';

  if (hasMouExplicit) {
    isMouSigned = mouInput?.signed === true || mouInput?.signed === 'yes' || mouInput?.signed === 'نعم';
    mouWhen = mouInput?.signedDate || '';
    mouType = mouInput?.type || '';
  } else {
    // Check existing bilateralAgreements for MOHRE MOU
    const activeMOU = (data.bilateralAgreements || []).find(a => 
      a.status === 'active' || (a.title && (a.title.includes('MOU') || a.title.includes('تفاهم')))
    );
    if (activeMOU) {
      isMouSigned = true;
      mouWhen = activeMOU.date || '';
      mouType = activeMOU.title.includes('مساعدة') || activeMOU.title.toLowerCase().includes('domestic') 
        ? (isRTL ? 'عمالة مساعدة' : 'Domestic labour') 
        : (isRTL ? 'كلاهما (عامة ومساعدة)' : 'Both (general & domestic)');
    }
  }

  // Format MOU Type label
  const formatMouType = (typeVal: string) => {
    if (!typeVal) return '';
    if (typeVal === 'domestic') return isRTL ? 'عمالة مساعدة' : 'Domestic labour';
    if (typeVal === 'general') return isRTL ? 'عمالة عامة' : 'General labour';
    if (typeVal === 'both') return isRTL ? 'كلاهما (عامة ومساعدة)' : 'Both (General & Domestic)';
    return typeVal;
  };

  const keyNumbers = [
    {
      label: isRTL ? 'إجمالي العمالة بالدولة' : 'Total Workers in UAE',
      value: combinedTotalWorkers > 0 ? combinedTotalWorkers.toLocaleString() : (data.totalWorkersInUae || null),
      context: isRTL ? 'العمالة المسجلة بسوق العمل' : 'Registered UAE workforce',
      source: isRTL ? 'معلومات سوق العمل' : 'Labour Market Information',
      icon: Users
    },
    {
      label: isRTL ? 'النمو السنوي للعمالة' : 'Workforce YoY Growth',
      value: growthPctText,
      context: isRTL ? 'مقارنة بالعام السابق' : 'Compared to previous year',
      source: isRTL ? 'معلومات سوق العمل' : 'Labour Market Information',
      icon: TrendingUp
    },
    {
      label: isRTL ? 'التحويلات السنوية' : 'Annual Remittances',
      value: data.economicStats?.remittancesFromUAE || null,
      context: isRTL ? 'تحويلات العمالة إلى الموطن' : 'Outbound remittances from UAE',
      source: isRTL ? 'مصرف الإمارات المركزي CBUAE' : 'Central Bank (CBUAE)',
      icon: ArrowRightLeft
    },
    {
      label: isRTL ? 'التغطية التأمينية' : 'Insurance Coverage',
      value: insuranceCoverageText,
      context: isRTL ? 'التأمين ضد التعطل والحقوق' : 'Unemployment & protection scheme',
      source: isRTL ? 'معلومات سوق العمل' : 'Labour Market Information',
      icon: ShieldAlert
    },
    {
      label: isRTL ? 'الشكاوى قيد النظر' : 'Complaints Under Review',
      value: data.uaeWorkforceStats?.mohre?.laborComplaintsUnderReview ?? '0',
      context: isRTL ? 'شكاوى عمالية قيد المتابعة' : 'Individual cases under review',
      source: isRTL ? 'معلومات سوق العمل' : 'Labour Market Information',
      icon: Clock
    },
  ];

  // -------------------------------------------------------------
  // 5. COUNTERPART DELEGATION (وفد الدولة المقابل)
  // Redesigned: compact minister/lead delegate card since usually only 1 person is met
  // -------------------------------------------------------------
  const partnerDelegates = data.delegations?.partner || [];
  const leadDelegate = partnerDelegates[0];

  // -------------------------------------------------------------
  // 6. PENDING MATTERS (المواضيع تحت المراجعة)
  // Subject only + Department name below it.
  // -------------------------------------------------------------
  interface PendingMatterItem {
    id?: string;
    matter: string;
    dept: string;
    status?: string;
  }

  const pendingItems: PendingMatterItem[] = [];

  if (Array.isArray(data.pendingMatters) && data.pendingMatters.length > 0) {
    data.pendingMatters.forEach(item => {
      if (item && item.matter && item.matter.trim()) {
        pendingItems.push({
          id: item.id,
          matter: item.matter.trim(),
          dept: item.dept?.trim() || (isRTL ? 'إدارة العلاقات الدولية' : 'International Relations'),
          status: item.status || 'pending'
        });
      }
    });
  } else if (!data.pendingMatters) {
    (data.previousAgreementsAndUpdates || []).forEach(item => {
      let dept = isRTL ? 'إدارة العلاقات الدولية' : 'International Relations';
      const combined = `${item.title} ${item.content}`.toLowerCase();
      if (combined.includes('operation') || combined.includes('عمليات') || combined.includes('تصاريح')) {
        dept = isRTL ? 'قطاع شؤون العمل والعمليات' : 'Labour Affairs & Operations';
      } else if (combined.includes('inspection') || combined.includes('iod') || combined.includes('تفتيش') || combined.includes('توجيه')) {
        dept = isRTL ? 'إدارة التفتيش والتوجيه العمالي' : 'Labour Inspection & Guidance';
      } else if (combined.includes('complaint') || combined.includes('نزاع') || combined.includes('شكاوى')) {
        dept = isRTL ? 'إدارة علاقات العمل' : 'Labour Relations Department';
      }

      pendingItems.push({
        matter: item.title,
        dept,
        status: 'pending'
      });
    });

    (data.bilateralAgreements || []).filter(a => a.status === 'pending').forEach(item => {
      pendingItems.push({
        matter: item.title,
        dept: isRTL ? 'إدارة العلاقات الدولية' : 'International Relations',
        status: 'pending'
      });
    });
  }

  // -------------------------------------------------------------
  // 9. REQUIRES ATTENTION (ملاحظات وتنبيهات تتطلب الانتباه قبل الاجتماع)
  // Only displayed if the user explicitly provided attention notes. If empty, it is completely removed.
  // -------------------------------------------------------------
  const userAttentionNotes = (data.attentionNotes || []).filter(n => typeof n === 'string' && n.trim().length > 0);
  const finalAttentionNotes: string[] = userAttentionNotes.slice(0, 4);

  return (
    <PageContainer footer={footer} className="shadow-xl print:shadow-none mb-8 print:mb-0">
      {/* Header Band */}
      <HeaderBand country={data.country} reportId={report.id} title={t('loginTitle')} flagUrl={data.flagUrl} />

      {/* Section Header - Pure language without English brackets */}
      <div className="flex items-center justify-between border-b-2 border-primary/20 pb-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-extrabold text-primary leading-tight">
              {isRTL ? 'الملخص التنفيذي' : 'Executive Brief'}
            </h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none mt-0.5">
              {isRTL ? 'إيجاز شامل لقيادة الوزارة قبل المباحثات الثنائية' : 'Ministerial Pre-Briefing & Strategic Summary'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary/5 text-primary-dark border border-primary/15 text-[9.5px] font-extrabold px-2.5 py-1 rounded-md">
            {isRTL ? 'الصفحة 2 • إيجاز معتمد' : 'PAGE 2 • Verified Brief'}
          </span>
        </div>
      </div>

      {/* 3. RELATIONSHIP ONE-LINER (Full Width Box) */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-s-4 border-primary rounded-r-xl p-2.5 mb-3">
        <div className="flex items-start gap-2">
          <Info size={15} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-0.5">
              {isRTL ? 'ملخص مسار العلاقات الثنائية' : 'Relationship Overview'}
            </p>
            <p className="text-[12.5px] font-bold text-gray-900 leading-snug">
              {relationshipOneLiner}
            </p>
          </div>
        </div>
      </div>

      {/* 4. KEY NUMBERS (6 Cards Grid: 5 stats + MOU with MOHRE) */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <Hash size={13} className="text-primary" />
            {isRTL ? 'المؤشرات والأرقام الجوهرية' : 'Key Numbers & Core Indicators'}
          </p>
          <span className="text-[8.5px] text-gray-500 font-bold">
            {isRTL ? 'بيانات معتمدة ومقترنة بالمحور المصدري' : 'Grounded in Source Sections'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* 5 Core Indicators */}
          {keyNumbers.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-gray-50/90 border border-gray-200 rounded-xl p-2 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-600 leading-tight">
                    {kpi.label}
                  </span>
                  <div className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center text-primary shrink-0">
                    <Icon size={11} />
                  </div>
                </div>

                <div className="my-0.5">
                  {kpi.value ? (
                    <span className="text-[15px] font-black font-mono text-gray-900 leading-none">
                      {kpi.value}
                    </span>
                  ) : (
                    renderMissing()
                  )}
                </div>

                <div className="pt-1 mt-1 border-t border-gray-200/60 flex items-center justify-between text-[8.5px] leading-none">
                  <span className="text-gray-500 font-medium truncate max-w-[55%]">{kpi.context}</span>
                  <span className="text-primary-dark/80 font-bold truncate max-w-[45%] text-end">{kpi.source}</span>
                </div>
              </div>
            );
          })}

          {/* CARD 6: DID WE HAVE MOU SIGNED WITH MOHRE (User requested custom block) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9.5px] font-extrabold text-primary-dark leading-tight">
                {isRTL ? 'مذكرة تفاهم موقعة مع وزارة الموارد البشرية و التوطين؟' : 'MOU Signed with MOHRE?'}
              </span>
              <div className="w-5 h-5 rounded-md bg-white border border-blue-200 flex items-center justify-center text-primary shrink-0">
                <FileText size={11} />
              </div>
            </div>

            <div className="my-0.5 flex items-center gap-2">
              <span className={`text-[15px] font-black font-mono leading-none px-2 py-0.5 rounded-md ${
                isMouSigned 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                {isMouSigned ? (isRTL ? 'نعم' : 'YES') : (isRTL ? 'لا' : 'NO')}
              </span>
              {mouWhen && (
                <span className="text-[10px] font-bold text-gray-700 font-mono">
                  {mouWhen}
                </span>
              )}
            </div>

            <div className="pt-1 mt-1 border-t border-blue-200/80 flex items-center justify-between text-[8.5px] leading-tight">
              <span className="text-gray-700 font-medium truncate max-w-[60%]">
                {mouType ? formatMouType(mouType) : (isRTL ? 'النوع: عمالة عامة / مساعدة' : 'Type: General / Domestic')}
              </span>
              <span className="text-primary-dark font-bold shrink-0">
                {isRTL ? 'محور الاتفاقيات' : 'Agreements'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1 & 2. LAST MEETING & LAST CORRESPONDENCE (Two Columns) */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Card 1: Last Meeting */}
        <div className="border border-gray-200 bg-white rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-1.5">
            <h4 className="text-[11px] font-black text-gray-900 uppercase flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" />
              {isRTL ? 'اللقاء الأخير' : 'Last Meeting'}
            </h4>
            {meetingDate && (
              <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                {meetingDate}
              </span>
            )}
          </div>

          {hasAnyMeeting ? (
            <div className="space-y-1 text-[11px]">
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 font-bold text-[10px] shrink-0">{isRTL ? 'النوع:' : 'Type:'}</span>
                <span className="font-extrabold text-primary-dark text-[10.5px]">
                  {getMeetingTypeDisplay(rawMeetingType, meetingTitle)}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 font-bold text-[10px] shrink-0">{isRTL ? 'المسمى:' : 'Title:'}</span>
                <span className="font-bold text-gray-900 truncate text-[10.5px]">{meetingTitle || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting')}</span>
              </div>
              <div className="pt-1 mt-0.5 border-t border-gray-100 text-[10.5px] text-gray-600 leading-tight">
                <span className="font-bold text-gray-700">{isRTL ? 'موجز ما تم بحثه: ' : 'Coverage: '}</span>
                <span className="line-clamp-2">
                  {meetingCoverage ? meetingCoverage.slice(0, 130) : (isRTL ? 'مباحثات ثنائية في قضايا العمل المشتركة.' : 'Bilateral discussion on workforce cooperation.')}
                </span>
              </div>
            </div>
          ) : (
            renderMissing(isRTL ? 'لا يوجد لقاء مسجل — يرجى إدخاله في حقل الملخص بصفحة الإدخال' : 'No meeting recorded — complete in Summary field')
          )}
        </div>

        {/* Card 2: Last Correspondence */}
        <div className="border border-gray-200 bg-white rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-1.5">
            <h4 className="text-[11px] font-black text-gray-900 uppercase flex items-center gap-1.5">
              <Mail size={13} className="text-primary" />
              {isRTL ? 'آخر مراسلة' : 'Last Correspondence'}
            </h4>
            {correspondence?.date && (
              <span className="text-[9px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {correspondence.date}
              </span>
            )}
          </div>

          {correspondence ? (
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-bold text-[10px]">{isRTL ? 'الاتجاه:' : 'Direction:'}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                    correspondence.direction?.includes('وارد') || correspondence.direction === 'incoming' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {correspondence.direction || (isRTL ? 'صادرة' : 'Outgoing')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-bold text-[10px]">{isRTL ? 'الحالة:' : 'Status:'}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                    correspondence.status === 'awaiting_reply' 
                      ? 'bg-amber-100 text-amber-800' 
                      : correspondence.status === 'closed' 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {correspondence.status === 'awaiting_reply' 
                      ? (isRTL ? 'بانتظار الرد' : 'Awaiting reply')
                      : correspondence.status === 'closed'
                        ? (isRTL ? 'مغلقة' : 'Closed')
                        : (isRTL ? 'تم اتخاذ الإجراء' : 'Actioned')}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 font-bold text-[10px] shrink-0">{isRTL ? 'رقم القيد:' : 'Ref:'}</span>
                <span className="font-mono text-gray-800 text-[9.5px] truncate">{correspondence.ref || '—'}</span>
              </div>
              <div className="pt-1 mt-0.5 border-t border-gray-100 text-[10.5px] text-gray-700 leading-tight">
                <span className="font-bold text-gray-700">{isRTL ? 'الموضوع: ' : 'Subject: '}</span>
                <span className="font-medium line-clamp-2">
                  {correspondence.subject || (isRTL ? 'متابعة مذكرات التفاهم وبروتوكولات التعاون' : 'Follow up on bilateral labour protocols')}
                </span>
              </div>
            </div>
          ) : (
            renderMissing(isRTL ? 'لا توجد مراسلة مسجلة — يرجى إدخالها في صفحة الإدخال' : 'No correspondence recorded — complete in input page')
          )}
        </div>
      </div>

      {/* 5 & 6: LOWER GRID - Counterpart Delegation (4 cols) + Expanded Pending Matters (8 cols) */}
      <div className="grid grid-cols-12 gap-2.5 mb-3">
        {/* 5. COUNTERPART DELEGATION (Compact - usually 1 person) */}
        <div className="col-span-4 border border-gray-200 bg-gray-50/70 rounded-xl p-2.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2">
              <h4 className="text-[10.5px] font-black text-gray-900 uppercase flex items-center gap-1.5">
                <UserCheck size={13} className="text-primary" />
                {isRTL ? 'وفد الدولة المقابل' : 'Counterpart Delegation'}
              </h4>
              {partnerDelegates.length > 1 && (
                <span className="text-[8.5px] font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded">
                  +{partnerDelegates.length - 1} {isRTL ? 'آخرين' : 'more'}
                </span>
              )}
            </div>

            {leadDelegate ? (
              <div className="bg-white border border-gray-200 rounded-lg p-2 text-[10.5px] space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-black text-gray-900 leading-snug">{leadDelegate.name}</p>
                    <p className="text-gray-500 text-[9.5px] leading-tight mt-0.5">{leadDelegate.title || (isRTL ? 'رئيس الوفد المقابل' : 'Head of Delegation')}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black shrink-0 ${
                    leadDelegate.metBefore ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {leadDelegate.metBefore ? (isRTL ? 'لقاء سابق' : 'Met Before') : (isRTL ? 'أول لقاء' : 'First Meet')}
                  </span>
                </div>

                <div className="pt-1 mt-1 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-600">
                  <span className="font-bold text-primary">{isRTL ? 'سجل اللقاءات:' : 'Meeting History:'}</span>
                  <span className="font-medium truncate max-w-[65%] text-end">
                    {leadDelegate.metBefore && (leadDelegate.meetingYear || leadDelegate.meetingLocation)
                      ? `${leadDelegate.meetingYear || ''} ${leadDelegate.meetingLocation ? `(${leadDelegate.meetingLocation})` : ''}`
                      : (isRTL ? 'اللقاء الرسمي الأول' : 'First Official Meeting')}
                  </span>
                </div>
              </div>
            ) : (
              renderMissing(isRTL ? 'لم يتم تحديد الوفد المقابل' : 'Counterpart delegation unlisted')
            )}
          </div>

          <p className="text-[8px] text-gray-500 italic mt-1.5 text-center">
            {isRTL ? '* يقتصر على الجانب المقابل دون وفد الدولة' : '* Partner counterparts only; UAE side excluded'}
          </p>
        </div>

        {/* 6. PENDING MATTERS (المواضيع تحت المراجعة) - Expanded to 8 cols */}
        <div 
          className="col-span-8 border border-gray-200 bg-gray-50/70 rounded-xl p-2.5 shadow-2xs flex flex-col justify-between"
          style={{ color: '#111827', forcedColorAdjust: 'none' }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-primary" style={{ color: '#162e4a' }} />
                <h4 
                  className="text-[10.5px] font-black uppercase"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                >
                  {isRTL ? 'المواضيع تحت المراجعة' : 'Matters Under Review'}
                </h4>
              </div>
              {pendingItems.length > 0 ? (
                <span 
                  className="text-[8.5px] font-bold px-2 py-0.5 rounded border"
                  style={{ color: '#78350f', backgroundColor: '#fef3c7', borderColor: '#fde68a' }}
                >
                  {Math.min(2, pendingItems.length)} {isRTL ? 'ملفات للمتابعة' : 'Pending Files'}
                </span>
              ) : (
                <span 
                  className="text-[8.5px] font-bold px-2 py-0.5 rounded border"
                  style={{ color: '#065f46', backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }}
                >
                  {isRTL ? 'مستقرة' : 'All Clear'}
                </span>
              )}
            </div>

            {pendingItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {pendingItems.slice(0, 2).map((item, i) => (
                  <div 
                    key={i} 
                    className="border border-gray-200 rounded-lg p-2.5 shadow-2xs flex flex-col justify-between min-h-[64px] overflow-visible"
                    style={{ backgroundColor: '#ffffff', color: '#111827' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <p 
                          className="pending-matter-title text-[11px] leading-snug break-words overflow-visible"
                          style={{ color: '#111827', WebkitTextFillColor: '#111827', fontWeight: 800 }}
                        >
                          {item.matter}
                        </p>
                        <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded shrink-0 border ${
                          item.status === 'urgent' || item.status === 'عاجل'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : item.status === 'in_coordination' || item.status === 'قيد التنسيق'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.status === 'awaiting_reply' || item.status === 'بانتظار الرد'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.status ? (
                            item.status === 'pending' ? (isRTL ? 'قيد المتابعة' : 'Pending') :
                            item.status === 'in_coordination' ? (isRTL ? 'قيد التنسيق' : 'In Coordination') :
                            item.status === 'urgent' ? (isRTL ? 'عاجل' : 'Urgent') :
                            item.status === 'awaiting_reply' ? (isRTL ? 'بانتظار الرد' : 'Awaiting Reply') :
                            item.status
                          ) : (isRTL ? 'قيد المتابعة' : 'Pending')}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-gray-100 flex items-center justify-between text-[9px]">
                      <span 
                        className="pending-matter-dept truncate max-w-[85%]" 
                        title={item.dept}
                        style={{ color: '#162e4a', WebkitTextFillColor: '#162e4a', fontWeight: 700 }}
                      >
                        {item.dept}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.status === 'urgent' || item.status === 'عاجل'
                          ? 'bg-rose-500'
                          : item.status === 'in_coordination' || item.status === 'قيد التنسيق'
                          ? 'bg-blue-500'
                          : item.status === 'awaiting_reply' || item.status === 'بانتظار الرد'
                          ? 'bg-purple-500'
                          : 'bg-amber-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="border border-emerald-200 rounded-lg p-3 text-center text-[10.5px] font-bold"
                style={{ backgroundColor: '#ffffff', color: '#065f46', WebkitTextFillColor: '#065f46' }}
              >
                {isRTL ? 'لا توجد مواضيع تحت المراجعة — كافة الملفات مستقرة ومنسقة' : 'No matters under review — all tracks are aligned'}
              </div>
            )}
          </div>

          <p className="text-[8px] text-gray-500 italic mt-1.5 text-center">
            {isRTL ? 'متابعات وتنسيقات قيد الإنجاز بين القطاعات والجانب المقابل' : 'Active follow-ups and inter-departmental pending files'}
          </p>
        </div>
      </div>

      {/* 9. REQUIRES ATTENTION (Only rendered when user-defined flags exist, otherwise completely removed) */}
      {finalAttentionNotes.length > 0 && (
        <div className="border border-amber-300/80 bg-amber-50/40 rounded-xl p-2.5 mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10.5px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-600" />
              {isRTL ? 'ملاحظات وتنبيهات تتطلب الانتباه قبل الاجتماع' : 'Critical Pre-Meeting Attention Flags'}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[8.5px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">
                {finalAttentionNotes.length} {isRTL ? 'تنبيهات' : 'Flags'}
              </span>
              {onEditAttentionNotes && (
                <button
                  type="button"
                  onClick={onEditAttentionNotes}
                  className="no-print text-[9px] font-bold text-amber-900 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded border border-amber-300 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                  title={isRTL ? 'تعديل التنبيهات في صفحة التحرير' : 'Edit flags in edit page'}
                >
                  <Edit3 size={10} />
                  <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {finalAttentionNotes.slice(0, 4).map((flag, idx) => (
              <div key={idx} className="flex items-start gap-1.5 bg-white border border-amber-200/90 rounded-lg p-2 text-[10px] leading-snug">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[8.5px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-bold text-gray-900 break-words" style={{ color: '#111827' }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
