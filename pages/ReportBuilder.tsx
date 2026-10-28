import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Sparkles, Loader2, Eye, EyeOff, FileDown, CheckCircle2, Check, Plus, Trash2, ChevronUp, ChevronDown,
  AlertTriangle, Bold, List, ChevronLeft, ChevronRight, UploadCloud, X, Globe, BarChart3, Users, MessageSquare, ListChecks, History, FileText, UserRound, Settings2, LayoutDashboard,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MockService } from '../services/mockService';
import { EMPTY_REPORT_DATA, Report, ReportData } from '../types';
import ReportDocument, { SectionKey } from '../components/report/ReportDocument';
import { COPY, Lang, isBlank } from '../components/report/reportCopy';
import { PROFILE_FIELDS, PARTNER_FIELDS, fetchFields, draftSummary } from '../services/reportAI';
import { fromClassic } from '../components/report/classicAdapter';

/* =====================================================================
   Report Builder — one page to prepare the bilateral report.
   Each section maps to a report page and says where its data comes from:
     Auto (built from the report) · AI-fetched (verify) · Your input.
   Left: sections · Middle: form · Right: live A4 preview.
   ===================================================================== */

type Source = 'auto' | 'ai' | 'user';
type SecId = 'setup' | SectionKey;

const UI = {
  en: {
    back: 'Reports', untitled: 'Untitled report', draft: 'Draft', completed: 'Completed', pageN: (n: string) => `Page ${n}`, save: 'Save draft', saving: 'Saving…', saved: 'Saved', unsaved: 'Unsaved changes',
    complete: 'Mark complete', pdf: 'Open PDF', preview: 'Preview', hidePreview: 'Hide preview',
    src: { auto: 'Built from report', ai: 'AI-fetched', user: 'Your input' } as Record<Source, string>,
    srcHint: {
      auto: 'Figures are calculated from the other sections. Write the summary yourself or draft it with AI.',
      ai: 'Fetch with AI, then check each value. Amber fields are AI values not yet verified.',
      user: 'Enter this section yourself — AI is not used here.',
    } as Record<Source, string>,
    fetchAI: 'Fetch with AI', refetchAI: 'Fetch again', fetching: 'Fetching…', verify: 'Verify', verifyAll: 'Mark all verified',
    aiPending: (n: number) => `${n} AI value${n === 1 ? '' : 's'} to verify`,
    aiKeepNote: 'AI only fills empty fields and fields it filled before; values you typed are kept.',
    needCountry: 'Enter the country in Report setup first.',
    draftAI: 'Draft with AI from report data', drafting: 'Drafting…', include: 'Include in report', hiddenTag: 'Hidden', showBlock: 'Show in report', highlights: 'Automatic highlights', hlDist: 'Highlights on the emirate & sector page', hlWage: 'Highlights on the wages page', hlHint: 'Calculated from your figures (largest emirate, largest sector, wage gaps).', trade: 'Bilateral trade', partnerFacts: 'Key labour market facts', gender: 'Labour force participation by gender', hiddenNote: 'This section is switched off and will not appear in the report. You can keep editing it and switch it back on at any time.',
    add: 'Add', remove: 'Remove', moveUp: 'Move up', moveDown: 'Move down',
    overflow: (p: number[]) => `Content does not fit on page ${p.join(', ')}. Shorten the text in that section.`,
    completeWarn: (n: number) => `${n} AI value(s) are not verified yet.`, completeAnyway: 'Complete anyway', cancel: 'Cancel',
    required: 'Country and report date are required.',
    setup: 'Report setup', setupLede: 'Basic details used on the cover and running headers.',
    title: 'Report title (internal)', date: 'Report date', asOf: 'Workforce data as of', country: 'Country', contentLang: 'Report language',
    flag: 'Flag', uploadFlag: 'Upload', resetFlag: 'Reset', flagUrl: 'or paste image URL', officialName: 'Official country name (shown on the cover)', lookup: 'Find flag & official name', looking: 'Looking up…', flagFound: 'Flag and official name found automatically — please check them.', flagMissing: 'The flag could not be found automatically. Please upload it or paste an image link.',
    en: 'English', ar: 'Arabic',
    autoFigures: 'Calculated figures (from other sections)',
    objectivesHint: 'Type the objectives for this meeting.', objectivePh: 'An objective for this meeting', addObjective: 'Add objective', copyFromPoints: 'Copy from Points for Discussion', lastHint: 'Up to two recent meetings or letters, shown on the summary page.', slot: 'Interaction', brief: 'Brief', briefPh: 'One or two short lines', summaryText: 'Summary text', summaryPh: '2–3 sentences (about 50–80 words): the state of the relationship, protection and the main open item. Use **bold** for key figures.', objectivesNote: 'Main objectives on this page are the titles from Points for Discussion.',
    messages: 'Key messages', messagePh: 'One-sentence message for decision-makers',
    trend: 'MOHRE workers over the last 3 years', trendHint: 'MOHRE only (no ICP). Oldest year first. Total = labour + domestic unless you enter a total. The report shows each year\'s total and the increase.',
    year: 'Year', privateN: 'MOHRE labour', domesticN: 'MOHRE domestic', totalN: 'Total (optional)',
    totals: 'Headline totals', totalOverride: 'Override total (optional)', totalOverrideHint: 'Only if the official total differs from the calculated one.',
    protection: 'Worker protection', covered: 'covered', notCovered: 'not covered', pct: '%',
    wages: 'Median monthly wage (AED)', emirates: 'Workers by emirate', sectorsAll: 'Workers by sector', sectorsM: 'Workers by sector — MOHRE', sectorsI: 'Workers by sector — ICP',
    salary: 'Median wage by sector (AED)', sector: 'Sector', market: 'Labour market', nationals: 'Nationals',
    addStdSectors: 'Add standard sectors',
    name: 'Name', value: 'Value', countryCol: 'Country', countCol: 'Workers',
    party: 'UAE side', partyMohre: 'MOHRE', partyGov: 'UAE Government',
    typeCol: 'Type', titleCol: 'Title', details: 'Details', content: 'Details',
    status: 'Status', pending: 'Pending', done: 'Done', active: 'Active',
    isMohre: 'Is this a MOHRE agreement?', yes: 'Yes', no: 'No', mohreAgr: 'Yes — MOHRE', govAgr: 'No — UAE Government',
    summaryCol: 'Summary', photo: 'Photo', role: 'Position', metBefore: 'Have we met before?', metWhen: 'When / where', metShow: 'Show “first meeting” in the report', metShowHint: 'Turn off to leave this line out of the report.', bio: 'Notes / bio',
    addEngagement: 'Add engagement', addPoint: 'Add point', addUpdate: 'Add update', addAgreement: 'Add agreement', addMember: 'Add member',
    empty: 'Nothing added yet.',
    typeSuggestions: ['Meeting', 'Official visit', 'Joint Committee (JCM)', 'Call', 'Correspondence', 'Workshop'],
  },
  ar: {
    back: 'التقارير', untitled: 'تقرير بدون عنوان', draft: 'مسودة', completed: 'معتمد', pageN: (n: string) => `الصفحة ${n}`, save: 'حفظ كمسودة', saving: 'جارٍ الحفظ…', saved: 'تم الحفظ', unsaved: 'تغييرات غير محفوظة',
    complete: 'اعتماد التقرير', pdf: 'فتح PDF', preview: 'معاينة', hidePreview: 'إخفاء المعاينة',
    src: { auto: 'من بيانات التقرير', ai: 'بالذكاء الاصطناعي', user: 'إدخال المستخدم' } as Record<Source, string>,
    srcHint: {
      auto: 'تُحسب الأرقام من الأقسام الأخرى. اكتب الملخص بنفسك أو استعن بالذكاء الاصطناعي لصياغة مسودة.',
      ai: 'اجلب البيانات بالذكاء الاصطناعي ثم راجع كل قيمة. الحقول البرتقالية قيم لم يتم التحقق منها بعد.',
      user: 'يُدخل هذا القسم يدوياً — لا يُستخدم الذكاء الاصطناعي هنا.',
    } as Record<Source, string>,
    fetchAI: 'جلب بالذكاء الاصطناعي', refetchAI: 'جلب مجدداً', fetching: 'جارٍ الجلب…', verify: 'تأكيد', verifyAll: 'تأكيد الكل',
    aiPending: (n: number) => `${n} قيمة بحاجة إلى تحقق`,
    aiKeepNote: 'يملأ الذكاء الاصطناعي الحقول الفارغة أو التي سبق أن ملأها فقط؛ ولا يغيّر ما أدخلته.',
    needCountry: 'أدخل اسم الدولة في إعدادات التقرير أولاً.',
    draftAI: 'صياغة مسودة من بيانات التقرير', drafting: 'جارٍ الصياغة…', include: 'إظهار في التقرير', hiddenTag: 'مخفي', showBlock: 'إظهار في التقرير', highlights: 'المؤشرات التلقائية', hlDist: 'مؤشرات صفحة الإمارات والقطاعات', hlWage: 'مؤشرات صفحة الأجور', hlHint: 'تُحسب من أرقامك (الإمارة الأعلى، القطاع الأعلى، فجوات الأجور).', trade: 'التبادل التجاري', partnerFacts: 'أبرز مؤشرات سوق العمل', gender: 'المشاركة في القوى العاملة حسب الجنس', hiddenNote: 'هذا القسم متوقف ولن يظهر في التقرير. يمكنك مواصلة تعديله وإعادة تفعيله في أي وقت.',
    add: 'إضافة', remove: 'حذف', moveUp: 'لأعلى', moveDown: 'لأسفل',
    overflow: (p: number[]) => `المحتوى لا يتسع في الصفحة ${p.join('، ')}. يرجى اختصار النص في هذا القسم.`,
    completeWarn: (n: number) => `هناك ${n} قيمة من الذكاء الاصطناعي لم يتم التحقق منها.`, completeAnyway: 'اعتماد على أي حال', cancel: 'إلغاء',
    required: 'الدولة وتاريخ التقرير مطلوبان.',
    setup: 'إعدادات التقرير', setupLede: 'البيانات الأساسية التي تظهر في الغلاف وترويسة الصفحات.',
    title: 'عنوان التقرير (داخلي)', date: 'تاريخ التقرير', asOf: 'تاريخ بيانات القوى العاملة', country: 'الدولة', contentLang: 'لغة التقرير',
    flag: 'العلم', uploadFlag: 'رفع', resetFlag: 'إعادة', flagUrl: 'أو الصق رابط الصورة', officialName: 'الاسم الرسمي للدولة (يظهر في الغلاف)', lookup: 'جلب العلم والاسم الرسمي', looking: 'جارٍ البحث…', flagFound: 'تم جلب العلم والاسم الرسمي تلقائياً — يرجى التحقق منهما.', flagMissing: 'تعذّر جلب العلم تلقائياً. يرجى رفعه أو لصق رابط الصورة.',
    en: 'الإنجليزية', ar: 'العربية',
    autoFigures: 'أرقام محسوبة (من الأقسام الأخرى)',
    objectivesHint: 'اكتب أهداف هذا الاجتماع.', objectivePh: 'هدف من أهداف الاجتماع', addObjective: 'إضافة هدف', copyFromPoints: 'نسخ من محاور النقاش', lastHint: 'حتى اجتماعين أو رسالتين حديثتين، تظهر في صفحة الملخص.', slot: 'التواصل', brief: 'نبذة', briefPh: 'سطر أو سطران', summaryText: 'نص الملخص', summaryPh: 'جملتان أو ثلاث (حوالي 50–80 كلمة): وضع العلاقة والحماية وأبرز ملف مفتوح. استخدم **النص الغامق** للأرقام المهمة.', objectivesNote: 'الأهداف الرئيسية في هذه الصفحة هي عناوين محاور النقاش.',
    messages: 'الرسائل الرئيسية', messagePh: 'رسالة من جملة واحدة لمتخذي القرار',
    trend: 'عمالة الوزارة خلال آخر 3 سنوات', trendHint: 'بيانات الوزارة فقط (دون الهوية والجنسية). ابدأ بالسنة الأقدم. الإجمالي = العمالة + المساعدة ما لم تُدخل إجمالياً. يعرض التقرير إجمالي كل سنة ونسبة الزيادة.',
    year: 'السنة', privateN: 'عمالة الوزارة', domesticN: 'مساعدة الوزارة', totalN: 'الإجمالي (اختياري)',
    totals: 'الأرقام الرئيسية', totalOverride: 'تعديل الإجمالي (اختياري)', totalOverrideHint: 'فقط إذا اختلف الإجمالي الرسمي عن الإجمالي المحسوب.',
    protection: 'حماية العمال', covered: 'مشمولون', notCovered: 'غير مشمولين', pct: '%',
    wages: 'وسيط الأجر الشهري (درهم)', emirates: 'العمال حسب الإمارة', sectorsAll: 'العمال حسب القطاع', sectorsM: 'العمال حسب القطاع — الوزارة', sectorsI: 'العمال حسب القطاع — الهوية',
    salary: 'وسيط الأجور حسب القطاع (درهم)', sector: 'القطاع', market: 'سوق العمل', nationals: 'الجنسية',
    addStdSectors: 'إضافة القطاعات الأساسية',
    name: 'الاسم', value: 'القيمة', countryCol: 'الدولة', countCol: 'عدد العمال',
    party: 'الجانب الإماراتي', partyMohre: 'الوزارة', partyGov: 'حكومة الإمارات',
    typeCol: 'النوع', titleCol: 'العنوان', details: 'التفاصيل', content: 'التفاصيل',
    status: 'الحالة', pending: 'قيد المتابعة', done: 'منجز', active: 'سارية',
    isMohre: 'هل هذه اتفاقية خاصة بالوزارة؟', yes: 'نعم', no: 'لا', mohreAgr: 'نعم — الوزارة', govAgr: 'لا — حكومة الإمارات',
    summaryCol: 'الملخص', photo: 'الصورة', role: 'المنصب', metBefore: 'هل سبق اللقاء؟', metWhen: 'متى / أين', metShow: 'إظهار «أول لقاء» في التقرير', metShowHint: 'أوقفه لعدم إظهار هذا السطر في التقرير.', bio: 'ملاحظات / نبذة',
    addEngagement: 'إضافة تواصل', addPoint: 'إضافة محور', addUpdate: 'إضافة مستجد', addAgreement: 'إضافة اتفاقية', addMember: 'إضافة عضو',
    empty: 'لم تتم إضافة أي عنصر بعد.',
    typeSuggestions: ['اجتماع', 'زيارة رسمية', 'اللجنة المشتركة', 'اتصال', 'مراسلة', 'ورشة عمل'],
  },
};

/* ---------- immutable path helpers ---------- */
const getIn = (obj: any, path: string) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const setIn = (obj: any, path: string, value: any): any => {
  const [k, ...rest] = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  clone[k] = rest.length ? setIn(obj?.[k], rest.join('.'), value) : value;
  return clone;
};

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const STD_SECTORS = ['Construction', 'Retail', 'Services', 'Hospitality', 'Manufacturing', 'Transportation'];

/* Normalise older reports so every field the builder touches exists. */
const normalise = (raw: any): ReportData => {
  const d: any = fromClassic(raw);
  const base: any = JSON.parse(JSON.stringify(EMPTY_REPORT_DATA));
  const out: any = { ...base, ...d };
  out.uaeWorkforceStats = { ...base.uaeWorkforceStats, ...(d?.uaeWorkforceStats || {}) };
  out.uaeWorkforceStats.mohre = { ...base.uaeWorkforceStats.mohre, ...(d?.uaeWorkforceStats?.mohre || {}) };
  out.uaeWorkforceStats.icp = { ...base.uaeWorkforceStats.icp, ...(d?.uaeWorkforceStats?.icp || {}) };
  out.workforceStats = { ...base.workforceStats, ...(d?.workforceStats || {}) };
  out.economicStats = { ...base.economicStats, ...(d?.economicStats || {}) };
  out.educationStats = { ...base.educationStats, ...(d?.educationStats || {}) };
  out.delegations = { ...base.delegations, ...(d?.delegations || {}) };
  if (!out.uaeWorkforceStats.trend?.length) {
    const y = new Date(out.reportDate || Date.now()).getFullYear();
    out.uaeWorkforceStats.trend = [y - 2, y - 1, y].map(v => ({ year: String(v) }));
  }
  if (!out.contentLanguage) {
    const sample = [out.country, out.capital, out.executiveSummary, ...(out.recentInteractions || []).map((i: any) => i.title)].join(' ');
    out.contentLanguage = /[\u0600-\u06FF]/.test(sample) ? 'ar' : (sample.trim() ? 'en' : undefined);
  }
  ['recentInteractions', 'pointsOfDiscussion', 'previousAgreementsAndUpdates', 'bilateralAgreements', 'keyMessages', 'aiFields'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  return out as ReportData;
};

/* ---------- small UI pieces ---------- */
const SrcChip: React.FC<{ kind: Source; label: string }> = ({ kind, label }) => {
  const cls = kind === 'ai' ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
    : kind === 'auto' ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-700'
      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600';
  const Icon = kind === 'ai' ? Sparkles : kind === 'auto' ? LayoutDashboard : UserRound;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}><Icon size={11} />{label}</span>;
};

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#24527f] focus:ring-2 focus:ring-[#24527f]/15 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
const labelCls = 'mb-1 block text-[13px] font-semibold text-slate-700 dark:text-slate-300';

const Segmented: React.FC<{ value: any; options: { v: any; label: string }[]; onChange: (v: any) => void }> = ({ value, options, onChange }) => (
  <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-800">
    {options.map(o => (
      <button key={String(o.v)} type="button" onClick={() => onChange(o.v)}
        className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${value === o.v ? 'bg-[#0d2c4f] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'}`}>
        {o.label}
      </button>
    ))}
  </div>
);

const RichArea: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; dir?: string }> = ({ value, onChange, placeholder, rows = 5, dir }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (kind: 'bold' | 'bullet') => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b);
    const ins = kind === 'bold' ? `**${sel || '…'}**` : `${a > 0 && value[a - 1] !== '\n' ? '\n' : ''}- ${sel}`;
    onChange(value.slice(0, a) + ins + value.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + ins.length, a + ins.length); });
  };
  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-[#24527f] focus-within:ring-2 focus-within:ring-[#24527f]/15 dark:border-slate-600">
      <div className="flex gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800">
        <button type="button" title="Bold" onClick={() => wrap('bold')} className="rounded p-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><Bold size={14} /></button>
        <button type="button" title="Bullet" onClick={() => wrap('bullet')} className="rounded p-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><List size={14} /></button>
      </div>
      <textarea ref={ref} dir={dir} rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="block w-full resize-y bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none dark:bg-slate-900 dark:text-white" />
    </div>
  );
};

/* Small on/off switch */
const Switch: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({ on, onClick, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} title={label} onClick={onClick} data-block-toggle
    className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'start-[18px]' : 'start-0.5'}`} />
  </button>
);

/* Card; with `block`, it gets a "Show in report" switch for that part of the report */
const Card: React.FC<{ title?: string; hint?: string; right?: React.ReactNode; block?: string; children: React.ReactNode }> = ({ title, hint, right, block, children }) => {
  const ctx = React.useContext(BuilderCtx);
  const shown = !block || !ctx?.hidden.has(block);
  return (
    <div className={`rounded-xl border p-4 shadow-sm transition ${shown ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60' : 'border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/30'}`}>
      {(title || right || block) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className={shown ? '' : 'opacity-60'}>
            {title && <h3 className="text-[15px] font-bold text-[#0d2c4f] dark:text-white">{title}{!shown && <span className="ms-2 rounded bg-slate-200 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">{ctx.ui.hiddenTag}</span>}</h3>}
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
          </div>
          <div className="flex items-center gap-3">
            {shown && right}
            {block && <span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><span className="hidden sm:inline">{ctx.ui.showBlock}</span><Switch on={shown} onClick={() => ctx.toggle(block)} label={ctx.ui.showBlock} /></span>}
          </div>
        </div>
      )}
      <div className={shown ? '' : 'pointer-events-none opacity-40'} aria-hidden={!shown}>{children}</div>
    </div>
  );
};

/* Repeating list with add / remove / reorder */
function ListEditor<T>({ items, onChange, make, render, addLabel, emptyText, ui }: {
  items: T[]; onChange: (v: T[]) => void; make: () => T; render: (item: T, set: (patch: Partial<T>) => void, i: number) => React.ReactNode;
  addLabel: string; emptyText: string; ui: typeof UI.en;
}) {
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div className="space-y-3">
      {!items.length && <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400 dark:border-slate-600">{emptyText}</div>}
      {items.map((it, i) => (
        <div key={(it as any).id || i} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="absolute end-2 top-2 flex gap-0.5">
            <button type="button" title={ui.moveUp} onClick={() => move(i, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"><ChevronUp size={15} /></button>
            <button type="button" title={ui.moveDown} onClick={() => move(i, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"><ChevronDown size={15} /></button>
            <button type="button" title={ui.remove} onClick={() => onChange(items.filter((_, k) => k !== i))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"><Trash2 size={15} /></button>
          </div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">#{i + 1}</div>
          {render(it, patch => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x))), i)}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, make()])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-sm font-semibold text-[#24527f] transition hover:border-[#24527f] hover:bg-[#24527f]/5 dark:border-slate-600 dark:text-sky-300">
        <Plus size={16} />{addLabel}
      </button>
    </div>
  );
}

/* ---------- Context-bound field components (module level → stable identity, inputs keep focus) ---------- */
interface Ctx { data: ReportData; update: (p: string, v: any) => void; verify: (p: string[]) => void; aiSet: Set<string>; dir: string; ui: typeof UI.en; hidden: Set<string>; toggle: (k: string) => void }
const BuilderCtx = React.createContext<Ctx>(null as any);

const VerifyPill: React.FC<{ path: string }> = ({ path }) => {
  const { verify, ui } = React.useContext(BuilderCtx);
  return (
    <button type="button" onClick={() => verify([path])} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200">
      <Sparkles size={10} />AI · {ui.verify}<Check size={11} />
    </button>
  );
};

const Field: React.FC<{ path: string; label: string; type?: 'text' | 'number' | 'date'; placeholder?: string; hint?: string; list?: 'lines' }> = ({ path, label, type = 'text', placeholder, hint, list }) => {
  const { data, update, aiSet, dir } = React.useContext(BuilderCtx);
  const v = getIn(data, path);
  const flagged = aiSet.has(path);
  const ring = flagged ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-900/10' : '';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        {flagged && <VerifyPill path={path} />}
      </div>
      {list === 'lines' ? (
        <textarea dir={dir} rows={5} className={`${inputCls} ${ring}`} value={Array.isArray(v) ? v.join('\n') : ''} placeholder={placeholder}
          onChange={e => update(path, e.target.value.split('\n'))} onBlur={e => update(path, e.target.value.split('\n').map(x => x.trim()).filter(Boolean))} />
      ) : (
        <input dir={type === 'text' ? dir : undefined} type={type} className={`${inputCls} ${ring}`} value={v ?? ''} placeholder={placeholder}
          onChange={e => update(path, type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)} />
      )}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};

const NumRow: React.FC<{ label: string; path: string }> = ({ label, path }) => {
  const { data, update } = React.useContext(BuilderCtx);
  return (
    <div className="grid grid-cols-[1fr_110px] items-center gap-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <input type="number" className={`${inputCls} py-1.5 text-end`} value={getIn(data, path) || ''} onChange={e => update(path, e.target.value === '' ? 0 : Number(e.target.value))} />
    </div>
  );
};

const NameValueEditor: React.FC<{ path: string; nameLabel: string; valueLabel: string; valueKey?: string; nameKey?: string; textValue?: boolean }> = ({ path, nameLabel, valueLabel, valueKey = 'value', nameKey = 'name', textValue }) => {
  const { data, update, aiSet, dir, ui } = React.useContext(BuilderCtx);
  const rows: any[] = getIn(data, path) || [];
  const flagged = aiSet.has(path);
  return (
    <div className={flagged ? 'rounded-lg ring-2 ring-amber-300 ring-offset-2 dark:ring-offset-slate-900' : ''}>
      {flagged && <div className="mb-2 flex justify-end"><VerifyPill path={path} /></div>}
      <div className="mb-1 grid grid-cols-[1fr_120px_28px] gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400"><span>{nameLabel}</span><span>{valueLabel}</span><span /></div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_28px] items-center gap-2">
            <input dir={dir} className={`${inputCls} py-1.5`} value={r[nameKey] || ''} onChange={e => update(path, rows.map((x, k) => k === i ? { ...x, [nameKey]: e.target.value } : x))} />
            <input type={textValue ? 'text' : 'number'} className={`${inputCls} py-1.5 text-end`} value={r[valueKey] ?? ''} onChange={e => update(path, rows.map((x, k) => k === i ? { ...x, [valueKey]: textValue ? e.target.value : Number(e.target.value) } : x))} />
            <button type="button" onClick={() => update(path, rows.filter((_, k) => k !== i))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => update(path, [...rows, { [nameKey]: '', [valueKey]: textValue ? '' : 0 }])} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#24527f] hover:underline dark:text-sky-300"><Plus size={14} />{ui.add}</button>
    </div>
  );
};

const ProtectionRow: React.FC<{ label: string; cn: string; cp: string; nn?: string; np?: string }> = ({ label, cn, cp, nn, np }) => {
  const { data, update, ui } = React.useContext(BuilderCtx);
  const inp = (key: string, ph: string) => {
    const path = `uaeWorkforceStats.mohre.${key}`;
    return <input className={`${inputCls} py-1.5 text-end`} placeholder={ph} value={getIn(data, path) || ''} onChange={e => update(path, e.target.value)} />;
  };
  return (
    <div className="grid grid-cols-[1.6fr_1fr_70px_1fr_70px] items-center gap-2 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {inp(cn, ui.covered)}{inp(cp, '%')}
      {nn ? inp(nn, ui.notCovered) : <span />}
      {np ? inp(np, '%') : <span />}
    </div>
  );
};

/* =====================================================================
   Page
   ===================================================================== */
export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const uiLang: Lang = language === 'ar' ? 'ar' : 'en';
  const ui = UI[uiLang];

  const [reportId, setReportId] = useState<string>(id || `r-${uuidv4().slice(0, 8)}`);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'draft' | 'completed'>('draft');
  const [data, setData] = useState<ReportData>(() => normalise({ ...EMPTY_REPORT_DATA, contentLanguage: uiLang }));
  const [loading, setLoading] = useState(!!id);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [section, setSection] = useState<SecId>('setup');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [overflow, setOverflow] = useState<number[]>([]);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const lang: Lang = (data.contentLanguage as Lang) || uiLang;
  const R = COPY[lang]; // report labels in the report's language
  const contentDir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!id) return;
    MockService.getReportById(id).then(r => {
      if (r) {
        setData(normalise(r.data));
        setTitle(r.title);
        setStatus(r.status);
        setReportId(r.id);
      }
      setLoading(false);
    });
  }, [id]);

  /* ---------- updates & provenance ---------- */
  const aiSet = useMemo(() => new Set(data.aiFields || []), [data.aiFields]);
  const update = useCallback((path: string, value: any) => {
    setData(prev => {
      let next = setIn(prev, path, value);
      if ((prev.aiFields || []).includes(path)) next = { ...next, aiFields: (prev.aiFields || []).filter(p => p !== path) };
      return next;
    });
    setDirty(true);
  }, []);
  const verify = (paths: string[]) => { setData(prev => ({ ...prev, aiFields: (prev.aiFields || []).filter(p => !paths.includes(p)) })); setDirty(true); };

  /* ---------- show / hide report sections ---------- */
  const hiddenSet = new Set<string>((data as any).hiddenSections || []);
  const toggleSection = (id: string) => {
    setData(prev => {
      const cur = new Set<string>((prev as any).hiddenSections || []);
      cur.has(id) ? cur.delete(id) : cur.add(id);
      return { ...prev, hiddenSections: [...cur] } as ReportData;
    });
    setDirty(true);
  };

  /* ---------- AI ---------- */
  const runFetch = async (scope: 'profile' | 'partner') => {
    if (!data.country.trim()) { setError(ui.needCountry); return; }
    setBusy(scope); setError(null);
    try {
      const fields = scope === 'profile' ? PROFILE_FIELDS : PARTNER_FIELDS;
      const topic = scope === 'profile' ? 'country profile, economy, bilateral trade with the UAE and education' : 'labour market, wages, outward labour migration and skills';
      const result = await fetchFields(data.country, fields, lang, user?.apiKey || '', topic);
      setData(prev => {
        let next: any = prev;
        const flagged = new Set(prev.aiFields || []);
        Object.entries(result).forEach(([path, v]) => {
          const cur = getIn(prev, path);
          const curEmpty = cur === undefined || cur === null || cur === '' || (Array.isArray(cur) && !cur.length) || cur === 0 || (path === 'directFlight' && !flagged.has(path));
          if (curEmpty || flagged.has(path)) { next = setIn(next, path, v); flagged.add(path); }
        });
        return { ...next, aiFields: [...flagged] };
      });
      setDirty(true);
    } catch (e: any) { setError(e.message || String(e)); } finally { setBusy(null); }
  };

  /* Flag + official name via the existing restcountries proxy (works without the AI key) */
  const [flagStatus, setFlagStatus] = useState<'idle' | 'loading' | 'found' | 'missing'>('idle');
  const lookupCountry = async (force = false) => {
    const name = data.country.trim();
    if (!name) return;
    if (!force && data.flagUrl && (data as any).countryOfficialName) return;
    setFlagStatus('loading');
    try {
      const res = await fetch(`/api/proxy-flag?country=${encodeURIComponent(name)}&fullText=true`);
      const list = res.ok ? await res.json() : [];
      const c = Array.isArray(list) ? list[0] : null;
      if (!c) { setFlagStatus(data.flagUrl ? 'idle' : 'missing'); return; }
      const official = lang === 'ar' ? (c.translations?.ara?.official || '') : (c.name?.official || '');
      const flagUrl = c.flags?.png || c.flags?.svg || '';
      setData(prev => {
        let next: any = prev; const flagged = new Set(prev.aiFields || []);
        if (flagUrl && (force || !prev.flagUrl)) { next = { ...next, flagUrl }; flagged.add('flagUrl'); }
        if (official && (force || !(prev as any).countryOfficialName)) { next = { ...next, countryOfficialName: official }; flagged.add('countryOfficialName'); }
        return { ...next, aiFields: [...flagged] };
      });
      setDirty(true);
      setFlagStatus(flagUrl ? 'found' : 'missing');
    } catch { setFlagStatus(data.flagUrl ? 'idle' : 'missing'); }
  };

  const facts = useMemo(() => {
    const m = data.uaeWorkforceStats.mohre;
    const trend = (data.uaeWorkforceStats.trend || []).filter(t => t.year && ((t.privateSector || 0) + (t.domestic || 0) + (t.total || 0)) > 0)
      .map(t => ({ year: t.year, total: t.total || (Number(t.privateSector) || 0) + (Number(t.domestic) || 0) }));
    const sumEm = (l: any[]) => l.reduce((a, c) => a + (Number(c.value) || 0), 0);
    const num = (v: any) => parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;
    const icpTotal = (data.uaeWorkforceStats.icp as any).totalWorkers;
    const total = data.uaeWorkforceStats.totalWorkersOverride || (num(m.totalPrivate?.value) + num(m.totalDomestic?.value) + num(icpTotal)) || (sumEm(m.byEmirate) + sumEm(data.uaeWorkforceStats.icp.byEmirate));
    const activeMohre = data.bilateralAgreements.filter(a => (a.status || 'active') === 'active' && a.party === 'mohre').length;
    const latest = [...data.recentInteractions].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    return {
      country: data.country, totalWorkforceInUAE: total || null, workforceTrend: trend,
      mohreLabour: m.totalPrivate?.value, mohreDomestic: m.totalDomestic?.value, icpWorkers: (data.uaeWorkforceStats.icp as any).totalWorkers, workforceTrendNote: 'trend covers MOHRE workers only (labour + domestic)',
      wpsPct: m.wpsWageTransferPct, unemploymentInsurancePct: m.insuranceUnemploymentCoveredPct, strikes: m.workersLaborStrikes,
      activeMohreAgreements: activeMohre,
      agreements: data.bilateralAgreements.map(a => ({ title: a.title, status: a.status, side: a.party })),
      latestEngagement: latest ? { date: latest.date, title: latest.title, side: latest.party } : null,
      pointsOfDiscussion: data.pointsOfDiscussion.map(p => p.title),
      pendingUpdates: (data.previousAgreementsAndUpdates || []).filter(u => u.status !== 'done').map(u => u.title),
    };
  }, [data]);

  const runSummary = async () => {
    setBusy('summary'); setError(null);
    try {
      const out = await draftSummary(data, facts, lang, user?.apiKey || '');
      setData(prev => ({ ...prev, executiveSummary: out.summary, aiFields: Array.from(new Set([...(prev.aiFields || []), 'executiveSummary'])) }));
      setDirty(true);
    } catch (e: any) { setError(e.message || String(e)); } finally { setBusy(null); }
  };

  /* ---------- save ---------- */
  const buildReport = (st: 'draft' | 'completed'): Report => ({
    id: reportId, userId: user?.id || 'u-admin',
    title: title.trim() || `${data.country || ui.untitled}${data.reportDate ? ` — ${data.reportDate}` : ''}`,
    status: st, updatedAt: new Date().toISOString(), data,
  });
  const save = async (st: 'draft' | 'completed' = status) => {
    setSaving('saving');
    await MockService.saveReport(buildReport(st));
    setStatus(st); setDirty(false); setSaving('saved');
    // first save of a new report: put the id in the address without reloading the builder
    if (!id) window.history.replaceState(window.history.state, '', `#/wizard/${reportId}`);
    setTimeout(() => setSaving('idle'), 1500);
  };
  const complete = async (force = false) => {
    if (!data.country.trim() || !data.reportDate) { setError(ui.required); return; }
    if (!force && aiSet.size) { setConfirmComplete(true); return; }
    setConfirmComplete(false);
    await save('completed');
  };
  const openPdf = async () => {
    if (dirty || !id) await save();
    window.open(`${window.location.origin}${window.location.pathname}#/print/${reportId}?lang=${lang}`, '_blank');
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /* ---------- preview scaling & scroll ---------- */
  const previewBox = useRef<HTMLDivElement>(null);
  const previewInner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.55);
  const [innerH, setInnerH] = useState(0);
  useEffect(() => {
    const box = previewBox.current, inner = previewInner.current;
    if (!box || !inner) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, (box.clientWidth - 32) / 794));
      setInnerH(inner.scrollHeight);
    });
    ro.observe(box); ro.observe(inner);
    return () => ro.disconnect();
  }, [showPreview, loading]);
  useEffect(() => {
    const box = previewBox.current, inner = previewInner.current;
    if (!box || !inner) return;
    const target = inner.querySelector<HTMLElement>(`.rpt-doc > section[data-section="${section === 'setup' ? 'cover' : section}"]`);
    if (target) box.scrollTo({ top: target.offsetTop * scale, behavior: 'smooth' });
  }, [section, scale, showPreview]);

  /* ---------- section definitions ---------- */
  const mohre = data.uaeWorkforceStats.mohre;
  const count = (paths: string[]) => paths.filter(p => !isBlank(getIn(data, p)) && !(Array.isArray(getIn(data, p)) && !getIn(data, p).length)).length;
  const aiIn = (paths: string[]) => paths.filter(p => aiSet.has(p));
  const profilePaths = PROFILE_FIELDS.map(f => f.path);
  const partnerPaths = PARTNER_FIELDS.map(f => f.path);

  const SECTIONS: { id: SecId; title: string; source: Source; icon: any; page?: string; done: string; ai?: number }[] = [
    { id: 'setup', title: ui.setup, source: 'user', icon: Settings2, done: `${count(['country', 'reportDate'])}/2` },
    { id: 'summary', title: R.summary, source: 'auto', icon: LayoutDashboard, page: '1', done: data.executiveSummary?.trim() ? '✓' : '—', ai: aiIn(['executiveSummary', 'keyMessages']).length },
    { id: 'profile', title: R.profile, source: 'ai', icon: Globe, page: '2', done: `${count(profilePaths)}/${profilePaths.length}`, ai: aiIn(profilePaths).length },
    { id: 'uae', title: R.uaeWorkforce, source: 'user', icon: BarChart3, page: '3', done: `${count(['uaeWorkforceStats.mohre.totalPrivate.value', 'uaeWorkforceStats.mohre.totalDomestic.value', 'uaeWorkforceStats.icp.totalWorkers'])}/3` },
    { id: 'partner', title: R.partnerWorkforce(data.country || '…'), source: 'ai', icon: Users, page: '4', done: `${count(partnerPaths)}/${partnerPaths.length}`, ai: aiIn(partnerPaths).length },
    { id: 'relationship', title: R.relationship, source: 'user', icon: MessageSquare, page: '5', done: String(data.recentInteractions.length) },
    { id: 'points', title: R.points, source: 'user', icon: ListChecks, done: String(data.pointsOfDiscussion.length) },
    { id: 'updates', title: R.updates, source: 'user', icon: History, done: String((data.previousAgreementsAndUpdates || []).length) },
    { id: 'agreements', title: R.agreements, source: 'user', icon: FileText, done: String(data.bilateralAgreements.length) },
    { id: 'delegations', title: R.delegations, source: 'user', icon: UserRound, done: String(data.delegations.partner.length) },
  ];
  const current = SECTIONS.find(s => s.id === section)!;
  const currentIdx = SECTIONS.findIndex(s => s.id === section);

  const readImage = (file: File, cb: (url: string) => void) => { const r = new FileReader(); r.onloadend = () => cb(r.result as string); r.readAsDataURL(file); };

  /* ---------- section bodies ---------- */
  const renderSection = () => {
    switch (section) {
      case 'setup':
        return (
          <div className="space-y-4">
            <Card>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelCls}>{ui.title}</label>
                  <input className={inputCls} value={title} placeholder={`${data.country || ui.untitled}${data.reportDate ? ` — ${data.reportDate}` : ''}`} onChange={e => { setTitle(e.target.value); setDirty(true); }} />
                </div>
                <div onBlur={() => lookupCountry()}><Field path="country" label={ui.country} placeholder="e.g. Kenya" /></div>
                <div>
                  <label className={labelCls}>{ui.contentLang}</label>
                  <Segmented value={lang} onChange={v => update('contentLanguage', v)} options={[{ v: 'en', label: ui.en }, { v: 'ar', label: ui.ar }]} />
                </div>
                <div className="md:col-span-2"><Field path="countryOfficialName" label={ui.officialName} placeholder={lang === 'ar' ? 'جمهورية كينيا' : 'Republic of Kenya'} /></div>
                <Field path="reportDate" label={ui.date} type="date" />
                <Field path="reportMonthYear" label={ui.asOf} placeholder={lang === 'ar' ? 'سبتمبر 2026' : 'September 2026'} />
              </div>
            </Card>
            <Card title={ui.flag} right={
              <button type="button" disabled={flagStatus === 'loading' || !data.country.trim()} onClick={() => lookupCountry(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200">
                {flagStatus === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}{flagStatus === 'loading' ? ui.looking : ui.lookup}
              </button>}>
              {flagStatus === 'missing' && !data.flagUrl && <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"><AlertTriangle size={15} />{ui.flagMissing}</div>}
              {flagStatus === 'found' && <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"><Sparkles size={15} />{ui.flagFound}{aiSet.has('flagUrl') && <span className="ms-auto"><VerifyPill path="flagUrl" /></span>}</div>}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  {data.flagUrl ? <img src={data.flagUrl} className="h-full w-full object-cover" alt="" /> : <Globe className="text-slate-300" />}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200">
                  <UploadCloud size={15} />{ui.uploadFlag}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readImage(f, u => update('flagUrl', u)); }} />
                </label>
                {data.flagUrl && <button type="button" onClick={() => update('flagUrl', '')} className="text-sm font-semibold text-slate-500 hover:text-red-600">{ui.resetFlag}</button>}
                <input className={`${inputCls} flex-1`} placeholder={ui.flagUrl} value={data.flagUrl?.startsWith('http') ? data.flagUrl : ''} onChange={e => update('flagUrl', e.target.value)} />
              </div>
            </Card>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-4">
            <Card title={ui.autoFigures} block="summary.kpis">
              <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                {[
                  [R.glanceWorkers, facts.totalWorkforceInUAE ? Number(facts.totalWorkforceInUAE).toLocaleString('en-US') : '—'],
                  [R.privateSector, facts.mohreLabour || '—'],
                  [R.glanceProtected, facts.wpsPct ? `${String(facts.wpsPct).replace('%', '')}%` : '—'],
                  [R.glanceAgreements, String(facts.activeMohreAgreements)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <dt className="text-[11px] text-slate-500">{k}</dt>
                    <dd className="mt-0.5 text-lg font-bold text-[#0d2c4f] dark:text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title={ui.summaryText} block="summary.text" right={
              <button type="button" disabled={busy === 'summary'} onClick={runSummary} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60">
                {busy === 'summary' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{busy === 'summary' ? ui.drafting : ui.draftAI}
              </button>}>
              {aiSet.has('executiveSummary') && <div className="mb-2"><VerifyPill path="executiveSummary" /></div>}
              <RichArea dir={contentDir} rows={4} value={data.executiveSummary || ''} placeholder={ui.summaryPh} onChange={v => update('executiveSummary', v)} />
            </Card>
            <Card title={R.objectives} hint={ui.objectivesHint} block="summary.objectives"
              right={data.pointsOfDiscussion.some(p => p.title?.trim()) && !(data as any).meetingObjectives?.length ? (
                <button type="button" onClick={() => update('meetingObjectives', data.pointsOfDiscussion.map(p => p.title).filter(Boolean))} className="text-sm font-semibold text-[#24527f] hover:underline dark:text-sky-300">{ui.copyFromPoints}</button>) : undefined}>
              <div className="space-y-2">
                {(((data as any).meetingObjectives || []) as string[]).map((m, i, arr) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0d2c4f] text-xs font-bold text-white">{i + 1}</span>
                    <input dir={contentDir} className={inputCls} value={m} placeholder={ui.objectivePh} onChange={e => update('meetingObjectives', arr.map((x, k) => k === i ? e.target.value : x))} />
                    <button type="button" onClick={() => update('meetingObjectives', arr.filter((_, k) => k !== i))} className="rounded p-1 text-slate-400 hover:text-red-600"><X size={15} /></button>
                  </div>
                ))}
                {(((data as any).meetingObjectives || []) as string[]).length < 6 && (
                  <button type="button" onClick={() => update('meetingObjectives', [...((data as any).meetingObjectives || []), ''])} className="inline-flex items-center gap-1 text-sm font-semibold text-[#24527f] hover:underline dark:text-sky-300"><Plus size={14} />{ui.addObjective}</button>
                )}
              </div>
            </Card>
            <Card title={R.lastInteractions} hint={ui.lastHint} block="summary.last">
              <div className="grid gap-4 lg:grid-cols-2">
                {[0, 1].map(i => {
                  const list = (((data as any).lastInteractions || []) as any[]);
                  const x = list[i] || { kind: 'meeting', title: '', date: '', brief: '', status: 'pending' };
                  const set = (patch: any) => { const next = [...list]; while (next.length <= i) next.push({ kind: 'meeting', title: '', date: '', brief: '', status: 'pending' }); next[i] = { ...x, ...patch }; update('lastInteractions', next); };
                  return (
                    <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{ui.slot} {i + 1}</div>
                      <div className="flex flex-wrap gap-2">
                        <Segmented value={x.kind} onChange={v => set({ kind: v })} options={[{ v: 'meeting', label: R.kindMeeting }, { v: 'letter', label: R.kindLetter }]} />
                        <Segmented value={x.status} onChange={v => set({ status: v })} options={[{ v: 'pending', label: R.stPending }, { v: 'done', label: R.stDone }]} />
                      </div>
                      <div><label className={labelCls}>{R.colDate}</label><input type="date" className={inputCls} value={x.date} onChange={e => set({ date: e.target.value })} /></div>
                      <div><label className={labelCls}>{ui.titleCol}</label><input dir={contentDir} className={inputCls} value={x.title} onChange={e => set({ title: e.target.value })} /></div>
                      <div><label className={labelCls}>{ui.brief}</label><textarea dir={contentDir} rows={2} maxLength={220} className={inputCls} value={x.brief} placeholder={ui.briefPh} onChange={e => set({ brief: e.target.value })} /></div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <Card title={R.profile} block="profile.facts">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="capital" label={R.capital} />
                <Field path="population" label={R.population} />
                <Field path="currency" label={R.currency} />
                <Field path="hdi" label={R.hdi} />
                <Field path="governmentType" label={R.government} />
                <Field path="workforceMinistry" label={R.labourAuthority} />
                <Field path="officialLanguage" label={R.language} />
                <div>
                  <div className="mb-1 flex items-center justify-between"><label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{R.flights}</label>
                    {aiSet.has('directFlight') && <VerifyPill path="directFlight" />}</div>
                  <Segmented value={!!data.directFlight} onChange={v => update('directFlight', v)} options={[{ v: true, label: R.yes }, { v: false, label: R.no }]} />
                </div>
                <Field path="unemploymentRate" label={R.unemployment} />
                <Field path="literacyRate" label={R.literacy} />
                <Field path="crimeRate" label={R.crime} />
                <Field path="totalWorkersInUae" label={R.nationalsInUae} hint={lang === 'ar' ? 'بيانات الوزارة — اتركه فارغاً لاستخدام الإجمالي من قسم القوى العاملة.' : 'MOHRE figure — leave empty to use the total from the Workforce section.'} />
              </div>
            </Card>
            <Card title={R.economy} block="profile.economy">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="gdp" label={R.gdp} />
                <Field path="economicStats.inflation" label={R.inflation} />
                <Field path="economicStats.remittancesFromUAE" label={R.remittances} />
                <Field path="economicStats.tipRank" label={R.tip} />
              </div>
            </Card>
            <Card title={ui.trade} block="profile.trade">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="economicStats.totalImportsFromUAE" label={R.uaeExportsTo(data.country || '…')} />
                <Field path="economicStats.totalExportsToUAE" label={R.uaeImportsFrom(data.country || '…')} />
                <Field path="economicStats.topImportProducts" list="lines" label={`${R.uaeExportsTo(data.country || '…')} — top 5`} />
                <Field path="economicStats.topExportProducts" list="lines" label={`${R.uaeImportsFrom(data.country || '…')} — top 5`} />
              </div>
            </Card>
            <Card title={R.education} block="profile.education">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="educationStats.higherEducationEnrollment" label={R.tertiary} />
                <Field path="educationStats.primaryEnrollment" label={R.primary} />
                <div className="md:col-span-2"><Field path="educationStats.topUniversities" list="lines" label={R.universities} /></div>
              </div>
            </Card>
          </div>
        );

      case 'uae': {
        const trend = data.uaeWorkforceStats.trend || [];
        const setTrend = (i: number, k: string, v: any) => update('uaeWorkforceStats.trend', trend.map((t, j) => j === i ? { ...t, [k]: v } : t));
        return (
          <div className="space-y-4">
            <Card title={ui.totals} block="uae.kpis">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="uaeWorkforceStats.mohre.totalPrivate.value" label={`${R.entMohre} — ${R.catWorkers}`} />
                <Field path="uaeWorkforceStats.mohre.totalDomestic.value" label={`${R.entMohre} — ${R.catDomestic}`} />
                <div className="md:col-span-2"><Field path="uaeWorkforceStats.icp.totalWorkers" label={`${R.entIcp} — ${R.catWorkers}`} /></div>
                <div>
                  <label className={labelCls}>{R.totalWorkforce}</label>
                  <div className="flex h-[38px] items-center rounded-lg bg-slate-100 px-3 text-sm font-bold text-[#0d2c4f] dark:bg-slate-800 dark:text-white">{facts.totalWorkforceInUAE ? Number(facts.totalWorkforceInUAE).toLocaleString('en-US') : '—'}</div>
                </div>
                <Field path="uaeWorkforceStats.totalWorkersOverride" type="number" label={ui.totalOverride} hint={ui.totalOverrideHint} />
                <Field path="uaeWorkforceStats.mohre.workersLaborStrikes" label={R.strikes} />
              </div>
            </Card>
            <Card title={ui.trend} hint={ui.trendHint} block="uae.trend">
              <div className="mb-1 grid grid-cols-[90px_1fr_1fr_1fr_28px] gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400"><span>{ui.year}</span><span>{ui.privateN}</span><span>{ui.domesticN}</span><span>{ui.totalN}</span><span /></div>
              <div className="space-y-1.5">
                {trend.map((t, i) => (
                  <div key={i} className="grid grid-cols-[90px_1fr_1fr_1fr_28px] items-center gap-2">
                    <input className={`${inputCls} py-1.5`} value={t.year} onChange={e => setTrend(i, 'year', e.target.value)} />
                    <input type="number" className={`${inputCls} py-1.5 text-end`} value={t.privateSector ?? ''} onChange={e => setTrend(i, 'privateSector', e.target.value === '' ? undefined : Number(e.target.value))} />
                    <input type="number" className={`${inputCls} py-1.5 text-end`} value={t.domestic ?? ''} onChange={e => setTrend(i, 'domestic', e.target.value === '' ? undefined : Number(e.target.value))} />
                    <input type="number" className={`${inputCls} py-1.5 text-end`} placeholder={String((t.privateSector || 0) + (t.domestic || 0) || '')} value={t.total ?? ''} onChange={e => setTrend(i, 'total', e.target.value === '' ? undefined : Number(e.target.value))} />
                    <button type="button" onClick={() => update('uaeWorkforceStats.trend', trend.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:text-red-600"><X size={15} /></button>
                  </div>
                ))}
              </div>
              {trend.length < 3 && <button type="button" onClick={() => update('uaeWorkforceStats.trend', [...trend, { year: String((Number(trend[trend.length - 1]?.year) || new Date().getFullYear() - 1) + 1) }])} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#24527f] hover:underline dark:text-sky-300"><Plus size={14} />{ui.add}</button>}
            </Card>
            <Card title={ui.protection} block="uae.protection">
              <div className="grid grid-cols-[1.6fr_1fr_70px_1fr_70px] gap-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span>{R.indicator}</span><span>{R.covered}</span><span>%</span><span>{R.notCovered}</span><span>%</span>
              </div>
              <ProtectionRow label={R.unempIns} cn="insuranceUnemploymentCoveredNum" cp="insuranceUnemploymentCoveredPct" nn="insuranceUnemploymentExposedNum" np="insuranceUnemploymentExposedPct" />
              <ProtectionRow label={R.rightsIns} cn="insuranceRightsCoveredNum" cp="insuranceRightsCoveredPct" nn="insuranceRightsExposedNum" np="insuranceRightsExposedPct" />
              <ProtectionRow label={R.wps} cn="wpsWageTransferNum" cp="wpsWageTransferPct" />
            </Card>
            <Card title={ui.highlights} hint={ui.hlHint}>
              <div className="space-y-2.5">
                {[['uae.distTakeaways', ui.hlDist], ['uae.wageTakeaways', ui.hlWage]].map(([k, l]) => (
                  <label key={k} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <span>{l}</span><Switch on={!hiddenSet.has(k)} onClick={() => toggleSection(k)} label={l} />
                  </label>
                ))}
              </div>
            </Card>
            <Card title={ui.wages} block="uae.wagesSkill">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="uaeWorkforceStats.mohre.skilledPartnerWage" label={`${R.skilled} — ${R.nationals(data.country || '…')}`} />
                <Field path="uaeWorkforceStats.mohre.skilledUaeWage" label={`${R.skilled} — ${R.market}`} />
                <Field path="uaeWorkforceStats.mohre.unskilledPartnerWage" label={`${R.unskilled} — ${R.nationals(data.country || '…')}`} />
                <Field path="uaeWorkforceStats.mohre.unskilledUaeWage" label={`${R.unskilled} — ${R.market}`} />
              </div>
            </Card>
            <Card title={ui.emirates} block="uae.emirates">
              <div className="grid gap-6 lg:grid-cols-2">
                <div><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">MOHRE</div>
                  <div className="space-y-1.5">{EMIRATES.map(e => { const i = mohre.byEmirate.findIndex(x => x.name === e); return <NumRow key={e} label={e} path={`uaeWorkforceStats.mohre.byEmirate.${i}.value`} />; })}</div></div>
                <div><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">ICP</div>
                  <div className="space-y-1.5">{EMIRATES.map(e => { const i = data.uaeWorkforceStats.icp.byEmirate.findIndex(x => x.name === e); return <NumRow key={e} label={e} path={`uaeWorkforceStats.icp.byEmirate.${i}.value`} />; })}</div></div>
              </div>
            </Card>
            <Card title={ui.sectorsAll} block="uae.sectors">
              <div className="grid gap-6 lg:grid-cols-2">
                <div><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">MOHRE</div><NameValueEditor path="uaeWorkforceStats.mohre.bySector" nameLabel={ui.sector} valueLabel={ui.value} /></div>
                <div><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">ICP</div><NameValueEditor path="uaeWorkforceStats.icp.bySector" nameLabel={ui.sector} valueLabel={ui.value} /></div>
              </div>
            </Card>
            <Card title={ui.salary} block="uae.wagesSector" right={!(data.uaeWorkforceStats.salaryBySector || []).length ? (
              <button type="button" onClick={() => update('uaeWorkforceStats.salaryBySector', STD_SECTORS.map(n => ({ name: n, uaeValue: 0, partnerValue: 0 })))} className="text-sm font-semibold text-[#24527f] hover:underline dark:text-sky-300">{ui.addStdSectors}</button>) : undefined}>
              <div className="mb-1 grid grid-cols-[1fr_120px_120px_28px] gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400"><span>{ui.sector}</span><span>{ui.market}</span><span>{ui.nationals}</span><span /></div>
              <div className="space-y-1.5">
                {(data.uaeWorkforceStats.salaryBySector || []).map((s, i, arr) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_120px_28px] items-center gap-2">
                    <input className={`${inputCls} py-1.5`} value={s.name} onChange={e => update('uaeWorkforceStats.salaryBySector', arr.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} />
                    <input type="number" className={`${inputCls} py-1.5 text-end`} value={s.uaeValue || ''} onChange={e => update('uaeWorkforceStats.salaryBySector', arr.map((x, k) => k === i ? { ...x, uaeValue: Number(e.target.value) } : x))} />
                    <input type="number" className={`${inputCls} py-1.5 text-end`} value={s.partnerValue || ''} onChange={e => update('uaeWorkforceStats.salaryBySector', arr.map((x, k) => k === i ? { ...x, partnerValue: Number(e.target.value) } : x))} />
                    <button type="button" onClick={() => update('uaeWorkforceStats.salaryBySector', arr.filter((_, k) => k !== i))} className="rounded p-1 text-slate-400 hover:text-red-600"><X size={15} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => update('uaeWorkforceStats.salaryBySector', [...(data.uaeWorkforceStats.salaryBySector || []), { name: '', uaeValue: 0, partnerValue: 0 }])} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#24527f] hover:underline dark:text-sky-300"><Plus size={14} />{ui.add}</button>
            </Card>
          </div>
        );
      }

      case 'partner':
        return (
          <div className="space-y-4">
            <Card title={ui.partnerFacts} block="partner.facts">
              <div className="grid gap-4 md:grid-cols-3">
                <Field path="workforceStats.totalWorkforce" label={R.labourForce} />
                <Field path="averageWage" label={R.avgWage} />
                <Field path="minimumWage" label={R.minWage} />
              </div>
            </Card>
            <Card title={ui.gender} block="partner.gender">
              <div className="grid gap-4 md:grid-cols-2">
                <Field path="workforceStats.participationMale" type="number" label={`${R.men} (%)`} />
                <Field path="workforceStats.participationFemale" type="number" label={`${R.women} (%)`} />
              </div>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title={R.destinations} block="partner.destinations"><NameValueEditor path="workforceStats.migrationDestinations" nameKey="country" valueKey="count" textValue nameLabel={ui.countryCol} valueLabel={ui.countCol} /></Card>
              <Card title={R.sectors} block="partner.sectors"><NameValueEditor path="workforceStats.topSectors" nameLabel={ui.sector} valueLabel="%" /></Card>
            </div>
            <Card title={R.skills} block="partner.skills"><Field path="workforceStats.availableSkills" list="lines" label={R.skills} /></Card>
          </div>
        );

      case 'relationship':
        return (
          <ListEditor ui={ui} items={data.recentInteractions} onChange={v => update('recentInteractions', v)} addLabel={ui.addEngagement} emptyText={ui.empty}
            make={() => ({ id: uuidv4(), title: '', date: new Date().toISOString().slice(0, 10), type: ui.typeSuggestions[0], details: '', party: 'mohre' as const })}
            render={(it, set) => (
              <div className="grid gap-3 md:grid-cols-[150px_1fr]">
                <div><label className={labelCls}>{R.colDate}</label><input type="date" className={inputCls} value={it.date} onChange={e => set({ date: e.target.value })} /></div>
                <div><label className={labelCls}>{ui.titleCol}</label><input dir={contentDir} className={inputCls} value={it.title} onChange={e => set({ title: e.target.value })} /></div>
                <div>
                  <label className={labelCls}>{ui.party}</label>
                  <Segmented value={it.party || 'mohre'} onChange={v => set({ party: v })} options={[{ v: 'mohre', label: ui.partyMohre }, { v: 'uae_gov', label: ui.partyGov }]} />
                </div>
                <div>
                  <label className={labelCls}>{ui.typeCol}</label>
                  <input dir={contentDir} list="engagement-types" className={inputCls} value={it.type} onChange={e => set({ type: e.target.value })} />
                </div>
                <div className="md:col-span-2"><label className={labelCls}>{ui.details}</label><RichArea dir={contentDir} rows={4} value={it.details} onChange={v => set({ details: v })} /></div>
              </div>
            )} />
        );

      case 'points':
        return (
          <ListEditor ui={ui} items={data.pointsOfDiscussion} onChange={v => update('pointsOfDiscussion', v)} addLabel={ui.addPoint} emptyText={ui.empty}
            make={() => ({ id: uuidv4(), title: '', content: '' })}
            render={(it, set) => (
              <div className="space-y-3">
                <div><label className={labelCls}>{ui.titleCol}</label><input dir={contentDir} className={inputCls} value={it.title} onChange={e => set({ title: e.target.value })} /></div>
                <div><label className={labelCls}>{ui.content}</label><RichArea dir={contentDir} rows={4} value={it.content} onChange={v => set({ content: v })} /></div>
              </div>
            )} />
        );

      case 'updates':
        return (
          <ListEditor ui={ui} items={data.previousAgreementsAndUpdates || []} onChange={v => update('previousAgreementsAndUpdates', v)} addLabel={ui.addUpdate} emptyText={ui.empty}
            make={() => ({ id: uuidv4(), title: '', content: '', status: 'pending' as const })}
            render={(it, set) => (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div><label className={labelCls}>{ui.titleCol}</label><input dir={contentDir} className={inputCls} value={it.title} onChange={e => set({ title: e.target.value })} /></div>
                  <div><label className={labelCls}>{ui.status}</label><Segmented value={it.status || 'pending'} onChange={v => set({ status: v })} options={[{ v: 'pending', label: ui.pending }, { v: 'done', label: ui.done }]} /></div>
                </div>
                <div><label className={labelCls}>{ui.content}</label><RichArea dir={contentDir} rows={3} value={it.content} onChange={v => set({ content: v })} /></div>
              </div>
            )} />
        );

      case 'agreements':
        return (
          <ListEditor ui={ui} items={data.bilateralAgreements} onChange={v => update('bilateralAgreements', v)} addLabel={ui.addAgreement} emptyText={ui.empty}
            make={() => ({ title: '', date: '', status: 'active' as const, summary: '', party: 'mohre' as const })}
            render={(it, set) => (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr_170px]">
                  <div><label className={labelCls}>{R.colAgreement}</label><input dir={contentDir} className={inputCls} value={it.title} onChange={e => set({ title: e.target.value })} /></div>
                  <div><label className={labelCls}>{R.colDate}</label><input type="date" className={inputCls} value={it.date} onChange={e => set({ date: e.target.value })} /></div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div><label className={labelCls}>{ui.isMohre}</label><Segmented value={it.party || 'mohre'} onChange={v => set({ party: v })} options={[{ v: 'mohre', label: ui.mohreAgr }, { v: 'uae_gov', label: ui.govAgr }]} /></div>
                  <div><label className={labelCls}>{ui.status}</label><Segmented value={it.status === 'pending' ? 'pending' : 'active'} onChange={v => set({ status: v })} options={[{ v: 'active', label: ui.active }, { v: 'pending', label: R.pending }]} /></div>
                </div>
                <div><label className={labelCls}>{ui.summaryCol}</label><RichArea dir={contentDir} rows={3} value={it.summary} onChange={v => set({ summary: v })} /></div>
              </div>
            )} />
        );

      case 'delegations':
        return (
          <ListEditor ui={ui} items={data.delegations.partner} onChange={v => update('delegations.partner', v)} addLabel={ui.addMember} emptyText={ui.empty}
            make={() => ({ id: uuidv4(), name: '', title: '', imageUrl: '', bio: '', metBefore: false, metWhen: '', metShow: true })}
            render={(d, set) => (
              <div className="grid gap-4 md:grid-cols-[110px_1fr]">
                <label className="flex h-[136px] w-[110px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 hover:border-[#24527f] dark:border-slate-600 dark:bg-slate-800">
                  {d.imageUrl ? <img src={d.imageUrl} className="h-full w-full object-cover" alt="" /> : <><UploadCloud size={20} /><span className="mt-1">{ui.photo}</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readImage(f, u => set({ imageUrl: u })); }} />
                </label>
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><label className={labelCls}>{ui.name}</label><input dir={contentDir} className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} /></div>
                    <div><label className={labelCls}>{ui.role}</label><input dir={contentDir} className={inputCls} value={d.title} onChange={e => set({ title: e.target.value })} /></div>
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div><label className={labelCls}>{ui.metBefore}</label><Segmented value={!!d.metBefore} onChange={v => set({ metBefore: v })} options={[{ v: true, label: ui.yes }, { v: false, label: ui.no }]} /></div>
                    {!d.metBefore && (
                      <label className="flex cursor-pointer items-center gap-2.5 pb-1.5" title={ui.metShowHint}>
                        <button type="button" role="switch" aria-checked={d.metShow !== false} onClick={() => set({ metShow: d.metShow === false })}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${d.metShow !== false ? 'bg-[#0d2c4f]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.metShow !== false ? 'start-[22px]' : 'start-0.5'}`} />
                        </button>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{ui.metShow}</span>
                      </label>
                    )}
                    {d.metBefore && <div className="min-w-[220px] flex-1"><label className={labelCls}>{ui.metWhen}</label><input dir={contentDir} className={inputCls} value={d.metWhen || ''} placeholder={lang === 'ar' ? 'اجتماع اللجنة المشتركة، مارس 2026' : 'JCM, March 2026'} onChange={e => set({ metWhen: e.target.value })} /></div>}
                  </div>
                  <div><label className={labelCls}>{ui.bio}</label><RichArea dir={contentDir} rows={3} value={d.bio} onChange={v => set({ bio: v })} /></div>
                </div>
              </div>
            )} />
        );
    }
    return null;
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-[#24527f]" /></div>;

  const previewReport: Report = buildReport(status);
  const sectionAi = current.id === 'profile' ? aiIn(profilePaths) : current.id === 'partner' ? aiIn(partnerPaths) : current.id === 'summary' ? aiIn(['executiveSummary', 'keyMessages']) : [];

  return (
    <BuilderCtx.Provider value={{ data, update, verify, aiSet, dir: contentDir, ui, hidden: hiddenSet, toggle: toggleSection }}>
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col bg-slate-50 md:-m-8 dark:bg-slate-950">
      <datalist id="engagement-types">{ui.typeSuggestions.map(t => <option key={t} value={t} />)}</datalist>

      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => navigate('/reports')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft size={16} className="rtl:rotate-180" />{ui.back}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-[#0d2c4f] dark:text-white">{title || data.country || ui.untitled}</div>
          <div className="text-xs text-slate-500">
            {status === 'completed' ? <span className="font-semibold text-emerald-600">● {ui.completed}</span> : <span>● {ui.draft}</span>}
            {' · '}{saving === 'saving' ? ui.saving : saving === 'saved' ? ui.saved : dirty ? ui.unsaved : ''}
          </div>
        </div>
        {aiSet.size > 0 && <span className="hidden items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 md:inline-flex dark:bg-amber-900/40 dark:text-amber-200"><Sparkles size={12} />{ui.aiPending(aiSet.size)}</span>}
        <button onClick={() => setShowPreview(p => !p)} className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:inline-flex dark:border-slate-600 dark:text-slate-200">
          {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}{showPreview ? ui.hidePreview : ui.preview}
        </button>
        <button onClick={() => save()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"><Save size={15} />{ui.save}</button>
        <button onClick={openPdf} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"><FileDown size={15} />{ui.pdf}</button>
        <button onClick={() => complete()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d2c4f] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#24527f]"><CheckCircle2 size={15} />{ui.complete}</button>
      </header>

      {(error || confirmComplete || overflow.length > 0) && (
        <div className="space-y-1 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
          {error && <div className="flex items-center gap-2 text-sm text-red-700"><AlertTriangle size={15} />{error}<button className="ms-auto text-slate-400" onClick={() => setError(null)}><X size={14} /></button></div>}
          {confirmComplete && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-amber-800"><AlertTriangle size={15} />{ui.completeWarn(aiSet.size)}
              <button onClick={() => complete(true)} className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">{ui.completeAnyway}</button>
              <button onClick={() => setConfirmComplete(false)} className="text-xs font-semibold text-slate-500">{ui.cancel}</button>
            </div>
          )}
          {overflow.length > 0 && <div className="flex items-center gap-2 text-sm text-red-700"><AlertTriangle size={15} />{ui.overflow(overflow)}</div>}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Section nav */}
        <nav data-builder-nav className="hidden w-64 shrink-0 overflow-y-auto border-e border-slate-200 bg-white p-3 md:block dark:border-slate-800 dark:bg-slate-900">
          {SECTIONS.map((s, i) => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`mb-1 flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-start transition ${section === s.id ? 'bg-[#0d2c4f] text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              {hiddenSet.has(s.id) ? <EyeOff size={16} className="mt-0.5 shrink-0 opacity-60" /> : <s.icon size={16} className="mt-0.5 shrink-0 opacity-80" />}
              <span className={`min-w-0 flex-1 ${hiddenSet.has(s.id) && section !== s.id ? 'opacity-50' : ''}`}>
                <span className={`block truncate text-[13px] font-semibold ${hiddenSet.has(s.id) ? 'line-through decoration-1' : ''}`}>{s.page ? `${s.page}. ` : ''}{s.title}</span>
                <span className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${section === s.id ? 'text-white/70' : 'text-slate-400'}`}>
                  {hiddenSet.has(s.id) ? <b className="font-bold">{ui.hiddenTag}</b> : <>{ui.src[s.source]}{s.done && <> · {s.done}</>}</>}
                </span>
              </span>
              {!!s.ai && <span className="mt-0.5 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">{s.ai}</span>}
            </button>
          ))}
        </nav>

        {/* Form */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
            <select className={`${inputCls} mb-4 md:hidden`} value={section} onChange={e => setSection(e.target.value as SecId)}>
              {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2"><SrcChip kind={current.source} label={ui.src[current.source]} />{current.page && <span className="text-xs text-slate-400">{ui.pageN(current.page)}</span>}</div>
                <h1 className="text-xl font-bold text-[#0d2c4f] dark:text-white">{current.title}</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-500">{current.id === 'setup' ? ui.setupLede : ui.srcHint[current.source]}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
              {current.id !== 'setup' && (
                <label className="flex cursor-pointer items-center gap-2.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{ui.include}</span>
                  <button data-section-toggle type="button" role="switch" aria-checked={!hiddenSet.has(current.id)} onClick={() => toggleSection(current.id)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${!hiddenSet.has(current.id) ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${!hiddenSet.has(current.id) ? 'start-[22px]' : 'start-0.5'}`} />
                  </button>
                </label>
              )}
              {(current.id === 'profile' || current.id === 'partner') && !hiddenSet.has(current.id) && (
                <div className="flex flex-col items-end gap-1.5">
                  <button data-ai-fetch type="button" disabled={!!busy} onClick={() => runFetch(current.id as 'profile' | 'partner')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60">
                    {busy === current.id ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {busy === current.id ? ui.fetching : (current.done.startsWith('0/') ? ui.fetchAI : ui.refetchAI)}
                  </button>
                  {sectionAi.length > 0 && <button type="button" onClick={() => verify(sectionAi)} className="text-xs font-semibold text-amber-700 hover:underline">{ui.verifyAll} ({sectionAi.length})</button>}
                </div>
              )}
              </div>
            </div>
            {current.id !== 'setup' && hiddenSet.has(current.id) && <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"><EyeOff size={16} className="mt-0.5 shrink-0" />{ui.hiddenNote}</div>}
            {current.source === 'ai' && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">{ui.aiKeepNote}</p>}

            {renderSection()}

            <div className="mt-6 flex justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <button disabled={currentIdx === 0} onClick={() => setSection(SECTIONS[currentIdx - 1].id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"><ChevronLeft size={16} className="rtl:rotate-180" />{SECTIONS[currentIdx - 1]?.title || ''}</button>
              <button disabled={currentIdx === SECTIONS.length - 1} onClick={() => setSection(SECTIONS[currentIdx + 1].id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#24527f] hover:bg-slate-100 disabled:opacity-30 dark:text-sky-300 dark:hover:bg-slate-800">{SECTIONS[currentIdx + 1]?.title || ''}<ChevronRight size={16} className="rtl:rotate-180" /></button>
            </div>
          </div>
        </main>

        {/* Live preview */}
        {showPreview && (
          <aside ref={previewBox} className="hidden w-[44%] max-w-[720px] shrink-0 overflow-y-auto border-s border-slate-200 bg-slate-200/70 p-4 lg:block dark:border-slate-800 dark:bg-slate-900">
            <div style={{ height: innerH * scale, position: 'relative' }}>
              <div ref={previewInner} style={{ width: 794, transform: `scale(${scale})`, transformOrigin: uiLang === 'ar' ? 'top right' : 'top left', position: 'absolute', top: 0, [uiLang === 'ar' ? 'right' : 'left']: 0 }}>
                <ReportDocument report={previewReport} lang={lang} onOverflow={p => setOverflow(prev => (prev.join() === p.join() ? prev : p))} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
    </BuilderCtx.Provider>
  );
}
