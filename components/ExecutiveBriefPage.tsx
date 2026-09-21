import React from 'react';
import { Report, ReportData, RecentInteraction } from '../types';
import { PageContainer, HeaderBand, SectionHeader } from './PrintUI';
import { 
  FileText, Calendar, Sparkles, MessageSquare, CheckCircle2, 
  MapPin, Clock, ArrowUpRight, Award, ShieldCheck, Tag, Mail
} from 'lucide-react';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const getCategoryRank = (cat?: string) => {
  const c = (cat || '').toUpperCase().trim();
  if (c === 'UAE GOV' || c.includes('UAE') || c.includes('GOV') || c.includes('حكومة')) return 1;
  if (c === 'MOHRE' || c.includes('MOHRE') || c.includes('وزارة') || c.includes('موارد')) return 2;
  return 3; // OTHER
};

const getCategoryDisplay = (cat?: string, isRTL: boolean = true) => {
  const rank = getCategoryRank(cat);
  if (rank === 1) {
    return {
      label: isRTL ? 'حكومة الإمارات' : 'UAE GOV',
      shortLabel: 'UAE GOV',
      badgeClass: 'bg-amber-100/90 text-amber-950 border-amber-300 font-black shadow-2xs'
    };
  }
  if (rank === 2) {
    return {
      label: isRTL ? 'وزارة الموارد البشرية و التوطين (MOHRE)' : 'MOHRE',
      shortLabel: 'MOHRE',
      badgeClass: 'bg-[#162e4a] text-white border-[#162e4a] font-black shadow-2xs'
    };
  }
  return {
    label: isRTL ? 'جهة أخرى (OTHER)' : 'OTHER',
    shortLabel: 'OTHER',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300 font-bold shadow-2xs'
  };
};

const getMeetingTypeBubble = (item: any, isRTL: boolean = true) => {
  if (item.meetingType && item.meetingType.trim()) {
    return item.meetingType.trim();
  }
  const combined = `${item.type || ''} ${item.title || ''}`.toLowerCase();
  if (combined.includes('jcm') || combined.includes('joint committee') || combined.includes('مشتركة')) {
    return isRTL ? 'اللجنة المشتركة (JCM)' : 'Joint Committee (JCM)';
  }
  if (combined.includes('tcm') || combined.includes('technical') || combined.includes('ministerial') || combined.includes('فنية') || combined.includes('وزارية')) {
    return isRTL ? 'اللجنة الوزارية / الفنية (TCM)' : 'Ministerial / Technical (TCM)';
  }
  if (combined.includes('consultation') || combined.includes('تشاور')) {
    return isRTL ? 'اجتماع تشاوري' : 'Consultation Session';
  }
  if (combined.includes('bilateral') || combined.includes('ثنائي')) {
    return isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting';
  }
  if (combined.includes('summit') || combined.includes('قمة')) {
    return isRTL ? 'قمة وزارية' : 'Ministerial Summit';
  }
  const isMeeting = (item.type || '').toLowerCase().includes('meet') || 
                    (item.type || '').includes('اجتماع') || 
                    (item.type || '').includes('لقاء');
  if (isMeeting) {
    return isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting';
  }
  return null;
};

const renderRichText = (text: string, sizeClass: string = "text-[11.5px]") => {
  if (!text) return null;
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-bold">$1</strong>');
  processed = processed.replace(/\*(.*?)\*/g, '<em class="text-gray-700 italic">$1</em>');
  const lines = processed.split('\n');
  const result: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      if (!inList) { inList = true; listItems = []; }
      listItems.push(trimmed.substring(2));
    } else {
      if (inList) {
        result.push(<ul key={`list-${i}`} className="list-disc mb-1 ms-6 text-gray-800">{listItems.map((item, idx) => (<li key={idx} className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>);
        inList = false;
      }
      if (trimmed) { result.push(<p key={i} className="mb-0.5 text-gray-800 leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: processed.includes('\n') ? line : processed }} />); }
    }
  });
  if (inList) { result.push(<ul key="list-final" className="list-disc mb-1 ms-6 text-gray-800">{listItems.map((item, idx) => (<li key={idx} className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />))}</ul>); }
  return <div className={`rich-text-content ${sizeClass} text-gray-800 leading-[1.5] overflow-visible font-serif`}>{result.length > 0 ? result : text}</div>;
};

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
  // Extract and sort meetings from data.executiveBriefMeetings, data.executiveBriefMeetingIds, or data.recentInteractions
  let finalMeetings: RecentInteraction[] = [];

  if (data.executiveBriefMeetings && data.executiveBriefMeetings.length > 0) {
    // 1st Priority: Dedicated Executive Brief meetings (custom title/body specific to main page)
    finalMeetings = data.executiveBriefMeetings.map(m => ({ ...m }));
  } else if (data.executiveBriefMeetingIds && data.executiveBriefMeetingIds.length > 0) {
    const map = new Map((data.recentInteractions || []).map(i => [i.id, i]));
    for (const id of data.executiveBriefMeetingIds) {
      const found = map.get(id);
      if (found) {
        finalMeetings.push({ ...found });
      }
    }
  }

  // If user entered a specific data.lastMeeting and executiveBriefMeetings was NOT set, handle it
  if ((!data.executiveBriefMeetings || data.executiveBriefMeetings.length === 0) && data.lastMeeting && (data.lastMeeting.title || data.lastMeeting.date)) {
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

  // Arrange ALWAYS by the latest to the oldest (chronological descending date)
  const sortedMeetings = [...finalMeetings].sort((a, b) => {
    const dateCompare = (b.date || '').localeCompare(a.date || '');
    if (dateCompare !== 0) return dateCompare;
    return (b.id || '').localeCompare(a.id || '');
  });

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
        <p className="text-[14.5px] sm:text-[15.5px] font-bold text-gray-900 dark:text-gray-100 mt-2 pr-1 leading-relaxed font-serif">
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
                    <div className="space-y-2.5">
                      {sortedMeetings.slice(0, ((data.executiveBriefMeetings && data.executiveBriefMeetings.length > 0) || (data.executiveBriefMeetingIds && data.executiveBriefMeetingIds.length > 0))
                        ? Math.min(sortedMeetings.length, bothVisible ? (sortedMeetings.length >= 3 ? 3 : 2) : 4) 
                        : (bothVisible ? 2 : 3)
                      ).map((meeting, idx) => {
                        return (
                          <div 
                            key={meeting.id || `brief-meeting-${idx}`} 
                            className="border border-gray-200/80 rounded-xl p-3 bg-white shadow-2xs flex flex-col avoid-break hover:border-accent/40 transition-all"
                          >
                            <div className="flex justify-between items-center mb-1.5 gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* 1. Category Badge: UAE GOV, MOHRE, OTHER */}
                                {(() => {
                                  const catInfo = getCategoryDisplay(meeting.category, isRTL);
                                  return (
                                    <span className={`text-[8.5px] uppercase px-2 py-0.5 rounded border tracking-wider ${catInfo.badgeClass}`}>
                                      {catInfo.label}
                                    </span>
                                  );
                                })()}

                                {/* 2. Type Badge: e.g. Meeting / اجتماع */}
                                <span className="text-[8px] font-bold uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                  {meeting.type || (isRTL ? 'اجتماع' : 'Meeting')}
                                </span>

                                {/* 3. Tiny bubble next to it showing what is the meeting type */}
                                {(() => {
                                  const meetingBubble = getMeetingTypeBubble(meeting, isRTL);
                                  if (!meetingBubble) return null;
                                  return (
                                    <span className="text-[7.5px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs inline-flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span>
                                      {meetingBubble}
                                    </span>
                                  );
                                })()}

                                {/* Latest indicator if first meeting */}
                                {idx === 0 && (
                                  <span className="text-[7.5px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs inline-flex items-center gap-0.5">
                                    <Sparkles size={8} className="text-emerald-600 shrink-0" />
                                    <span>{isRTL ? 'الأحدث' : 'Latest'}</span>
                                  </span>
                                )}
                              </div>

                              <span className="text-[9px] font-mono text-gray-500 font-bold shrink-0">
                                {formatDate(meeting.date)}
                              </span>
                            </div>

                            <p className="text-[12.5px] font-bold text-gray-900 mb-0.5 leading-tight font-serif">
                              {meeting.title}
                            </p>

                            {meeting.details && renderRichText(meeting.details, "text-[11.5px]")}
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
