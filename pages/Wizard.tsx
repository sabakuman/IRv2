import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReportData, EMPTY_REPORT_DATA, Report, Delegate, NewsItem, PendingMatter } from '../types';
import { MockService } from '../services/mockService';
import { Button, Card, Input } from '../components/ui/LayoutComponents';
import { PendingMattersEditor } from '../components/PendingMattersEditor';
import { ArrowLeft, ArrowRight, Save, Globe, Users, FileText, CheckCircle, Plane, Building, TrendingUp, Sparkles, Loader2, RefreshCw, Link as LinkIcon, Search, Hammer, GraduationCap, Briefcase, Plus, X, Banknote, UserPlus, BarChart2, MessageSquare, Newspaper, Calendar, UploadCloud, ShieldAlert, BookOpen, Bold, Italic, List, ExternalLink, Mail, Layers } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Custom Textarea with Rich Text Toolbar
// ... (omitted for brevity in replacement, but kept in file)
const RichTextarea = ({ label, value, onChange, placeholder }: any) => {
  // ... (keep original logic)
  const insertText = (tag: string) => {
    const textarea = document.getElementById(`rt-${label}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let replacement = "";
    if (tag === 'bold') replacement = `**${selected || 'text'}**`;
    else if (tag === 'italic') replacement = `*${selected || 'text'}*`;
    else if (tag === 'bullet') replacement = `\n- ${selected || 'item'}`;

    onChange(before + replacement + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selected.length || 4));
    }, 0);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300">{label}</label>}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
        <div className="flex gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
           <button type="button" onClick={() => insertText('bold')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Bold"><Bold size={16} /></button>
           <button type="button" onClick={() => insertText('italic')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Italic"><Italic size={16} /></button>
           <button type="button" onClick={() => insertText('bullet')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Bullet List"><List size={16} /></button>
        </div>
        <textarea 
          id={`rt-${label}`}
          className="w-full p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none min-h-[120px] resize-y text-sm leading-relaxed" 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

const EMIRATES_CONFIG = [
  { id: 'Abu Dhabi', nameEn: 'Abu Dhabi', nameAr: 'أبوظبي' },
  { id: 'Dubai', nameEn: 'Dubai', nameAr: 'دبي' },
  { id: 'Sharjah', nameEn: 'Sharjah', nameAr: 'الشارقة' },
  { id: 'Ajman', nameEn: 'Ajman', nameAr: 'عجمان' },
  { id: 'Ras Al Khaimah', nameEn: 'Ras Al Khaimah', nameAr: 'رأس الخيمة' },
  { id: 'Fujairah', nameEn: 'Fujairah', nameAr: 'الفجيرة' },
  { id: 'Umm Al Quwain', nameEn: 'Umm Al Quwain', nameAr: 'أم القيوين' },
];

export default function Wizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData>(EMPTY_REPORT_DATA);
  const [reportTitle, setReportTitle] = useState('');

  const getEmirateVal = (source: 'mohre' | 'icp', emirateId: string): number => {
    const list = data?.uaeWorkforceStats?.[source]?.byEmirate || [];
    const item = list.find(e => e.name.toLowerCase() === emirateId.toLowerCase());
    return item ? Number(item.value || 0) : 0;
  };

  const setEmirateVal = (source: 'mohre' | 'icp', emirateId: string, val: number) => {
    const currentList = [...(data?.uaeWorkforceStats?.[source]?.byEmirate || [])];
    const idx = currentList.findIndex(e => e.name.toLowerCase() === emirateId.toLowerCase());
    if (idx !== -1) {
      currentList[idx] = { ...currentList[idx], value: val };
    } else {
      currentList.push({ name: emirateId, value: val });
    }
    setData({
      ...data,
      uaeWorkforceStats: {
        ...data.uaeWorkforceStats,
        [source]: {
          ...data.uaeWorkforceStats[source],
          byEmirate: currentList
        }
      }
    });
  };

  const STEPS = [
    { id: 'profile', icon: Globe, label: t('sectionProfile') },
    { id: 'uae-workforce', icon: BarChart2, label: t('sectionUaeWorkforce') },
    { id: 'workforce', icon: Users, label: t('sectionWorkforce') },
    { id: 'economy', icon: Briefcase, label: t('sectionEconomy') },
    { id: 'interactions', icon: MessageSquare, label: t('sectionInteractions') },
    { id: 'agreements', icon: FileText, label: t('sectionAgreements') },
    { id: 'delegation', icon: Users, label: t('sectionDelegation') },
    { id: 'preview', icon: CheckCircle, label: t('sectionPreview') },
  ];

  useEffect(() => {
    if (id) {
      MockService.getReportById(id).then(r => {
        if (r) {
          const reportData = { ...r.data };
          if (!reportData.uaeWorkforceStats) {
            reportData.uaeWorkforceStats = { salaryBySector: [] } as any;
          }
          if (!reportData.uaeWorkforceStats.salaryBySector || reportData.uaeWorkforceStats.salaryBySector.length === 0) {
            reportData.uaeWorkforceStats.salaryBySector = [
              { name: 'Construction', uaeValue: 4500, partnerValue: 1200 },
              { name: 'Retail', uaeValue: 3800, partnerValue: 950 },
              { name: 'Services', uaeValue: 4200, partnerValue: 1100 },
              { name: 'Hospitality', uaeValue: 3500, partnerValue: 800 },
              { name: 'Manufacturing', uaeValue: 5000, partnerValue: 1400 },
              { name: 'Transportation', uaeValue: 4800, partnerValue: 1300 },
            ];
          }
          if (!reportData.pendingMatters) {
            const initialPending: PendingMatter[] = [];
            (reportData.previousAgreementsAndUpdates || []).forEach(item => {
              let dept = language === 'ar' ? 'إدارة العلاقات الدولية' : 'International Relations';
              const combined = `${item.title} ${item.content}`.toLowerCase();
              if (combined.includes('operation') || combined.includes('عمليات') || combined.includes('تصاريح')) {
                dept = language === 'ar' ? 'قطاع شؤون العمل والعمليات' : 'Labour Affairs & Operations';
              } else if (combined.includes('inspection') || combined.includes('iod') || combined.includes('تفتيش') || combined.includes('توجيه')) {
                dept = language === 'ar' ? 'إدارة التفتيش والتوجيه العمالي' : 'Labour Inspection & Guidance';
              } else if (combined.includes('complaint') || combined.includes('نزاع') || combined.includes('شكاوى')) {
                dept = language === 'ar' ? 'إدارة علاقات العمل' : 'Labour Relations Department';
              }
              initialPending.push({
                id: item.id || uuidv4(),
                matter: item.title,
                dept,
                status: 'pending'
              });
            });
            (reportData.bilateralAgreements || []).filter(a => a.status === 'pending').forEach(item => {
              initialPending.push({
                id: uuidv4(),
                matter: item.title,
                dept: language === 'ar' ? 'إدارة العلاقات الدولية' : 'International Relations',
                status: 'pending'
              });
            });
            reportData.pendingMatters = initialPending;
          }
          setData(reportData);
          setReportTitle(r.title);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const fetchFlag = async (countryName: string) => {
    if (!countryName) return;
    try {
      const res = await fetch(`/api/proxy-flag?country=${encodeURIComponent(countryName)}&fullText=true`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].flags) {
          const flagUrl = data[0].flags.png || data[0].flags.svg;
          setData(prev => ({ ...prev, flagUrl }));
        }
      }
    } catch (error) {
      console.error('Error fetching flag:', error);
    }
  };

  const handleFetchData = async () => {
    if (!data.country) {
      alert("Please enter a country name first.");
      return;
    }
    
    setIsFetchingAI(true);
    setAiError(null);
    const targetLanguage = language === 'ar' ? 'Arabic' : 'English';
    const userApiKey = user?.apiKey || '';

    try {
      const prompt = `Fetch the latest official labour market and economic data for ${data.country}. IMPORTANT: All text values MUST be returned in ${targetLanguage}. Ensure numeric values are strings if they contain units. Always provide monthly wages in USD ($) or AED (درهم) only - convert from local currency if necessary. Include Top 5 export products and Top 5 import products as individual string arrays. Also include 'tipRank' (Trafficking in Persons Rank, e.g. Tier 2) and 'remittancesFromUAE' (annual amount). List Top 5 Universities. Also fetch if there are 'directFlight' (boolean, true if direct flights from UAE exist, else false) and 'unemploymentRate' (latest official national unemployment rate of that country, e.g. '5.2%').`;
      
      const config = { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            capital: { type: Type.STRING },
            officialLanguage: { type: Type.STRING },
            population: { type: Type.STRING },
            currency: { type: Type.STRING },
            gdp: { type: Type.STRING },
            hdi: { type: Type.STRING },
            averageWage: { type: Type.STRING },
            minimumWage: { type: Type.STRING },
            crimeRate: { type: Type.STRING },
            literacyRate: { type: Type.STRING },
            governmentType: { type: Type.STRING },
            workforceMinistry: { type: Type.STRING },
            directFlight: { type: Type.BOOLEAN },
            unemploymentRate: { type: Type.STRING },
            totalWorkforce: { type: Type.STRING },
            participationMale: { type: Type.NUMBER },
            participationFemale: { type: Type.NUMBER },
            migrationDestinations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  country: { type: Type.STRING },
                  count: { type: Type.STRING }
                }
              }
            },
            topSectors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            },
            availableSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            topExportProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            topImportProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            economicStats_inflation: { type: Type.STRING },
            economicStats_gdp: { type: Type.STRING },
            economicStats_totalExportsToUAE: { type: Type.STRING },
            economicStats_totalImportsFromUAE: { type: Type.STRING },
            tipRank: { type: Type.STRING },
            remittancesFromUAE: { type: Type.STRING },
            topUniversities: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      };

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-apikey': userApiKey
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3.5-flash',
          config
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error generating AI data.');
      }

      const responseJson = await res.json();
      if (responseJson.text) {
        const aiData = JSON.parse(responseJson.text);
        setData(prev => ({ 
          ...prev, 
          ...aiData,
          economicStats: {
            ...prev.economicStats,
            inflation: aiData.economicStats_inflation || prev.economicStats.inflation,
            gdp: aiData.economicStats_gdp || prev.economicStats.gdp,
            totalExportsToUAE: aiData.economicStats_totalExportsToUAE || prev.economicStats.totalExportsToUAE,
            totalImportsFromUAE: aiData.economicStats_totalImportsFromUAE || prev.economicStats.totalImportsFromUAE,
            topExportProducts: aiData.topExportProducts || prev.economicStats.topExportProducts,
            topImportProducts: aiData.topImportProducts || prev.economicStats.topImportProducts,
            tipRank: aiData.tipRank || prev.economicStats.tipRank,
            remittancesFromUAE: aiData.remittancesFromUAE || prev.economicStats.remittancesFromUAE,
          },
          educationStats: {
            ...prev.educationStats,
            topUniversities: aiData.topUniversities || prev.educationStats.topUniversities,
            primaryEnrollment: aiData.primaryEnrollment || prev.educationStats.primaryEnrollment,
            higherEducationEnrollment: aiData.higherEducationEnrollment || prev.educationStats.higherEducationEnrollment
          },
          workforceStats: { ...prev.workforceStats, ...aiData } 
        }));
      }
    } catch (error: any) { 
      console.error("AI Fetch Error:", error);
      setAiError(error.message || "Failed to fetch data via AI. Please ensure your connection is stable.");
    } finally { 
      setIsFetchingAI(false); 
    }
  };

  const handleFetchAgreements = async () => {
    if (!data.country) return;
    setIsFetchingAI(true);
    setAiError(null);
    const userApiKey = user?.apiKey || '';

    try {
      const targetLanguage = language === 'ar' ? 'Arabic' : 'English';
      const prompt = `Identify and list 5-10 formal bilateral labour agreements, MoUs, or protocols between the UAE (MOHRE/MOFA) and ${data.country}. Return as JSON array with title, date, status (active or pending), and summary. Language: ${targetLanguage}.`;
      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              status: { type: Type.STRING, enum: ['active', 'pending'] },
              summary: { type: Type.STRING }
            }
          }
        }
      };

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-apikey': userApiKey
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3.5-flash',
          config
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error generating agreements.');
      }

      const responseJson = await res.json();
      if (responseJson.text) {
        const agrs = JSON.parse(responseJson.text);
        setData(prev => ({ ...prev, bilateralAgreements: agrs }));
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "Failed to fetch agreements: Connection error.");
    } finally {
      setIsFetchingAI(false);
    }
  };

  const handleFetchNews = async () => {
     if (!data.country) return;
     
     setIsFetchingNews(true);
     setAiError(null);
     const userApiKey = user?.apiKey || '';

     try {
       const targetLanguage = language === 'ar' ? 'Arabic' : 'English';
       const prompt = `Find exactly 3 most recent official news items or press releases (from 2024-2025) concerning bilateral workforce cooperation, diplomatic visits, or labour market agreements between the UAE and ${data.country}. 
       Return ONLY a valid JSON array of objects. 
       Format: [{"title": "...", "source": "...", "date": "...", "summary": "...", "url": "..."}] 
       All text MUST be in ${targetLanguage}.`;
       
       const config = { 
         tools: [{ googleSearch: {} }]
       };

       const res = await fetch('/api/ai/generate', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'x-user-apikey': userApiKey
         },
         body: JSON.stringify({
           prompt,
           model: 'gemini-3.5-flash',
           config
         })
       });

       if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || 'Server error generating news.');
       }

       const responseJson = await res.json();
       if (responseJson.text) {
         let cleanedText = responseJson.text.trim();
         if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
         }
         
         const newsItems = JSON.parse(cleanedText);
         const groundingChunks = responseJson.candidates?.[0]?.groundingMetadata?.groundingChunks;
         
         const formattedNews: NewsItem[] = newsItems.map((n: any, idx: number) => {
            let finalUrl = n.url || '';
            if (!finalUrl && groundingChunks && groundingChunks[idx]?.web?.uri) {
               finalUrl = groundingChunks[idx].web.uri;
            }
            
            return {
               id: uuidv4(),
               title: n.title || '',
               source: n.source || '',
               date: n.date || '',
               summary: n.summary || '',
               url: finalUrl
            };
         });

         setData(prev => ({ 
           ...prev, 
           relatedNews: [...prev.relatedNews, ...formattedNews] 
         }));
       }
     } catch (e: any) {
        console.error(e);
        setAiError(e.message || "Failed to fetch news: Connection error.");
     } finally {
        setIsFetchingNews(false);
     }
  };

  const addDelegate = (type: 'uae' | 'partner') => {
    const newDelegate: Delegate = { id: uuidv4(), name: '', title: '', imageUrl: '', bio: '' };
    setData(prev => ({ ...prev, delegations: { ...prev.delegations, [type]: [...prev.delegations[type], newDelegate] } }));
  };

  const handleAutoImportPendingMatters = () => {
    const imported: PendingMatter[] = [];
    (data.previousAgreementsAndUpdates || []).forEach(item => {
      let dept = isRTL ? 'إدارة العلاقات الدولية' : 'International Relations';
      const combined = `${item.title} ${item.content}`.toLowerCase();
      if (combined.includes('operation') || combined.includes('عمليات') || combined.includes('تصاريح')) {
        dept = isRTL ? 'قطاع شؤون العمل والعمليات' : 'Labour Affairs & Operations';
      } else if (combined.includes('inspection') || combined.includes('iod') || combined.includes('تفتيش') || combined.includes('توجيه')) {
        dept = isRTL ? 'إدارة التفتيش والتوجيه العمالي' : 'Labour Inspection & Guidance';
      } else if (combined.includes('complaint') || combined.includes('نزاع') || combined.includes('شكاوى')) {
        dept = isRTL ? 'إدارة علاقات العمل' : 'Labour Relations Department';
      }
      imported.push({
        id: uuidv4(),
        matter: item.title,
        dept,
        status: 'pending'
      });
    });
    (data.bilateralAgreements || []).filter(a => a.status === 'pending').forEach(item => {
      imported.push({
        id: uuidv4(),
        matter: item.title,
        dept: isRTL ? 'إدارة العلاقات الدولية' : 'International Relations',
        status: 'pending'
      });
    });
    if (imported.length === 0) {
      alert(isRTL ? 'لم يتم العثور على اتفاقيات سابقة أو مستجدات لاستيرادها.' : 'No previous agreements or pending files found to import.');
      return;
    }
    setData(prev => ({
      ...prev,
      pendingMatters: [...(prev.pendingMatters || []), ...imported]
    }));
  };

  const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
    const reportId = id || `r-${uuidv4().slice(0, 8)}`;
    const newReport: Report = { 
      id: reportId, 
      userId: user?.id || 'u-admin', 
      title: reportTitle || `Report for ${data.country || 'Unknown'}`, 
      status, 
      updatedAt: new Date().toISOString(), 
      data 
    };
    await MockService.saveReport(newReport);
    if (status === 'completed') navigate('/dashboard');
    else if (!id) navigate(`/wizard/${reportId}`);
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const SectionVisibilityToggle = ({
    sectionKey,
    label,
    description,
  }: {
    sectionKey: keyof NonNullable<ReportData['sectionVisibility']>;
    label: string;
    description?: string;
  }) => {
    const isVisible = data.sectionVisibility?.[sectionKey] !== false;
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-2xs mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${isVisible ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
            <FileText size={15} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {label}
            </p>
            {description && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={isVisible}
            onChange={(e) => {
              setData({
                ...data,
                sectionVisibility: {
                  ...(data.sectionVisibility || {}),
                  [sectionKey]: e.target.checked
                }
              });
            }}
          />
          <div className="w-10 h-5.5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
          <span className="ms-2.5 text-xs font-bold text-gray-700 dark:text-gray-200">
            {isVisible ? (isRTL ? 'مدرج في التقرير' : 'Included') : (isRTL ? 'مستبعد' : 'Excluded')}
          </span>
        </label>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <SectionVisibilityToggle 
               sectionKey="profileEconomy" 
               label={isRTL ? 'تضمين صفحة النبذة التعريفية وسوق العمل (الصفحة 3)' : 'Include Profile & Economy Page (Page 3)'}
               description={isRTL ? 'التحكم في ظهور صفحة النبذة التعريفية في التقرير المطبوع / PDF' : 'Toggle whether Page 3 is generated in print and PDF views'}
             />

             <div className="border-b dark:border-gray-700 pb-4 mb-4">
               <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 mb-2"><FileText size={20} /> {t('reportDetails')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label={t('reportTitle')} value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
                 <Input label={t('reportDate')} type="date" value={data.reportDate} onChange={e => setData({...data, reportDate: e.target.value})} />
               </div>
             </div>

             <div className="flex flex-col md:flex-row gap-6 items-start bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 shadow-sm">
               <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div 
                      className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer overflow-hidden shadow-md hover:border-primary transition-all" 
                      onClick={() => document.getElementById('flag-upload')?.click()}
                    >
                       {(() => {
                          const getAIUrl = (c: string) => {
                            const l = (c || '').toLowerCase();
                            if (l.includes('india')) return 'https://flagcdn.com/w160/in.png';
                            if (l.includes('philippines')) return 'https://flagcdn.com/w160/ph.png';
                            if (l.includes('pakistan')) return 'https://flagcdn.com/w160/pk.png';
                            if (l.includes('bangladesh')) return 'https://flagcdn.com/w160/bd.png';
                            if (l.includes('vietnam')) return 'https://flagcdn.com/w160/vn.png';
                            return 'https://flagcdn.com/w160/ae.png';
                          };
                          const src = data.flagUrl || getAIUrl(data.country);
                          return <img src={src} className="w-full h-full object-cover" alt="Flag" />;
                       })()}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <UploadCloud className="text-white" size={24} />
                       </div>
                    </div>
                    {data.flagUrl && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setData({...data, flagUrl: ''}); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                        title="Reset to AI flag"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => document.getElementById('flag-upload')?.click()} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight">Upload Flag</button>
                  <input type="file" id="flag-upload" className="hidden" accept="image/*" onChange={(e) => { 
                    const file = e.target.files?.[0]; 
                    if (file) { 
                      const reader = new FileReader(); 
                      reader.onloadend = () => setData(prev => ({ ...prev, flagUrl: reader.result as string })); 
                      reader.readAsDataURL(file); 
                    } 
                  }} />
               </div>
               <div className="flex-1 w-full space-y-4">
                  <div className="flex gap-2 items-end">
                    <Input 
                      label={t('country')} 
                      value={data.country} 
                      onChange={e => setData({...data, country: e.target.value})} 
                      onBlur={() => fetchFlag(data.country)}
                      placeholder="e.g. India" 
                    />
                    <Button onClick={handleFetchData} disabled={isFetchingAI} className="mb-0.5">
                      {isFetchingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} 
                      {t('fetchData')}
                    </Button>
                  </div>
                  <Input label="Manual Flag URL" value={data.flagUrl?.startsWith('http') ? data.flagUrl : ''} onChange={e => setData({...data, flagUrl: e.target.value})} placeholder="Paste URL (OneDrive/Public)..." className="text-xs py-1.5" />
               </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={t('capital')} value={data.capital} onChange={e => setData({...data, capital: e.target.value})} />
              <Input label={t('officialLanguage')} value={data.officialLanguage} onChange={e => setData({...data, officialLanguage: e.target.value})} />
              <Input label={t('population')} value={data.population} onChange={e => setData({...data, population: e.target.value})} />
              <Input label={t('currency')} value={data.currency} onChange={e => setData({...data, currency: e.target.value})} />
              <Input label={t('gdp')} value={data.gdp} onChange={e => setData({...data, gdp: e.target.value})} />
              <Input label={t('hdi')} value={data.hdi} onChange={e => setData({...data, hdi: e.target.value})} />
              <Input label={t('crimeRate')} value={data.crimeRate} onChange={e => setData({...data, crimeRate: e.target.value})} />
              <Input label={t('literacyRate')} value={data.literacyRate} onChange={e => setData({...data, literacyRate: e.target.value})} />
              <Input label={t('governmentType')} value={data.governmentType} onChange={e => setData({...data, governmentType: e.target.value})} />
              <Input label={t('workforceMinistry')} value={data.workforceMinistry} onChange={e => setData({...data, workforceMinistry: e.target.value})} />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300">{t('directFlight')}</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={data.directFlight ? "true" : "false"}
                  onChange={e => setData({...data, directFlight: e.target.value === "true"})}
                >
                  <option value="true">{t('yesDirect')}</option>
                  <option value="false">{t('noDirect')}</option>
                </select>
              </div>
              <Input label={t('totalWorkersInUae')} value={data.totalWorkersInUae || ''} onChange={e => setData({...data, totalWorkersInUae: e.target.value})} placeholder="e.g. 150,000" />
              <Input label={t('unemploymentRate')} value={data.unemploymentRate || ''} onChange={e => setData({...data, unemploymentRate: e.target.value})} placeholder="e.g. 5.2%" />
            </div>

            {/* Executive Brief (Page 2) Comprehensive Controls */}
            <div className="mt-8 pt-6 border-t dark:border-gray-700 space-y-6">
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-primary leading-tight">
                        {isRTL ? 'إعدادات وبيانات الملخص التنفيذي (Executive Brief)' : 'Executive Brief Data & Controls'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isRTL ? 'تخصيص البيانات التي تظهر مباشرة في الصفحة 2 من التقرير' : 'Customize the fields featured directly on Page 2'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                    {isRTL ? 'الصفحة 2' : 'Page 2'}
                  </span>
                </div>

                {/* 1. Relationship One-Liner / Summary */}
                <div className="mb-5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {isRTL ? 'ملخص مسار العلاقات الثنائية (جملة واحدة استراتيجية)' : 'Relationship Overview (Strategic One-Liner)'}
                  </label>
                  <textarea
                    className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={2}
                    placeholder={isRTL ? 'مثال: شراكة عمالية استراتيجية تضم أكثر من 150 ألف عامل ومؤطرة باتفاقيات ثنائية لتعزيز الاستقرار وحماية الحقوق...' : 'e.g. A strategic labour partnership covering over 150k workers anchored by active bilateral agreements...'}
                    value={data.summary || ''}
                    onChange={e => setData({ ...data, summary: e.target.value })}
                  />
                </div>

                {/* 2. MOU Signed with MOHRE (User requested custom block) */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5 shadow-2xs">
                  <h5 className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                    <FileText size={15} />
                    {isRTL ? 'هل توجد مذكرة تفاهم موقعة مع الوزارة؟' : 'MoU Signed with MOHRE?'}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'حالة التوقيع' : 'Signed Status'}
                      </label>
                      <select
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.mouSignedWithMohre?.signed === true || data.mouSignedWithMohre?.signed === 'yes' ? 'yes' : (data.mouSignedWithMohre?.signed === false || data.mouSignedWithMohre?.signed === 'no' ? 'no' : '')}
                        onChange={e => setData({
                          ...data,
                          mouSignedWithMohre: {
                            ...(data.mouSignedWithMohre || {}),
                            signed: e.target.value === 'yes' ? 'yes' : (e.target.value === 'no' ? 'no' : undefined)
                          }
                        })}
                      >
                        <option value="">{isRTL ? '— غير محدد (تلقائي) —' : '— Auto-detect —'}</option>
                        <option value="yes">{isRTL ? 'نعم (موقعة)' : 'Yes (Signed)'}</option>
                        <option value="no">{isRTL ? 'لا (غير موقعة)' : 'No (Not Signed)'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'تاريخ التوقيع' : 'Date of Signing'}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        placeholder={isRTL ? 'مثال: 2018 أو 14/05/2018' : 'e.g. 2018 or 14/05/2018'}
                        value={data.mouSignedWithMohre?.signedDate || ''}
                        onChange={e => setData({
                          ...data,
                          mouSignedWithMohre: {
                            ...(data.mouSignedWithMohre || {}),
                            signedDate: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'نوع المذكرة' : 'MoU Type'}
                      </label>
                      <select
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.mouSignedWithMohre?.type || ''}
                        onChange={e => setData({
                          ...data,
                          mouSignedWithMohre: {
                            ...(data.mouSignedWithMohre || {}),
                            type: e.target.value
                          }
                        })}
                      >
                        <option value="">{isRTL ? '— اختر النوع —' : '— Select Type —'}</option>
                        <option value="domestic">{isRTL ? 'عمالة مساعدة (Domestic)' : 'Domestic Labour'}</option>
                        <option value="general">{isRTL ? 'عمالة عامة (General)' : 'General Labour'}</option>
                        <option value="both">{isRTL ? 'كلاهما (عامة ومساعدة)' : 'Both (General & Domestic)'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Last Meeting (اللقاء الأخير) */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5 shadow-2xs">
                  <h5 className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                    <Calendar size={15} />
                    {isRTL ? 'اللقاء الأخير' : 'Last Meeting'}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'تاريخ اللقاء' : 'Meeting Date'}
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.lastMeeting?.date || ''}
                        onChange={e => setData({
                          ...data,
                          lastMeeting: {
                            ...(data.lastMeeting || {}),
                            date: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'نوع اللقاء' : 'Meeting Type'}
                      </label>
                      <select
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.lastMeeting?.type || ''}
                        onChange={e => setData({
                          ...data,
                          lastMeeting: {
                            ...(data.lastMeeting || {}),
                            type: e.target.value
                          }
                        })}
                      >
                        <option value="">{isRTL ? '— اختر النوع —' : '— Select Type —'}</option>
                        <option value="اللجنة المشتركة (JCM)">{isRTL ? 'اللجنة المشتركة (JCM)' : 'Joint Committee (JCM)'}</option>
                        <option value="اللجنة الوزارية / الفنية (TCM)">{isRTL ? 'اللجنة الوزارية / الفنية (TCM)' : 'Ministerial / Technical (TCM)'}</option>
                        <option value="اجتماع ثنائي">{isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'}</option>
                        <option value="أخرى">{isRTL ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'مسمى اللقاء' : 'Meeting Title'}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        placeholder={isRTL ? 'مثال: اجتماع الدورة الرابعة للجنة الفنية المشتركة' : 'e.g. 4th Joint Committee Session'}
                        value={data.lastMeeting?.title || ''}
                        onChange={e => setData({
                          ...data,
                          lastMeeting: {
                            ...(data.lastMeeting || {}),
                            title: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'موجز ما تم بحثه' : 'Coverage Summary'}
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {(data.lastMeeting?.coverage || '').length}/130 {isRTL ? 'حرف' : 'chars'}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={130}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                      placeholder={isRTL ? 'موجز مختصر للمباحثات (بحد أقصى 130 حرف حتى لا يتجاوز الحجم المخصص)...' : 'Brief discussion summary (max 130 chars)...'}
                      value={data.lastMeeting?.coverage || ''}
                      onChange={e => setData({
                        ...data,
                        lastMeeting: {
                          ...(data.lastMeeting || {}),
                          coverage: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                {/* 4. Last Correspondence (آخر مراسلة) */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5 shadow-2xs">
                  <h5 className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                    <Mail size={15} />
                    {isRTL ? 'آخر مراسلة' : 'Last Correspondence'}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'الاتجاه' : 'Direction'}
                      </label>
                      <select
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.lastCorrespondence?.direction || 'outgoing'}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            direction: e.target.value
                          }
                        })}
                      >
                        <option value="outgoing">{isRTL ? 'صادرة' : 'Outgoing'}</option>
                        <option value="incoming">{isRTL ? 'واردة' : 'Incoming'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'الحالة' : 'Status'}
                      </label>
                      <select
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.lastCorrespondence?.status || 'awaiting_reply'}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            status: e.target.value
                          }
                        })}
                      >
                        <option value="awaiting_reply">{isRTL ? 'بانتظار الرد' : 'Awaiting Reply'}</option>
                        <option value="actioned">{isRTL ? 'تم اتخاذ الإجراء' : 'Actioned'}</option>
                        <option value="closed">{isRTL ? 'مغلقة' : 'Closed'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        value={data.lastCorrespondence?.date || ''}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            date: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'رقم القيد' : 'Reference Number'}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                        placeholder="REF/MOHRE/2024/091"
                        value={data.lastCorrespondence?.ref || ''}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            ref: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isRTL ? 'الموضوع' : 'Subject'}
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {(data.lastCorrespondence?.subject || '').length}/120 {isRTL ? 'حرف' : 'chars'}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={120}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                      placeholder={isRTL ? 'موضوع المراسلة (بحد أقصى 120 حرف حتى لا يتجاوز الحجم المخصص)...' : 'Subject of correspondence (max 120 chars)...'}
                      value={data.lastCorrespondence?.subject || ''}
                      onChange={e => setData({
                        ...data,
                        lastCorrespondence: {
                          ...(data.lastCorrespondence || {}),
                          subject: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                {/* 5. Requires Attention (ملاحظات وتنبيهات تتطلب الانتباه قبل الاجتماع - Max 4 items) */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <ShieldAlert size={15} className="text-amber-600" />
                      {isRTL ? 'ملاحظات وتنبيهات تتطلب الانتباه قبل الاجتماع (بحد أقصى 4 بنود)' : 'Pre-Meeting Attention Notes (Max 4 Items)'}
                    </h5>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                      {(data.attentionNotes || []).length}/4
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                    {isRTL 
                      ? 'أدخل حتى 4 نقاط جوهرية تستدعي انتباه معالي الوزير أو رئيس الوفد قبل الاجتماع (في حال تركها فارغة، يستخرج النظام تلقائياً التنبيهات من البيانات المسجلة).' 
                      : 'Enter up to 4 critical points requiring attention before the meeting (if left empty, the brief auto-generates flags from data).'}
                  </p>

                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((noteIdx) => {
                      const currentNotes = data.attentionNotes || [];
                      const noteValue = currentNotes[noteIdx] || '';
                      return (
                        <div key={noteIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                            {noteIdx + 1}
                          </span>
                          <input
                            type="text"
                            maxLength={125}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400/40"
                            placeholder={isRTL ? `التنبيه ${noteIdx + 1} (بحد أقصى 125 حرف)...` : `Attention flag ${noteIdx + 1} (max 125 chars)...`}
                            value={noteValue}
                            onChange={(e) => {
                              const updated = [...currentNotes];
                              updated[noteIdx] = e.target.value;
                              setData({
                                ...data,
                                attentionNotes: updated
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Pending Matters (المواضيع تحت المراجعة - Matters Under Review) */}
                <div className="mt-5">
                  <PendingMattersEditor
                    pendingMatters={data.pendingMatters || []}
                    onChange={(matters) => setData({ ...data, pendingMatters: matters })}
                    isRTL={isRTL}
                    onAutoImport={handleAutoImportPendingMatters}
                    showAutoImport={(data.previousAgreementsAndUpdates || []).length > 0 || (data.bilateralAgreements || []).some(a => a.status === 'pending')}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <SectionVisibilityToggle 
               sectionKey="uaeWorkforce" 
               label={isRTL ? 'تضمين صفحة سوق العمل في دولة الإمارات (الصفحة 4)' : 'Include UAE Labour Market Page (Page 4)'}
               description={isRTL ? 'التحكم في ظهور صفحة سوق العمل الإماراتي وإحصائيات العمالة في التقرير' : 'Toggle whether Page 4 is generated in print and PDF views'}
             />
              {/* Total Workforce Override Card */}
              <Card className="p-4 border border-gray-200 bg-gray-50/50 dark:bg-gray-900/30">
                <h5 className="font-bold text-sm mb-1 text-amber-600 flex items-center gap-2 font-sans">
                  <Users size={16} />
                  {language === 'ar' ? 'إجمالي القوى العاملة وجدولة التاريخ (تعديل يدوي)' : 'Total Workforce & Month/Year Dynamic Settings (Manual Override)'}
                </h5>
                <p className="text-xs text-gray-500 mb-3 leading-normal">
                  {language === 'ar' 
                    ? 'يمكنك ضبط إجمالي القوى العاملة بالدولة وكذلك تحديد الشهر والسنة اللذين يظهران بجانب عنوان قسم "القوى العاملة في دولة الإمارات".' 
                    : 'You can define the total workforce and specify the month/year that will be featured on the "UAE Workforce" header.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input 
                      type="number" 
                      label={language === 'ar' ? 'إجمالي العمالة اليدوي' : 'Manual Total Workers'} 
                      placeholder={language === 'ar' ? 'مثال: 5500000' : 'e.g. 5500000'}
                      value={data.uaeWorkforceStats.totalWorkersOverride || ''} 
                      onChange={e => {
                        const val = e.target.value === '' ? undefined : Number(e.target.value);
                        setData({
                          ...data, 
                          uaeWorkforceStats: {
                            ...data.uaeWorkforceStats, 
                            totalWorkersOverride: val
                          }
                        });
                      }} 
                    />
                  </div>
                  <div>
                    <Input 
                      type="text" 
                      label={language === 'ar' ? 'الشهر والسنة للتقرير (مثال: يونيو 2026)' : 'Month & Year of Report (e.g., June 2026)'} 
                      placeholder={language === 'ar' ? 'اتركه فارغاً للتاريخ التلقائي' : 'Leave empty for auto current date'}
                      value={data.reportMonthYear || ''} 
                      onChange={e => {
                        setData({
                          ...data, 
                          reportMonthYear: e.target.value
                        });
                      }} 
                    />
                  </div>
                </div>
              </Card>

             {/* Main MOHRE / ICP Private/Domestic and Emirate Totals */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 border-l-4 border-l-primary">
                  <h5 className="font-bold text-sm mb-2">{t('mohreData')}</h5>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Input label="Private Sector" value={data.uaeWorkforceStats.mohre.totalPrivate.value} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalPrivate: {...data.uaeWorkforceStats.mohre.totalPrivate, value: e.target.value}}}})} />
                      <Input label="Domestic Workers" value={data.uaeWorkforceStats.mohre.totalDomestic.value} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalDomestic: {...data.uaeWorkforceStats.mohre.totalDomestic, value: e.target.value}}}})} />
                    </div>
                    <Input 
                      label="As of (MOHRE Data)" 
                      type="month" 
                      value={data.uaeWorkforceStats.mohre.totalPrivate.date || data.uaeWorkforceStats.mohre.totalDomestic.date} 
                      onChange={e => setData({
                        ...data, 
                        uaeWorkforceStats: {
                          ...data.uaeWorkforceStats, 
                          mohre: {
                            ...data.uaeWorkforceStats.mohre, 
                            totalPrivate: {...data.uaeWorkforceStats.mohre.totalPrivate, date: e.target.value},
                            totalDomestic: {...data.uaeWorkforceStats.mohre.totalDomestic, date: e.target.value}
                          }
                        }
                      })} 
                    />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-sm text-gray-900 dark:text-gray-100">{t('icpData')}</h5>
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      {isRTL ? 'الهيئة الاتحادية للهوية' : 'Federal ICP'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">{t('icpDisclaimer')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                        {isRTL ? 'إجمالي عمال ICP (من الإمارات)' : 'Total ICP Workers (Sum of Emirates)'}
                      </label>
                      <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                        {EMIRATES_CONFIG.reduce((acc, em) => acc + getEmirateVal('icp', em.id), 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Input 
                        label={isRTL ? 'تجاوز إجمالي العمال (اختياري)' : 'Total Workers Override (Optional)'} 
                        type="number"
                        placeholder="e.g. 3500000"
                        value={data.uaeWorkforceStats.totalWorkersOverride ?? ''} 
                        onChange={e => setData({
                          ...data, 
                          uaeWorkforceStats: {
                            ...data.uaeWorkforceStats, 
                            totalWorkersOverride: e.target.value === '' ? undefined : Number(e.target.value)
                          }
                        })} 
                      />
                    </div>
                  </div>
                </Card>
             </div>

             {/* Dynamic Unemployment Insurance and Worker Rights Systems */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Unemployment Insurance System */}
                <Card className="p-4 bg-white dark:bg-gray-800 border space-y-4">
                  <h5 className="font-bold text-xs text-primary uppercase tracking-wider">نظام التأمين ضد التعطل عن العمل (Unemployment Insurance)</h5>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{t('unemploymentInsuranceCoverageRate')}</p>
                    <div className="flex gap-4">
                      <Input label="Number (عدد)" placeholder="e.g. 5,000,000" value={data.uaeWorkforceStats.mohre.insuranceUnemploymentCoveredNum || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceUnemploymentCoveredNum: e.target.value}}})} />
                      <Input label="Percentage (نسبة)" placeholder="e.g. 98%" value={data.uaeWorkforceStats.mohre.insuranceUnemploymentCoveredPct || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceUnemploymentCoveredPct: e.target.value}}})} />
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{t('insuranceUnemploymentExposed')}</p>
                    <div className="flex gap-4">
                      <Input label="Number (عدد)" placeholder="e.g. 100,000" value={data.uaeWorkforceStats.mohre.insuranceUnemploymentExposedNum || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceUnemploymentExposedNum: e.target.value}}})} />
                      <Input label="Percentage (نسبة)" placeholder="e.g. 2%" value={data.uaeWorkforceStats.mohre.insuranceUnemploymentExposedPct || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceUnemploymentExposedPct: e.target.value}}})} />
                    </div>
                  </div>
                </Card>

                {/* Worker Rights Insurance System */}
                <Card className="p-4 bg-white dark:bg-gray-800 border space-y-4">
                  <h5 className="font-bold text-xs text-amber-600 uppercase tracking-wider font-sans">نظام التأمين على حقوق العمالة (Workers Rights Insurance)</h5>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{t('insuranceRightsCovered')}</p>
                    <div className="flex gap-4">
                      <Input label="Number (عدد)" placeholder="e.g. 4,500,000" value={data.uaeWorkforceStats.mohre.insuranceRightsCoveredNum || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceRightsCoveredNum: e.target.value}}})} />
                      <Input label="Percentage (نسبة)" placeholder="e.g. 90%" value={data.uaeWorkforceStats.mohre.insuranceRightsCoveredPct || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceRightsCoveredPct: e.target.value}}})} />
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{t('insuranceRightsExposed')}</p>
                    <div className="flex gap-4">
                      <Input label="Number (عدد)" placeholder="e.g. 500,000" value={data.uaeWorkforceStats.mohre.insuranceRightsExposedNum || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceRightsExposedNum: e.target.value}}})} />
                      <Input label="Percentage (نسبة)" placeholder="e.g. 10%" value={data.uaeWorkforceStats.mohre.insuranceRightsExposedPct || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, insuranceRightsExposedPct: e.target.value}}})} />
                    </div>
                  </div>
                </Card>
             </div>

             {/* WPS and other indicators */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* WPS Group */}
                <Card className="p-4 bg-white dark:bg-gray-800 border space-y-4">
                  <h5 className="font-bold text-xs text-emerald-600 uppercase tracking-wider font-sans">نظام حماية الأجور (Wages Protection System)</h5>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                    <p className="text-[11px] font-bold text-gray-700 leading-normal">{t('wpsWageTransferRate')}</p>
                    <div className="flex gap-4">
                      <Input label="Number (عدد)" placeholder="e.g. 4,800,000" value={data.uaeWorkforceStats.mohre.wpsWageTransferNum || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, wpsWageTransferNum: e.target.value}}})} />
                      <Input label="Percentage (نسبة)" placeholder="e.g. 96%" value={data.uaeWorkforceStats.mohre.wpsWageTransferPct || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, wpsWageTransferPct: e.target.value}}})} />
                    </div>
                  </div>
                </Card>

                {/* Wage Median, Strikes & Complaints Group */}
                <Card className="p-4 bg-white dark:bg-gray-800 border space-y-4">
                  <h5 className="font-bold text-xs text-amber-600 uppercase tracking-wider font-sans">
                    {language === 'ar' ? 'شكاوى عمالية وإضرابات ومقارنة الرواتب' : 'Labor Complaints, Strikes & Wages'}
                  </h5>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Input 
                        label={language === 'ar' ? 'إجمالي عدد الشكاوى العمالية للسنة الحالية' : 'Total Labor Complaints (Current Year)'} 
                        placeholder="e.g. 14,250" 
                        value={data.uaeWorkforceStats.mohre.totalComplaintsCurrentYear || ''} 
                        onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalComplaintsCurrentYear: e.target.value}}})} 
                      />
                      <Input 
                        label={language === 'ar' ? 'شكاوى عمالية قيد البحث' : 'Complaints Under Review'} 
                        placeholder="e.g. 320" 
                        value={data.uaeWorkforceStats.mohre.laborComplaintsUnderReview || ''} 
                        onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, laborComplaintsUnderReview: e.target.value}}})} 
                      />
                    </div>

                    <Input label={t('workersLaborStrikes')} placeholder="e.g. 0" value={data.uaeWorkforceStats.mohre.workersLaborStrikes || ''} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, workersLaborStrikes: e.target.value}}})} />
                    
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">مقارنة وسيط الرواتب حسب المستوى المهاري (Median Wage Comparison by Skill Level)</p>
                      <div className="grid grid-cols-3 gap-2 items-center text-[10px] font-bold text-gray-500 mb-1">
                        <div>المستوى المهاري</div>
                        <div>وسيط الراتب للجنسية</div>
                        <div>وسيط الراتب لسوق العمل</div>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Skilled Row */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-xs font-semibold dark:text-white">ماهر (Skilled)</span>
                          <input 
                            type="text" 
                            className="w-full text-xs font-mono border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            placeholder="e.g. AED 4,500" 
                            value={data.uaeWorkforceStats.mohre.skilledPartnerWage || ''} 
                            onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, skilledPartnerWage: e.target.value}}})} 
                          />
                          <input 
                            type="text" 
                            className="w-full text-xs font-mono border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            placeholder="e.g. AED 5,000" 
                            value={data.uaeWorkforceStats.mohre.skilledUaeWage || ''} 
                            onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, skilledUaeWage: e.target.value}}})} 
                          />
                        </div>

                        {/* Unskilled Row */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-xs font-semibold dark:text-white">غير ماهر (Unskilled)</span>
                          <input 
                            type="text" 
                            className="w-full text-xs font-mono border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            placeholder="e.g. AED 1,200" 
                            value={data.uaeWorkforceStats.mohre.unskilledPartnerWage || ''} 
                            onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, unskilledPartnerWage: e.target.value}}})} 
                          />
                          <input 
                            type="text" 
                            className="w-full text-xs font-mono border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            placeholder="e.g. AED 1,500" 
                            value={data.uaeWorkforceStats.mohre.unskilledUaeWage || ''} 
                            onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, unskilledUaeWage: e.target.value}}})} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 3-Year Workforce History & Trend Card */}
                <div className="col-span-1 md:col-span-2">
                  <Card className="p-5 bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-sky-100 dark:border-sky-800">
                      <div>
                        <h5 className="font-bold text-sm text-primary uppercase tracking-wider font-sans">
                          {language === 'ar' ? 'إجمالي العمالة خلال آخر 3 سنوات ونسبة التغير' : 'Workforce History (Last 3 Years) & Growth Trend'}
                        </h5>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {language === 'ar' 
                            ? 'أدخل أعداد العمالة للسنة الحالية والسنتين السابقتين لحساب نسبة الزيادة أو النقصان وإجمالي الـ 3 سنوات تلقائياً.' 
                            : 'Enter workforce numbers for current and last 2 years to calculate growth percentage and 3-year total automatically.'}
                        </p>
                      </div>
                      {(() => {
                        const h = data.uaeWorkforceStats.workersHistory || {};
                        const currCalc = (h.totalCurrent !== undefined && h.totalCurrent !== null && h.totalCurrent > 0)
                          ? h.totalCurrent
                          : (data.uaeWorkforceStats.totalWorkersOverride || ((data.uaeWorkforceStats.mohre.byEmirate || []).reduce((acc, c) => acc + (c.value || 0), 0) + (data.uaeWorkforceStats.icp?.byEmirate || []).reduce((acc, c) => acc + (c.value || 0), 0)));
                        const prev = h.totalPrevious || 0;
                        if (prev > 0) {
                          const diff = Number(currCalc) - Number(prev);
                          const pct = ((diff) / Number(prev)) * 100;
                          const isInc = diff >= 0;
                          return (
                            <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-black flex items-center gap-1.5 ${isInc ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                              <span>{isInc ? '▲' : '▼'}</span>
                              <span>{isInc ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}</span>
                              <span className="font-sans font-bold">({isInc ? (language === 'ar' ? 'زيادة' : 'Increase') : (language === 'ar' ? 'انخفاض' : 'Decrease')})</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Two Years Ago */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border space-y-2">
                        <Input 
                          label={language === 'ar' ? 'السنة (قبل سنتين)' : 'Year (2 Years Ago)'} 
                          placeholder="e.g. 2022" 
                          value={data.uaeWorkforceStats.workersHistory?.yearTwoYearsAgo || ''} 
                          onChange={e => setData({
                            ...data,
                            uaeWorkforceStats: {
                              ...data.uaeWorkforceStats,
                              workersHistory: {
                                ...(data.uaeWorkforceStats.workersHistory || {}),
                                yearTwoYearsAgo: e.target.value
                              }
                            }
                          })}
                        />
                        <Input 
                          type="number"
                          label={language === 'ar' ? 'إجمالي العمالة' : 'Total Workers'} 
                          placeholder="e.g. 4800000" 
                          value={data.uaeWorkforceStats.workersHistory?.totalTwoYearsAgo || ''} 
                          onChange={e => {
                            const val = e.target.value === '' ? undefined : Number(e.target.value);
                            setData({
                              ...data,
                              uaeWorkforceStats: {
                                ...data.uaeWorkforceStats,
                                workersHistory: {
                                ...(data.uaeWorkforceStats.workersHistory || {}),
                                totalTwoYearsAgo: val
                              }
                            }
                          });
                        }}
                      />
                    </div>

                    {/* Previous Year */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border space-y-2">
                      <Input 
                        label={language === 'ar' ? 'السنة السابقة' : 'Previous Year'} 
                        placeholder="e.g. 2023" 
                        value={data.uaeWorkforceStats.workersHistory?.yearPrevious || ''} 
                        onChange={e => setData({
                          ...data,
                          uaeWorkforceStats: {
                            ...data.uaeWorkforceStats,
                            workersHistory: {
                              ...(data.uaeWorkforceStats.workersHistory || {}),
                              yearPrevious: e.target.value
                            }
                          }
                        })}
                      />
                      <Input 
                        type="number"
                        label={language === 'ar' ? 'إجمالي العمالة' : 'Total Workers'} 
                        placeholder="e.g. 5100000" 
                        value={data.uaeWorkforceStats.workersHistory?.totalPrevious || ''} 
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setData({
                            ...data,
                            uaeWorkforceStats: {
                              ...data.uaeWorkforceStats,
                              workersHistory: {
                                ...(data.uaeWorkforceStats.workersHistory || {}),
                                totalPrevious: val
                              }
                            }
                          });
                        }}
                      />
                    </div>

                    {/* Current Year */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-primary/40 ring-1 ring-primary/20 space-y-2">
                      <Input 
                        label={language === 'ar' ? 'السنة الحالية' : 'Current Year'} 
                        placeholder="e.g. 2024" 
                        value={data.uaeWorkforceStats.workersHistory?.yearCurrent || ''} 
                        onChange={e => setData({
                          ...data,
                          uaeWorkforceStats: {
                            ...data.uaeWorkforceStats,
                            workersHistory: {
                              ...(data.uaeWorkforceStats.workersHistory || {}),
                              yearCurrent: e.target.value
                            }
                          }
                        })}
                      />
                      <Input 
                        type="number"
                        label={language === 'ar' ? 'إجمالي العمالة (فارغ = التلقائي)' : 'Total Workers (empty = auto)'} 
                        placeholder={String(data.uaeWorkforceStats.totalWorkersOverride || ((data.uaeWorkforceStats.mohre.byEmirate || []).reduce((acc, c) => acc + (c.value || 0), 0) + (data.uaeWorkforceStats.icp?.byEmirate || []).reduce((acc, c) => acc + (c.value || 0), 0)) || '5500000')} 
                        value={data.uaeWorkforceStats.workersHistory?.totalCurrent || ''} 
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setData({
                            ...data,
                            uaeWorkforceStats: {
                              ...data.uaeWorkforceStats,
                              workersHistory: {
                                ...(data.uaeWorkforceStats.workersHistory || {}),
                                totalCurrent: val
                              }
                            }
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* 3-Year Summary Row */}
                  {(() => {
                    const h = data.uaeWorkforceStats.workersHistory || {};
                    const currVal = (h.totalCurrent !== undefined && h.totalCurrent !== null && h.totalCurrent > 0)
                      ? Number(h.totalCurrent)
                      : (data.uaeWorkforceStats.totalWorkersOverride || ((data.uaeWorkforceStats.mohre.byEmirate || []).reduce((acc, c) => acc + (c.value || 0), 0) + (data.uaeWorkforceStats.icp?.byEmirate || []).reduce((acc, c) => acc + (c.value || 0), 0)));
                    const prevVal = Number(h.totalPrevious || 0);
                    const twoYearsAgoVal = Number(h.totalTwoYearsAgo || 0);
                    const baseVal = prevVal > 0 ? prevVal : twoYearsAgoVal;
                    let pctChange: number | null = null;
                    let diff: number | null = null;
                    if (baseVal > 0) {
                      diff = currVal - baseVal;
                      pctChange = (diff / baseVal) * 100;
                    }
                    const isIncrease = diff !== null && diff >= 0;

                    return (
                      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px] font-bold uppercase">
                            {language === 'ar' ? (isIncrease ? 'نسبة ومقدار النمو (تلقائي)' : 'نسبة ومقدار التغير (تلقائي)') : 'Calculated Growth & Change'}
                          </span>
                          {pctChange !== null && diff !== null ? (
                            <span className={`font-mono font-black text-sm flex items-center gap-1.5 ${isIncrease ? 'text-emerald-600' : 'text-rose-600'}`}>
                              <span>{isIncrease ? '▲' : '▼'}</span>
                              <span>{isIncrease ? `+${pctChange.toFixed(1)}%` : `${pctChange.toFixed(1)}%`}</span>
                              <span className="text-xs font-normal">({diff >= 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()})</span>
                            </span>
                          ) : (
                            <span className="font-mono font-black text-sm text-gray-400">---</span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] font-bold uppercase">{language === 'ar' ? 'العمالة المحتسبة للعام الحالي' : 'Current Year Value'}</span>
                          <span className="font-mono font-black text-sm text-gray-700 dark:text-gray-300">{Number(currVal).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              </div>
             </div>

             {/* Workers by Emirate: Unified MOHRE & ICP Section with Two Inputs Per Emirate */}
             <div className="pt-6 border-t">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <div>
                    <h5 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Building size={18} className="text-primary" />
                      {t('workersByEmirate')}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isRTL 
                        ? 'إدخال بيانات العاملين لكل إمارة من خلال مصدري البيانات: وزارة الموارد البشرية (MOHRE) والهيئة الاتحادية للهوية (ICP)' 
                        : 'Two data inputs per emirate from both official sources: MOHRE and ICP'}
                    </p>
                  </div>
                  
                  {/* Summary Totals Bar */}
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border">
                    <div className="text-center px-2">
                      <p className="text-[10px] font-bold text-[#0284c7] uppercase">MOHRE</p>
                      <p className="text-sm font-extrabold font-mono text-[#0284c7]">
                        {EMIRATES_CONFIG.reduce((sum, em) => sum + getEmirateVal('mohre', em.id), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                    <div className="text-center px-2">
                      <p className="text-[10px] font-bold text-[#d97706] uppercase">ICP</p>
                      <p className="text-sm font-extrabold font-mono text-[#d97706]">
                        {EMIRATES_CONFIG.reduce((sum, em) => sum + getEmirateVal('icp', em.id), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                    <div className="text-center px-2">
                      <p className="text-[10px] font-bold text-primary uppercase">{isRTL ? 'الإجمالي' : 'Total'}</p>
                      <p className="text-sm font-extrabold font-mono text-primary">
                        {EMIRATES_CONFIG.reduce((sum, em) => sum + getEmirateVal('mohre', em.id) + getEmirateVal('icp', em.id), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 7 Emirates Grid - 2 inputs per emirate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {EMIRATES_CONFIG.map((em) => {
                    const mohreVal = getEmirateVal('mohre', em.id);
                    const icpVal = getEmirateVal('icp', em.id);
                    const emirateTotal = mohreVal + icpVal;

                    return (
                      <div 
                        key={em.id} 
                        className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100 dark:border-gray-700">
                          <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {isRTL ? em.nameAr : em.nameEn}
                            </span>
                            <span className="text-[11px] text-gray-400 ms-1.5 font-normal">
                              ({isRTL ? em.nameEn : em.nameAr})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md" title={isRTL ? 'إجمالي الإمارة' : 'Emirate Total'}>
                            {emirateTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {/* Input 1: MOHRE */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-[#0284c7] flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                                {isRTL ? 'وزارة الموارد البشرية (MOHRE)' : 'MOHRE (Private Sector)'}
                              </label>
                            </div>
                            <input
                              type="number"
                              min="0"
                              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50/30 dark:bg-sky-950/20 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                              value={mohreVal || ''}
                              placeholder="0"
                              onChange={(e) => setEmirateVal('mohre', em.id, Number(e.target.value) || 0)}
                            />
                          </div>

                          {/* Input 2: ICP */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-[#d97706] flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#d97706]"></span>
                                {isRTL ? 'الهيئة الاتحادية للهوية (ICP)' : 'ICP (Total Residents)'}
                              </label>
                            </div>
                            <input
                              type="number"
                              min="0"
                              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20 focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                              value={icpVal || ''}
                              placeholder="0"
                              onChange={(e) => setEmirateVal('icp', em.id, Number(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>

             {/* Sector Distribution: MOHRE AND ICP */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                   <h5 className="font-bold text-sm mb-3">{t('workersBySector')} (MOHRE)</h5>
                   <div className="space-y-2">
                     {data.uaeWorkforceStats.mohre.bySector.map((sec, idx) => (
                       <div key={idx} className="flex gap-4 mb-2">
                         <Input value={sec.name} className="flex-1" onChange={e => { const list = [...data.uaeWorkforceStats.mohre.bySector]; list[idx].name = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: list}}}); }} />
                         <Input value={sec.value} type="number" className="w-32" onChange={e => { const list = [...data.uaeWorkforceStats.mohre.bySector]; list[idx].value = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: list}}}); }} />
                         <button onClick={() => { const list = data.uaeWorkforceStats.mohre.bySector.filter((_, i) => i !== idx); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: list}}}); }} className="text-red-400"><X size={16} /></button>
                       </div>
                     ))}
                   </div>
                   {data.uaeWorkforceStats.mohre.bySector.length < 25 ? (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: { ...data.uaeWorkforceStats.mohre, bySector: [...data.uaeWorkforceStats.mohre.bySector, { name: '', value: 0 }] }}})}>
                        + Add Sector (MOHRE) ({data.uaeWorkforceStats.mohre.bySector.length})
                      </Button>
                    ) : null}
                    <p className="text-[11px] text-gray-500 mt-1">
                      {language === 'ar' ? 'ملاحظة: يعرض التقرير تلقائياً أعلى 10 قطاعات ويجمع أي قطاعات إضافية كبند حادي عشر (أخرى)' : 'Note: The report displays top 10 sectors and aggregates remaining into 11th (Other)'}
                    </p>
                </div>

                <div>
                   <h5 className="font-bold text-sm mb-3">توزيع العمال حسب القطاع في *(بيانات ICP)</h5>
                   <div className="space-y-2">
                     {(data.uaeWorkforceStats.icp.bySector || []).map((sec, idx) => (
                       <div key={idx} className="flex gap-4 mb-2">
                         <Input value={sec.name} className="flex-1" onChange={e => { const list = [...data.uaeWorkforceStats.icp.bySector]; list[idx].name = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, icp: {...data.uaeWorkforceStats.icp, bySector: list}}}); }} />
                         <Input value={sec.value} type="number" className="w-32" onChange={e => { const list = [...data.uaeWorkforceStats.icp.bySector]; list[idx].value = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, icp: {...data.uaeWorkforceStats.icp, bySector: list}}}); }} />
                         <button onClick={() => { const list = data.uaeWorkforceStats.icp.bySector.filter((_, i) => i !== idx); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, icp: {...data.uaeWorkforceStats.icp, bySector: list}}}); }} className="text-red-400"><X size={16} /></button>
                       </div>
                     ))}
                   </div>
                   {(data.uaeWorkforceStats.icp.bySector || []).length < 25 ? (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, icp: {...data.uaeWorkforceStats.icp, bySector: [...(data.uaeWorkforceStats.icp.bySector || []), { name: '', value: 0 }]}}})}>
                        + Add Sector (ICP) ({(data.uaeWorkforceStats.icp.bySector || []).length})
                      </Button>
                    ) : null}
                    <p className="text-[11px] text-gray-500 mt-1">
                      {language === 'ar' ? 'ملاحظة: يعرض التقرير تلقائياً أعلى 10 قطاعات ويجمع أي قطاعات إضافية كبند حادي عشر (أخرى)' : 'Note: The report displays top 10 sectors and aggregates remaining into 11th (Other)'}
                    </p>
                 </div>
              </div>

              {/* Average Salary per Sector (Median) */}
              <div className="pt-6 mt-6 border-t col-span-1 md:col-span-2">
                 <h5 className="font-bold text-sm mb-3 text-primary dark:text-primary-light">
                   توزيع وسيط الرواتب مقارنة بوسيط سوق العمل على حسب القطاع
                   <span className="block text-xs text-gray-500 font-normal mt-1">
                     Median salary distribution for this nationality compared to the labour market median based on skill level by sector
                   </span>
                 </h5>
                 <div className="space-y-4 max-w-2xl">
                   {(data.uaeWorkforceStats.salaryBySector || []).map((sec, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-gray-50/50 dark:bg-gray-800/40 relative">
                       <div className="flex-1">
                         <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                           القطاع / Sector Name
                         </label>
                         <Input placeholder="e.g. Construction / الإنشاءات" value={sec.name} onChange={e => { const list = [...(data.uaeWorkforceStats.salaryBySector || [])]; list[idx].name = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, salaryBySector: list}}); }} />
                       </div>
                       
                       <div className="w-full md:w-48">
                         <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1">
                           <span className="inline-block w-2 H-2 rounded-full bg-emerald-500"></span>
                           سوق العمل / Labour Market Wide (AED) (أخضر)
                         </label>
                         <Input 
                           placeholder="Labour Market Wide" 
                           value={sec.uaeValue} 
                           type="number" 
                           className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 dark:border-emerald-800"
                           onChange={e => { const list = [...(data.uaeWorkforceStats.salaryBySector || [])]; list[idx].uaeValue = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, salaryBySector: list}}); }} 
                         />
                       </div>

                       <div className="w-full md:w-48">
                         <label className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-1 flex items-center gap-1">
                           <span className="inline-block w-2 H-2 rounded-full bg-blue-500"></span>
                           {data.country || 'Partner'} Salary (AED) (أزرق)
                         </label>
                         <Input 
                           placeholder={`${data.country || 'Partner'} Salary`} 
                           value={sec.partnerValue} 
                           type="number" 
                           className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-800"
                           onChange={e => { const list = [...(data.uaeWorkforceStats.salaryBySector || [])]; list[idx].partnerValue = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, salaryBySector: list}}); }} 
                         />
                       </div>

                       <button onClick={() => { const list = (data.uaeWorkforceStats.salaryBySector || []).filter((_, i) => i !== idx); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, salaryBySector: list}}); }} className="text-red-400 self-end md:mb-2.5 hover:text-red-600 transition-colors"><X size={18} /></button>
                     </div>
                   ))}
                 </div>
                 <Button size="sm" variant="outline" className="mt-3 border-dashed hover:border-solid hover:bg-gray-100" onClick={() => { if ((data.uaeWorkforceStats.salaryBySector || []).length < 10) { setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, salaryBySector: [...(data.uaeWorkforceStats.salaryBySector || []), { name: '', uaeValue: 0, partnerValue: 0 }]}}); } }} disabled={(data.uaeWorkforceStats.salaryBySector || []).length >= 10}>
                    {(data.uaeWorkforceStats.salaryBySector || []).length < 10 ? "+ Add Sector Salary" : "تنبيه: الحد الأقصى هو 10 قطاعات (Max 10 sectors reached)"}
                  </Button>
              </div>

              <div className="hidden">
                 <div>
                </div>
             </div>
          </div>
        );
      case 2:
      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             {currentStep === 2 && (
               <SectionVisibilityToggle 
                 sectionKey="partnerWorkforce" 
                 label={isRTL ? `تضمين صفحة القوى العاملة في ${data.country || 'الدولة الشريكة'}` : `Include ${data.country || 'Partner'} Workforce Page`}
                 description={isRTL ? 'التحكم في ظهور صفحة القوى العاملة ومعدلات الأجور والمهارات في التقرير' : 'Toggle whether partner workforce page is generated in print and PDF views'}
               />
             )}
             {currentStep === 2 ? (
               <>
                 <div className="grid grid-cols-2 gap-6">
                    <Input label={t('avgWage')} value={data.averageWage} onChange={e => setData({...data, averageWage: e.target.value})} placeholder="e.g. 500 USD" />
                    <Input label={t('minWage')} value={data.minimumWage} onChange={e => setData({...data, minimumWage: e.target.value})} placeholder="e.g. 150 USD" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} onChange={e => setData({...data, workforceStats: {...data.workforceStats, totalWorkforce: e.target.value}})} />
                    <Input label={t('maleParticipation')} type="number" value={data.workforceStats.participationMale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationMale: Number(e.target.value)}})} />
                    <Input label={t('femaleParticipation')} type="number" value={data.workforceStats.participationFemale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationFemale: Number(e.target.value)}})} />
                 </div>
                 <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-sm font-semibold">{t('migrationDestinations')}</label>
                     <span className="text-xs text-gray-500 font-mono font-medium">
                       {data.workforceStats.migrationDestinations.length}/5 {language === 'ar' ? '(الحد الأقصى 5 وجهات)' : '(Max 5)'}
                     </span>
                   </div>
                   {data.workforceStats.migrationDestinations.map((dest, i) => (
                     <div key={i} className="flex gap-2 mb-2"><Input value={dest.country} placeholder="Country" onChange={e => { const list = [...data.workforceStats.migrationDestinations]; list[i].country = e.target.value; setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: list}}); }} /><Input value={dest.count} placeholder="Count" onChange={e => { const list = [...data.workforceStats.migrationDestinations]; list[i].count = e.target.value; setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: list}}); }} /><button onClick={() => setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: data.workforceStats.migrationDestinations.filter((_, idx) => idx !== i)}})} className="text-red-400"><X size={16} /></button></div>
                   ))}
                   <Button 
                     size="sm" 
                     variant="outline" 
                     disabled={data.workforceStats.migrationDestinations.length >= 5}
                     onClick={() => {
                       if (data.workforceStats.migrationDestinations.length < 5) {
                         setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: [...data.workforceStats.migrationDestinations, { country: '', count: '' }]}});
                       }
                     }}
                   >
                     {data.workforceStats.migrationDestinations.length >= 5 
                       ? (language === 'ar' ? 'تم الوصول للحد الأقصى (5 وجهات)' : 'Max 5 Destinations Reached') 
                       : '+ Add Destination'}
                   </Button>
                 </div>
                 <div>
                   <label className="text-sm font-semibold mb-2 block">{t('sectorDistribution')}</label>
                   {data.workforceStats.topSectors.map((sec, i) => (
                     <div key={i} className="flex gap-2 mb-2"><Input value={sec.name} placeholder="Sector" onChange={e => { const list = [...data.workforceStats.topSectors]; list[i].name = e.target.value; setData({...data, workforceStats: {...data.workforceStats, topSectors: list}}); }} /><Input value={sec.value} type="number" placeholder="Value" onChange={e => { const list = [...data.workforceStats.topSectors]; list[i].value = Number(e.target.value); setData({...data, workforceStats: {...data.workforceStats, topSectors: list}}); }} /><button onClick={() => setData({...data, workforceStats: {...data.workforceStats, topSectors: data.workforceStats.topSectors.filter((_, idx) => idx !== i)}})} className="text-red-400"><X size={16} /></button></div>
                   ))}
                   <Button size="sm" variant="outline" onClick={() => setData({...data, workforceStats: {...data.workforceStats, topSectors: [...data.workforceStats.topSectors, { name: '', value: 0 }]}})}>+ Add Sector</Button>
                 </div>
                 {/* Fixed: Made Available Skills editable with a tag-like interface */}
                 <div className="pt-6 border-t">
                    <label className="text-sm font-semibold mb-3 block">{t('availableSkills')}</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {data.workforceStats.availableSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-primary/5 text-primary border border-primary/20 px-2 py-1 rounded text-xs font-bold uppercase">
                          {skill}
                          <button onClick={() => {
                            const list = data.workforceStats.availableSkills.filter((_, i) => i !== idx);
                            setData({...data, workforceStats: {...data.workforceStats, availableSkills: list}});
                          }} className="hover:text-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                       <Input 
                        id="skill-input"
                        placeholder="Add a new skill (e.g. Nursing)" 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              setData({...data, workforceStats: {...data.workforceStats, availableSkills: [...data.workforceStats.availableSkills, input.value.trim()]}});
                              input.value = '';
                            }
                          }
                        }}
                       />
                       <Button size="sm" onClick={() => {
                         const input = document.getElementById('skill-input') as HTMLInputElement;
                         if (input.value.trim()) {
                           setData({...data, workforceStats: {...data.workforceStats, availableSkills: [...data.workforceStats.availableSkills, input.value.trim()]}});
                           input.value = '';
                         }
                       }}>Add</Button>
                    </div>
                 </div>
               </>
             ) : (
               <>
                 <div className="grid grid-cols-2 gap-6"><Input label={t('inflation')} value={data.economicStats.inflation} onChange={e => setData({...data, economicStats: {...data.economicStats, inflation: e.target.value}})} /><Input label={t('gdp')} value={data.economicStats.gdp} onChange={e => setData({...data, economicStats: {...data.economicStats, gdp: e.target.value}})} /><Input label={t('exportsToUae')} value={data.economicStats.totalExportsToUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalExportsToUAE: e.target.value}})} /><Input label={t('importsFromUae')} value={data.economicStats.totalImportsFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalImportsFromUAE: e.target.value}})} /></div>
                 
                 <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                    <Input label={t('tipRank')} value={data.economicStats.tipRank} onChange={e => setData({...data, economicStats: {...data.economicStats, tipRank: e.target.value}})} />
                    <Input label={t('remittances')} value={data.economicStats.remittancesFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesFromUAE: e.target.value}})} />
                 </div>

                 <div className="pt-4 border-t">
                    <h5 className="font-bold text-sm mb-3">{t('topExports')}</h5>
                    {data.economicStats.topExportProducts.map((p, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input value={p} onChange={e => { const list = [...data.economicStats.topExportProducts]; list[i] = e.target.value; setData({...data, economicStats: {...data.economicStats, topExportProducts: list}}); }} />
                        <button onClick={() => setData({...data, economicStats: {...data.economicStats, topExportProducts: data.economicStats.topExportProducts.filter((_, idx) => idx !== i)}})} className="text-red-400"><X size={16} /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setData({...data, economicStats: {...data.economicStats, topExportProducts: [...data.economicStats.topExportProducts, '']}})}>+ Add Export Product</Button>
                 </div>

                 <div className="pt-4">
                    <h5 className="font-bold text-sm mb-3">{t('topImports')}</h5>
                    {data.economicStats.topImportProducts.map((p, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input value={p} onChange={e => { const list = [...data.economicStats.topImportProducts]; list[i] = e.target.value; setData({...data, economicStats: {...data.economicStats, topImportProducts: list}}); }} />
                        <button onClick={() => setData({...data, economicStats: {...data.economicStats, topImportProducts: data.economicStats.topImportProducts.filter((_, idx) => idx !== i)}})} className="text-red-400"><X size={16} /></button>
                      </div>
                    ))}
                    {/* Fixed typo: changed educationStats to economicStats */}
                    <Button size="sm" variant="outline" onClick={() => setData({...data, economicStats: {...data.economicStats, topImportProducts: [...data.economicStats.topImportProducts, '']}})}>+ Add Import Product</Button>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pt-4 border-t"><Input label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, primaryEnrollment: e.target.value}})} /><Input label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, higherEducationEnrollment: e.target.value}})} /></div>
                 
                 <div className="pt-4 border-t">
                    <h5 className="font-bold text-sm mb-3">{t('topUniversities')} (Max 5)</h5>
                    <div className="space-y-3">
                      {data.educationStats.topUniversities.map((uni, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                          <Input 
                            value={uni} 
                            onChange={e => {
                              const list = [...data.educationStats.topUniversities];
                              list[idx] = e.target.value;
                              setData({...data, educationStats: {...data.educationStats, topUniversities: list}});
                            }} 
                            placeholder="Enter university name..."
                          />
                          <button 
                            onClick={() => {
                              const list = data.educationStats.topUniversities.filter((_, i) => i !== idx);
                              setData({...data, educationStats: {...data.educationStats, topUniversities: list}});
                            }} 
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                      {data.educationStats.topUniversities.length < 5 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setData({...data, educationStats: {...data.educationStats, topUniversities: [...data.educationStats.topUniversities, '']}})}
                        >
                          <Plus size={14} /> Add University
                        </Button>
                      )}
                    </div>
                 </div>

                </>
              )}
           </div>
         );
      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
               <SectionVisibilityToggle 
                 sectionKey="interactions" 
                 label={isRTL ? 'صفحات سجل اللقاءات والمراسلات' : 'Interaction History Pages'}
               />
               <SectionVisibilityToggle 
                 sectionKey="discussionPoints" 
                 label={isRTL ? 'صفحات محاور النقاش' : 'Discussion Points Pages'}
               />
               <SectionVisibilityToggle 
                 sectionKey="previousUpdates" 
                 label={isRTL ? 'صفحات التحديثات السابقة' : 'Previous Updates Pages'}
               />
             </div>
             <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2"><Calendar size={18} /> {t('recentInteractions')}</h4>
                {data.recentInteractions.map((item, idx) => (
                   <Card key={item.id} className="p-4 relative">
                      <button onClick={() => setData({...data, recentInteractions: data.recentInteractions.filter(ri => ri.id !== item.id)})} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                      <div className="grid grid-cols-2 gap-4 mb-4"><Input value={item.title} label="Title" onChange={e => { const list = [...data.recentInteractions]; list[idx].title = e.target.value; setData({...data, recentInteractions: list}); }} /><Input value={item.date} type="date" label="Date" onChange={e => { const list = [...data.recentInteractions]; list[idx].date = e.target.value; setData({...data, recentInteractions: list}); }} /></div>
                      <RichTextarea label="Details" value={item.details} onChange={(val: string) => { const list = [...data.recentInteractions]; list[idx].details = val; setData({...data, recentInteractions: list}); }} />
                   </Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, recentInteractions: [...data.recentInteractions, { id: uuidv4(), title: '', date: '', type: 'Meeting', details: '' }]})}>+ Add Interaction</Button>
             </div>

             {/* Last Official Correspondence Editor */}
             <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold flex items-center gap-2"><Mail size={18} /> {isRTL ? 'آخر مراسلة رسمية (Last Official Correspondence)' : 'Last Official Correspondence'}</h4>
                  <span className="text-xs text-gray-500">{isRTL ? 'تظهر في صفحة الملخص التنفيذي (Page 2)' : 'Appears on Executive Brief (Page 2)'}</span>
                </div>
                <Card className="p-4 bg-gray-50/60 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{isRTL ? 'اتجاه المراسلة' : 'Direction'}</label>
                      <select 
                        className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none"
                        value={data.lastCorrespondence?.direction || 'outgoing'}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            direction: e.target.value
                          }
                        })}
                      >
                        <option value="outgoing">{isRTL ? 'صادرة (Outgoing)' : 'Outgoing'}</option>
                        <option value="incoming">{isRTL ? 'واردة (Incoming)' : 'Incoming'}</option>
                      </select>
                    </div>
                    <Input 
                      label={isRTL ? 'تاريخ المراسلة' : 'Date'} 
                      type="date"
                      value={data.lastCorrespondence?.date || ''} 
                      onChange={e => setData({
                        ...data,
                        lastCorrespondence: {
                          ...(data.lastCorrespondence || {}),
                          date: e.target.value
                        }
                      })}
                    />
                    <Input 
                      label={isRTL ? 'رقم القيد / الإشارة' : 'Reference Number'} 
                      value={data.lastCorrespondence?.ref || ''} 
                      placeholder="e.g. REF/MOHRE/2024/889"
                      onChange={e => setData({
                        ...data,
                        lastCorrespondence: {
                          ...(data.lastCorrespondence || {}),
                          ref: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input 
                        label={isRTL ? 'الموضوع' : 'Subject'} 
                        value={data.lastCorrespondence?.subject || ''} 
                        placeholder={isRTL ? 'موضوع المراسلة أو الطلب...' : 'Subject of correspondence...'}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            subject: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{isRTL ? 'الحالة' : 'Status'}</label>
                      <select 
                        className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none"
                        value={data.lastCorrespondence?.status || 'awaiting_reply'}
                        onChange={e => setData({
                          ...data,
                          lastCorrespondence: {
                            ...(data.lastCorrespondence || {}),
                            status: e.target.value
                          }
                        })}
                      >
                        <option value="awaiting_reply">{isRTL ? 'بانتظار الرد (Awaiting Reply)' : 'Awaiting Reply'}</option>
                        <option value="closed">{isRTL ? 'مغلقة (Closed)' : 'Closed'}</option>
                        <option value="actioned">{isRTL ? 'تم اتخاذ الإجراء (Actioned)' : 'Actioned'}</option>
                      </select>
                    </div>
                  </div>
                </Card>
             </div>

             <div className="space-y-4 pt-6 border-t">
                <h4 className="font-bold flex items-center gap-2"><MessageSquare size={18} /> {t('pointsDiscussion')}</h4>
                {data.pointsOfDiscussion.map((item, idx) => (
                   <Card key={item.id} className="p-4 relative">
                      <button onClick={() => setData({...data, pointsOfDiscussion: data.pointsOfDiscussion.filter(pd => pd.id !== item.id)})} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                      <Input value={item.title} className="font-bold mb-4" placeholder="Topic Title" onChange={e => { const list = [...data.pointsOfDiscussion]; list[idx].title = e.target.value; setData({...data, pointsOfDiscussion: list}); }} /><RichTextarea label="Content" value={item.content} onChange={(val: string) => { const list = [...data.pointsOfDiscussion]; list[idx].content = val; setData({...data, pointsOfDiscussion: list}); }} />
                   </Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, pointsOfDiscussion: [...data.pointsOfDiscussion, { id: uuidv4(), title: '', content: '' }]})}>+ Add Point</Button>
             </div>
             <div className="space-y-4 pt-6 border-t">
                <h4 className="font-bold flex items-center gap-2"><CheckCircle size={18} /> {t('previousAgreementsAndUpdates')}</h4>
                {(data.previousAgreementsAndUpdates || []).map((item, idx) => (
                   <Card key={item.id} className="p-4 relative">
                      <button onClick={() => setData({...data, previousAgreementsAndUpdates: (data.previousAgreementsAndUpdates || []).filter(pd => pd.id !== item.id)})} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                      <Input value={item.title} className="font-bold mb-4" placeholder="Topic Title" onChange={e => { const list = [...(data.previousAgreementsAndUpdates || [])]; list[idx].title = e.target.value; setData({...data, previousAgreementsAndUpdates: list}); }} /><RichTextarea label="Content" value={item.content} onChange={(val: string) => { const list = [...(data.previousAgreementsAndUpdates || [])]; list[idx].content = val; setData({...data, previousAgreementsAndUpdates: list}); }} />
                   </Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, previousAgreementsAndUpdates: [...(data.previousAgreementsAndUpdates || []), { id: uuidv4(), title: '', content: '' }]})}>+ Add Point</Button>
             </div>
             <div className="space-y-4 pt-6 border-t">
               <PendingMattersEditor
                 pendingMatters={data.pendingMatters || []}
                 onChange={(matters) => setData({ ...data, pendingMatters: matters })}
                 isRTL={isRTL}
                 onAutoImport={handleAutoImportPendingMatters}
                 showAutoImport={(data.previousAgreementsAndUpdates || []).length > 0 || (data.bilateralAgreements || []).some(a => a.status === 'pending')}
               />
             </div>
             <div className="pt-6 border-t">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold flex items-center gap-2"><Newspaper size={18} /> {t('relatedNews')}</h4>
                 <Button onClick={handleFetchNews} disabled={isFetchingNews || !data.country} size="sm">
                   {isFetchingNews ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                   {t('fetchNews')}
                 </Button>
               </div>
               <div className="space-y-4">
                  {data.relatedNews.map((news, idx) => (
                    <Card key={news.id} className="p-4 relative bg-gray-50/50">
                       <button onClick={() => {
                          const list = [...data.relatedNews];
                          list.splice(idx, 1);
                          setData({...data, relatedNews: list});
                       }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <Input label="Title" value={news.title} onChange={e => {
                             const list = [...data.relatedNews];
                             list[idx].title = e.target.value;
                             setData({...data, relatedNews: list});
                          }} />
                          <div className="flex flex-col gap-1.5">
                            <Input label="Source / Date" value={news.source || news.date} onChange={e => {
                              const list = [...data.relatedNews];
                              list[idx].source = e.target.value;
                              setData({...data, relatedNews: list});
                            }} />
                            {news.url && (
                              <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline font-bold px-1">
                                <ExternalLink size={10} /> View Source Document
                              </a>
                            )}
                          </div>
                       </div>
                       <RichTextarea label="Summary" value={news.summary} onChange={(val: string) => {
                          const list = [...data.relatedNews];
                          list[idx].summary = val;
                          setData({...data, relatedNews: list});
                       }} />
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setData({...data, relatedNews: [...data.relatedNews, { id: uuidv4(), title: '', source: '', date: '', summary: '', url: '' }]})}>+ Add Manual News Item</Button>
               </div>
             </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <SectionVisibilityToggle 
               sectionKey="agreements" 
               label={isRTL ? 'تضمين صفحات الاتفاقيات ومذكرات التفاهم الثنائية' : 'Include Bilateral Agreements Pages'}
               description={isRTL ? 'التحكم في ظهور قسم الاتفاقيات في التقرير المطبوع / PDF' : 'Toggle whether Key Agreements pages are included'}
             />
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">{t('keyAgreements')}</h4>
                <Button size="sm" onClick={handleFetchAgreements} disabled={isFetchingAI}>
                   {isFetchingAI ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} {t('fetchMofa')}
                </Button>
             </div>
             {data.bilateralAgreements.map((agreement, idx) => (
                <Card key={idx} className="p-4 relative">
                   <button onClick={() => setData({...data, bilateralAgreements: data.bilateralAgreements.filter((_, i) => i !== idx)})} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                   <Input value={agreement.title} className="font-bold mb-2" onChange={e => { const list = [...data.bilateralAgreements]; list[idx].title = e.target.value; setData({...data, bilateralAgreements: list}); }} />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                     <Input value={agreement.date} label="Date" onChange={e => { const list = [...data.bilateralAgreements]; list[idx].date = e.target.value; setData({...data, bilateralAgreements: list}); }} />
                     <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-foreground/80">{t('status')}</label>
                       <select 
                         className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-primary transition-all"
                         value={agreement.status || 'active'}
                         onChange={e => {
                           const list = [...data.bilateralAgreements];
                           list[idx].status = e.target.value as any;
                           setData({...data, bilateralAgreements: list});
                         }}
                       >
                         <option value="active">{t('activeLabel')}</option>
                         <option value="pending">{t('pendingLabel')}</option>
                         <option value="custom">{t('customLabel')}</option>
                       </select>
                     </div>
                   </div>
                   {agreement.status === 'custom' && (
                     <Input 
                        label={t('customStatusText')} 
                        value={agreement.customStatusText || ''} 
                        onChange={e => {
                          const list = [...data.bilateralAgreements];
                          list[idx].customStatusText = e.target.value;
                          setData({...data, bilateralAgreements: list});
                        }}
                        className="mb-2"
                        placeholder="e.g. Under Review"
                     />
                   )}
                   <RichTextarea label="Summary" value={agreement.summary} onChange={(val: string) => { const list = [...data.bilateralAgreements]; list[idx].summary = val; setData({...data, bilateralAgreements: list}); }} />
                </Card>
             ))}
             <Button variant="outline" onClick={() => setData({...data, bilateralAgreements: [...data.bilateralAgreements, { title: '', date: '', status: 'active', summary: '' }]})}>+ Add Agreement</Button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
             <SectionVisibilityToggle 
               sectionKey="delegation" 
               label={isRTL ? 'تضمين صفحات الوفود الرسمية (الإماراتي والشريك)' : 'Include Delegations Pages'}
               description={isRTL ? 'التحكم في ظهور قسم الوفود في التقرير المطبوع / PDF' : 'Toggle whether Delegations pages are included'}
             />
             {['uae', 'partner'].map((type: any) => (
                <div key={type} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border">
                   <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <h3 className="text-2xl font-serif font-bold">{type === 'uae' ? t('uaeDelegation') : t('partnerDelegation')}</h3>
                      <Button onClick={() => addDelegate(type)}>+ Add Member</Button>
                   </div>
                   <div className="space-y-8">
                      {data.delegations[type as 'uae'|'partner'].map((delegate, idx) => (
                        <Card key={delegate.id} className="p-8">
                           <div className="flex flex-col md:flex-row gap-8">
                              <div className="w-32 h-44 shrink-0 bg-gray-100 rounded-xl overflow-hidden relative cursor-pointer group" onClick={() => document.getElementById(`file-${delegate.id}`)?.click()}>
                                 {delegate.imageUrl ? <img src={delegate.imageUrl} className="w-full h-full object-cover" /> : <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 font-bold text-[10px]"><UploadCloud size={24} className="mb-2" /> UPLOAD</div>}
                                 <input type="file" id={`file-${delegate.id}`} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].imageUrl = reader.result as string; setData({...data, delegations: {...data.delegations, [type]: list}}); }; reader.readAsDataURL(file); } }} />
                              </div>
                              <div className="flex-1 space-y-4">
                                 <div className="grid grid-cols-2 gap-4"><Input label="Name" value={delegate.name} onChange={e => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].name = e.target.value; setData({...data, delegations: {...data.delegations, [type]: list}}); }} /><Input label="Title" value={delegate.title} onChange={e => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].title = e.target.value; setData({...data, delegations: {...data.delegations, [type]: list}}); }} /></div>
                                 <RichTextarea label="Biography" value={delegate.bio} onChange={(val: string) => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].bio = val; setData({...data, delegations: {...data.delegations, [type]: list}}); }} />
                                 {type === 'partner' && (
                                   <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-800 space-y-3">
                                     <div className="flex items-center gap-3">
                                       <input
                                         type="checkbox"
                                         id={`metBefore-${delegate.id}`}
                                         checked={!!delegate.metBefore}
                                         onChange={e => {
                                           const list = [...data.delegations.partner];
                                           list[idx] = { ...list[idx], metBefore: e.target.checked };
                                           setData({ ...data, delegations: { ...data.delegations, partner: list } });
                                         }}
                                         className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                       />
                                       <label htmlFor={`metBefore-${delegate.id}`} className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer select-none">
                                         {language === 'ar' ? 'هل تم اللقاء به مسبقاً؟' : 'Have we met this delegate before?'}
                                       </label>
                                     </div>
                                     {delegate.metBefore && (
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-sky-100 dark:border-sky-900">
                                         <Input
                                           label={language === 'ar' ? 'سنة اللقاء' : 'Meeting Year'}
                                           placeholder="e.g. 2023"
                                           value={delegate.meetingYear || ''}
                                           onChange={e => {
                                             const list = [...data.delegations.partner];
                                             list[idx] = { ...list[idx], meetingYear: e.target.value };
                                             setData({ ...data, delegations: { ...data.delegations, partner: list } });
                                           }}
                                         />
                                         <Input
                                           label={language === 'ar' ? 'مكان اللقاء (أين؟)' : 'Meeting Location (Where)'}
                                           placeholder={language === 'ar' ? 'مثال: أبوظبي / نيودلهي' : 'e.g. Abu Dhabi, New Delhi'}
                                           value={delegate.meetingLocation || ''}
                                           onChange={e => {
                                             const list = [...data.delegations.partner];
                                             list[idx] = { ...list[idx], meetingLocation: e.target.value };
                                             setData({ ...data, delegations: { ...data.delegations, partner: list } });
                                           }}
                                         />
                                       </div>
                                     )}
                                   </div>
                                 )}
                              </div>
                              <button onClick={() => { const list = data.delegations[type as 'uae'|'partner'].filter((_, i) => i !== idx); setData({...data, delegations: {...data.delegations, [type]: list}}); }} className="text-gray-300 hover:text-red-500"><X /></button>
                           </div>
                        </Card>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        );
      case 7:
        return (
          <div className="bg-gray-100 dark:bg-gray-800 p-12 rounded-2xl border text-center animate-in zoom-in-95 duration-300">
             <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
             <h2 className="text-3xl font-serif font-bold mb-4">{reportTitle || 'Ready to Finalize'}</h2>
             <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Review your report one last time. You can generate a ministerial-grade PDF or print the document once saved.</p>
             <Button size="lg" onClick={() => handleSave('completed')} className="bg-green-600 hover:bg-green-700 mx-auto">Complete & Return to Dashboard</Button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-10">
        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <button key={step.id} onClick={() => setCurrentStep(idx)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${idx === currentStep ? 'bg-primary text-white shadow-xl translate-x-2' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <step.icon size={20} /><span className="text-sm font-bold uppercase tracking-wider">{step.label}</span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-3 space-y-8">
          <Card className="min-h-[500px] p-8 shadow-2xl">
            {aiError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-red-700 dark:text-red-300 text-sm flex gap-3 items-start relative animate-in fade-in slide-in-from-top-4">
                <ShieldAlert className="shrink-0 text-red-500 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="font-bold">{language === 'ar' ? 'تنبيه الاتصال بالذكاء الاصطناعي' : 'AI Service Notice'}</p>
                  <p className="text-xs mt-1 leading-relaxed">{aiError}</p>
                </div>
                <button onClick={() => setAiError(null)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            )}
            {renderStep()}
          </Card>
          <div className="flex justify-between items-center pt-6">
            <Button variant="ghost" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}><ArrowLeft size={18} /> {t('back')}</Button>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => handleSave('draft')}><Save size={18} /> {t('save')}</Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)} className="px-10">{t('next')} <ArrowRight size={18} /></Button>
              ) : (
                <Button onClick={() => handleSave('completed')} className="bg-green-600 hover:bg-green-700 px-10">{t('finish')} <CheckCircle size={18} /></Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}