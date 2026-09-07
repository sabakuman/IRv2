// server/seedReport.js

export const INITIAL_DUMMY_REPORT = {
  id: 'rep-india-2024',
  userId: 'u-admin',
  title: 'Bilateral Labor & Workforce Report - Republic of India (تقرير القوى العاملة الثنائي - جمهورية الهند)',
  status: 'completed',
  updatedAt: new Date().toISOString(),
  data: {
    reportDate: '2024-10-15',
    reportMonthYear: 'October 2024 / أكتوبر 2024',
    flagUrl: 'https://flagcdn.com/w320/in.png',
    country: 'Republic of India',
    capital: 'New Delhi',
    officialLanguage: 'Hindi, English',
    population: '1,428,000,000',
    currency: 'INR (Indian Rupee / الروبية الهندية)',
    gdp: '$3.75 Trillion',
    hdi: '0.644 (Medium)',
    directFlight: true,
    uaeEmbassyLocation: 'New Delhi',
    foreignEmbassyLocation: 'Abu Dhabi',
    totalWorkersInUae: '3,835,000',
    unemploymentRate: '6.8%',
    crimeRate: 'Low - Moderate',
    literacyRate: '77.7%',
    governmentType: 'Federal Parliamentary Republic',
    workforceMinistry: 'Ministry of Labour and Employment',
    averageWage: '18,500 INR / Month',
    minimumWage: '5,340 INR / Month',
    uaeWorkforceStats: {
      totalWorkersOverride: 3835000,
      workersHistory: {
        yearCurrent: '2024',
        totalCurrent: 3835000,
        yearPrevious: '2023',
        totalPrevious: 3550000,
        yearTwoYearsAgo: '2022',
        totalTwoYearsAgo: 3250000
      },
      mohre: {
        totalPrivate: { value: '3,450,000', date: '2024-09' },
        totalDomestic: { value: '385,000', date: '2024-09' },
        insuranceUnemploymentCoveredNum: '3,250,000',
        insuranceUnemploymentCoveredPct: '94.2%',
        insuranceUnemploymentExposedNum: '200,000',
        insuranceUnemploymentExposedPct: '5.8%',
        insuranceRightsCoveredNum: '3,300,000',
        insuranceRightsCoveredPct: '95.6%',
        insuranceRightsExposedNum: '150,000',
        insuranceRightsExposedPct: '4.4%',
        wpsWageTransferNum: '3,180,000',
        wpsWageTransferPct: '92.1%',
        workersLaborStrikes: '0',
        laborComplaintsUnderReview: '340',
        totalComplaintsCurrentYear: '11,850',
        skilledPartnerWage: '4,500',
        skilledUaeWage: '5,200',
        unskilledPartnerWage: '1,850',
        unskilledUaeWage: '2,100',
        byEmirate: [
          { name: 'Abu Dhabi', value: 1120000 },
          { name: 'Dubai', value: 1850000 },
          { name: 'Sharjah', value: 490000 },
          { name: 'Ajman', value: 180000 },
          { name: 'Ras Al Khaimah', value: 115000 },
          { name: 'Fujairah', value: 55000 },
          { name: 'Umm Al Quwain', value: 25000 }
        ],
        bySector: [
          { name: 'الإنشاءات والبناء', value: 1350000 },
          { name: 'تجارة الجملة والتجزئة', value: 720000 },
          { name: 'الصناعات التحويلية', value: 430000 },
          { name: 'النقل والتخزين', value: 360000 },
          { name: 'خدمات الإقامة والضيافة', value: 290000 },
          { name: 'الخدمات الإدارية والدعم', value: 210000 },
          { name: 'المعلومات والاتصالات', value: 185000 },
          { name: 'الرعاية الصحية والعمل الاجتماعي', value: 110000 },
          { name: 'الأنشطة العقارية', value: 95000 },
          { name: 'الأنشطة المهنية والعلمية والتقنية', value: 85000 },
          { name: 'التعليم والتدريب', value: 45000 },
          { name: 'الفنون والترفيه والتسلية', value: 25000 },
          { name: 'التعدين واستغلال المحاجر', value: 15000 }
        ]
      },
      icp: {
        byEmirate: [
          { name: 'Abu Dhabi', value: 125000 },
          { name: 'Dubai', value: 175000 },
          { name: 'Sharjah', value: 42000 },
          { name: 'Ajman', value: 18000 },
          { name: 'Ras Al Khaimah', value: 12000 },
          { name: 'Fujairah', value: 8000 },
          { name: 'Umm Al Quwain', value: 5000 }
        ],
        bySector: [
          { name: 'مساعدات المنازل ورعاية الأطفال', value: 280000 },
          { name: 'سائقون خاصون للأسر', value: 65000 },
          { name: 'الطهي المنزلي والضيافة العائلية', value: 42000 },
          { name: 'الدعم الزراعي ومزارع الأسر', value: 25000 },
          { name: 'الحراسة الخاصة وأمن المنازل', value: 22000 },
          { name: 'العناية بالحدائق والمسطحات الخضراء', value: 18000 },
          { name: 'مدبرو المنازل وإدارة شؤون الأسرة', value: 15000 },
          { name: 'رعاية كبار السن والمرافقة الصحية', value: 12000 },
          { name: 'الخياطة المنزلية والأعمال اليدوية', value: 8500 },
          { name: 'المعاونون المنزليون المتخصصون', value: 6000 },
          { name: 'مربو الخيول ورعاية الصقور والحيوانات', value: 4500 },
          { name: 'مقدمو الرعاية الخاصة الإضافيون', value: 3000 }
        ]
      },
      custom: [
        { id: 'total-uae', label: 'Total Workers in UAE', value: '3,835,000', date: '2024', isTotal: true }
      ],
      salaryBySector: [
        { name: 'Construction', uaeValue: 4500, partnerValue: 1200 },
        { name: 'Retail', uaeValue: 3800, partnerValue: 950 },
        { name: 'Services', uaeValue: 4200, partnerValue: 1100 },
        { name: 'Hospitality', uaeValue: 3500, partnerValue: 800 },
        { name: 'Manufacturing', uaeValue: 5000, partnerValue: 1400 },
        { name: 'Transportation', uaeValue: 4800, partnerValue: 1300 }
      ]
    },
    workforceStats: {
      totalWorkforce: '560,000,000',
      participationMale: 76.5,
      participationFemale: 32.8,
      migrationDestinations: [
        { country: 'UAE', count: '3,835,000' },
        { country: 'Saudi Arabia', count: '2,600,000' },
        { country: 'USA', count: '1,450,000' },
        { country: 'Oman', count: '780,000' },
        { country: 'Kuwait', count: '650,000' },
        { country: 'Qatar', count: '520,000' },
        { country: 'United Kingdom', count: '480,000' },
        { country: 'Canada', count: '390,000' },
        { country: 'Australia', count: '310,000' },
        { country: 'Bahrain', count: '240,000' },
        { country: 'Singapore', count: '180,000' },
        { country: 'Germany', count: '120,000' },
        { country: 'Malaysia', count: '95,000' }
      ],
      topSectors: [
        { name: 'Agriculture & Allied', value: 43 },
        { name: 'Services & Trade', value: 32 },
        { name: 'Industry & Construction', value: 25 }
      ],
      availableSkills: [
        'Civil & Infrastructure Engineering',
        'IT & Software Development',
        'Healthcare & Specialized Nursing',
        'Hospitality & Culinary Management',
        'Precision Manufacturing & Fabrication'
      ]
    },
    economicStats: {
      inflation: '4.8%',
      gdp: '$3.75 Trillion',
      totalExportsToUAE: '$31.6 Billion',
      totalImportsFromUAE: '$53.2 Billion',
      topExportProducts: [
        'Refined Petroleum & Petrochemicals',
        'Precious Stones & Jewelry',
        'Machinery, Nuclear Reactors & Boilers',
        'Pharmaceutical Formulations',
        'Textiles, Apparel & Yarns'
      ],
      topImportProducts: [
        'Crude Petroleum Oil',
        'Gold & Precious Metals',
        'Petrochemicals & Polymers',
        'Copper & Base Metals',
        'Inorganic Chemicals'
      ],
      mainEconomicPartners: [
        'United States',
        'United Arab Emirates',
        'China',
        'Saudi Arabia',
        'Singapore'
      ],
      tipRank: 'Tier 2',
      remittancesFromUAE: '$20.4 Billion',
      remittancesGlobal: '$125 Billion',
      customStats: [
        { id: 'cepa-growth', label: 'CEPA Bilateral Growth', value: '+16.4%' }
      ]
    },
    educationStats: {
      topUniversities: [
        'Indian Institute of Technology (IIT)',
        'Indian Institute of Science (IISc)',
        'University of Delhi',
        'Birla Institute of Technology & Science (BITS Pilani)'
      ],
      primaryEnrollment: '98.2%',
      higherEducationEnrollment: '28.4%'
    },
    recentInteractions: [
      {
        id: 'int-1',
        title: 'UAE-India Joint Committee on Manpower and Labour Affairs',
        date: '2024-05-18',
        type: 'Joint Committee Session',
        details: 'Deliberated on skills harmonization framework, pre-departure verification systems, and digital integration for dispute resolution.'
      },
      {
        id: 'int-2',
        title: 'High-Level Bilateral Labor Consultation Session',
        date: '2023-11-22',
        type: 'Ministerial Summit',
        details: 'Reviewed digital contract authentication and worker welfare protection mechanisms across all Emirates.'
      }
    ],
    pointsOfDiscussion: [
      {
        id: 'pod-1',
        title: 'Skills Harmonization & Technical Certification Alignment',
        content: 'Coordinating between UAE National Qualifications Framework (NQF) and India Skill Development Council for reciprocal recognition of vocational diplomas.'
      },
      {
        id: 'pod-2',
        title: 'Expansion of Digital Wage Protection & Insurance Onboarding',
        content: 'Reviewing implementation metrics of the Involuntary Loss of Employment (ILOE) scheme and Worker Protection Program (Tameen).'
      },
      {
        id: 'pod-3',
        title: 'Ethical Recruitment & Elimination of Unregulated Intermediaries',
        content: 'Strengthening monitoring protocols between e-Migrate and MOHRE digital channels to ensure direct ethical hiring.'
      }
    ],
    previousAgreementsAndUpdates: [
      {
        id: 'pau-1',
        title: 'Progress on Technical Skill Testing Centers',
        content: 'Establishment of 14 accredited testing facilities across India for pre-departure vocational screening.'
      }
    ],
    pendingMatters: [
      {
        id: 'pm-1',
        matter: 'الربط الإلكتروني بين منصة تصاريح العمل ومنظومة e-Migrate',
        dept: 'قطاع شؤون العمل والعمليات',
        status: 'pending'
      },
      {
        id: 'pm-2',
        matter: 'اعتماد مراكز اختبار وتصنيف المهارات الفنية والمهنية المسبقة',
        dept: 'إدارة التفتيش والتوجيه العمالي',
        status: 'in_coordination'
      },
      {
        id: 'pm-3',
        matter: 'تنسيق آلية تسوية النزاعات العمالية والقضايا المعلقة عبر القنوات الدبلوماسية',
        dept: 'إدارة علاقات العمل',
        status: 'pending'
      },
      {
        id: 'pm-4',
        matter: 'تحديث بنود مذكرة التفاهم للعمالة المساعدة وتسهيل استقدام الكوادر المتخصصة',
        dept: 'إدارة العلاقات الدولية',
        status: 'in_coordination'
      }
    ],
    relatedNews: [
      {
        id: 'news-1',
        title: 'UAE and India Review Labor Cooperation and Technical Skill Initiatives',
        source: 'WAM Emirates News Agency',
        date: '2024-05-20',
        summary: 'Both nations reaffirmed strategic bilateral ties and agreed to enhance the pilot project for skill testing centers.'
      },
      {
        id: 'news-2',
        title: 'Bilateral Trade Surpasses $84 Billion Under Comprehensive Partnership (CEPA)',
        source: 'Khaleej Times',
        date: '2024-03-12',
        summary: 'Economic engagement continues rapid growth across non-oil sectors including engineering, technology, and logistics.'
      }
    ],
    customSections: [],
    bilateralAgreements: [
      {
        title: 'Memorandum of Understanding in the Field of Manpower',
        date: '2018-02-10',
        status: 'active',
        summary: 'Framework for integration of recruitment systems, protection of rights, and dispute settlement.'
      },
      {
        title: 'Comprehensive Economic Partnership Agreement (CEPA)',
        date: '2022-05-01',
        status: 'active',
        summary: 'Historic bilateral pact driving non-oil trade, investment flows, and mutual service mobility.'
      },
      {
        title: 'Framework Agreement on Mutual Recognition of Vocational Qualifications',
        date: '2023-09-15',
        status: 'active',
        summary: 'Pilot program covering construction, electro-mechanical, and hospitality vocations.'
      }
    ],
    keyIssues: [
      'Ensuring direct recruitment via authenticated government channels without excessive sub-agent fees.',
      'Expediting vocational certification verification prior to departure.',
      'Expanding awareness of insurance schemes (ILOE & Worker Protection System) among newly arriving workers.'
    ],
    recommendations: [
      'Activate phase 2 of the Joint Digital Skill Verification platform across key Indian state centers.',
      'Hold quarterly technical follow-up meetings between MOHRE and the Indian Embassy consular team.',
      'Distribute multilingual legal awareness handbooks through pre-departure orientation centers.'
    ],
    delegations: {
      uae: [
        {
          id: 'del-uae-1',
          name: 'H.E. Dr. Abdulrahman Al Awar',
          title: 'Minister of Human Resources and Emiratisation',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
          bio: 'Leading labor market governance, human capital transformation, and strategic bilateral partnerships for the United Arab Emirates.'
        },
        {
          id: 'del-uae-2',
          name: 'H.E. Shayma Al Awadhi',
          title: 'Assistant Undersecretary for Communication and International Relations',
          imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
          bio: 'Oversees multilateral workforce agreements, international treaties, and bilateral joint committee affairs.'
        }
      ],
      partner: [
        {
          id: 'del-part-1',
          name: 'H.E. Dr. Mansukh Mandaviya',
          title: 'Minister of Labour and Employment',
          imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
          bio: 'Heading national employment policies, labor welfare reforms, and international worker mobility pacts.',
          metBefore: true,
          meetingYear: '2023',
          meetingLocation: 'Abu Dhabi'
        },
        {
          id: 'del-part-2',
          name: 'H.E. Sunjay Sudhir',
          title: 'Ambassador of India to the United Arab Emirates',
          imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces',
          bio: 'Senior diplomat directing the comprehensive bilateral strategic relationship between India and the UAE.',
          metBefore: true,
          meetingYear: '2024',
          meetingLocation: 'Dubai'
        },
        {
          id: 'del-part-3',
          name: 'Ms. Sumita Dawra',
          title: 'Secretary, Ministry of Labour and Employment',
          imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces',
          bio: 'Senior administrative official leading operational workforce mobility and social security modernization.',
          metBefore: false
        }
      ]
    },
    summary: 'شراكة عمالية استراتيجية تضم أكثر من 3.8 مليون عامل ومؤطرة باتفاقيات ثنائية نافذة لتعزيز الاستقرار وحماية الحقوق.',
    lastCorrespondence: {
      direction: 'صادرة',
      date: '2024-08-28',
      ref: 'REF/MOHRE/2024/792',
      subject: 'تحديثات الربط الإلكتروني لأنظمة الاستقدام واختبار المهارات المهنية (e-Migrate Integration)',
      status: 'awaiting_reply'
    }
  }
};

export function seedInitialReport(db) {
  // Check if reports table already contains any report
  db.get("SELECT id FROM reports LIMIT 1", [], (err, row) => {
    if (err) {
      console.error("[SEED REPORT] Error checking existing reports:", err.message);
      return;
    }
    // Only insert initial seed data if table is completely empty
    if (!row) {
      const stmt = db.prepare("INSERT INTO reports (id, userId, title, status, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)");
      stmt.run(
        INITIAL_DUMMY_REPORT.id,
        INITIAL_DUMMY_REPORT.userId,
        INITIAL_DUMMY_REPORT.title,
        INITIAL_DUMMY_REPORT.status,
        INITIAL_DUMMY_REPORT.updatedAt,
        JSON.stringify(INITIAL_DUMMY_REPORT.data),
        function(insertErr) {
          if (insertErr) {
            console.error("[SEED REPORT] Failed to seed dummy report:", insertErr.message);
          } else {
            console.log("[SEED REPORT] Successfully seeded initial report into empty database:", INITIAL_DUMMY_REPORT.id);
          }
        }
      );
      stmt.finalize();
    } else {
      console.log("[SEED REPORT] Database already populated. Skipping seed to protect user modifications; database.sqlite will not be updated.");
    }
  });
}
