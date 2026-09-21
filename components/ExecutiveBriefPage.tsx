import React from 'react';
import { Report, ReportData } from '../types';
import { PageContainer, HeaderBand, SectionHeader } from './PrintUI';
import { 
  FileText, Calendar, Sparkles, MessageSquare, CheckCircle2, 
  MapPin, Clock, ArrowUpRight, Award, ShieldCheck, Tag
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
  // Extract and sort meetings from data.recentInteractions, combined with data.lastMeeting if present
  const allInteractions = [...(data.recentInteractions || [])];
  
  // If user entered a specific data.lastMeeting and it's not in recentInteractions, prepend it
  if (data.lastMeeting && (data.lastMeeting.title || data.lastMeeting.date)) {
    const exists = allInteractions.some(i => i.date === data.lastMeeting?.date && i.title === data.lastMeeting?.title);
    if (!exists) {
      allInteractions.unshift({
        id: 'user-last-meeting',
        date: data.lastMeeting.date || new Date().toISOString().split('T')[0],
        type: data.lastMeeting.type || 'Meeting',
        meetingType: data.lastMeeting.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
        title: data.lastMeeting.title || (isRTL ? 'اللقاء الأخير' : 'Last Meeting'),
        category: 'MOHRE',
        details: data.lastMeeting.coverage || ''
      });
    }
  }

  // Sort by date descending
  const sortedMeetings = allInteractions
    .filter(item => {
      // Include items that are meetings, sessions, visits, or general diplomatic interactions
      const t = (item.type || '').toLowerCase();
      return t === 'meeting' || t === 'visit' || t === 'session' || item.meetingType || t === '';
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Visibility flags:
  const isPointsVisible = data.sectionVisibility?.briefPointsToFocus !== false;
  const isMeetingsVisible = data.sectionVisibility?.briefLastMeetings !== false;

  return (
    <PageContainer footer={footer} className="shadow-xl print:shadow-none mb-8 print:mb-0">
      {/* Header Band with Flag and Ministry title */}
      <HeaderBand 
        country={data.country} 
        reportId={report.id} 
        title={t('loginTitle')} 
        flagUrl={data.flagUrl} 
      />

      {/* Page Title: الإحاطة التنفيذية */}
      <div className="mb-4">
        <SectionHeader 
          icon={FileText} 
          title={isRTL ? 'الإحاطة التنفيذية' : 'Executive Briefing'} 
          compact 
        />
        <p className="text-[11px] text-gray-500 font-medium mt-1 pr-1">
          {isRTL 
            ? `موجز استراتيجي عالي المستوى لأهم الرسائل المعتمدة وأحدث اللقاءات مع ${countryDisplayName}`
            : `High-level strategic overview of key focus messages and recent meetings with ${countryDisplayName}`}
        </p>
      </div>

      {/* Main Container with 2 Sections */}
      <div className="flex flex-col gap-5 flex-1 pb-2">
        {/* ======================================================== */}
        {/* SECTION 1: أهم الرسائل التي يجب التركيز عليها              */}
        {/* ======================================================== */}
        {isPointsVisible ? (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col flex-1 min-h-[300px]">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b-2 border-primary/25">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-2xs">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-gray-900 leading-tight">
                    {isRTL ? 'أهم الرسائل التي يجب التركيز عليها' : 'Points to Focus On'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    {isRTL ? 'المحاور الجوهرية والرسائل الاستراتيجية المعتمدة' : 'Core strategic messages and priority talking points'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-primary/10 text-primary border border-primary/20">
                {isRTL ? `${focusPointsList.length} رسائل رئيسية` : `${focusPointsList.length} Key Messages`}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 flex-1 justify-center">
              {focusPointsList.map((point, idx) => (
                <div 
                  key={`focus-point-${idx}`}
                  className="flex items-start gap-3.5 p-3 rounded-xl bg-gray-50/70 border border-gray-200/70 hover:border-primary/30 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-[12.5px] font-semibold text-gray-900 leading-relaxed font-serif">
                      {point}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* SECTION 2: آخر اللقاءات والاجتماعات مع الدولة الشريكة      */}
        {/* ======================================================== */}
        {isMeetingsVisible ? (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col flex-1 min-h-[320px]">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b-2 border-accent/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold shadow-2xs">
                  <Calendar size={17} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-gray-900 leading-tight">
                    {isRTL 
                      ? `آخر اللقاءات والاجتماعات مع ${countryDisplayName}` 
                      : `Last Meetings with ${data.country || 'Partner Country'}`}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    {isRTL ? 'سجل المحادثات الثنائية ومخرجات الاجتماعات الرسمية' : 'Record of bilateral meetings, sessions, and agreed outcomes'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-accent/10 text-accent border border-accent/20">
                {isRTL ? 'سجل اللقاءات الرسمية' : 'Official Meetings Log'}
              </span>
            </div>

            {sortedMeetings.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 flex-1">
                {sortedMeetings.slice(0, 3).map((meeting, idx) => {
                  const meetingCategory = (meeting.category || 'MOHRE').toUpperCase();
                  const isMohre = meetingCategory.includes('MOHRE') || meetingCategory.includes('وزارة');
                  const isUaeGov = meetingCategory.includes('UAE') || meetingCategory.includes('GOV') || meetingCategory.includes('حكومة');
                  
                  return (
                    <div 
                      key={meeting.id || `brief-meeting-${idx}`} 
                      className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:border-accent/40 transition-all flex flex-col justify-between"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          {/* Date Badge */}
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-mono font-black text-gray-900 shadow-2xs">
                            <Clock size={12} className="text-primary" />
                            <span>{meeting.date || '—'}</span>
                          </div>

                          {/* Meeting Type Bubble */}
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                            {meeting.meetingType || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting')}
                          </span>

                          {/* Category Tag */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
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
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                            {isRTL ? 'أحدث لقاء رسمي' : 'Latest Official Meeting'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-950 leading-snug">
                          {meeting.title || (isRTL ? 'مباحثات ثنائية في شؤون القوى العاملة' : 'Bilateral Labour Discussions')}
                        </h4>
                        {meeting.details && (
                          <p className="text-[11px] text-gray-700 leading-relaxed line-clamp-2">
                            {meeting.details.replace(/[*#]/g, '')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center flex-1">
                <Calendar size={28} className="text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-700">
                  {isRTL 
                    ? `لا توجد لقاءات رسمية مسجلة حالياً مع ${countryDisplayName}`
                    : `No official meetings recorded yet with ${data.country || 'this country'}`}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {isRTL 
                    ? 'يمكن إضافة بيانات الاجتماعات من صفحة الإدخال تحت قسم "الإحاطة التنفيذية"'
                    : 'Add meeting details from the edit page under "Executive Briefing"'}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
};
