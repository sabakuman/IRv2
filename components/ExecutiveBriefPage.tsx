import React from 'react';
import { Report, ReportData, RecentInteraction } from '../types';
import { PageContainer, HeaderBand, SectionHeader } from './PrintUI';
import { 
  FileText, Calendar, Sparkles, MessageSquare, CheckCircle2, 
  MapPin, Clock, ArrowUpRight, Award, ShieldCheck, Tag, Mail
} from 'lucide-react';

interface ExecutiveBriefPageProps {
  report: Report;
  data: ReportData;
  combinedTotalWorkers?: number;
  isRTL: boolean;
  t: (key: any) => string;
  footer?: React.ReactNode;
  onEditAttentionNotes?: () => void;
}

export const ExecutiveBriefPage: React.FC<ExecutiveBriefPageProps> = ({
  report,
  data,
  isRTL,
  t,
  footer
}) => {
  // Helper to translate/format Arabic country name
  const getCountryArabicName = (country: string = ''): string => {
    const c = country.trim().toLowerCase();
    if (!c) return isRTL ? 'الدولة الشريكة' : 'Partner Country';
    if (c.includes('india') || c.includes('هند')) return 'جمهورية الهند';
    if (c.includes('philippine') || c.includes('فلبين')) return 'جمهورية الفلبين';
    if (c.includes('pakistan') || c.includes('باكستان')) return 'جمهورية باكستان الإسلامية';
    if (c.includes('bangladesh') || c.includes('بنغلاديش')) return 'جمهورية بنغلاديش الشعبية';
    if (c.includes('nepal') || c.includes('نيبال')) return 'جمهورية نيبال الديمقراطية الاتحادية';
    if (c.includes('sri lanka') || c.includes('سريلانكا')) return 'جمهورية سريلانكا الديمقراطية الاشتراكية';
    if (c.includes('egypt') || c.includes('مصر')) return 'جمهورية مصر العربية';
    if (c.includes('jordan') || c.includes('أردن')) return 'المملكة الأردنية الهاشمية';
    if (c.includes('indonesia') || c.includes('إندونيسيا')) return 'جمهورية إندونيسيا';
    if (c.includes('vietnam') || c.includes('فيتنام')) return 'جمهورية فيتنام الاشتراكية';
    if (c.includes('ethiopia') || c.includes('إثيوبيا')) return 'جمهورية إثيوبيا الفيدرالية';
    if (c.includes('kenya') || c.includes('كينيا')) return 'جمهورية كينيا';
    if (c.includes('uganda') || c.includes('أوغندا')) return 'جمهورية أوغندا';
    return country;
  };

  const countryDisplayName = isRTL 
    ? getCountryArabicName(data.country) 
    : (data.country || 'Partner Country');

  // 1. FOCUS POINTS ("أهم الرسائل التي يجب التركيز عليها")
  const defaultFocusPoints = isRTL ? [
    'التأكيد على عمق العلاقات الثنائية والشراكة الاستراتيجية في تنظيم وحوكمة سوق العمل.',
    'متابعة مخرجات وقرارات اللجان الفنية والوزارية المشتركة، وتفعيل قنوات التنسيق المباشر.',
    'تعزيز منظومة حماية حقوق العمالة عبر التوعية الاستباقية، ومنظومة التأمين ضد التعطل، وحماية الأجور (WPS).',
    'تطوير التعاون الرقمي والربط الإلكتروني للتحقق من المهارات وتبسيط إجراءات الاستقدام النظامي.'
  ] : [
    'Emphasize strategic bilateral partnership and collaborative governance in labor mobility.',
    'Follow up on outcomes of Joint Committees (JCM) and maintain active inter-ministerial coordination.',
    'Strengthen worker welfare protocols through proactive awareness, Wage Protection System (WPS), and unemployment insurance.',
    'Advance digital integration for skill verification and streamlined, transparent recruitment procedures.'
  ];

  const focusPointsList = (data.pointsToFocusOn && data.pointsToFocusOn.length > 0)
    ? data.pointsToFocusOn.filter(p => p && p.trim().length > 0)
    : defaultFocusPoints;

  // 2. LAST MEETINGS ("آخر اللقاءات والاجتماعات مع X Country")
  // Extract and sort meetings from data.executiveBriefMeetingIds or data.recentInteractions
  let finalMeetings: RecentInteraction[] = [];

  if (data.executiveBriefMeetingIds && data.executiveBriefMeetingIds.length > 0) {
    const map = new Map((data.recentInteractions || []).map(i => [i.id, i]));
    for (const id of data.executiveBriefMeetingIds) {
      const found = map.get(id);
      if (found) {
        finalMeetings.push({ ...found });
      }
    }
  }

  // If user entered a specific data.lastMeeting and it's not in finalMeetings, handle it
  if (data.lastMeeting && (data.lastMeeting.title || data.lastMeeting.date)) {
    const featuredItem: RecentInteraction = {
      id: 'featured-last-meeting',
      date: data.lastMeeting.date || new Date().toISOString().split('T')[0],
      type: data.lastMeeting.type || 'Meeting',
      meetingType: data.lastMeeting.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
      title: data.lastMeeting.title || (isRTL ? 'اللقاء الأخير' : 'Last Meeting'),
      category: data.lastMeeting.category || 'MOHRE',
      details: data.lastMeeting.coverage || ''
    };

    const matchIdx = finalMeetings.findIndex(m => 
      (m.id && m.id === featuredItem.id) || 
      (m.title === featuredItem.title && m.date === featuredItem.date)
    );

    if (matchIdx !== -1) {
      finalMeetings[matchIdx] = { ...finalMeetings[matchIdx], ...featuredItem };
      // Move to front as the primary/featured meeting
      const [item] = finalMeetings.splice(matchIdx, 1);
      finalMeetings.unshift(item);
    } else if (finalMeetings.length === 0) {
      finalMeetings.unshift(featuredItem);
    }
  }

  // Fallback: If no explicit topics were selected via executiveBriefMeetingIds
  if (finalMeetings.length === 0) {
    const allInteractions = [...(data.recentInteractions || [])];
    if (data.lastMeeting && (data.lastMeeting.title || data.lastMeeting.date)) {
      const exists = allInteractions.some(i => i.date === data.lastMeeting?.date && i.title === data.lastMeeting?.title);
      if (!exists) {
        allInteractions.unshift({
          id: 'user-last-meeting',
          date: data.lastMeeting.date || new Date().toISOString().split('T')[0],
          type: data.lastMeeting.type || 'Meeting',
          meetingType: data.lastMeeting.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
          title: data.lastMeeting.title || (isRTL ? 'اللقاء الأخير' : 'Last Meeting'),
          category: data.lastMeeting.category || 'MOHRE',
          details: data.lastMeeting.coverage || ''
        });
      }
    }
    finalMeetings = allInteractions
      .filter(item => {
        const t = (item.type || '').toLowerCase();
        return t === 'meeting' || t === 'visit' || t === 'session' || item.meetingType || t === '';
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  const sortedMeetings = finalMeetings;

  // Visibility flags:
  const isPointsVisible = data.sectionVisibility?.executiveBriefPoints !== false && data.sectionVisibility?.briefPointsToFocus !== false;
  const isMeetingsVisible = data.sectionVisibility?.executiveBriefLastMeeting !== false && data.sectionVisibility?.briefLastMeetings !== false;
  const isCorrespondenceVisible = data.sectionVisibility?.executiveBriefLastCorrespondence !== false && data.sectionVisibility?.briefLastCorrespondence !== false;

  const bothVisible = isMeetingsVisible && isCorrespondenceVisible;

  return (
    <PageContainer footer={footer} className="shadow-xl print:shadow-none mb-8 print:mb-0">
      {/* Header Band with Flag and Ministry title */}
      <HeaderBand 
        country={data.country} 
        reportId={report.id} 
        title={t('loginTitle')} 
        flagUrl={data.flagUrl} 
      />

      {/* Page Title: الإحاطة التنفيذية & Goal of the meeting */}
      <div className="mb-4">
        <SectionHeader 
          icon={FileText} 
          title={isRTL ? 'الإحاطة التنفيذية' : 'Executive Briefing'} 
          compact 
        />
        <p className="text-xs sm:text-[13px] font-semibold text-gray-800 dark:text-gray-200 mt-1.5 pr-1 leading-snug">
          {data.meetingGoal || (isRTL 
            ? `موجز استراتيجي عالي المستوى لأهم الرسائل المعتمدة وأحدث اللقاءات والمراسلات الرسمية مع ${countryDisplayName}`
            : `High-level strategic overview of key focus messages, recent meetings, and official correspondence with ${countryDisplayName}`)}
        </p>
      </div>

      {/* Main Container with Sections */}
      <div className="flex flex-col gap-4 flex-1 pb-2">
        {/* ======================================================== */}
        {/* SECTION 1: أهم الرسائل التي يجب التركيز عليها              */}
        {/* ======================================================== */}
        {isPointsVisible ? (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b-2 border-primary/25">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shadow-2xs">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-xs text-gray-900 leading-tight">
                    {isRTL ? 'أهم الرسائل التي يجب التركيز عليها' : 'Points to Focus On'}
                  </h3>
                  <p className="text-[9.5px] text-gray-500 font-semibold">
                    {isRTL ? 'المحاور الجوهرية والرسائل الاستراتيجية المعتمدة' : 'Core strategic messages and priority talking points'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                {isRTL ? `${focusPointsList.length} رسائل رئيسية` : `${focusPointsList.length} Key Messages`}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {focusPointsList.slice(0, 4).map((point, idx) => (
                <div 
                  key={`focus-point-${idx}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50/70 border border-gray-200/70 hover:border-primary/30 transition-all"
                >
                  <div className="w-5 h-5 rounded-md bg-primary text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-[11.5px] font-semibold text-gray-900 leading-relaxed font-serif">
                      {point}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* SECTION 2 & 3: آخر لقاء رسمي & آخر مراسلة رسمية             */}
        {/* ======================================================== */}
        {(isMeetingsVisible || isCorrespondenceVisible) && (
          <div className={`grid grid-cols-1 ${bothVisible ? 'lg:grid-cols-2' : ''} gap-4 flex-1`}>
            {/* 1. MEETINGS SECTION */}
            {isMeetingsVisible && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-accent/30">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold shadow-2xs">
                        <Calendar size={15} />
                      </div>
                      <div>
                        <h3 className="font-serif font-black text-xs text-gray-900 leading-tight">
                          {isRTL ? 'آخر لقاء رسمي والاجتماعات السابقة' : 'Last Official Meeting & Sessions'}
                        </h3>
                        <p className="text-[9.5px] text-gray-500 font-semibold">
                          {isRTL ? 'سجل المحادثات واللجان المشتركة' : 'Record of bilateral meetings and outcomes'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-accent/10 text-accent border border-accent/20">
                      {isRTL ? 'سجل اللقاءات' : 'Meetings Log'}
                    </span>
                  </div>

                  {sortedMeetings.length > 0 ? (
                    <div className="space-y-2">
                      {sortedMeetings.slice(0, (data.executiveBriefMeetingIds && data.executiveBriefMeetingIds.length > 0) 
                        ? Math.min(sortedMeetings.length, bothVisible ? (sortedMeetings.length >= 3 ? 3 : 2) : 4) 
                        : (bothVisible ? 2 : 3)
                      ).map((meeting, idx) => {
                        const meetingCategory = (meeting.category || 'MOHRE').toUpperCase();
                        const isMohre = meetingCategory.includes('MOHRE') || meetingCategory.includes('وزارة');
                        const isUaeGov = meetingCategory.includes('UAE') || meetingCategory.includes('GOV') || meetingCategory.includes('حكومة');
                        
                        return (
                          <div 
                            key={meeting.id || `brief-meeting-${idx}`} 
                            className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:border-accent/40 transition-all flex flex-col justify-between"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-200/70">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Date Badge */}
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-200 text-[10.5px] font-mono font-bold text-gray-900 shadow-2xs">
                                  <Clock size={11} className="text-primary" />
                                  <span>{meeting.date || '—'}</span>
                                </div>

                                {/* Meeting Title near date and time */}
                                <span className="text-[12px] font-bold text-gray-950 font-serif leading-tight">
                                  {meeting.title || (isRTL ? 'مباحثات ثنائية في شؤون العمل' : 'Bilateral Labour Discussions')}
                                </span>

                                {/* Meeting Type Bubble */}
                                <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                                  {meeting.meetingType || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting')}
                                </span>

                                {/* Category Tag */}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${
                                  isUaeGov 
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : isMohre
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-gray-200 text-gray-800 border-gray-300'
                                }`}>
                                  {isUaeGov ? 'UAE GOV' : isMohre ? 'MOHRE' : 'OTHER'}
                                </span>
                              </div>

                              {idx === 0 && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                                  {isRTL ? 'أحدث لقاء رسمي' : 'Latest Meeting'}
                                </span>
                              )}
                            </div>

                            {meeting.details && (
                              <div className="pt-0.5">
                                <p className="text-[11.5px] font-semibold text-gray-900 leading-relaxed font-serif">
                                  {meeting.details.replace(/[*#]/g, '')}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                      <Calendar size={22} className="text-gray-300 mb-1.5" />
                      <p className="text-xs font-bold text-gray-700">
                        {isRTL 
                          ? `لا توجد لقاءات رسمية مسجلة حالياً`
                          : `No official meetings recorded yet`}
                      </p>
                      <p className="text-[9.5px] text-gray-400 mt-0.5">
                        {isRTL 
                          ? 'يمكن إضافة بيانات الاجتماعات من صفحة الإدخال تحت قسم "الإحاطة التنفيذية"'
                          : 'Add meeting details from the edit page under "Executive Briefing"'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. CORRESPONDENCE SECTION */}
            {isCorrespondenceVisible && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-indigo-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                        <Mail size={15} />
                      </div>
                      <div>
                        <h3 className="font-serif font-black text-xs text-gray-900 leading-tight">
                          {isRTL ? 'آخر مراسلة رسمية' : 'Last Official Correspondence'}
                        </h3>
                        <p className="text-[9.5px] text-gray-500 font-semibold">
                          {isRTL ? 'متابعة الخطابات والمراسلات الوزارية' : 'Diplomatic letters & ministerial tracking'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {isRTL ? 'متابعة رسمية' : 'Official Tracking'}
                    </span>
                  </div>

                  {data.lastCorrespondence && (data.lastCorrespondence.subject || data.lastCorrespondence.ref || data.lastCorrespondence.date) ? (
                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-gray-200/60">
                        <div className="flex items-center gap-1.5">
                          {/* Direction Badge */}
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-black border ${
                            data.lastCorrespondence.direction === 'incoming'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {data.lastCorrespondence.direction === 'incoming' 
                              ? (isRTL ? 'واردة (من الجانب المقابل)' : 'Incoming') 
                              : (isRTL ? 'صادرة (من دولة الإمارات)' : 'Outgoing')}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                            data.lastCorrespondence.status === 'closed'
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : data.lastCorrespondence.status === 'actioned'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {data.lastCorrespondence.status === 'closed'
                              ? (isRTL ? 'مغلقة' : 'Closed')
                              : data.lastCorrespondence.status === 'actioned'
                                ? (isRTL ? 'تم اتخاذ الإجراء' : 'Actioned')
                                : (isRTL ? 'بانتظار الرد' : 'Awaiting Reply')}
                          </span>
                        </div>

                        {data.lastCorrespondence.date && (
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-gray-700">
                            <Clock size={11} className="text-gray-400" />
                            <span>{data.lastCorrespondence.date}</span>
                          </div>
                        )}
                      </div>

                      {data.lastCorrespondence.ref && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
                          <span className="font-bold text-gray-700">{isRTL ? 'رقم الإشارة:' : 'Ref:'}</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-black text-gray-900 shadow-2xs">
                            {data.lastCorrespondence.ref}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider">
                          {isRTL ? 'الموضوع:' : 'Subject:'}
                        </p>
                        <p className="text-[11.5px] font-bold text-gray-900 leading-relaxed font-serif">
                          {data.lastCorrespondence.subject || (isRTL ? 'مراسلة وزارية رسمية قيد المتابعة' : 'Official correspondence under tracking')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                      <Mail size={22} className="text-gray-300 mb-1.5" />
                      <p className="text-xs font-bold text-gray-700">
                        {isRTL ? 'لا توجد مراسلة رسمية مسجلة' : 'No correspondence recorded'}
                      </p>
                      <p className="text-[9.5px] text-gray-400 mt-0.5">
                        {isRTL ? 'يمكن إضافة المراسلة وحالتها من صفحة الإدخال' : 'Add correspondence details from the edit wizard'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
