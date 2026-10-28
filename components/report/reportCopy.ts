/* Report copy (EN / AR) and formatting helpers shared by the report renderer and the builder. */

export type Lang = 'en' | 'ar';

export const COPY = {
  en: {
    ministry: 'Ministry of Human Resources & Emiratisation',
    dept: 'International Relations Department',
    reportTitle: 'Workforce Cooperation Status Report',
    eyebrow: 'Bilateral Brief',
    subtitle: (c: string) => `Labour relations between the United Arab Emirates and ${c}: country profile, workforce data, engagement history and agreements in force.`,
    partnerCountry: 'Partner country',
    reference: 'Reference',
    reportDate: 'Report date',
    preparedBy: 'Prepared by',
    classification: 'Classification',
    restricted: 'Restricted',
    restrictedLong: 'Restricted — official use',
    contents: 'Contents',
    generated: 'Issued',
    page: (n: number, total: number) => `Page ${n} of ${total}`,
    continued: '(continued)',
    noData: 'No data recorded.',

    summary: 'Executive Summary',
    summaryLede: 'Key figures and messages for decision-makers',
    keyMessages: 'Key messages',
    objectives: 'Main objectives of this meeting',
    lastInteractions: 'Last interactions',
    kindMeeting: 'Meeting',
    kindLetter: 'Letter',
    stDone: 'Done',
    stPending: 'Pending',
    summaryMissing: 'Executive summary not yet written.',
    trendTitle: 'MOHRE workers — last three years',
    since: (pct: string, y: string) => `${pct} since ${y}`,
    mohreShort: 'Labour',
    icpShort: 'Domestic',
    mohreShortSub: 'MOHRE',
    vsYear: (y: string) => `vs ${y}`,
    baseYear: 'Base year',
    overallChange: 'Change over 3 years',
    moreWorkers: 'additional workers',
    glanceWorkers: 'Workforce in the UAE',
    glanceProtected: 'Paid through WPS',
    glanceAgreements: 'Active MOHRE agreements',
    glanceLast: 'Latest engagement',

    profile: 'Country Profile',
    profileLede: 'Key national indicators and labour-relations context',
    capital: 'Capital',
    population: 'Population',
    currency: 'Currency',
    hdi: 'Human Development Index',
    crime: 'Crime rate',
    literacy: 'Literacy rate',
    government: 'System of government',
    labourAuthority: 'Labour authority',
    language: 'Official language',
    flights: 'Direct flights to the UAE',
    yes: 'Available',
    no: 'Not available',
    nationalsInUae: 'Nationals working in the UAE',
    unemployment: 'Unemployment rate',
    economy: 'Economy & Trade',
    tip: 'TIP Report ranking',
    inflation: 'Inflation',
    gdp: 'GDP',
    remittances: 'Annual remittances from the UAE',
    tradeTitle: 'Bilateral trade',
    uaeExportsTo: (c: string) => `UAE exports to ${c}`,
    uaeImportsFrom: (c: string) => `UAE imports from ${c}`,
    education: 'Education',
    tertiary: 'Tertiary enrolment',
    primary: 'Primary enrolment',
    universities: 'Leading universities',

    uaeWorkforce: 'Workforce in the UAE',
    uaeWorkforceLede: (c: string, d: string) => `${c} nationals in the UAE labour market · data as of ${d}`,
    uaeCont: 'Where they work — by emirate and sector',
    totalWorkforce: 'Total workforce in the UAE',
    privateSector: 'Total labour — MOHRE',
    domestic: 'Total domestic — MOHRE',
    icpWorkers: 'ICP',
    totalFormula: 'MOHRE labour + MOHRE domestic + ICP',
    entMohre: 'Ministry of Human Resources and Emiratisation',
    entIcp: 'Federal Authority for Identity, Citizenship, Customs and Port Security',
    catWorkers: 'Workers',
    catDomestic: 'Domestic workers',
    catAllMohre: 'Workers incl. domestic workers',
    protection: 'Worker protection indicators',
    indicator: 'Indicator',
    covered: 'Covered',
    notCovered: 'Not covered',
    share: 'Coverage',
    unempIns: 'Unemployment insurance scheme',
    rightsIns: 'Worker rights insurance scheme',
    wps: 'Wages paid through WPS (last 3 months)',
    strikes: 'Workers involved in labour strikes (current year)',
    wagesBySkill: 'Median monthly wage by skill level',
    skillLevel: 'Skill level',
    nationals: (c: string) => `${c} nationals`,
    market: 'Labour market (all)',
    gap: 'Difference',
    skilled: 'Skilled',
    unskilled: 'Unskilled',
    byEmirateMohre: 'Workers by emirate — MOHRE',
    byEmirateIcp: 'Workers by emirate — ICP',
    bySectorMohre: 'Workers by sector — MOHRE',
    bySectorIcp: 'Workers by sector — ICP',
    other: 'Other',
    salaryTitle: (c: string) => `Median monthly wage by sector — ${c} nationals vs. labour market`,
    marketMedian: 'Labour market median',
    sectorCol: 'Sector',
    emirateCol: 'Emirate',
    byEmirate: 'Workers by emirate',
    bySector: 'Workers by sector',
    tkEmirate: 'Largest emirate',
    tkSector: 'Largest sector',
    tkOfMohre: 'of MOHRE workers',
    tkWage: 'Average wage gap',
    tkTop3: 'Top 3 emirates',
    tkWidest: 'Widest gap',
    tkClosest: 'Closest to market',
    vs: 'vs',
    aed: 'AED',
    wagesLede: (c: string) => `Wages of ${c} nationals compared with the UAE labour market`,
    tkWageSub: (b: number, n: number) => `vs. labour-market median · below market in ${b} of ${n} sectors`,
    salaryHow: (c: string) => `Monthly median wage in AED. Difference = how much ${c} nationals earn compared with the labour-market median in the same sector.`,

    partnerWorkforce: (c: string) => `Labour Market of ${c}`,
    partnerLede: 'Source-market capacity and outward labour migration',
    labourForce: 'Labour force',
    avgWage: 'Average monthly wage',
    minWage: 'Minimum monthly wage',
    gender: 'Labour force participation by gender',
    men: 'Men',
    women: 'Women',
    destinations: 'Main destinations for migrant workers',
    sectors: 'Employment by sector',
    skills: 'Skills available for overseas employment',
    skillsNote: 'Indicative occupational categories available for external employment, based on current education and vocational-training output.',

    relationship: 'Relationship Summary',
    relationshipLede: 'Recent engagements, most recent first',
    relCount: (n: number, m: number, g: number) => `${n} engagements · ${m} at MOHRE level · ${g} at UAE Government level`,
    partyMohre: 'MOHRE',
    partyGov: 'UAE Government',
    points: 'Points for Discussion',
    pointsLede: 'Proposed agenda items for the upcoming engagement',
    updates: 'Previous Agreements & Work Updates',
    updatesLede: 'Outcomes agreed in earlier meetings and their current status',
    agreements: 'Bilateral Agreements & MoUs',
    agreementsLede: 'Formal instruments between the two sides, most recent first',
    colAgreement: 'Agreement',
    colDate: 'Date',
    colSummary: 'Summary',
    colStatus: 'Status',
    active: 'Active',
    pending: 'Pending',
    noAgreements: 'No formal agreements on record.',
    delegations: 'Delegations',
    delegationsLede: 'Members of the partner delegation',
    metBefore: 'Met before',
    metYes: (w: string) => `Yes${w ? ` — ${w}` : ''}`,
    metNo: 'No — first meeting',
    done: 'Done',
    inProgress: 'Pending',
    signedBy: 'Signed by',
    uaeDelegation: 'UAE delegation',
    partnerDelegation: (c: string) => `${c} delegation`,

    src: {
      wb: 'World Bank', comtrade: 'UN Comtrade', unesco: 'UNESCO', tip: 'US TIP Report',
      mohre: 'MOHRE', mohreIcp: 'MOHRE & ICP', cbuae: 'Central Bank of the UAE', source: 'Source',
    },
    notFound: 'Report not found',
    notFoundMsg: 'The report could not be found or has been deleted.',
    loading: 'Preparing report…',
    print: 'Print / Save PDF',
    switchLang: 'العربية',
  },
  ar: {
    ministry: 'وزارة الموارد البشرية والتوطين',
    dept: 'إدارة العلاقات الدولية',
    reportTitle: 'تقرير الوضع الحالي للتعاون في مجال القوى العاملة',
    eyebrow: 'موجز ثنائي',
    subtitle: (c: string) => `علاقات العمل بين دولة الإمارات العربية المتحدة و${c}: الملف التعريفي للدولة، وبيانات القوى العاملة، وسجل التواصل، والاتفاقيات النافذة.`,
    partnerCountry: 'الدولة الشريكة',
    reference: 'الرقم المرجعي',
    reportDate: 'تاريخ التقرير',
    preparedBy: 'إعداد',
    classification: 'التصنيف',
    restricted: 'مقيّد',
    restrictedLong: 'رسمي / مقيّد',
    contents: 'المحتويات',
    generated: 'تاريخ الإصدار',
    page: (n: number, total: number) => `صفحة ${n} من ${total}`,
    continued: '(تابع)',
    noData: 'لا تتوفر بيانات.',

    summary: 'الملخص التنفيذي',
    summaryLede: 'أبرز الأرقام والرسائل لمتخذي القرار',
    keyMessages: 'الرسائل الرئيسية',
    objectives: 'الأهداف الرئيسية لهذا الاجتماع',
    lastInteractions: 'آخر التواصلات',
    kindMeeting: 'اجتماع',
    kindLetter: 'رسالة',
    stDone: 'منجز',
    stPending: 'قيد المتابعة',
    summaryMissing: 'لم تتم كتابة الملخص التنفيذي بعد.',
    trendTitle: 'عمالة الوزارة خلال السنوات الثلاث الأخيرة',
    since: (pct: string, y: string) => `${pct} منذ ${y}`,
    mohreShort: 'العمالة',
    icpShort: 'المساعدة',
    mohreShortSub: 'الوزارة',
    vsYear: (y: string) => `مقارنةً بعام ${y}`,
    baseYear: 'سنة الأساس',
    overallChange: 'التغير خلال 3 سنوات',
    moreWorkers: 'عامل إضافي',
    glanceWorkers: 'العمالة في دولة الإمارات',
    glanceProtected: 'الأجور عبر نظام حماية الأجور',
    glanceAgreements: 'اتفاقيات الوزارة السارية',
    glanceLast: 'آخر تواصل',

    profile: 'الملف التعريفي للدولة',
    profileLede: 'أبرز المؤشرات الوطنية وسياق علاقات العمل',
    capital: 'العاصمة',
    population: 'عدد السكان',
    currency: 'العملة',
    hdi: 'مؤشر التنمية البشرية',
    crime: 'معدل الجريمة',
    literacy: 'معدل الإلمام بالقراءة والكتابة',
    government: 'نظام الحكم',
    labourAuthority: 'الجهة المعنية بسوق العمل',
    language: 'اللغة الرسمية',
    flights: 'رحلات مباشرة مع الدولة',
    yes: 'متوفرة',
    no: 'غير متوفرة',
    nationalsInUae: 'عدد العاملين في دولة الإمارات',
    unemployment: 'معدل البطالة',
    economy: 'الاقتصاد والتجارة',
    tip: 'التصنيف في تقرير الاتجار بالأشخاص',
    inflation: 'معدل التضخم',
    gdp: 'الناتج المحلي الإجمالي',
    remittances: 'التحويلات المالية السنوية من الإمارات',
    tradeTitle: 'التبادل التجاري',
    uaeExportsTo: (c: string) => `صادرات الإمارات إلى ${c}`,
    uaeImportsFrom: (c: string) => `واردات الإمارات من ${c}`,
    education: 'التعليم',
    tertiary: 'نسبة الالتحاق بالتعليم العالي',
    primary: 'نسبة الالتحاق بالتعليم الابتدائي',
    universities: 'أبرز الجامعات',

    uaeWorkforce: 'القوى العاملة في دولة الإمارات',
    uaeWorkforceLede: (c: string, d: string) => `العمالة من ${c} في سوق العمل الإماراتي · البيانات حتى ${d}`,
    uaeCont: 'أماكن عملهم — حسب الإمارة والقطاع',
    totalWorkforce: 'إجمالي العمالة في الدولة',
    privateSector: 'العمالة — الوزارة',
    domestic: 'المساعدة — الوزارة',
    icpWorkers: 'الهوية والجنسية',
    totalFormula: 'الوزارة + المساعدة + الهوية',
    entMohre: 'وزارة الموارد البشرية والتوطين',
    entIcp: 'الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ',
    catWorkers: 'العمالة',
    catDomestic: 'العمالة المساعدة',
    catAllMohre: 'العمالة شاملةً العمالة المساعدة',
    protection: 'مؤشرات حماية العمال',
    indicator: 'المؤشر',
    covered: 'مشمول',
    notCovered: 'غير مشمول',
    share: 'نسبة التغطية',
    unempIns: 'نظام التأمين ضد التعطل عن العمل',
    rightsIns: 'نظام التأمين على حقوق العمالة',
    wps: 'الأجور عبر نظام حماية الأجور (3 أشهر)',
    strikes: 'المشاركون في إضرابات (هذا العام)',
    wagesBySkill: 'وسيط الأجر الشهري حسب المستوى المهاري',
    skillLevel: 'المستوى المهاري',
    nationals: (c: string) => `عمالة ${c}`,
    market: 'سوق العمل (الإجمالي)',
    gap: 'الفارق',
    skilled: 'ماهر',
    unskilled: 'غير ماهر',
    byEmirateMohre: 'توزيع العمال حسب الإمارة — الوزارة',
    byEmirateIcp: 'توزيع العمال حسب الإمارة — الهوية والجنسية',
    bySectorMohre: 'توزيع العمال حسب القطاع — الوزارة',
    bySectorIcp: 'توزيع العمال حسب القطاع — الهوية والجنسية',
    other: 'أخرى',
    salaryTitle: (c: string) => `وسيط الأجور الشهرية حسب القطاع — عمالة ${c} مقارنةً بسوق العمل`,
    marketMedian: 'وسيط سوق العمل',
    sectorCol: 'القطاع',
    emirateCol: 'الإمارة',
    byEmirate: 'توزيع العمال حسب الإمارة',
    bySector: 'توزيع العمال حسب القطاع',
    tkEmirate: 'الإمارة الأعلى',
    tkSector: 'القطاع الأعلى',
    tkOfMohre: 'من عمالة الوزارة',
    tkWage: 'متوسط فجوة الأجور',
    tkTop3: 'أعلى 3 إمارات',
    tkWidest: 'الفجوة الأكبر',
    tkClosest: 'الأقرب للسوق',
    vs: 'مقابل',
    aed: 'درهم',
    wagesLede: (c: string) => `أجور عمالة ${c} مقارنةً بسوق العمل في الدولة`,
    tkWageSub: (b: number, n: number) => `مقارنةً بوسيط سوق العمل · أقل من السوق في ${b} من ${n} قطاعات`,
    salaryHow: (c: string) => `وسيط الأجر الشهري بالدرهم. الفارق = أجر عمالة ${c} مقارنةً بوسيط سوق العمل في القطاع نفسه.`,

    partnerWorkforce: (c: string) => `سوق العمل في ${c}`,
    partnerLede: 'قدرات سوق المصدر واتجاهات هجرة العمالة',
    labourForce: 'إجمالي القوى العاملة',
    avgWage: 'متوسط الأجر الشهري',
    minWage: 'الحد الأدنى للأجر الشهري',
    gender: 'المشاركة في القوى العاملة حسب الجنس',
    men: 'الذكور',
    women: 'الإناث',
    destinations: 'وجهات العمل الرئيسية',
    sectors: 'التوظيف حسب القطاع',
    skills: 'المهارات المتاحة للعمل في الخارج',
    skillsNote: 'تمثل هذه المهارات الفئات الرئيسية للعمالة المتاحة للعمل خارجياً بناءً على مخرجات التعليم والتدريب المهني الحالية.',

    relationship: 'ملخص العلاقة',
    relationshipLede: 'أبرز أوجه التواصل، مرتبة من الأحدث إلى الأقدم',
    relCount: (n: number, m: number, g: number) => `${n} من أوجه التواصل · ${m} على مستوى الوزارة · ${g} على مستوى حكومة الإمارات`,
    partyMohre: 'الوزارة',
    partyGov: 'حكومة الإمارات',
    points: 'محاور النقاش',
    pointsLede: 'المحاور المقترحة للقاء المرتقب',
    updates: 'أبرز ما تم الاتفاق عليه خلال الاجتماعات السابقة ومستجدات العمل',
    updatesLede: 'مخرجات الاجتماعات السابقة وما آلت إليه',
    agreements: 'الاتفاقيات ومذكرات التفاهم الرئيسية',
    agreementsLede: 'الأدوات الرسمية الموقعة بين الجانبين، مرتبة من الأحدث',
    colAgreement: 'الاتفاقية',
    colDate: 'التاريخ',
    colSummary: 'الملخص',
    colStatus: 'الحالة',
    active: 'سارية',
    pending: 'قيد الإجراء',
    noAgreements: 'لا توجد اتفاقيات رسمية مسجلة.',
    delegations: 'الوفود',
    delegationsLede: 'أعضاء وفد الدولة الشريكة',
    metBefore: 'سبق اللقاء',
    metYes: (w: string) => `نعم${w ? ` — ${w}` : ''}`,
    metNo: 'لا — أول لقاء',
    done: 'منجز',
    inProgress: 'قيد المتابعة',
    signedBy: 'الجهة الموقعة',
    uaeDelegation: 'وفد دولة الإمارات',
    partnerDelegation: (c: string) => `وفد ${c}`,

    src: {
      wb: 'البنك الدولي', comtrade: 'كومتريد', unesco: 'اليونسكو', tip: 'تقرير الاتجار بالأشخاص',
      mohre: 'بيانات الوزارة', mohreIcp: 'الوزارة والهوية والجنسية', cbuae: 'مصرف الإمارات المركزي', source: 'المصدر',
    },
    notFound: 'التقرير غير موجود',
    notFoundMsg: 'تعذّر العثور على التقرير أو ربما تم حذفه.',
    loading: 'جارٍ إعداد التقرير…',
    print: 'طباعة / حفظ PDF',
    switchLang: 'English',
  },
};
export type Copy = typeof COPY.en;

export const MONTHS: Record<Lang, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export const SOURCE_URLS: Record<string, string> = {
  wb: 'https://data.worldbank.org',
  comtrade: 'https://comtradeplus.un.org',
  unesco: 'https://uis.unesco.org',
  tip: 'https://www.state.gov/trafficking-in-persons-report/',
};

export const EMIRATES_AR: Record<string, string> = {
  'Abu Dhabi': 'أبوظبي', 'Dubai': 'دبي', 'Sharjah': 'الشارقة', 'Ajman': 'عجمان',
  'Umm Al Quwain': 'أم القيوين', 'Ras Al Khaimah': 'رأس الخيمة', 'Fujairah': 'الفجيرة',
};

export const SECTORS_EN_AR: Record<string, string> = {
  Construction: 'الإنشاءات', Retail: 'التجزئة', Services: 'الخدمات', Hospitality: 'الضيافة',
  Manufacturing: 'الصناعة', Transportation: 'النقل', Other: 'أخرى',
};
export const SECTORS_AR_EN: Record<string, string> = Object.fromEntries(
  Object.entries(SECTORS_EN_AR).map(([en, ar]) => [ar, en]).concat([['اخرى', 'Other']])
);

export const COUNTRY_AR: Record<string, string> = {
  india: 'الهند', pakistan: 'باكستان', bangladesh: 'بنغلاديش', philippines: 'الفلبين', nepal: 'نيبال',
  'sri lanka': 'سريلانكا', egypt: 'مصر', uganda: 'أوغندا', kenya: 'كينيا', ethiopia: 'إثيوبيا',
  indonesia: 'إندونيسيا', vietnam: 'فيتنام', 'viet nam': 'فيتنام',
};

const FLAG_CODES: Record<string, string> = {
  india: 'in', 'الهند': 'in', pakistan: 'pk', 'باكستان': 'pk', bangladesh: 'bd', 'بنغلاديش': 'bd',
  philippines: 'ph', 'الفلبين': 'ph', nepal: 'np', 'نيبال': 'np', 'sri lanka': 'lk', 'سريلانكا': 'lk',
  egypt: 'eg', 'مصر': 'eg', uganda: 'ug', 'أوغندا': 'ug', kenya: 'ke', 'كينيا': 'ke',
  ethiopia: 'et', 'إثيوبيا': 'et', indonesia: 'id', 'إندونيسيا': 'id', vietnam: 'vn', 'فيتنام': 'vn',
  'viet nam': 'vn', ghana: 'gh', 'غانا': 'gh', nigeria: 'ng', 'نيجيريا': 'ng', morocco: 'ma', 'المغرب': 'ma',
  jordan: 'jo', 'الأردن': 'jo', thailand: 'th', 'تايلاند': 'th', china: 'cn', 'الصين': 'cn',
  uzbekistan: 'uz', 'أوزبكستان': 'uz', kazakhstan: 'kz', 'كازاخستان': 'kz', rwanda: 'rw', 'رواندا': 'rw',
};
export const flagFor = (country: string, custom?: string) => {
  if (custom) return custom;
  const code = FLAG_CODES[(country || '').toLowerCase().trim()];
  return code ? `https://flagcdn.com/w160/${code}.png` : '';
};

export const DASH = '—';
export const isBlank = (v: unknown) =>
  v === undefined || v === null || String(v).trim() === '' || String(v).trim().toLowerCase() === 'n/a';
export const show = (v: unknown) => (isBlank(v) ? DASH : String(v));

export const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? n : null;
};

export const fmtInt = (v: unknown) => {
  if (isBlank(v)) return DASH;
  if (typeof v === 'string' && /[a-zA-Z؀-ۿ%]/.test(v)) return v;
  const n = toNumber(v);
  return n === null ? String(v) : Math.round(n).toLocaleString('en-US');
};

export const fmtCompact = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const fmtPct = (v: unknown) => {
  if (isBlank(v) || String(v).trim() === '-' || String(v).trim() === '-%') return DASH;
  const s = String(v).trim();
  return s.endsWith('%') ? s : `${s}%`;
};

export const fmtChange = (from: number, to: number) => {
  if (!from) return '';
  const d = ((to - from) / from) * 100;
  const r = Math.abs(d) >= 10 ? Math.round(d) : Math.round(d * 10) / 10;
  return `${r > 0 ? '+' : ''}${r}%`;
};

export const withAed = (v: string | undefined, lang: Lang) => {
  if (isBlank(v)) return DASH;
  const s = String(v).trim();
  if (/aed|usd|\$|د\.إ|درهم/i.test(s)) return s;
  return lang === 'ar' ? `${fmtInt(s)} درهم` : `AED ${fmtInt(s)}`;
};

export const formatDayDate = (dateStr: string, lang: Lang) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
};

export const formatMonthYear = (dateStr: string | undefined, lang: Lang) => {
  if (!dateStr) return '';
  const m = dateStr.match(/^(\d{4})-(\d{2})/);
  if (m) return `${MONTHS[lang][parseInt(m[2], 10) - 1]} ${m[1]}`;
  return dateStr;
};
