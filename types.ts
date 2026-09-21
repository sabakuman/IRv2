export type Language = 'en' | 'ar';
export type ReportStatus = 'draft' | 'completed';
export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string;
  apiKey?: string; // Personal Gemini API Key
}

// Letter Log Module Types
export interface LetterLog {
  id: string;
  title: string;
  internal_ref: string;
  topic: string;
  external_ref: string;
  status: 'open' | 'closed';
  label: string;
  label_color: string;
  notes: string;
  attachment_url?: string;
  created_by: string; // User Name
  created_by_id: string; // User UUID
  created_at: string;
  updated_at: string;
}

export interface LetterLogNote {
  id: string;
  letter_id: string;
  note: string;
  created_by: string;
  created_by_id: string;
  created_at: string;
}

export interface Delegate {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  bio: string;
  metBefore?: boolean;
  meetingYear?: string;
  meetingLocation?: string;
}

export interface DateValue {
  value: string;
  date: string; // "As of..."
}

export interface LabelValue {
  name: string;
  value: number;
}

export interface SectorSalary {
  name: string;
  uaeValue: number;
  partnerValue: number;
}

export interface RecentInteraction {
  id: string;
  title: string;
  date: string;
  type: string; // e.g., "Meeting", "Visit", "Phone Call", "Correspondence"
  meetingType?: string; // e.g., "اللجنة المشتركة (JCM)", "اللجنة الوزارية / الفنية (TCM)", "اجتماع ثنائي", "أخرى"
  category?: 'UAE GOV' | 'MOHRE' | 'OTHER' | string;
  details: string; // Summary of the interaction
}

export interface PointOfDiscussion {
  id: string;
  title: string;
  content: string;
}

export interface PendingMatter {
  id: string;
  matter: string;
  dept: string;
  status?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url?: string; // Added for grounding support
}

export interface WorkersHistory {
  yearCurrent?: string;
  totalCurrent?: number;
  yearPrevious?: string;
  totalPrevious?: number;
  yearTwoYearsAgo?: string;
  totalTwoYearsAgo?: number;
}

export interface UaeWorkforceData {
  totalWorkersOverride?: number;
  workersHistory?: WorkersHistory;
  mohre: {
    totalPrivate: DateValue;
    totalDomestic: DateValue;
    unemploymentInsuranceCoverage?: DateValue;
    wpsWageTransferRate?: DateValue;
    insuranceUnemploymentCoveredNum?: string;
    insuranceUnemploymentCoveredPct?: string;
    insuranceUnemploymentExposedNum?: string;
    insuranceUnemploymentExposedPct?: string;
    insuranceRightsCoveredNum?: string;
    insuranceRightsCoveredPct?: string;
    insuranceRightsExposedNum?: string;
    insuranceRightsExposedPct?: string;
    wpsWageTransferNum?: string;
    wpsWageTransferPct?: string;
    wageMedianComparison?: string;
    workersLaborStrikes?: string;
    laborComplaintsUnderReview?: string;
    totalComplaintsCurrentYear?: string;
    skilledPartnerWage?: string;
    skilledUaeWage?: string;
    unskilledPartnerWage?: string;
    unskilledUaeWage?: string;
    byEmirate: LabelValue[]; // Abu Dhabi, Dubai, etc.
    bySector: LabelValue[];
  };
  icp: {
    byEmirate: LabelValue[];
    bySector: LabelValue[];
  };
  custom: Array<{
    id: string;
    label: string;
    value: string;
    date: string;
    isTotal: boolean; // For the mandatory "Total Workers in UAE"
  }>;
  salaryBySector?: SectorSalary[];
}

// Complex Report Structure
export interface ReportData {
  reportDate?: string; // Date of the report/meeting
  reportMonthYear?: string; // Month and Year (Arabic/English or input from user)
  meetingGoal?: string; // Goal / objective of the meeting (1-2 lines shown on Cover Page)
  flagUrl?: string; // Custom uploaded flag

  // Section 1: Country Profile & Diplomacy
  country: string;
  capital: string;
  officialLanguage: string;
  population: string;
  currency: string;
  gdp: string; // Generic GDP field
  hdi: string; // Human Development Index
  directFlight: boolean; // Yes/No
  uaeEmbassyLocation: string; // Location in that country
  foreignEmbassyLocation: string; // City in UAE
  totalWorkersInUae?: string;
  unemploymentRate?: string;
  
  // New Demographics
  crimeRate?: string;
  literacyRate?: string;
  governmentType?: string;
  workforceMinistry?: string;

  // Section 2: Workforce in UAE (NEW)
  uaeWorkforceStats: UaeWorkforceData;

  // Section 3: Partner Country Workforce & Economic Indicators
  averageWage: string;
  minimumWage: string;
  workforceStats: {
    totalWorkforce: string;
    participationMale: number;
    participationFemale: number;
    migrationDestinations: Array<{ country: string; count: string }>; 
    topSectors: Array<{ name: string; value: number }>; 
    availableSkills: string[]; 
  };

  // Section 4: Economy & Education
  economicStats: {
    inflation: string;
    gdp: string;
    totalExportsToUAE: string;
    totalImportsFromUAE: string;
    topExportProducts: string[];
    topImportProducts: string[];
    mainEconomicPartners: string[];
    tipRank: string; // Trafficking in Persons Rank
    remittancesFromUAE: string; // Specific to UAE
    remittancesGlobal: string; // NEW: Total global remittances
    customStats: Array<{ id: string; label: string; value: string }>;
  };
  
  educationStats: {
    topUniversities: string[];
    primaryEnrollment: string;
    higherEducationEnrollment: string;
  };

  // Section 5: Interactions & News (NEW)
  recentInteractions: RecentInteraction[];
  interactionSortOrder?: 'date_category' | 'category_date';
  pointsOfDiscussion: PointOfDiscussion[];
  previousAgreementsAndUpdates?: PointOfDiscussion[];
  relatedNews: NewsItem[];

  // Flexible Content
  customSections: Array<{
    id: string;
    title: string;
    content: string;
  }>;

  // Section 6: Relations
  bilateralAgreements: Array<{
    title: string;
    date: string;
    status: 'active' | 'pending' | 'custom';
    customStatusText?: string;
    summary: string;
  }>;
  
  keyIssues: string[];
  recommendations: string[];
  
  // Section 7: Delegations
  delegations: {
    uae: Delegate[];
    partner: Delegate[];
  };

  // Executive Brief & User Summary
  summary?: string; // Manual text user entered on input page
  lastCorrespondence?: {
    direction?: 'outgoing' | 'incoming' | string;
    date?: string;
    ref?: string;
    subject?: string;
    status?: 'awaiting_reply' | 'closed' | 'actioned' | string;
  };
  mouSignedWithMohre?: {
    signed?: 'yes' | 'no' | boolean | string;
    signedDate?: string;
    type?: 'domestic' | 'general' | 'both' | string;
  };
  lastMeeting?: {
    date?: string;
    type?: string;
    title?: string;
    coverage?: string;
    category?: 'MOHRE' | 'UAE GOV' | 'OTHER' | string;
  };
  executiveBriefMeetingIds?: string[]; // Multiple topic IDs selected from Relationship Summary to feature in Executive Brief
  executiveBriefMeetings?: RecentInteraction[]; // Customized meeting items specific to Executive Brief (Main Page), independent of Relationship Summary
  attentionNotes?: string[];
  pendingMatters?: PendingMatter[];
  pointsToFocusOn?: string[];
  sectionVisibility?: {
    cover?: boolean;
    executiveBrief?: boolean;
    profileEconomy?: boolean;
    uaeWorkforce?: boolean;
    partnerWorkforce?: boolean;
    interactions?: boolean;
    discussionPoints?: boolean;
    previousUpdates?: boolean;
    agreements?: boolean;
    delegation?: boolean;

    // Sub-sections inside pages:
    // Page 2: الإحاطة التنفيذية
    briefPointsToFocus?: boolean;
    briefLastMeetings?: boolean;
    briefLastCorrespondence?: boolean;
    executiveBriefPoints?: boolean;
    executiveBriefLastMeeting?: boolean;
    executiveBriefLastCorrespondence?: boolean;

    // Page 3: Profile & Economy
    demographics?: boolean;
    economicLandscape?: boolean;
    bilateralTrade?: boolean;
    educationInsights?: boolean;

    // Page 4: UAE Workforce
    uaeWorkforceKpis?: boolean;
    insuranceExposures?: boolean;
    laborComplaints?: boolean;
    threeYearTrend?: boolean;
    emiratesDistribution?: boolean;
    sectorsChart?: boolean;
    salaryChart?: boolean;

    // Page 5: Partner Workforce
    partnerWorkforceKpis?: boolean;
    migrationDestinations?: boolean;
    partnerSectors?: boolean;
    availableSkills?: boolean;

    // Delegations
    uaeDelegation?: boolean;
    partnerDelegation?: boolean;

    [key: string]: boolean | undefined;
  };
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  status: ReportStatus;
  updatedAt: string;
  data: ReportData;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export const EMPTY_REPORT_DATA: ReportData = {
  reportDate: new Date().toISOString().split('T')[0],
  reportMonthYear: '',
  meetingGoal: '',
  flagUrl: '',
  country: '',
  capital: '',
  officialLanguage: '',
  population: '',
  currency: '',
  gdp: '',
  hdi: '',
  directFlight: false,
  totalWorkersInUae: '',
  unemploymentRate: '',
  uaeEmbassyLocation: '',
  foreignEmbassyLocation: '',
  crimeRate: '',
  literacyRate: '',
  governmentType: '',
  workforceMinistry: '',
  averageWage: '',
  minimumWage: '',
  uaeWorkforceStats: {
    totalWorkersOverride: undefined,
    workersHistory: {
      yearCurrent: '',
      totalCurrent: undefined,
      yearPrevious: '',
      totalPrevious: undefined,
      yearTwoYearsAgo: '',
      totalTwoYearsAgo: undefined,
    },
    mohre: {
      totalPrivate: { value: '', date: '' },
      totalDomestic: { value: '', date: '' },
      unemploymentInsuranceCoverage: { value: '', date: '' },
      wpsWageTransferRate: { value: '', date: '' },
      insuranceUnemploymentCoveredNum: '',
      insuranceUnemploymentCoveredPct: '',
      insuranceUnemploymentExposedNum: '',
      insuranceUnemploymentExposedPct: '',
      insuranceRightsCoveredNum: '',
      insuranceRightsCoveredPct: '',
      insuranceRightsExposedNum: '',
      insuranceRightsExposedPct: '',
      wpsWageTransferNum: '',
      wpsWageTransferPct: '',
      wageMedianComparison: '',
      workersLaborStrikes: '',
      laborComplaintsUnderReview: '',
      totalComplaintsCurrentYear: '',
      skilledPartnerWage: '',
      skilledUaeWage: '',
      unskilledPartnerWage: '',
      unskilledUaeWage: '',
      byEmirate: [
        { name: 'Abu Dhabi', value: 0 },
        { name: 'Dubai', value: 0 },
        { name: 'Sharjah', value: 0 },
        { name: 'Ajman', value: 0 },
        { name: 'Umm Al Quwain', value: 0 },
        { name: 'Ras Al Khaimah', value: 0 },
        { name: 'Fujairah', value: 0 },
      ],
      bySector: []
    },
    icp: {
      byEmirate: [
        { name: 'Abu Dhabi', value: 0 },
        { name: 'Dubai', value: 0 },
        { name: 'Sharjah', value: 0 },
        { name: 'Ajman', value: 0 },
        { name: 'Umm Al Quwain', value: 0 },
        { name: 'Ras Al Khaimah', value: 0 },
        { name: 'Fujairah', value: 0 },
      ],
      bySector: []
    },
    custom: [
      { id: 'total-uae', label: 'Total Workers in UAE', value: '', date: '', isTotal: true }
    ],
    salaryBySector: [
      { name: 'Construction', uaeValue: 4500, partnerValue: 1200 },
      { name: 'Retail', uaeValue: 3800, partnerValue: 950 },
      { name: 'Services', uaeValue: 4200, partnerValue: 1100 },
      { name: 'Hospitality', uaeValue: 3500, partnerValue: 800 },
      { name: 'Manufacturing', uaeValue: 5000, partnerValue: 1400 },
      { name: 'Transportation', uaeValue: 4800, partnerValue: 1300 },
    ]
  },
  workforceStats: {
    totalWorkforce: '',
    participationMale: 0,
    participationFemale: 0,
    migrationDestinations: [],
    topSectors: [],
    availableSkills: [],
  },
  economicStats: {
    inflation: '',
    gdp: '',
    totalExportsToUAE: '',
    totalImportsFromUAE: '',
    topExportProducts: [],
    topImportProducts: [],
    mainEconomicPartners: [],
    tipRank: '',
    remittancesFromUAE: '',
    remittancesGlobal: '',
    customStats: [],
  },
  educationStats: {
    topUniversities: [],
    primaryEnrollment: '',
    higherEducationEnrollment: '',
  },
  recentInteractions: [],
  pointsOfDiscussion: [],
  previousAgreementsAndUpdates: [],
  relatedNews: [],
  customSections: [],
  bilateralAgreements: [],
  keyIssues: [],
  recommendations: [],
  delegations: {
    uae: [],
    partner: []
  },
  summary: '',
  lastCorrespondence: undefined,
  pendingMatters: [],
  pointsToFocusOn: [],
  sectionVisibility: {
    cover: true,
    executiveBrief: true,
    profileEconomy: true,
    uaeWorkforce: true,
    partnerWorkforce: true,
    interactions: true,
    discussionPoints: true,
    previousUpdates: true,
    agreements: true,
    delegation: true,
    briefPointsToFocus: true,
    briefLastMeetings: true,
    briefLastCorrespondence: true,
    executiveBriefPoints: true,
    executiveBriefLastMeeting: true,
    executiveBriefLastCorrespondence: true,
    demographics: true,
    economicLandscape: true,
    bilateralTrade: true,
    educationInsights: true,
    uaeWorkforceKpis: true,
    insuranceExposures: true,
    laborComplaints: true,
    threeYearTrend: true,
    emiratesDistribution: true,
    sectorsChart: true,
    salaryChart: true,
    partnerWorkforceKpis: true,
    migrationDestinations: true,
    partnerSectors: true,
    availableSkills: true,
    uaeDelegation: true,
    partnerDelegation: true,
  },
};