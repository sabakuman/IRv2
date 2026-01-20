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
}

export interface DateValue {
  value: string;
  date: string; // "As of..."
}

export interface LabelValue {
  name: string;
  value: number;
}

export interface RecentInteraction {
  id: string;
  title: string;
  date: string;
  type: string; // e.g., "Visit", "Phone Call", "Meeting"
  details: string; // Summary of the interaction
}

export interface PointOfDiscussion {
  id: string;
  title: string;
  content: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url?: string; // Added for grounding support
}

export interface UaeWorkforceData {
  mohre: {
    totalPrivate: DateValue;
    totalDomestic: DateValue;
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
}

// Complex Report Structure
export interface ReportData {
  reportDate?: string; // Date of the report/meeting
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
  pointsOfDiscussion: PointOfDiscussion[];
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
  flagUrl: '',
  country: '',
  capital: '',
  officialLanguage: '',
  population: '',
  currency: '',
  gdp: '',
  hdi: '',
  directFlight: false,
  uaeEmbassyLocation: '',
  foreignEmbassyLocation: '',
  crimeRate: '',
  literacyRate: '',
  governmentType: '',
  workforceMinistry: '',
  averageWage: '',
  minimumWage: '',
  uaeWorkforceStats: {
    mohre: {
      totalPrivate: { value: '', date: '' },
      totalDomestic: { value: '', date: '' },
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
  relatedNews: [],
  customSections: [],
  bilateralAgreements: [],
  keyIssues: [],
  recommendations: [],
  delegations: {
    uae: [],
    partner: []
  },
};