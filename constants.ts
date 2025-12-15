import { Report, AuditLog, EMPTY_REPORT_DATA } from './types';

export const FLAGS: Record<string, string> = {
  'India': 'https://flagcdn.com/w320/in.png',
  'Philippines': 'https://flagcdn.com/w320/ph.png',
  'Pakistan': 'https://flagcdn.com/w320/pk.png',
  'Bangladesh': 'https://flagcdn.com/w320/bd.png',
  'UAE': 'https://flagcdn.com/w320/ae.png',
};

export const MOCK_REPORTS: Report[] = [
  {
    id: 'r-101',
    userId: 'u-1',
    title: 'Bilateral Meeting Prep: India',
    status: 'completed',
    updatedAt: '2023-10-24T10:00:00Z',
    data: {
      ...EMPTY_REPORT_DATA,
      reportDate: '2023-11-15',
      country: 'India',
      capital: 'New Delhi',
      officialLanguage: 'Hindi, English',
      population: '1.4B',
      currency: 'Indian Rupee (INR)',
      gdp: '3.5 Trillion USD',
      hdi: '0.633',
      directFlight: true,
      uaeEmbassyLocation: 'New Delhi',
      foreignEmbassyLocation: 'Abu Dhabi',
      uaeWorkforceStats: {
        mohre: {
          totalPrivate: { value: '3,200,000', date: 'Sept 2023' },
          totalDomestic: { value: '800,000', date: 'Sept 2023' },
          byEmirate: [
             { name: 'Abu Dhabi', value: 1200000 },
             { name: 'Dubai', value: 1800000 },
             { name: 'Sharjah', value: 500000 },
             { name: 'Ajman', value: 200000 },
             { name: 'Umm Al Quwain', value: 50000 },
             { name: 'Ras Al Khaimah', value: 150000 },
             { name: 'Fujairah', value: 100000 },
          ],
          bySector: [
            { name: 'Construction', value: 40 },
            { name: 'Retail', value: 20 },
            { name: 'Services', value: 30 }
          ]
        },
        icp: {
          byEmirate: [
             { name: 'Abu Dhabi', value: 1300000 },
             { name: 'Dubai', value: 1900000 },
             { name: 'Sharjah', value: 550000 },
             { name: 'Ajman', value: 210000 },
             { name: 'Umm Al Quwain', value: 55000 },
             { name: 'Ras Al Khaimah', value: 160000 },
             { name: 'Fujairah', value: 110000 },
          ],
          bySector: [
            { name: 'Private', value: 70 },
            { name: 'Government', value: 10 },
            { name: 'Family', value: 20 }
          ]
        },
        custom: [
           { id: 'total-uae', label: 'Total Workers in UAE', value: '5,500,000', date: 'Oct 2023', isTotal: true }
        ]
      },
      averageWage: '$300/month',
      minimumWage: '$60/month',
      workforceStats: {
        totalWorkforce: '580 Million',
        participationMale: 76,
        participationFemale: 24,
        migrationDestinations: [
          { country: 'UAE', count: '3.5 Million' },
          { country: 'USA', count: '2.7 Million' },
          { country: 'Saudi Arabia', count: '2.5 Million' }
        ],
        topSectors: [
          { name: 'Agriculture', value: 45 },
          { name: 'Services', value: 30 },
          { name: 'Industry', value: 25 },
        ],
        availableSkills: ['IT & Software Development', 'Construction', 'Healthcare/Nursing', 'Engineering']
      },
      economicStats: {
        inflation: '5.5%',
        gdp: '3.5 Trillion USD',
        totalExportsToUAE: '30 Billion USD',
        totalImportsFromUAE: '50 Billion USD',
        topExportProducts: ['Petroleum Products', 'Gems & Jewelry', 'Machinery', 'Textiles'],
        topImportProducts: ['Crude Oil', 'Gold', 'Plastics', 'Electronic Goods'],
        mainEconomicPartners: ['USA', 'China', 'UAE', 'Saudi Arabia'],
        tipRank: 'Tier 2',
        remittancesFromUAE: '20 Billion USD (Est. 2023)',
        remittancesGlobal: '125 Billion USD (2023 World Bank)',
        customStats: [
          { id: 'cs-1', label: 'Bilateral Non-Oil Trade', value: '50 Billion USD' }
        ]
      },
      educationStats: {
        topUniversities: ['Indian Institute of Technology Bombay', 'Indian Institute of Science', 'University of Delhi', 'IIT Delhi', 'IIT Madras'],
        primaryEnrollment: '99%',
        higherEducationEnrollment: '27%',
      },
      customSections: [
         { id: 'c-1', title: 'Strategic Partnership Context', content: 'India and UAE share a Comprehensive Economic Partnership Agreement (CEPA) which has significantly boosted non-oil trade.' }
      ],
      recentInteractions: [
         { id: 'ri-1', title: 'Ministerial Visit to New Delhi', date: '2023-05-15', type: 'Visit', details: 'Discussed enhancing labor mobility pathways and skill harmonization standards between NSDC and UAE qualifications.' }
      ],
      pointsOfDiscussion: [
         { id: 'pd-1', title: 'Skill Certification', content: 'Harmonization of skill standards between NSDC India and UAE authorities.' }
      ],
      relatedNews: [],
      bilateralAgreements: [
        { title: 'MoU on Manpower', date: '2018-05-12', status: 'Active', summary: 'Framework for domestic worker recruitment protection.' },
        { title: 'Skill Development Partnership', date: '2021-11-20', status: 'Pending', summary: 'Joint certification program for construction workers.' }
      ],
      keyIssues: ['Passport retention complaints', 'Wage protection system compliance in SMEs'],
      recommendations: ['Establish joint committee for grievance redressal', 'Digitize contract validation process'],
      delegations: {
        uae: [
           { id: 'd-uae-1', name: 'H.E. Dr. Abdulrahman Al Awar', title: 'Minister of Human Resources', imageUrl: 'https://ui-avatars.com/api/?name=Abdulrahman+Al+Awar&background=0D8ABC&color=fff', bio: 'Leading the UAE delegation.' }
        ],
        partner: [
           { id: 'd-ind-1', name: 'H.E. Dr. S. Jaishankar', title: 'Minister of External Affairs', imageUrl: 'https://picsum.photos/100/100?random=1', bio: 'Career diplomat and politician serving as the Minister of External Affairs of India.' }
        ]
      }
    }
  },
  {
    id: 'r-102',
    userId: 'u-1',
    title: 'Labour Market Analysis: Philippines',
    status: 'draft',
    updatedAt: '2023-10-25T14:30:00Z',
    data: {
      ...EMPTY_REPORT_DATA,
      reportDate: '2023-11-20',
      country: 'Philippines',
      capital: 'Manila',
      officialLanguage: 'Filipino, English',
      population: '115M',
      currency: 'Philippine Peso (PHP)',
      gdp: '404 Billion USD',
      hdi: '0.699',
      directFlight: true,
      uaeEmbassyLocation: 'Manila',
      foreignEmbassyLocation: 'Abu Dhabi',
      averageWage: '$330/month',
      minimumWage: '$180/month',
      workforceStats: {
        totalWorkforce: '48 Million',
        participationMale: 73,
        participationFemale: 51,
        migrationDestinations: [
          { country: 'USA', count: '4 Million' },
          { country: 'Saudi Arabia', count: '1.8 Million' },
          { country: 'UAE', count: '700,000' }
        ],
        topSectors: [
          { name: 'Services', value: 60 },
          { name: 'Agriculture', value: 23 },
          { name: 'Industry', value: 17 }
        ],
        availableSkills: ['Nursing & Caregiving', 'Hospitality', 'Seafarers', 'Customer Service']
      },
      economicStats: {
        inflation: '3.9%',
        gdp: '404 Billion USD',
        totalExportsToUAE: '500 Million USD',
        totalImportsFromUAE: '1.2 Billion USD',
        topExportProducts: ['Bananas', 'Pineapples', 'Electronics', 'Garments'],
        topImportProducts: ['Oil', 'Petrochemicals', 'Aluminum'],
        mainEconomicPartners: ['USA', 'China', 'Japan', 'Singapore'],
        tipRank: 'Tier 1',
        remittancesFromUAE: '1.2 Billion USD',
        remittancesGlobal: '40 Billion USD',
        customStats: []
      },
      educationStats: {
        topUniversities: ['University of the Philippines', 'Ateneo de Manila University', 'De La Salle University'],
        primaryEnrollment: '94%',
        higherEducationEnrollment: '35%',
      },
      customSections: [],
      recentInteractions: [],
      pointsOfDiscussion: [],
      relatedNews: [],
      bilateralAgreements: [],
      keyIssues: [],
      recommendations: [],
      delegations: {
        uae: [],
        partner: []
      }
    }
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'l-1', action: 'LOGIN', user: 'Ahmed Al-Mansouri', timestamp: '2023-10-26T08:00:00Z', details: 'Successful login from IP 192.168.1.1' },
  { id: 'l-2', action: 'REPORT_CREATE', user: 'Ahmed Al-Mansouri', timestamp: '2023-10-26T09:15:00Z', details: 'Created draft report for Philippines' },
  { id: 'l-3', action: 'EXPORT_PDF', user: 'Sarah Khan', timestamp: '2023-10-25T16:20:00Z', details: 'Exported India Bilateral Report' },
];

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    reports: 'Reports',
    createNew: 'Create Report',
    draft: 'Draft',
    completed: 'Completed',
    logout: 'Logout',
    welcome: 'Welcome back',
    stats: 'Market Statistics',
    step: 'Step',
    next: 'Next',
    back: 'Back',
    save: 'Save Draft',
    finish: 'Finish & Preview',
    country: 'Country',
    capital: 'Capital',
    agreements: 'Bilateral Agreements',
    workforce: 'Workforce Distribution',
    delegation: 'Delegation',
    print: 'Print Report',
    confidential: 'CONFIDENTIAL / INTERNAL USE ONLY',
    ministry: 'Ministry of Human Resources & Emiratisation',
    loginTitle: 'Labour Market Intelligence',
    loginSubtitle: 'Secure Official Access Only',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    reports: 'التقارير',
    createNew: 'إنشاء تقرير',
    draft: 'مسودة',
    completed: 'مكتمل',
    logout: 'تسجيل خروج',
    welcome: 'مرحباً بك',
    stats: 'إحصائيات السوق',
    step: 'خطوة',
    next: 'التالي',
    back: 'سابق',
    save: 'حفظ المسودة',
    finish: 'إنهاء ومعاينة',
    country: 'الدولة',
    capital: 'العاصمة',
    agreements: 'الاتفاقيات الثنائية',
    workforce: 'توزيع القوى العاملة',
    delegation: 'الوفد الرسمي',
    print: 'طباعة التقرير',
    confidential: 'سري / للاستخدام الداخلي فقط',
    ministry: 'وزارة الموارد البشرية والتوطين',
    loginTitle: 'نظام ذكاء سوق العمل',
    loginSubtitle: 'دخول رسمي آمن فقط',
  }
};