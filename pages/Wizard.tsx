import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReportData, EMPTY_REPORT_DATA, Report, Delegate, NewsItem, PendingMatter } from '../types';
import { MockService } from '../services/mockService';
import { Button, Card, Input } from '../components/ui/LayoutComponents';
import { PendingMattersEditor } from '../components/PendingMattersEditor';
import { AttentionNotesEditor } from '../components/AttentionNotesEditor';
import { ArrowLeft, ArrowRight, Save, Globe, Users, FileText, CheckCircle, Plane, Building, TrendingUp, Sparkles, Loader2, RefreshCw, Link as LinkIcon, Search, Hammer, GraduationCap, Briefcase, Plus, X, Banknote, UserPlus, BarChart2, MessageSquare, Newspaper, Calendar, UploadCloud, ShieldAlert, BookOpen, Bold, Italic, List, ExternalLink, Mail, Layers, Eye, Check, ArrowUpDown, SlidersHorizontal, ChevronDown, ChevronUp, Target, Trash2, Star } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const [data, setData] = useState<ReportData>(EMPTY_REPORT_DATA);
  const [reportTitle, setReportTitle] = useState('');
  const [showVisibilityManager, setShowVisibilityManager] = useState(false);
  const [visibilityTab, setVisibilityTab] = useState<'pages' | 'sections'>('sections');

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

  const broadcastSync = (reportId: string, updatedReport?: Report) => {
    try {
      localStorage.setItem('report_updated_at', `${reportId}_${Date.now()}`);
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('report_sync_channel');
        bc.postMessage({ reportId, report: updatedReport, timestamp: Date.now() });
        setTimeout(() => bc.close(), 100);
      }
    } catch (e) {}
  };

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

  const handleSave = async (
    status: 'draft' | 'completed' = 'draft', 
    shouldViewReport = false,
    customData?: ReportData,
    silent = false,
    customMessage?: string
  ) => {
    if (!silent) setIsSaving(true);
    try {
      const dataToSave = customData || data;
      const reportId = id || `r-${uuidv4().slice(0, 8)}`;
      const newReport: Report = { 
        id: reportId, 
        userId: user?.id || 'u-admin', 
        title: reportTitle || `Report for ${dataToSave.country || 'Unknown'}`, 
        status, 
        updatedAt: new Date().toISOString(), 
        data: dataToSave 
      };
      await MockService.saveReport(newReport);
      broadcastSync(reportId, newReport);

      setSaveSuccess(true);
      if (customMessage) {
        setLastSavedMessage(customMessage);
      } else {
        setLastSavedMessage(isRTL ? 'تم حفظ التغييرات وانعكست في التقرير فوراً' : 'Changes saved & reflected in report');
      }
      setTimeout(() => {
        setSaveSuccess(false);
        setLastSavedMessage(null);
      }, 4000);

      if (shouldViewReport) {
        navigate(`/print/${reportId}?lang=${language}`);
      } else if (status === 'completed') {
        navigate('/dashboard');
      } else if (!id) {
        navigate(`/wizard/${reportId}`, { replace: true });
      }
    } catch (err) {
      console.error('Save report failed:', err);
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const saveSilently = async (updatedData: ReportData, message?: string) => {
    await handleSave('draft', false, updatedData, true, message);
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
    const isVisible = sectionKey === 'executiveBriefLastMeeting'
      ? (data.sectionVisibility?.executiveBriefLastMeeting !== false && data.sectionVisibility?.briefLastMeetings !== false)
      : sectionKey === 'executiveBriefLastCorrespondence'
        ? (data.sectionVisibility?.executiveBriefLastCorrespondence !== false && data.sectionVisibility?.briefLastCorrespondence !== false)
        : sectionKey === 'executiveBriefPoints'
          ? (data.sectionVisibility?.executiveBriefPoints !== false && data.sectionVisibility?.briefPointsToFocus !== false)
          : data.sectionVisibility?.[sectionKey] !== false;
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
              const val = e.target.checked;
              const newVisibility = {
                ...(data.sectionVisibility || {}),
                [sectionKey]: val
              };
              if (sectionKey === 'executiveBriefLastMeeting' || sectionKey === 'briefLastMeetings') {
                newVisibility.executiveBriefLastMeeting = val;
                newVisibility.briefLastMeetings = val;
              } else if (sectionKey === 'executiveBriefLastCorrespondence' || sectionKey === 'briefLastCorrespondence') {
                newVisibility.executiveBriefLastCorrespondence = val;
                newVisibility.briefLastCorrespondence = val;
              } else if (sectionKey === 'executiveBriefPoints' || sectionKey === 'briefPointsToFocus') {
                newVisibility.executiveBriefPoints = val;
                newVisibility.briefPointsToFocus = val;
              }
              const updated = {
                ...data,
                sectionVisibility: newVisibility
              };
              setData(updated);
              saveSilently(updated, isRTL ? `تم تحديث وحفظ حالة القسم "${label}" في التقرير` : `Section "${label}" visibility updated`);
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
             {/* REPORT SECTIONS & PAGES VISIBILITY CONTROL CENTER */}
             <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-gray-900/60 dark:to-gray-800/40 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-5 shadow-sm mb-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/40 dark:border-blue-800/40">
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                     <SlidersHorizontal size={18} />
                   </div>
                   <div>
                     <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                       {isRTL ? 'إدارة ظهور أقسام وصفحات التقرير (إظهار / استبعاد)' : 'Report Pages & Sections Visibility Control'}
                     </h4>
                     <p className="text-[11px] text-gray-500 dark:text-gray-400">
                       {isRTL 
                         ? 'تحكّم في استبعاد الصفحات الكاملة، أو إخفاء أقسام معينة مع بقاء مكانها شاغراً دون التأثير على التنسيق والمسافات'
                         : 'Control full pages, or hide specific sections while preserving layout and spacing as empty placeholders'}
                     </p>
                   </div>
                 </div>
                 <button
                   type="button"
                   onClick={() => setShowVisibilityManager(!showVisibilityManager)}
                   className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-primary shadow-2xs transition-all self-start sm:self-auto"
                 >
                   <span>{showVisibilityManager ? (isRTL ? 'طي اللوحة' : 'Collapse') : (isRTL ? 'تخصيص الأقسام' : 'Configure')}</span>
                   {showVisibilityManager ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 </button>
               </div>

               {showVisibilityManager && (
                 <div className="mt-4 pt-2 space-y-4 animate-in fade-in duration-200">
                   {/* Tabs for Pages vs Sub-sections */}
                   <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                     <button
                       type="button"
                       onClick={() => setVisibilityTab('sections')}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${visibilityTab === 'sections' ? 'bg-primary text-white shadow-2xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                     >
                       <Layers size={14} />
                       {isRTL ? 'الأقسام الداخلية (مع الحفاظ على المساحات الشاغرة)' : 'Sub-Sections (Preserve Empty Space)'}
                     </button>
                     <button
                       type="button"
                       onClick={() => setVisibilityTab('pages')}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${visibilityTab === 'pages' ? 'bg-primary text-white shadow-2xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                     >
                       <FileText size={14} />
                       {isRTL ? 'صفحات التقرير الكاملة' : 'Entire Pages'}
                     </button>
                   </div>

                   {visibilityTab === 'sections' ? (
                     <div className="space-y-4">
                       {/* Executive Brief Sub-sections */}
                       <div className="bg-white/90 dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                         <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                           {isRTL ? 'صفحة الإحاطة التنفيذية' : 'Executive Brief Page'}
                         </h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <SectionVisibilityToggle 
                             sectionKey="executiveBriefPoints" 
                             label={isRTL ? 'أهم الرسائل التي يجب التركيز عليها' : 'Points to Focus On'}
                             description={isRTL ? 'قسم النقاط والرسائل الاستراتيجية في الإحاطة التنفيذية' : 'Key focal points in executive brief'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="executiveBriefLastMeeting" 
                             label={isRTL ? 'آخر لقاء رسمي' : 'Last Official Meeting'}
                             description={isRTL ? 'تفاصيل آخر اجتماع أو لجنة مشتركة' : 'Last meeting details & outcomes'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="executiveBriefLastCorrespondence" 
                             label={isRTL ? 'آخر مراسلة رسمية' : 'Last Correspondence'}
                             description={isRTL ? 'المراسلة الصادرة أو الواردة ومتابعة حالتها' : 'Latest correspondence item & status'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="executiveBriefInsights" 
                             label={isRTL ? 'مؤشرات الإحاطة السريعة' : 'Brief Quick Insights'}
                             description={isRTL ? 'البطاقات والمؤشرات التلخيصية' : 'Summary KPI insight cards'}
                           />
                         </div>
                       </div>

                       {/* Profile & Economy Sub-sections */}
                       <div className="bg-white/90 dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                         <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                           {isRTL ? 'صفحة النبذة التعريفية وسوق العمل (الصفحة 3)' : 'Profile & Economy Page (Page 3)'}
                         </h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <SectionVisibilityToggle 
                             sectionKey="demographics" 
                             label={isRTL ? 'البيانات الديموغرافية والأساسية' : 'Demographics & Basics'}
                             description={isRTL ? 'العاصمة، السكان، اللغة، العملة، ومؤشر التنمية' : 'Capital, population, currency, HDI'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="economicLandscape" 
                             label={isRTL ? 'المشهد الاقتصادي ومعدلات التضخم' : 'Economic Landscape & Inflation'}
                             description={isRTL ? 'الناتج المحلي، التضخم، والبطالة' : 'GDP, inflation rate, unemployment'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="bilateralTrade" 
                             label={isRTL ? 'التبادل التجاري والتحويلات المالية' : 'Bilateral Trade & Remittances'}
                             description={isRTL ? 'الصادرات والواردات وحجم التحويلات' : 'Exports, imports, and remittance flow'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="educationInsights" 
                             label={isRTL ? 'مؤشرات التعليم وأبرز الجامعات' : 'Education Insights & Top Universities'}
                             description={isRTL ? 'نسب القيد والتعليم الجامعي' : 'Enrollment rates and top universities'}
                           />
                         </div>
                       </div>

                       {/* UAE Workforce Sub-sections */}
                       <div className="bg-white/90 dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                         <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                           {isRTL ? 'صفحة سوق العمل الإماراتي (الصفحة 4)' : 'UAE Labour Market Page (Page 4)'}
                         </h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <SectionVisibilityToggle 
                             sectionKey="uaeWorkforceKpis" 
                             label={isRTL ? 'مؤشرات القوى العاملة (MOHRE & ICP)' : 'UAE Workforce KPIs'}
                             description={isRTL ? 'إجمالي العمالة والمقارنة بين الوزارة والهيئة' : 'Total workers, MOHRE and ICP metrics'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="insuranceExposures" 
                             label={isRTL ? 'وثائق التأمين وحماية العمالة' : 'Insurance Exposures'}
                             description={isRTL ? 'المبالغ المؤمنة ونسب التغطية' : 'Insured value & worker coverage'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="laborComplaints" 
                             label={isRTL ? 'الشكاوى والنزاعات العمالية' : 'Labour Complaints'}
                             description={isRTL ? 'إجمالي الشكاوى ومعدل التسوية الودية' : 'Total complaints and amicable resolution'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="threeYearTrend" 
                             label={isRTL ? 'المسار التاريخي للعمالة (3 سنوات)' : '3-Year Workforce Trend'}
                             description={isRTL ? 'رسم بياني يوضح تطور العمالة على مدى 3 أعوام' : '3-year historic employment chart'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="workforceByEmirate" 
                             label={isRTL ? 'التوزيع الجغرافي حسب الإمارة' : 'Distribution by Emirate'}
                             description={isRTL ? 'توزيع العمال على إمارات الدولة السبع' : 'Distribution across the 7 Emirates'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="workforceBySector" 
                             label={isRTL ? 'التوزيع القطاعي للعمالة' : 'Distribution by Sector'}
                             description={isRTL ? 'أبرز القطاعات التشغيلية' : 'Key employment sectors'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="salaryComparison" 
                             label={isRTL ? 'مقارنة الأجور ومتوسط الرواتب' : 'Salary & Wage Comparison'}
                             description={isRTL ? 'مقارنة رواتب العمالة الماهرة وغير الماهرة' : 'Skilled vs unskilled median salary table'}
                           />
                         </div>
                       </div>

                       {/* Partner Workforce Sub-sections */}
                       <div className="bg-white/90 dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                         <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                           {isRTL ? `صفحة القوى العاملة في ${data.country || 'الدولة الشريكة'} (الصفحة 5)` : 'Partner Workforce Page (Page 5)'}
                         </h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <SectionVisibilityToggle 
                             sectionKey="partnerWorkforceKpis" 
                             label={isRTL ? 'إجمالي القوى العاملة والتوزيع الجنساني' : 'Workforce Total & Gender Distribution'}
                             description={isRTL ? 'إجمالي قوة العمل ومشاركة الذكور والإناث' : 'Total workforce & gender participation'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="migrationDestinations" 
                             label={isRTL ? 'وجهات الهجرة للعمالة' : 'Migration Destinations'}
                             description={isRTL ? 'أبرز الدول المستقطبة للعمالة' : 'Top destinations for outbound workers'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="partnerSectors" 
                             label={isRTL ? 'توزيع عمالة الدولة حسب القطاع' : 'Partner Workers by Sector'}
                             description={isRTL ? 'القطاعات المحلية في الدولة الشريكة' : 'Domestic sector distribution'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="availableSkills" 
                             label={isRTL ? 'المهارات والكفاءات المتاحة' : 'Available Skills'}
                             description={isRTL ? 'قائمة المهارات والمهن المعروضة' : 'Market skills and competencies'}
                           />
                         </div>
                       </div>

                       {/* Delegations Sub-sections */}
                       <div className="bg-white/90 dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                         <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                           {isRTL ? 'صفحة الوفود الرسمية' : 'Official Delegations Page'}
                         </h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <SectionVisibilityToggle 
                             sectionKey="uaeDelegation" 
                             label={isRTL ? 'وفد دولة الإمارات' : 'UAE Delegation'}
                             description={isRTL ? 'أعضاء وفد دولة الإمارات وتفاصيلهم' : 'UAE delegates profiles and bios'}
                           />
                           <SectionVisibilityToggle 
                             sectionKey="partnerDelegation" 
                             label={isRTL ? `وفد ${data.country || 'الدولة الشريكة'}` : 'Partner Delegation'}
                             description={isRTL ? 'أعضاء وفد الدولة الشريكة وبيانات اللقاءات السابقة' : 'Partner delegates & past meeting history'}
                           />
                         </div>
                       </div>
                     </div>
                   ) : (
                     /* Entire Pages Toggles */
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                       <SectionVisibilityToggle 
                         sectionKey="coverPage" 
                         label={isRTL ? 'صفحة الغلاف الرئيسي' : 'Main Cover Page'}
                         description={isRTL ? 'صفحة الغلاف الأولى وعنوان التقرير' : 'First page cover'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="executiveBriefPage" 
                         label={isRTL ? 'صفحة الإحاطة التنفيذية' : 'Executive Brief Page'}
                         description={isRTL ? 'صفحة الإحاطة التنفيذية والرسائل الرئيسية' : 'Executive brief focal messages'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="profileEconomy" 
                         label={isRTL ? 'صفحة النبذة التعريفية وسوق العمل (الصفحة 3)' : 'Profile & Economy Page (Page 3)'}
                         description={isRTL ? 'الملف التعريفي والاقتصادي العام للدولة' : 'Country general profile & trade'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="uaeWorkforce" 
                         label={isRTL ? 'صفحة سوق العمل الإماراتي (الصفحة 4)' : 'UAE Labour Market Page (Page 4)'}
                         description={isRTL ? 'إحصائيات عمالة الدولة في سوق عمل الإمارات' : 'Workforce in UAE statistics'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="partnerWorkforce" 
                         label={isRTL ? `صفحة القوى العاملة في ${data.country || 'الدولة الشريكة'} (الصفحة 5)` : 'Partner Workforce Page (Page 5)'}
                         description={isRTL ? 'سوق العمل المحلي للدولة الشريكة' : 'Partner domestic labour market'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="interactions" 
                         label={isRTL ? 'صفحات سجل اللقاءات والمراسلات' : 'Interaction History Pages'}
                         description={isRTL ? 'مواضيع ملخص العلاقة والمراسلات الرسمية' : 'Relationship summary topics'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="discussionPoints" 
                         label={isRTL ? 'صفحات محاور النقاش' : 'Discussion Points Pages'}
                         description={isRTL ? 'أبرز نقاط ومحاور المباحثات الثنائية' : 'Bilateral discussion points'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="previousUpdates" 
                         label={isRTL ? 'صفحات التحديثات السابقة' : 'Previous Updates Pages'}
                         description={isRTL ? 'التحديثات والقرارات الصادرة سابقاً' : 'Prior agreements and updates'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="agreements" 
                         label={isRTL ? 'صفحات الاتفاقيات ومذكرات التفاهم' : 'Bilateral Agreements Pages'}
                         description={isRTL ? 'قائمة الاتفاقيات ومذكرات التفاهم الثنائية' : 'Formal bilateral agreements and MoUs'}
                       />
                       <SectionVisibilityToggle 
                         sectionKey="delegation" 
                         label={isRTL ? 'صفحات الوفود الرسمية' : 'Delegations Pages'}
                         description={isRTL ? 'بيانات أعضاء الوفود الرسمية' : 'Official delegation members'}
                       />
                     </div>
                   )}
                 </div>
               )}
             </div>

             <div className="border-b dark:border-gray-700 pb-4 mb-4">
               <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 mb-2"><FileText size={20} /> {t('reportDetails')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label={t('reportTitle')} value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
                 <Input label={t('reportDate')} type="date" value={data.reportDate} onChange={e => setData({...data, reportDate: e.target.value})} />
               </div>
               {/* Meeting Goal (هدف اللقاء) - 1 or 2 lines section for Page 1 Cover */}
               <div className="mt-4">
                 <div className="flex items-center justify-between mb-1.5">
                   <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 flex items-center gap-2">
                     <Target size={16} className="text-primary" />
                     <span>{isRTL ? 'هدف اللقاء (يظهر في غلاف الصفحة الأولى)' : 'Meeting Goal (Features on Page 1 Cover)'}</span>
                   </label>
                   <span className="text-[11px] text-gray-400">
                     {isRTL ? 'سطر أو سطرين للهدف الاستراتيجي' : '1-2 lines for meeting objective'}
                   </span>
                 </div>
                 <textarea
                   rows={2}
                   className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm leading-relaxed"
                   placeholder={isRTL ? 'مثال: تعزيز التعاون الثنائي في حوكمة استقدام العمالة الماهرة ومناقشة مسودة مذكرة التفاهم وتفعيل آليات الربط الرقمي والتحقق المسبق من المهارات.' : 'e.g. Strengthening bilateral coordination on skilled labor mobility, reviewing the draft MoU, and advancing electronic skill verification.'}
                   value={data.meetingGoal || ''}
                   onChange={e => setData({ ...data, meetingGoal: e.target.value })}
                 />
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

            {/* Executive Brief (Page 2) Focused Controls */}
            <div className="mt-8 pt-6 border-t dark:border-gray-700 space-y-6">
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-primary/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold shadow-2xs">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-primary leading-tight">
                        {isRTL ? 'إعدادات وبيانات الملخص التنفيذي (Executive Brief)' : 'Executive Brief Data & Controls'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isRTL ? 'تخصيص أهم الرسائل التي يجب التركيز عليها وآخر اللقاءات المتبادلة في الصفحة 2' : 'Manage key focus messages and last bilateral meetings for Page 2'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSave('draft', false, data, false, isRTL ? 'تم حفظ بيانات الملخص التنفيذي في التقرير' : 'Executive brief saved');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-primary text-white hover:bg-primary-dark rounded-lg shadow-2xs transition-all"
                    >
                      <Save size={13} />
                      {isRTL ? 'حفظ التعديلات' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSave('draft', true, data, false);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg transition-all"
                    >
                      <ExternalLink size={13} />
                      {isRTL ? 'معاينة في التقرير ↗' : 'View in Report ↗'}
                    </button>
                  </div>
                </div>

                {/* GOAL OF THE MEETING ("هدف اللقاء") */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Target size={15} />
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isRTL ? 'هدف اللقاء (Goal of the meeting)' : 'Goal of the meeting'}
                      </h5>
                    </div>
                    {data.meetingGoal && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...data, meetingGoal: undefined };
                          setData(updated);
                          saveSilently(updated, isRTL ? 'تمت استعادة النص الافتراضي لهدف اللقاء' : 'Goal reset to default');
                        }}
                        className="text-[11px] text-gray-500 hover:text-primary hover:underline font-semibold"
                      >
                        {isRTL ? 'استعادة الافتراضي' : 'Reset to default'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {isRTL
                      ? 'موجز استراتيجي عالي المستوى لأهم الرسائل المعتمدة وأحدث اللقاءات والمراسلات الرسمية - يظهر بخط بارز أعلى صفحة الإحاطة التنفيذية:'
                      : 'High-level strategic overview displayed prominently below the executive briefing header:'}
                  </p>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder={isRTL 
                      ? `موجز استراتيجي عالي المستوى لأهم الرسائل المعتمدة وأحدث اللقاءات والمراسلات الرسمية مع ${getCountryArabicName(data.country)}`
                      : `High-level strategic overview of key focus messages, recent meetings, and official correspondence with ${data.country || 'Partner Country'}`}
                    value={data.meetingGoal !== undefined ? data.meetingGoal : ''}
                    onChange={e => {
                      setData({
                        ...data,
                        meetingGoal: e.target.value
                      });
                    }}
                    onBlur={() => {
                      saveSilently(data, isRTL ? 'تم حفظ هدف اللقاء' : 'Goal of the meeting saved');
                    }}
                  />
                </div>

                {/* 1. FOCUS POINTS ("أهم الرسائل التي يجب التركيز عليها") */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Sparkles size={15} />
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isRTL ? 'أهم الرسائل التي يجب التركيز عليها' : 'Key Messages & Points to Focus On'}
                      </h5>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                          checked={data.sectionVisibility?.briefPointsToFocus !== false}
                          onChange={e => {
                            const updated = {
                              ...data,
                              sectionVisibility: {
                                ...(data.sectionVisibility || {}),
                                briefPointsToFocus: e.target.checked
                              }
                            };
                            setData(updated);
                            saveSilently(updated, isRTL ? (e.target.checked ? 'تم إظهار قسم أهم الرسائل' : 'تم استبعاد قسم أهم الرسائل من المعاينة') : 'Focus points visibility updated');
                          }}
                        />
                        <span>{isRTL ? 'إظهار في التقرير' : 'Show in report'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultList = isRTL ? [
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
                          const updated = { ...data, pointsToFocusOn: defaultList };
                          setData(updated);
                          saveSilently(updated, isRTL ? 'تمت استعادة الرسائل المقترحة الافتراضية' : 'Default points restored');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                        title={isRTL ? 'استعادة النقاط الافتراضية' : 'Reset to defaults'}
                      >
                        <RefreshCw size={11} />
                        <span>{isRTL ? 'استعادة الاقتراحات' : 'Reset Defaults'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {isRTL 
                      ? 'الرسائل والمحاور الجوهرية المعدة للإحاطة بالقيادة والوفد للتأكيد عليها خلال المباحثات:' 
                      : 'Key strategic messages and talking points prepared for the delegation during discussions:'}
                  </p>

                  {/* List of Points */}
                  <div className="space-y-2.5">
                    {((data.pointsToFocusOn && data.pointsToFocusOn.length > 0)
                      ? data.pointsToFocusOn
                      : (isRTL ? [
                          'التأكيد على عمق العلاقات الثنائية والشراكة الاستراتيجية في تنظيم وحوكمة سوق العمل.',
                          'متابعة مخرجات وقرارات اللجان الفنية والوزارية المشتركة، وتفعيل قنوات التنسيق المباشر.',
                          'تعزيز منظومة حماية حقوق العمالة عبر التوعية الاستباقية، ومنظومة التأمين ضد التعطل، وحماية الأجور (WPS).',
                          'تطوير التعاون الرقمي والربط الإلكتروني للتحقق من المهارات وتبسيط إجراءات الاستقدام النظامي.'
                        ] : [
                          'Emphasize strategic bilateral partnership and collaborative governance in labor mobility.',
                          'Follow up on outcomes of Joint Committees (JCM) and maintain active inter-ministerial coordination.',
                          'Strengthen worker welfare protocols through proactive awareness, Wage Protection System (WPS), and unemployment insurance.',
                          'Advance digital integration for skill verification and streamlined, transparent recruitment procedures.'
                        ])
                    ).map((point, idx, arr) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={point}
                          placeholder={isRTL ? 'أدخل نقطة أو رسالة رئيسية...' : 'Enter a focus point...'}
                          onChange={e => {
                            const newPoints = [...arr];
                            newPoints[idx] = e.target.value;
                            setData(prev => ({ ...prev, pointsToFocusOn: newPoints }));
                          }}
                          onBlur={() => {
                            saveSilently(data, isRTL ? 'تم حفظ رسائل التركيز' : 'Focus points saved');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPoints = arr.filter((_, i) => i !== idx);
                            const updated = { ...data, pointsToFocusOn: newPoints };
                            setData(updated);
                            saveSilently(updated, isRTL ? 'تم حذف البند' : 'Point removed');
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors shrink-0"
                          title={isRTL ? 'حذف هذا البند' : 'Delete this point'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const current = data.pointsToFocusOn && data.pointsToFocusOn.length > 0
                        ? [...data.pointsToFocusOn]
                        : (isRTL ? [
                            'التأكيد على عمق العلاقات الثنائية والشراكة الاستراتيجية في تنظيم وحوكمة سوق العمل.',
                            'متابعة مخرجات وقرارات اللجان الفنية والوزارية المشتركة، وتفعيل قنوات التنسيق المباشر.',
                            'تعزيز منظومة حماية حقوق العمالة عبر التوعية الاستباقية، ومنظومة التأمين ضد التعطل، وحماية الأجور (WPS).',
                            'تطوير التعاون الرقمي والربط الإلكتروني للتحقق من المهارات وتبسيط إجراءات الاستقدام النظامي.'
                          ] : [
                            'Emphasize strategic bilateral partnership and collaborative governance in labor mobility.',
                            'Follow up on outcomes of Joint Committees (JCM) and maintain active inter-ministerial coordination.',
                            'Strengthen worker welfare protocols through proactive awareness, Wage Protection System (WPS), and unemployment insurance.',
                            'Advance digital integration for skill verification and streamlined, transparent recruitment procedures.'
                          ]);
                      current.push('');
                      setData(prev => ({ ...prev, pointsToFocusOn: current }));
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                    <span>{isRTL ? 'إضافة رسالة / نقطة جديدة' : 'Add Point to Focus On'}</span>
                  </button>
                </div>

                {/* 2. LAST MEETINGS ("آخر اللقاءات والاجتماعات مع X Country") */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <Calendar size={15} />
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isRTL 
                          ? `آخر لقاء رسمي والاجتماعات السابقة مع ${getCountryArabicName(data.country)}` 
                          : `Last Official Meeting & Sessions with ${data.country || 'Partner Country'}`}
                      </h5>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        checked={data.sectionVisibility?.executiveBriefLastMeeting !== false && data.sectionVisibility?.briefLastMeetings !== false}
                        onChange={e => {
                          const updated = {
                            ...data,
                            sectionVisibility: {
                              ...(data.sectionVisibility || {}),
                              executiveBriefLastMeeting: e.target.checked,
                              briefLastMeetings: e.target.checked
                            }
                          };
                          setData(updated);
                          saveSilently(updated, isRTL ? (e.target.checked ? 'تم إظهار قسم اللقاءات والاجتماعات' : 'تم استبعاد قسم اللقاءات والاجتماعات من المعاينة') : 'Meetings section visibility updated');
                        }}
                      />
                      <span>{isRTL ? 'إظهار في التقرير' : 'Show in report'}</span>
                    </label>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {isRTL
                      ? `بيانات اللقاءات الثنائية واللجان المشتركة السابقة والحديثة مع وفد ومسؤولي ${getCountryArabicName(data.country)}:`
                      : `Details of past and recent bilateral meetings and joint committees with ${data.country || 'Partner Country'}:`}
                  </p>

                  {/* ======================================================== */}
                  {/* MULTI-TOPIC IMPORT & SELECTION FROM RELATIONSHIP SUMMARY */}
                  {/* ======================================================== */}
                  {(() => {
                    // Safe interactions list with guaranteed IDs
                    const interactions = (data.recentInteractions || []).map((it, idx) => ({
                      ...it,
                      id: it.id || `topic-${idx}-${it.date || 'd'}-${(it.title || '').slice(0, 8)}`
                    }));

                    // Current selected IDs for Executive Brief
                    const selectedTopicIds: string[] = data.executiveBriefMeetingIds !== undefined
                      ? data.executiveBriefMeetingIds
                      : (() => {
                          if (data.lastMeeting?.title) {
                            const match = interactions.find(it => it.title === data.lastMeeting?.title || (it.date && it.date === data.lastMeeting?.date));
                            if (match?.id) return [match.id];
                          }
                          return interactions.slice(0, 2).map(it => it.id).filter(Boolean);
                        })();

                    // Helper to toggle a topic selection
                    const handleToggleTopic = (topicId: string) => {
                      const exists = selectedTopicIds.includes(topicId);
                      let newIds = exists ? selectedTopicIds.filter(id => id !== topicId) : [...selectedTopicIds, topicId];
                      
                      // Keep lastMeeting in sync with the first selected topic if needed
                      let updatedLastMeeting = data.lastMeeting;
                      if (newIds.length > 0) {
                        const firstItem = interactions.find(it => it.id === newIds[0]);
                        if (firstItem && (!updatedLastMeeting || !updatedLastMeeting.title || (exists && updatedLastMeeting.title === interactions.find(it => it.id === topicId)?.title))) {
                          updatedLastMeeting = {
                            date: firstItem.date || '',
                            type: firstItem.meetingType || firstItem.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
                            title: firstItem.title || '',
                            coverage: (firstItem.details || '').slice(0, 160),
                            category: firstItem.category || 'MOHRE'
                          };
                        }
                      }

                      const updated = {
                        ...data,
                        executiveBriefMeetingIds: newIds,
                        lastMeeting: updatedLastMeeting
                      };
                      setData(updated);
                      saveSilently(updated, isRTL ? `تم تحديث المواضيع المختارة (${newIds.length})` : `Selected topics updated (${newIds.length})`);
                    };

                    // Helper to move a topic up or down
                    const handleMoveTopic = (index: number, direction: 'up' | 'down') => {
                      const newIds = [...selectedTopicIds];
                      const targetIndex = direction === 'up' ? index - 1 : index + 1;
                      if (targetIndex < 0 || targetIndex >= newIds.length) return;
                      const temp = newIds[index];
                      newIds[index] = newIds[targetIndex];
                      newIds[targetIndex] = temp;

                      // Update lastMeeting to the new first topic
                      const firstItem = interactions.find(it => it.id === newIds[0]);
                      const updatedLastMeeting = firstItem ? {
                        date: firstItem.date || '',
                        type: firstItem.meetingType || firstItem.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
                        title: firstItem.title || '',
                        coverage: (firstItem.details || '').slice(0, 160),
                        category: firstItem.category || 'MOHRE'
                      } : data.lastMeeting;

                      const updated = {
                        ...data,
                        executiveBriefMeetingIds: newIds,
                        lastMeeting: updatedLastMeeting
                      };
                      setData(updated);
                      saveSilently(updated, isRTL ? 'تم إعادة ترتيب مواضيع الإحاطة' : 'Topics reordered');
                    };

                    // Helper to set a topic as the featured last meeting
                    const handleSetAsFeatured = (topicId: string) => {
                      const target = interactions.find(it => it.id === topicId);
                      if (!target) return;
                      
                      // Move to front of selected IDs
                      const restIds = selectedTopicIds.filter(id => id !== topicId);
                      const newIds = [topicId, ...restIds];

                      const updated = {
                        ...data,
                        executiveBriefMeetingIds: newIds,
                        lastMeeting: {
                          date: target.date || '',
                          type: target.meetingType || target.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
                          title: target.title || '',
                          coverage: (target.details || '').slice(0, 160),
                          category: target.category || 'MOHRE'
                        }
                      };
                      setData(updated);
                      saveSilently(updated, isRTL ? `تم تعيين "${target.title}" كاللقاء الأخير المميز` : `Featured meeting set to "${target.title}"`);
                    };

                    return (
                      <div className="space-y-4 mb-4">
                        {/* 1. Multi-Topic Selection Panel from Relationship Summary */}
                        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-blue-200/80 dark:border-blue-800/40">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-blue-950 dark:text-blue-200 font-bold">
                                <Sparkles size={15} className="text-primary shrink-0" />
                                <span>{isRTL ? 'جلب من مواضيع ملخص العلاقة (Relationship Summary):' : 'Select from Relationship Summary:'}</span>
                              </div>
                              <p className="text-[10.5px] text-blue-800/80 dark:text-blue-300 mt-0.5">
                                {isRTL 
                                  ? 'يمكنك تحديد موضوع أو أكثر معاً لعرضها وإبرازها وتخصيص تفاصيلها في صفحة الإحاطة التنفيذية فوراً.' 
                                  : 'Select one or more topics to feature, display, and customize directly on the Executive Brief page.'}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-white dark:bg-gray-800 text-primary border border-blue-300 dark:border-blue-700 shadow-2xs">
                                {isRTL ? `${selectedTopicIds.length} مواضيع مختارة` : `${selectedTopicIds.length} selected`}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  const latest2 = interactions.slice(0, 2).map(it => it.id);
                                  const firstItem = interactions.find(it => it.id === latest2[0]);
                                  const updated = {
                                    ...data,
                                    executiveBriefMeetingIds: latest2,
                                    lastMeeting: firstItem ? {
                                      date: firstItem.date || '',
                                      type: firstItem.meetingType || firstItem.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
                                      title: firstItem.title || '',
                                      coverage: (firstItem.details || '').slice(0, 160),
                                      category: firstItem.category || 'MOHRE'
                                    } : data.lastMeeting
                                  };
                                  setData(updated);
                                  saveSilently(updated, isRTL ? 'تم اختيار أحدث موضوعين للإحاطة' : 'Latest 2 topics selected');
                                }}
                                className="px-2 py-1 text-[10.5px] font-bold rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                              >
                                {isRTL ? 'أحدث لقاءين' : 'Latest 2'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const latest3 = interactions.slice(0, 3).map(it => it.id);
                                  const firstItem = interactions.find(it => it.id === latest3[0]);
                                  const updated = {
                                    ...data,
                                    executiveBriefMeetingIds: latest3,
                                    lastMeeting: firstItem ? {
                                      date: firstItem.date || '',
                                      type: firstItem.meetingType || firstItem.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
                                      title: firstItem.title || '',
                                      coverage: (firstItem.details || '').slice(0, 160),
                                      category: firstItem.category || 'MOHRE'
                                    } : data.lastMeeting
                                  };
                                  setData(updated);
                                  saveSilently(updated, isRTL ? 'تم اختيار أحدث 3 مواضيع للإحاطة' : 'Latest 3 topics selected');
                                }}
                                className="px-2 py-1 text-[10.5px] font-bold rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                              >
                                {isRTL ? 'أحدث 3 لقاءات' : 'Latest 3'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = interactions.map(it => it.id);
                                  const updated = { ...data, executiveBriefMeetingIds: allIds };
                                  setData(updated);
                                  saveSilently(updated, isRTL ? 'تم تحديد جميع المواضيع' : 'All topics selected');
                                }}
                                className="px-2 py-1 text-[10.5px] font-bold rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                              >
                                {isRTL ? 'تحديد الكل' : 'Select All'}
                              </button>

                              {selectedTopicIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...data, executiveBriefMeetingIds: [] };
                                    setData(updated);
                                    saveSilently(updated, isRTL ? 'تم إلغاء تحديد المواضيع' : 'Selection cleared');
                                  }}
                                  className="px-2 py-1 text-[10.5px] font-semibold text-rose-600 hover:underline"
                                >
                                  {isRTL ? 'إلغاء التحديد' : 'Clear'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* List of Available Topics with Multi-Selection Checkboxes */}
                          {interactions.length === 0 ? (
                            <div className="text-center py-4 text-xs text-gray-500">
                              {isRTL ? 'لا توجد مواضيع مضافة في ملخص العلاقة حالياً. يمكنك إضافة لقاء من الزر أدناه.' : 'No topics available in Relationship Summary. You can add one below.'}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                              {interactions.map((item, idx) => {
                                const isSelected = selectedTopicIds.includes(item.id);
                                const isFeatured = data.lastMeeting?.title === item.title && (data.lastMeeting?.date === item.date || !data.lastMeeting?.date);
                                const cat = (item.category || 'MOHRE').toUpperCase();
                                const isUaeGov = cat.includes('UAE') || cat.includes('GOV') || cat.includes('حكومة');
                                const isMohre = cat.includes('MOHRE') || cat.includes('وزارة');

                                return (
                                  <div
                                    key={item.id || idx}
                                    onClick={() => handleToggleTopic(item.id)}
                                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                                      isSelected
                                        ? 'bg-white dark:bg-gray-800 border-primary shadow-xs ring-1 ring-primary/40'
                                        : 'bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}} // handled by div onClick
                                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                        {item.date && (
                                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                            {item.date}
                                          </span>
                                        )}
                                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                                          isUaeGov 
                                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800' 
                                            : isMohre 
                                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:text-white' 
                                              : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                          {isUaeGov ? 'UAE GOV' : isMohre ? 'MOHRE' : 'OTHER'}
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                          {item.meetingType || item.type || (isRTL ? 'اجتماع ثنائي' : 'Meeting')}
                                        </span>
                                        {isFeatured && (
                                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 rounded flex items-center gap-0.5">
                                            <Star size={10} className="fill-amber-500 text-amber-500" />
                                            {isRTL ? 'اللقاء الأخير المميز' : 'Featured'}
                                          </span>
                                        )}
                                      </div>
                                      <h6 className="font-bold text-gray-900 dark:text-gray-100 leading-snug truncate">
                                        {item.title || (isRTL ? 'موضوع بدون عنوان' : 'Untitled Topic')}
                                      </h6>
                                      {item.details && (
                                        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                          {item.details.replace(/[*#]/g, '')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. Manager & Direct Editors for the Selected Topics */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
                            <div>
                              <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                                {isRTL ? 'المواضيع المختارة المعروضة في صفحة الإحاطة التنفيذية' : 'Selected Topics Displayed in Executive Brief'}
                              </span>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {isRTL 
                                  ? 'يمكنك تعديل بيانات وتفاصيل أي لقاء هنا فوراً، واختيار اللقاء الأخير المميز وإعادة الترتيب:' 
                                  : 'Edit any meeting details here, designate the featured latest meeting, and reorder:'}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400">
                              {selectedTopicIds.length} / {interactions.length} {isRTL ? 'مواضيع' : 'topics'}
                            </span>
                          </div>

                          {selectedTopicIds.length === 0 ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                              <p className="text-xs text-gray-500 mb-2">
                                {isRTL 
                                  ? 'لم تختر أي مواضيع بعد. اضغط على خيارات التحديد السريع أعلاه (مثل "أحدث لقاءين") أو ضع علامة صح على المواضيع التي ترغب بجلبها.' 
                                  : 'No topics selected yet. Click "Latest 2" above or check topics to bring them into the Executive Brief.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const latest2 = interactions.slice(0, 2).map(it => it.id);
                                  const firstItem = interactions.find(it => it.id === latest2[0]);
                                  const updated = {
                                    ...data,
                                    executiveBriefMeetingIds: latest2,
                                    lastMeeting: firstItem ? {
                                      date: firstItem.date || '',
                                      type: firstItem.meetingType || firstItem.type || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'),
                                      title: firstItem.title || '',
                                      coverage: (firstItem.details || '').slice(0, 160),
                                      category: firstItem.category || 'MOHRE'
                                    } : data.lastMeeting
                                  };
                                  setData(updated);
                                  saveSilently(updated, isRTL ? 'تم جلب أحدث لقاءين' : 'Latest 2 meetings imported');
                                }}
                                className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary-dark shadow-2xs"
                              >
                                {isRTL ? '⚡ جلب أحدث لقاءين تلقائياً' : '⚡ Auto-Import Latest 2'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {selectedTopicIds.map((topicId, index) => {
                                const targetIdx = interactions.findIndex(it => it.id === topicId);
                                const item = targetIdx !== -1 ? interactions[targetIdx] : null;
                                if (!item) return null;

                                const isFeatured = data.lastMeeting?.title === item.title && (data.lastMeeting?.date === item.date || !data.lastMeeting?.date);

                                return (
                                  <div 
                                    key={topicId} 
                                    className={`p-3.5 rounded-xl border transition-all ${
                                      isFeatured 
                                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 shadow-2xs' 
                                        : 'bg-gray-50/90 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    {/* Card Action Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">
                                          {index + 1}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                          {item.title || (isRTL ? 'لقاء بدون مسمى' : 'Untitled Meeting')}
                                        </span>
                                        {isFeatured && (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                            <Star size={11} className="fill-emerald-600 text-emerald-600" />
                                            {isRTL ? '⭐ اللقاء الأخير المميز (الصفحة 2)' : '⭐ Featured Latest Meeting'}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {!isFeatured && (
                                          <button
                                            type="button"
                                            onClick={() => handleSetAsFeatured(item.id)}
                                            className="px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1"
                                            title={isRTL ? 'جعله اللقاء الأخير المميز بالصفحة 2' : 'Set as Featured Meeting'}
                                          >
                                            <Star size={11} />
                                            {isRTL ? 'تعيين كاللقاء الأخير المميز' : 'Set as Featured'}
                                          </button>
                                        )}

                                        {index > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleMoveTopic(index, 'up')}
                                            className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                            title={isRTL ? 'تقديم الترتيب للأعلى' : 'Move Up'}
                                          >
                                            ↑ {isRTL ? 'تقديم' : 'Up'}
                                          </button>
                                        )}

                                        {index < selectedTopicIds.length - 1 && (
                                          <button
                                            type="button"
                                            onClick={() => handleMoveTopic(index, 'down')}
                                            className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                            title={isRTL ? 'تأخير الترتيب للأسفل' : 'Move Down'}
                                          >
                                            ↓ {isRTL ? 'تأخير' : 'Down'}
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleToggleTopic(item.id)}
                                          className="px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900/60"
                                          title={isRTL ? 'إلغاء عرضه في الإحاطة التنفيذية' : 'Remove from Executive Brief'}
                                        >
                                          ✕ {isRTL ? 'إزالة من الإحاطة' : 'Remove'}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Inputs Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-2.5">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                          {isRTL ? 'تاريخ اللقاء' : 'Meeting Date'}
                                        </label>
                                        <input
                                          type="date"
                                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                                          value={item.date || ''}
                                          onChange={e => {
                                            const newInteractions = [...interactions];
                                            newInteractions[targetIdx] = { ...newInteractions[targetIdx], date: e.target.value };
                                            let updatedLast = data.lastMeeting;
                                            if (isFeatured) {
                                              updatedLast = { ...(data.lastMeeting || {}), date: e.target.value };
                                            }
                                            const updated = { ...data, recentInteractions: newInteractions, lastMeeting: updatedLast };
                                            setData(updated);
                                          }}
                                          onBlur={() => saveSilently(data, isRTL ? 'تم حفظ تاريخ اللقاء' : 'Meeting date saved')}
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                          {isRTL ? 'الجهة / تصنيف اللقاء' : 'Category'}
                                        </label>
                                        <select
                                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                                          value={item.category || 'MOHRE'}
                                          onChange={e => {
                                            const val = e.target.value;
                                            const newInteractions = [...interactions];
                                            newInteractions[targetIdx] = { ...newInteractions[targetIdx], category: val };
                                            let updatedLast = data.lastMeeting;
                                            if (isFeatured) {
                                              updatedLast = { ...(data.lastMeeting || {}), category: val };
                                            }
                                            const updated = { ...data, recentInteractions: newInteractions, lastMeeting: updatedLast };
                                            setData(updated);
                                            saveSilently(updated, isRTL ? `تم حفظ الجهة: ${val}` : 'Category saved');
                                          }}
                                        >
                                          <option value="MOHRE">{isRTL ? 'وزارة الموارد البشرية والتوطين (MOHRE)' : 'MOHRE'}</option>
                                          <option value="UAE GOV">{isRTL ? 'حكومة دولة الإمارات (UAE GOV)' : 'UAE GOV'}</option>
                                          <option value="OTHER">{isRTL ? 'جهة أخرى (OTHER)' : 'OTHER'}</option>
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                          {isRTL ? 'نوع اللقاء' : 'Meeting Type'}
                                        </label>
                                        <select
                                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                                          value={item.meetingType || item.type || ''}
                                          onChange={e => {
                                            const val = e.target.value;
                                            const newInteractions = [...interactions];
                                            newInteractions[targetIdx] = { 
                                              ...newInteractions[targetIdx], 
                                              meetingType: val,
                                              type: val 
                                            };
                                            let updatedLast = data.lastMeeting;
                                            if (isFeatured) {
                                              updatedLast = { ...(data.lastMeeting || {}), type: val };
                                            }
                                            const updated = { ...data, recentInteractions: newInteractions, lastMeeting: updatedLast };
                                            setData(updated);
                                            saveSilently(updated, isRTL ? `تم حفظ نوع اللقاء: ${val}` : 'Meeting type saved');
                                          }}
                                        >
                                          <option value="اجتماع ثنائي">{isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'}</option>
                                          <option value="اللجنة المشتركة (JCM)">{isRTL ? 'اللجنة المشتركة (JCM)' : 'Joint Committee (JCM)'}</option>
                                          <option value="اللجنة الوزارية / الفنية (TCM)">{isRTL ? 'اللجنة الوزارية / الفنية (TCM)' : 'Ministerial / Technical (TCM)'}</option>
                                          <option value="زيارة رسمية">{isRTL ? 'زيارة رسمية' : 'Official Visit'}</option>
                                          <option value="أخرى">{isRTL ? 'أخرى' : 'Other'}</option>
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                          {isRTL ? 'مسمى اللقاء / الاجتماع' : 'Meeting Title'}
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                                          value={item.title || ''}
                                          onChange={e => {
                                            const newInteractions = [...interactions];
                                            newInteractions[targetIdx] = { ...newInteractions[targetIdx], title: e.target.value };
                                            let updatedLast = data.lastMeeting;
                                            if (isFeatured) {
                                              updatedLast = { ...(data.lastMeeting || {}), title: e.target.value };
                                            }
                                            setData({ ...data, recentInteractions: newInteractions, lastMeeting: updatedLast });
                                          }}
                                          onBlur={() => saveSilently(data, isRTL ? 'تم حفظ مسمى اللقاء' : 'Meeting title saved')}
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                          {isRTL ? 'موجز ما تم بحثه والاتفاق عليه' : 'Discussion & Outcomes Summary'}
                                        </label>
                                        <span className="text-[10px] text-gray-400">
                                          {(item.details || '').length}/180 {isRTL ? 'حرف' : 'chars'}
                                        </span>
                                      </div>
                                      <textarea
                                        rows={2}
                                        maxLength={180}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                                        placeholder={isRTL ? 'موجز مختصر للمباحثات وأهم النتائج...' : 'Brief discussion summary and outcomes...'}
                                        value={item.details || ''}
                                        onChange={e => {
                                          const newInteractions = [...interactions];
                                          newInteractions[targetIdx] = { ...newInteractions[targetIdx], details: e.target.value };
                                          let updatedLast = data.lastMeeting;
                                          if (isFeatured) {
                                            updatedLast = { ...(data.lastMeeting || {}), coverage: e.target.value.slice(0, 160) };
                                          }
                                          setData({ ...data, recentInteractions: newInteractions, lastMeeting: updatedLast });
                                        }}
                                        onBlur={() => saveSilently(data, isRTL ? 'تم حفظ موجز اللقاء' : 'Meeting summary saved')}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Additional Past Meetings List (Synced with recentInteractions that render on Page 2) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {isRTL ? 'جدول سجل اللقاءات والاجتماعات السابقة' : 'Past Meetings & Sessions Log'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = uuidv4();
                          const newMeeting = {
                            id: newId,
                            date: new Date().toISOString().split('T')[0],
                            type: 'Meeting',
                            meetingType: isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting',
                            title: isRTL ? 'اجتماع ثنائي مشترك' : 'Joint Bilateral Meeting',
                            category: 'MOHRE',
                            details: ''
                          };
                          const current = [...(data.recentInteractions || [])];
                          current.unshift(newMeeting);
                          const updatedSelected = data.executiveBriefMeetingIds ? [newId, ...data.executiveBriefMeetingIds] : [newId];
                          const updated = { ...data, recentInteractions: current, executiveBriefMeetingIds: updatedSelected };
                          setData(updated);
                          saveSilently(updated, isRTL ? 'تمت إضافة لقاء جديد إلى السجل وتحديده للإحاطة' : 'Meeting added to log and selected for brief');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        <Plus size={12} />
                        <span>{isRTL ? 'إضافة لقاء إلى الجدول' : 'Add Meeting to Log'}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(data.recentInteractions || [])
                        .filter(item => {
                          const t = (item.type || '').toLowerCase();
                          return t === 'meeting' || t === 'visit' || t === 'session' || item.meetingType || t === '';
                        })
                        .map((item, idx) => (
                          <div key={item.id || idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                            <input
                              type="date"
                              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 w-32 shrink-0"
                              value={item.date || ''}
                              onChange={e => {
                                const current = [...(data.recentInteractions || [])];
                                const targetIdx = current.findIndex(m => (m.id === item.id) || (m === item));
                                if (targetIdx !== -1) {
                                  current[targetIdx] = { ...current[targetIdx], date: e.target.value };
                                  setData({ ...data, recentInteractions: current });
                                }
                              }}
                              onBlur={() => saveSilently(data, isRTL ? 'تم حفظ التعديل' : 'Saved')}
                            />
                            <input
                              type="text"
                              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 w-36 shrink-0"
                              placeholder={isRTL ? 'نوع اللقاء' : 'Type'}
                              value={item.meetingType || item.type || ''}
                              onChange={e => {
                                const current = [...(data.recentInteractions || [])];
                                const targetIdx = current.findIndex(m => (m.id === item.id) || (m === item));
                                if (targetIdx !== -1) {
                                  current[targetIdx] = { ...current[targetIdx], meetingType: e.target.value, type: e.target.value };
                                  setData({ ...data, recentInteractions: current });
                                }
                              }}
                              onBlur={() => saveSilently(data, isRTL ? 'تم حفظ التعديل' : 'Saved')}
                            />
                            <input
                              type="text"
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 min-w-[140px]"
                              placeholder={isRTL ? 'مسمى اللقاء وموجز المباحثات...' : 'Meeting title & summary...'}
                              value={item.title || item.details || ''}
                              onChange={e => {
                                const current = [...(data.recentInteractions || [])];
                                const targetIdx = current.findIndex(m => (m.id === item.id) || (m === item));
                                if (targetIdx !== -1) {
                                  current[targetIdx] = { ...current[targetIdx], title: e.target.value };
                                  setData({ ...data, recentInteractions: current });
                                }
                              }}
                              onBlur={() => saveSilently(data, isRTL ? 'تم حفظ التعديل' : 'Saved')}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = (data.recentInteractions || []).filter(m => (m.id ? m.id !== item.id : m !== item));
                                const updatedSelected = (data.executiveBriefMeetingIds || []).filter(id => id !== item.id);
                                const updated = { ...data, recentInteractions: current, executiveBriefMeetingIds: updatedSelected };
                                setData(updated);
                                saveSilently(updated, isRTL ? 'تم حذف اللقاء' : 'Meeting removed');
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded shrink-0"
                              title={isRTL ? 'حذف هذا اللقاء' : 'Delete'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* 3. LAST OFFICIAL CORRESPONDENCE ("آخر مراسلة رسمية") */}
                <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                        <Mail size={15} />
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isRTL 
                          ? `آخر مراسلة رسمية مع ${getCountryArabicName(data.country)}` 
                          : `Last Official Correspondence with ${data.country || 'Partner Country'}`}
                      </h5>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                          checked={data.sectionVisibility?.executiveBriefLastCorrespondence !== false && data.sectionVisibility?.briefLastCorrespondence !== false}
                          onChange={e => {
                            const updated = {
                              ...data,
                              sectionVisibility: {
                                ...(data.sectionVisibility || {}),
                                executiveBriefLastCorrespondence: e.target.checked,
                                briefLastCorrespondence: e.target.checked
                              }
                            };
                            setData(updated);
                            saveSilently(updated, isRTL ? (e.target.checked ? 'تم إظهار قسم آخر مراسلة رسمية' : 'تم استبعاد قسم آخر مراسلة رسمية من المعاينة') : 'Correspondence section visibility updated');
                          }}
                        />
                        <span>{isRTL ? 'إظهار في التقرير' : 'Show in report'}</span>
                      </label>

                      {data.lastCorrespondence && (data.lastCorrespondence.subject || data.lastCorrespondence.ref || data.lastCorrespondence.date) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...data,
                              lastCorrespondence: undefined
                            };
                            setData(updated);
                            saveSilently(updated, isRTL ? 'تم مسح بيانات المراسلة الرسمية' : 'Correspondence cleared');
                          }}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          {isRTL ? 'مسح الحقول' : 'Clear'}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {isRTL
                      ? `بيانات أحدث مراسلة رسمية متبادلة مع ${getCountryArabicName(data.country)} وتتبع حالتها وإجراءاتها:`
                      : `Details of the latest official correspondence with ${data.country || 'Partner Country'} to track status and actions:`}
                  </p>

                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          {isRTL ? 'اتجاه المراسلة' : 'Direction'}
                        </label>
                        <select
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                          value={data.lastCorrespondence?.direction || 'outgoing'}
                          onChange={e => {
                            const current = data.lastCorrespondence || {};
                            const updated = {
                              ...data,
                              lastCorrespondence: {
                                ...current,
                                direction: e.target.value
                              }
                            };
                            setData(updated);
                            saveSilently(updated, isRTL ? 'تم حفظ اتجاه المراسلة' : 'Direction saved');
                          }}
                        >
                          <option value="outgoing">{isRTL ? 'صادرة (من دولة الإمارات)' : 'Outgoing (From UAE)'}</option>
                          <option value="incoming">{isRTL ? 'واردة (من الجانب المقابل)' : 'Incoming (From Partner)'}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          {isRTL ? 'تاريخ المراسلة' : 'Correspondence Date'}
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                          value={data.lastCorrespondence?.date || ''}
                          onChange={e => {
                            const current = data.lastCorrespondence || {};
                            const updated = {
                              ...data,
                              lastCorrespondence: {
                                ...current,
                                date: e.target.value
                              }
                            };
                            setData(updated);
                          }}
                          onBlur={() => {
                            saveSilently(data, isRTL ? 'تم حفظ تاريخ المراسلة' : 'Date saved');
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          {isRTL ? 'رقم القيد / الإشارة' : 'Reference Number'}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                          placeholder={isRTL ? 'مثال: MOHRE/IR/2024/889' : 'e.g. MOHRE/IR/2024/889'}
                          value={data.lastCorrespondence?.ref || ''}
                          onChange={e => {
                            const current = data.lastCorrespondence || {};
                            setData({
                              ...data,
                              lastCorrespondence: {
                                ...current,
                                ref: e.target.value
                              }
                            });
                          }}
                          onBlur={() => {
                            saveSilently(data, isRTL ? 'تم حفظ رقم الإشارة' : 'Reference saved');
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          {isRTL ? 'موضوع المراسلة' : 'Subject'}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                          placeholder={isRTL ? 'موضوع الخطاب الرسمي أو الطلب المشترك...' : 'Official letter subject or bilateral request...'}
                          value={data.lastCorrespondence?.subject || ''}
                          onChange={e => {
                            const current = data.lastCorrespondence || {};
                            setData({
                              ...data,
                              lastCorrespondence: {
                                ...current,
                                subject: e.target.value
                              }
                            });
                          }}
                          onBlur={() => {
                            saveSilently(data, isRTL ? 'تم حفظ موضوع المراسلة' : 'Subject saved');
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          {isRTL ? 'حالة المراسلة' : 'Status'}
                        </label>
                        <select
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-primary"
                          value={data.lastCorrespondence?.status || 'awaiting_reply'}
                          onChange={e => {
                            const val = e.target.value;
                            const current = data.lastCorrespondence || {};
                            const updated = {
                              ...data,
                              lastCorrespondence: {
                                ...current,
                                status: val
                              }
                            };
                            setData(updated);
                            saveSilently(updated, isRTL ? `تم حفظ حالة المراسلة` : 'Status saved');
                          }}
                        >
                          <option value="awaiting_reply">{isRTL ? 'بانتظار الرد (Awaiting Reply)' : 'Awaiting Reply'}</option>
                          <option value="under_followup">{isRTL ? 'قيد المتابعة (Under Follow-up)' : 'Under Follow-up'}</option>
                          <option value="actioned">{isRTL ? 'تم اتخاذ الإجراء (Actioned)' : 'Actioned'}</option>
                          <option value="closed">{isRTL ? 'مغلقة (Closed)' : 'Closed'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
               <SectionVisibilityToggle sectionKey="uaeWorkforceKpis" label={isRTL ? 'مؤشرات القوى العاملة' : 'Workforce KPIs'} />
               <SectionVisibilityToggle sectionKey="insuranceExposures" label={isRTL ? 'وثائق التأمين' : 'Insurance'} />
               <SectionVisibilityToggle sectionKey="laborComplaints" label={isRTL ? 'الشكاوى العمالية' : 'Complaints'} />
               <SectionVisibilityToggle sectionKey="threeYearTrend" label={isRTL ? 'المسار التاريخي (3 سنوات)' : '3-Year Trend'} />
               <SectionVisibilityToggle sectionKey="workforceByEmirate" label={isRTL ? 'توزيع الإمارات' : 'Emirates'} />
               <SectionVisibilityToggle sectionKey="workforceBySector" label={isRTL ? 'توزيع القطاعات' : 'Sectors'} />
               <SectionVisibilityToggle sectionKey="salaryComparison" label={isRTL ? 'مقارنة الأجور' : 'Salaries'} />
             </div>
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
                        ? 'إدخال بيانات العاملين لكل إمارة من خلال مصدري البيانات: وزارة الموارد البشرية و التوطين (MOHRE) والهيئة الاتحادية للهوية (ICP)' 
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
                                {isRTL ? 'وزارة الموارد البشرية و التوطين (MOHRE)' : 'MOHRE (Private Sector)'}
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
               <div className="space-y-3">
                 <SectionVisibilityToggle 
                   sectionKey="partnerWorkforce" 
                   label={isRTL ? `تضمين صفحة القوى العاملة في ${data.country || 'الدولة الشريكة'}` : `Include ${data.country || 'Partner'} Workforce Page`}
                   description={isRTL ? 'التحكم في ظهور صفحة القوى العاملة ومعدلات الأجور والمهارات في التقرير' : 'Toggle whether partner workforce page is generated in print and PDF views'}
                 />
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                   <SectionVisibilityToggle sectionKey="partnerWorkforceKpis" label={isRTL ? 'مؤشرات القوى العاملة' : 'Workforce KPIs'} />
                   <SectionVisibilityToggle sectionKey="migrationDestinations" label={isRTL ? 'وجهات الهجرة' : 'Migration Dests'} />
                   <SectionVisibilityToggle sectionKey="partnerSectors" label={isRTL ? 'توزيع القطاعات' : 'Sectors'} />
                   <SectionVisibilityToggle sectionKey="availableSkills" label={isRTL ? 'المهارات المتاحة' : 'Skills'} />
                 </div>
               </div>
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
                {/* Header with Title, Explanation, and Sorting Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="font-bold flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
                      <Calendar size={18} className="text-primary" /> 
                      {isRTL ? 'مواضيع ملخص العلاقة (Relationship Summary)' : 'Relationship Summary Topics'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isRTL 
                        ? 'تصنيف المواضيع (حكومة الإمارات، وزارة الموارد البشرية و التوطين، جهة أخرى) وتحديد فقاعة نوع اللقاء، وتنعكس التعديلات في التقرير فوراً.' 
                        : 'Categorize topics (UAE GOV, MOHRE, OTHER), set meeting type bubble, instantly reflected in report.'}
                    </p>
                  </div>
                  
                  {/* Top Action Buttons & Sort Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSave('draft', false, data, false, isRTL ? 'تم حفظ وتحديث مواضيع ملخص العلاقة في التقرير بنجاح' : 'Topics updated in report');
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-primary text-white hover:bg-primary-dark rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                      title={isRTL ? 'حفظ فوري في التقرير' : 'Save to Report'}
                    >
                      <Save size={13} />
                      {isRTL ? 'حفظ التعديلات في التقرير فوراً' : 'Save to Report Now'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSave('draft', true, data, false);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg transition-all flex items-center gap-1.5"
                      title={isRTL ? 'معاينة في التقرير' : 'View in Report'}
                    >
                      <ExternalLink size={13} />
                      {isRTL ? 'معاينة في التقرير ↗' : 'View in Report ↗'}
                    </button>

                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
                      <span className="text-[11px] font-bold text-gray-500 px-1">{isRTL ? 'الترتيب:' : 'Sort:'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const getCategoryRankForSort = (cat?: string) => {
                            const c = (cat || '').toUpperCase().trim();
                            if (c === 'UAE GOV' || c.includes('UAE') || c.includes('GOV') || c.includes('حكومة')) return 1;
                            if (c === 'MOHRE' || c.includes('MOHRE') || c.includes('وزارة') || c.includes('موارد')) return 2;
                            return 3;
                          };
                          const sorted = [...data.recentInteractions].sort((a, b) => {
                            const dateCompare = (b.date || '').localeCompare(a.date || '');
                            if (dateCompare !== 0) return dateCompare;
                            const catRankA = getCategoryRankForSort(a.category);
                            const catRankB = getCategoryRankForSort(b.category);
                            if (catRankA !== catRankB) return catRankA - catRankB;
                            return (a.type || '').localeCompare(b.type || '');
                          });
                          const updated = {
                            ...data,
                            interactionSortOrder: 'date_category' as const,
                            recentInteractions: sorted
                          };
                          setData(updated);
                          saveSilently(updated, isRTL ? 'تم ترتيب المواضيع حسب التاريخ والفئة وحفظها' : 'Topics sorted and saved');
                        }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                          (data.interactionSortOrder || 'date_category') === 'date_category'
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {isRTL ? '📅 التاريخ ثم الفئة والنوع' : '📅 Date then Category'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const getCategoryRankForSort = (cat?: string) => {
                            const c = (cat || '').toUpperCase().trim();
                            if (c === 'UAE GOV' || c.includes('UAE') || c.includes('GOV') || c.includes('حكومة')) return 1;
                            if (c === 'MOHRE' || c.includes('MOHRE') || c.includes('وزارة') || c.includes('موارد')) return 2;
                            return 3;
                          };
                          const sorted = [...data.recentInteractions].sort((a, b) => {
                            const catRankA = getCategoryRankForSort(a.category);
                            const catRankB = getCategoryRankForSort(b.category);
                            if (catRankA !== catRankB) return catRankA - catRankB;
                            const dateCompare = (b.date || '').localeCompare(a.date || '');
                            if (dateCompare !== 0) return dateCompare;
                            return (a.type || '').localeCompare(b.type || '');
                          });
                          const updated = {
                            ...data,
                            interactionSortOrder: 'category_date' as const,
                            recentInteractions: sorted
                          };
                          setData(updated);
                          saveSilently(updated, isRTL ? 'تم ترتيب المواضيع حسب الفئة والتاريخ وحفظها' : 'Topics sorted and saved');
                        }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                          data.interactionSortOrder === 'category_date'
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {isRTL ? '🏛️ الفئة ثم التاريخ' : '🏛️ Category then Date'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const getCategoryRankForSort = (cat?: string) => {
                          const c = (cat || '').toUpperCase().trim();
                          if (c === 'UAE GOV' || c.includes('UAE') || c.includes('GOV') || c.includes('حكومة')) return 1;
                          if (c === 'MOHRE' || c.includes('MOHRE') || c.includes('وزارة') || c.includes('موارد')) return 2;
                          return 3;
                        };
                        const isCatFirst = data.interactionSortOrder === 'category_date';
                        const sorted = [...data.recentInteractions].sort((a, b) => {
                          if (isCatFirst) {
                            const catRankA = getCategoryRankForSort(a.category);
                            const catRankB = getCategoryRankForSort(b.category);
                            if (catRankA !== catRankB) return catRankA - catRankB;
                            const dateCompare = (b.date || '').localeCompare(a.date || '');
                            if (dateCompare !== 0) return dateCompare;
                            return (a.type || '').localeCompare(b.type || '');
                          }
                          const dateCompare = (b.date || '').localeCompare(a.date || '');
                          if (dateCompare !== 0) return dateCompare;
                          const catRankA = getCategoryRankForSort(a.category);
                          const catRankB = getCategoryRankForSort(b.category);
                          if (catRankA !== catRankB) return catRankA - catRankB;
                          return (a.type || '').localeCompare(b.type || '');
                        });
                        const updated = { ...data, recentInteractions: sorted };
                        setData(updated);
                        saveSilently(updated, isRTL ? 'تم إعادة ترتيب القائمة وتحديث التقرير فوراً' : 'List re-sorted & saved');
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors flex items-center gap-1"
                      title={isRTL ? 'إعادة ترتيب القائمة الآن' : 'Re-sort list now'}
                    >
                      <ArrowUpDown size={12} />
                      {isRTL ? 'ترتيب فوري' : 'Sort Now'}
                    </button>
                  </div>
                </div>
                {data.recentInteractions.map((item, idx) => (
                   <Card key={item.id} className="p-4 relative border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button 
                        onClick={() => {
                          const updatedList = data.recentInteractions.filter(ri => ri.id !== item.id);
                          const updated = { ...data, recentInteractions: updatedList };
                          setData(updated);
                          saveSilently(updated, isRTL ? 'تم حذف الموضوع وتحديث التقرير' : 'Item removed');
                        }} 
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>

                      {/* 1. Category Selection: UAE GOV | MOHRE | OTHER */}
                      <div className="mb-3 pr-6">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                          {isRTL ? 'فئة الموضوع (Category):' : 'Topic Category:'}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'UAE GOV', label: isRTL ? 'حكومة الإمارات (UAE GOV)' : 'UAE GOV', color: 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300 font-black' },
                            { key: 'MOHRE', label: isRTL ? 'وزارة الموارد البشرية و التوطين (MOHRE)' : 'MOHRE', color: 'bg-[#162e4a] text-white border-[#162e4a] ring-2 ring-primary/50 font-black' },
                            { key: 'OTHER', label: isRTL ? 'جهة أخرى (OTHER)' : 'OTHER', color: 'bg-slate-200 text-slate-900 border-slate-400 ring-2 ring-slate-300 font-bold' },
                          ].map(cat => {
                            const isSelected = (item.category || 'MOHRE') === cat.key;
                            return (
                              <button
                                key={cat.key}
                                type="button"
                                onClick={() => {
                                  const list = [...data.recentInteractions];
                                  list[idx].category = cat.key;
                                  const updated = { ...data, recentInteractions: list };
                                  setData(updated);
                                  saveSilently(updated, isRTL ? `تم حفظ الفئة "${cat.label}" في التقرير فوراً` : `Category saved to report`);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                                  isSelected 
                                    ? `${cat.color} shadow-xs scale-[1.02]`
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {cat.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Type & Meeting Type Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                            {isRTL ? 'نوع النشاط (Type)' : 'Activity Type'}
                          </label>
                          <select
                            value={item.type || 'Meeting'}
                            onChange={e => {
                              const val = e.target.value;
                              const list = [...data.recentInteractions];
                              list[idx].type = val;
                              if (val === 'Meeting' && !list[idx].meetingType) {
                                list[idx].meetingType = isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting';
                              }
                              const updated = { ...data, recentInteractions: list };
                              setData(updated);
                              saveSilently(updated, isRTL ? `تم حفظ نوع النشاط "${val}" في التقرير فوراً` : `Type "${val}" saved to report`);
                            }}
                            className="w-full px-3 py-1.5 text-sm rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none"
                          >
                            <option value="Meeting">{isRTL ? 'Meeting (اجتماع / لقاء)' : 'Meeting'}</option>
                            <option value="Visit">{isRTL ? 'Visit (زيارة رسمية)' : 'Visit'}</option>
                            <option value="Session">{isRTL ? 'Session (جلسة عمل)' : 'Session'}</option>
                            <option value="Phone Call">{isRTL ? 'Phone Call (مكالمة هاتفية)' : 'Phone Call'}</option>
                            <option value="Correspondence">{isRTL ? 'Correspondence (مراسلة)' : 'Correspondence'}</option>
                            <option value="Other">{isRTL ? 'Other (أخرى)' : 'Other'}</option>
                          </select>
                        </div>

                        {/* Meeting Type bubble: user requested a tiny bubble next to meeting showing meeting type */}
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1 flex items-center justify-between">
                            <span>{isRTL ? 'نوع اللقاء (الفقاعة بجانب كلمة Meeting):' : 'Meeting Type (Bubble next to Meeting):'}</span>
                            <span className="text-[10px] text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.2 rounded font-extrabold border border-blue-200">
                              {isRTL ? 'فقاعة خاصة' : 'Special Bubble'}
                            </span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={
                                ['اللجنة المشتركة (JCM)', 'اللجنة الوزارية / الفنية (TCM)', 'اجتماع ثنائي', 'اجتماع تشاوري', 'قمة وزارية', 'Joint Committee (JCM)', 'Ministerial / Technical (TCM)', 'Bilateral Meeting', 'Consultation Session', 'Ministerial Summit'].includes(item.meetingType || '')
                                  ? item.meetingType
                                  : (item.meetingType ? 'custom' : (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting'))
                              }
                              onChange={e => {
                                const val = e.target.value;
                                const list = [...data.recentInteractions];
                                if (val === 'custom') {
                                  list[idx].meetingType = '';
                                } else {
                                  list[idx].meetingType = val;
                                }
                                const updated = { ...data, recentInteractions: list };
                                setData(updated);
                                if (val !== 'custom') {
                                  saveSilently(updated, isRTL ? `تم حفظ نوع اللقاء "${val}" في التقرير فوراً` : `Meeting type "${val}" saved to report`);
                                }
                              }}
                              className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none"
                            >
                              <option value="اللجنة المشتركة (JCM)">اللجنة المشتركة (JCM)</option>
                              <option value="اللجنة الوزارية / الفنية (TCM)">اللجنة الوزارية / الفنية (TCM)</option>
                              <option value="اجتماع ثنائي">اجتماع ثنائي</option>
                              <option value="اجتماع تشاوري">اجتماع تشاوري</option>
                              <option value="قمة وزارية">قمة وزارية</option>
                              <option value="custom">{isRTL ? 'نوع مخصص...' : 'Custom type...'}</option>
                            </select>
                            <input
                              type="text"
                              placeholder={isRTL ? 'أو اكتب نص الفقاعة...' : 'Or type bubble text...'}
                              value={item.meetingType || ''}
                              onChange={e => {
                                const list = [...data.recentInteractions];
                                list[idx].meetingType = e.target.value;
                                setData({ ...data, recentInteractions: list });
                              }}
                              onBlur={() => {
                                saveSilently(data, isRTL ? `تم حفظ نوع اللقاء "${item.meetingType}" في التقرير فوراً` : 'Meeting type bubble saved');
                              }}
                              className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Title & Date */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="md:col-span-2">
                          <Input 
                            value={item.title} 
                            label={isRTL ? 'عنوان الموضوع / الاجتماع' : 'Topic / Meeting Title'} 
                            onChange={e => { const list = [...data.recentInteractions]; list[idx].title = e.target.value; setData({...data, recentInteractions: list}); }} 
                            onBlur={() => {
                              saveSilently(data, isRTL ? 'تم حفظ عنوان الموضوع في التقرير' : 'Topic title saved');
                            }}
                          />
                        </div>
                        <div>
                          <Input 
                            value={item.date} 
                            type="date" 
                            label={isRTL ? 'التاريخ' : 'Date'} 
                            onChange={e => { 
                              const list = [...data.recentInteractions]; 
                              list[idx].date = e.target.value; 
                              const updated = { ...data, recentInteractions: list };
                              setData(updated);
                              saveSilently(updated, isRTL ? 'تم حفظ التاريخ في التقرير' : 'Date saved');
                            }} 
                          />
                        </div>
                      </div>

                      {/* 4. Details */}
                      <RichTextarea 
                        label={isRTL ? 'التفاصيل ومحاور اللقاء' : 'Details & Summary'} 
                        value={item.details} 
                        onChange={(val: string) => { const list = [...data.recentInteractions]; list[idx].details = val; setData({...data, recentInteractions: list}); }} 
                        onBlur={() => {
                          saveSilently(data, isRTL ? 'تم حفظ تفاصيل الموضوع في التقرير' : 'Topic details saved');
                        }}
                      />

                      {/* Card Instant Save Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <span className="font-semibold">{isRTL ? 'معاينة الفقاعة في التقرير:' : 'Bubble preview:'}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                            {item.meetingType || (isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleSave('draft', false, data, false, isRTL ? 'تم حفظ هذا البند وانعكس في التقرير فوراً ✓' : 'Topic saved & reflected in report ✓');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all"
                          title={isRTL ? 'حفظ هذا البند في التقرير فوراً' : 'Save this item to report'}
                        >
                          <Save size={13} />
                          {isRTL ? 'حفظ هذا البند في التقرير' : 'Save Item to Report'}
                        </button>
                      </div>
                   </Card>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const newItem: any = { 
                      id: uuidv4(), 
                      title: '', 
                      date: new Date().toISOString().split('T')[0], 
                      category: 'MOHRE',
                      type: 'Meeting', 
                      meetingType: isRTL ? 'اجتماع ثنائي' : 'Bilateral Meeting',
                      details: '' 
                    };
                    const updated = {...data, recentInteractions: [...data.recentInteractions, newItem]};
                    setData(updated);
                    saveSilently(updated, isRTL ? 'تمت إضافة بند جديد وحفظه' : 'New topic added and saved');
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} /> {isRTL ? '+ إضافة موضوع / لقاء جديد' : '+ Add Interaction'}
                </Button>
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
                 onChange={(matters) => setData(prev => ({ ...prev, pendingMatters: matters }))}
                 isRTL={isRTL}
                 onAutoImport={handleAutoImportPendingMatters}
                 showAutoImport={(data.previousAgreementsAndUpdates || []).length > 0 || (data.bilateralAgreements || []).some(a => a.status === 'pending')}
               />
             </div>
             <div className="space-y-4 pt-6 border-t">
               <AttentionNotesEditor
                 attentionNotes={data.attentionNotes || []}
                 onChange={(notes) => setData(prev => ({ ...prev, attentionNotes: notes }))}
                 isRTL={isRTL}
                 reportData={data}
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
             <div className="space-y-4 pt-6 border-t">
               <AttentionNotesEditor
                 attentionNotes={data.attentionNotes || []}
                 onChange={(notes) => setData(prev => ({ ...prev, attentionNotes: notes }))}
                 isRTL={isRTL}
                 reportData={data}
               />
             </div>
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <SectionVisibilityToggle 
                 sectionKey="uaeDelegation" 
                 label={isRTL ? 'إظهار وفد دولة الإمارات' : 'Show UAE Delegation'}
                 description={isRTL ? 'في حال الإخفاء، يُترك مكان القسم فارغاً حفاظاً على التنسيق' : 'If hidden, space remains empty to preserve layout'}
               />
               <SectionVisibilityToggle 
                 sectionKey="partnerDelegation" 
                 label={isRTL ? `إظهار وفد ${data.country || 'الدولة الشريكة'}` : `Show ${data.country || 'Partner'} Delegation`}
                 description={isRTL ? 'في حال الإخفاء، يُترك مكان القسم فارغاً حفاظاً على التنسيق' : 'If hidden, space remains empty to preserve layout'}
               />
             </div>
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
      {/* Top Header Controls & Feedback */}
      <div className="mt-6 mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            {data.country ? data.country.substring(0, 2).toUpperCase() : <Globe size={20} />}
          </div>
          <div>
            <h2 className="font-serif font-bold text-gray-900 dark:text-white text-base">
              {reportTitle || (data.country ? `تقرير ${data.country}` : (isRTL ? 'إعداد التقرير الدبلوماسي' : 'Diplomatic Report Wizard'))}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{isRTL ? 'الخطوة' : 'Step'} {currentStep + 1} {isRTL ? 'من' : 'of'} {STEPS.length}: {STEPS[currentStep]?.label}</span>
              {saveSuccess && (
                <span className="text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                  <Check size={14} /> {isRTL ? 'تم الحفظ وتحديث البيانات' : 'Saved & Updated'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1.5"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin text-primary" /> : <Save size={15} />}
            <span>{isRTL ? 'حفظ مسودة' : 'Save Draft'}</span>
          </Button>

          <Button 
            variant="primary" 
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave('draft', true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            title={isRTL ? 'حفظ وعرض التقرير الكامل والملخص التنفيذي' : 'Save and View Executive Report'}
          >
            <Eye size={15} />
            <span>{isRTL ? 'معاينة التقرير' : 'View Report'}</span>
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>
              {lastSavedMessage || (isRTL
                ? 'تم حفظ كافة بيانات التقرير وتحديثها في التقرير التنفيذي فوراً.'
                : 'Report data saved & updated in executive report immediately.')}
            </span>
          </div>
          <button 
            onClick={() => handleSave('draft', true)} 
            className="underline font-black hover:text-emerald-900 ms-4 shrink-0"
          >
            {isRTL ? 'فتح التقرير الآن ←' : 'Open Report Now →'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-2">
        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <button 
              key={step.id} 
              onClick={() => {
                saveSilently(data);
                setCurrentStep(idx);
              }} 
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${idx === currentStep ? 'bg-primary text-white shadow-xl translate-x-2' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
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
            <Button 
              variant="ghost" 
              onClick={() => {
                saveSilently(data);
                setCurrentStep(Math.max(0, currentStep - 1));
              }} 
              disabled={currentStep === 0}
            >
              <ArrowLeft size={18} /> {t('back')}
            </Button>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                disabled={isSaving}
                onClick={() => handleSave('draft')}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin text-primary" /> : <Save size={18} />}
                {t('save')}
              </Button>
              
              <Button 
                variant="outline"
                disabled={isSaving}
                onClick={() => handleSave('draft', true)}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                title={isRTL ? 'حفظ وعرض التقرير' : 'Save & View Report'}
              >
                <Eye size={18} />
                {isRTL ? 'حفظ ومعاينة التقرير' : 'Save & View'}
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button 
                  onClick={() => {
                    saveSilently(data);
                    setCurrentStep(currentStep + 1);
                  }} 
                  className="px-10"
                >
                  {t('next')} <ArrowRight size={18} />
                </Button>
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