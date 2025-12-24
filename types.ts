
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
  apiKey?: string;
}

export interface Bulletin {
  id: number;
  content: string;
  authorName: string;
  timestamp: string;
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
  date: string;
}

export interface LabelValue {
  name: string;
  value: number;
}

export interface RecentInteraction {
  id: string;
  title: string;
  date: string;
  type: string;
  details: string;
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
}

export interface UaeWorkforceData {
  mohre: {
    totalPrivate: DateValue;
    totalDomestic: DateValue;
    byEmirate: LabelValue[];
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
    isTotal: boolean;
  }>;
}

export interface ReportData {
  reportDate?: string;
  flagUrl?: string;
  country: string;
  capital: string;
  officialLanguage: string;
  population: string;
  currency: string;
  gdp: string;
  hdi: string;
  directFlight: boolean;
  uaeEmbassyLocation: string;
  foreignEmbassyLocation: string;
  crimeRate?: string;
  literacyRate?: string;
  governmentType?: string;
  workforceMinistry?: string;
  uaeWorkforceStats: UaeWorkforceData;
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
  economicStats: {
    inflation: string;
    gdp: string;
    totalExportsToUAE: string;
    totalImportsFromUAE: string;
    topExportProducts: string[];
    topImportProducts: string[];
    mainEconomicPartners: string[];
    tipRank: string;
    remittancesFromUAE: string;
    remittancesGlobal: string;
    customStats: Array<{ id: string; label: string; value: string }>;
  };
  educationStats: {
    topUniversities: string[];
    primaryEnrollment: string;
    higherEducationEnrollment: string;
  };
  recentInteractions: RecentInteraction[];
  pointsOfDiscussion: PointOfDiscussion[];
  relatedNews: NewsItem[];
  customSections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  bilateralAgreements: Array<{
    title: string;
    date: string;
    status: 'Active' | 'Pending' | 'Expired';
    summary: string;
  }>;
  keyIssues: string[];
  recommendations: string[];
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