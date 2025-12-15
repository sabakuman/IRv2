import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ReportData, EMPTY_REPORT_DATA, Report, Delegate, LabelValue, NewsItem, RecentInteraction, PointOfDiscussion } from '../types';
import { MockService } from '../services/mockService';
import { Button, Card, Input } from '../components/ui/LayoutComponents';
import { ArrowLeft, ArrowRight, Save, Globe, Users, FileText, CheckCircle, Plane, Building, TrendingUp, Sparkles, Loader2, RefreshCw, Link as LinkIcon, Search, Hammer, GraduationCap, Briefcase, Plus, X, Banknote, UserPlus, Image as ImageIcon, BarChart2, MessageSquare, Newspaper, Calendar, UploadCloud } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Wizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [isFetchingAgreements, setIsFetchingAgreements] = useState(false);
  const [isFetchingEconomy, setIsFetchingEconomy] = useState(false);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [data, setData] = useState<ReportData>(EMPTY_REPORT_DATA);
  const [reportTitle, setReportTitle] = useState('');

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
          setData(r.data);
          setReportTitle(r.title);
        }
        setLoading(false);
      });
    }
  }, [id]);

  // Helper to safely extract and parse JSON from mixed content
  const extractAndParseJSON = (text: string) => {
    try {
      // 1. Try direct parse
      return JSON.parse(text);
    } catch (e) {
      // 2. Try extracting JSON block
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {
          console.error("Failed to parse extracted JSON block", e2);
          throw e2;
        }
      }
      console.error("No JSON found in response", text);
      throw new Error("Invalid API response format");
    }
  };

  // Helper to construct AI instruction based on language
  const getLanguageInstruction = () => {
    return language === 'ar' 
      ? "IMPORTANT: Provide the response in Arabic (Modern Standard Arabic). However, keep all JSON keys in English, and keep all numbers (dates, percentages, counts, currency amounts) in Western digits (0-9) format (e.g., 2024, 50%, 1.2M)." 
      : "All string values must be in English.";
  };

  const handleFetchData = async () => {
    if (!data.country) return;
    setIsFetchingAI(true);
    
    try {
      if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const langInstr = getLanguageInstruction();
        const prompt = `Act as a labour market intelligence expert. Fetch the latest available data from ILO (International Labour Organization), World Bank, and official government sources for ${data.country}.
        
        ${langInstr}
        
        Return a strictly valid JSON object matching this structure exactly (keys must remain in English):
        {
          "capital": "string",
          "officialLanguage": "string",
          "population": "string (e.g. 1.4B)",
          "currency": "string",
          "gdp": "string (e.g. 400 Billion USD)",
          "hdi": "string (e.g. 0.750)",
          "directFlight": boolean,
          "uaeEmbassyLocation": "string (City in target country)",
          "foreignEmbassyLocation": "string (City in UAE, usually Abu Dhabi or Dubai)",
          "averageWage": "string (Monthly average in USD approx)",
          "minimumWage": "string (Monthly minimum in USD approx)",
          "totalWorkforce": "string (e.g. 50 Million)",
          "participationMale": number (percentage 0-100),
          "participationFemale": number (percentage 0-100),
          "migrationDestinations": [{"country": "string", "count": "string (e.g. 2.5 Million)"}],
          "topSectors": [{"name": "string", "value": number}, {"name": "string", "value": number}],
          "availableSkills": ["string", "string", "string", "string"]
        }
        
        For "migrationDestinations", provide the top 3-5 countries workers migrate to, and the estimated total number of workers in that country.
        For "availableSkills", list the top 4-6 specific job skills or industries that are abundant and available for migration (e.g. "Construction", "Nursing", "IT", "Domestic Work").`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        const aiData = extractAndParseJSON(response.text);

        setData(prev => ({
          ...prev,
          ...aiData,
          workforceStats: {
            ...prev.workforceStats,
            totalWorkforce: aiData.totalWorkforce,
            participationMale: aiData.participationMale,
            participationFemale: aiData.participationFemale,
            migrationDestinations: aiData.migrationDestinations || [],
            topSectors: aiData.topSectors,
            availableSkills: aiData.availableSkills || []
          }
        }));
      } else {
        console.error("API Key missing");
      }
    } catch (error) {
      console.error("AI Fetch failed", error);
    } finally {
      setIsFetchingAI(false);
    }
  };

  const handleFetchNews = async () => {
     if (!data.country) return;
     setIsFetchingNews(true);

     try {
       if (process.env.API_KEY) {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         const langInstr = getLanguageInstruction();
         const searchLang = language === 'ar' ? "Arabic" : "English";
         const prompt = `Search for the top 3 most recent and relevant news articles in ${searchLang} regarding "Labour", "Workforce", "Migrant Workers", or "Economic Relations" between UAE and ${data.country}.
         
         ${langInstr}
         
         Return a strictly valid JSON array of objects with this structure (keys must remain in English):
         [
           {
             "title": "string (Headline)",
             "source": "string (News Source)",
             "date": "string (Date string in western digits)",
             "summary": "string (1 sentence summary)",
             "url": "string (Link if available)"
           }
         ]`;

         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              // Cannot use responseMimeType with tools
            },
         });
         
         const newsItems = extractAndParseJSON(response.text);
         
         // Add IDs
         const newsWithIds = Array.isArray(newsItems) ? newsItems.map((n: any) => ({ ...n, id: uuidv4() })) : [];
         
         setData(prev => ({
            ...prev,
            relatedNews: [...(prev.relatedNews || []), ...newsWithIds]
         }));
       }
     } catch (error) {
        console.error("News Fetch Failed", error);
     } finally {
        setIsFetchingNews(false);
     }
  };

  const handleFetchEconomyEdu = async () => {
    if (!data.country) return;
    setIsFetchingEconomy(true);

    try {
      if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const langInstr = getLanguageInstruction();
        const prompt = `Act as an economic analyst. Fetch the latest official economic and education data for ${data.country}, focusing on its relationship with the UAE. 
        
        ${langInstr}
        
        Return a strictly valid JSON object with this structure (keys must remain in English):
        {
          "economicStats": {
            "inflation": "string (e.g. 5.1% in 2024)",
            "gdp": "string (e.g. 450 Billion USD)",
            "totalExportsToUAE": "string (e.g. 2 Billion USD)",
            "totalImportsFromUAE": "string (e.g. 5 Billion USD)",
            "topExportProducts": ["string", "string", "string"],
            "topImportProducts": ["string", "string", "string"],
            "mainEconomicPartners": ["string", "string", "string"],
            "tipRank": "string (e.g. Tier 2 Watch List)",
            "remittancesGlobal": "string (e.g. 40 Billion USD total global remittances received in 2023)"
          },
          "educationStats": {
             "topUniversities": ["string", "string", "string", "string", "string"],
             "primaryEnrollment": "string (e.g. 98%)",
             "higherEducationEnrollment": "string (e.g. 35%)"
          }
        }`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        const aiData = extractAndParseJSON(response.text);

        setData(prev => ({
          ...prev,
          economicStats: {
            ...prev.economicStats,
            ...aiData.economicStats
          },
          educationStats: {
            ...prev.educationStats,
            ...aiData.educationStats
          }
        }));
      }
    } catch (error) {
      console.error("Economy Fetch Failed", error);
    } finally {
      setIsFetchingEconomy(false);
    }
  };

   const handleFetchAgreements = async (source: 'MOFA' | 'GENERAL') => {
      if (!data.country) return;
      setIsFetchingAgreements(true);

      try {
        if (process.env.API_KEY) {
           const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
           const langInstr = getLanguageInstruction();
           
           let prompt = '';
           let tools = [];
           let config: any = {};

           if (source === 'GENERAL') {
              // General Online Search using Google Search Tool
              prompt = `Search for all major Bilateral Labour Agreements, Memorandum of Understanding (MoU), and diplomatic protocols regarding workforce/manpower between the United Arab Emirates (UAE) and ${data.country}.
              
              ${langInstr}
              
              Return a strictly valid JSON array of objects with this structure (keys must remain in English):
              [
                {
                   "title": "string (e.g. MoU on Manpower)",
                   "date": "string (e.g. 2022-05-12)",
                   "status": "Active" | "Pending" | "Expired",
                   "summary": "string (Key focus e.g. Domestic workers rights)"
                }
              ]`;
              config = {
                 tools: [{ googleSearch: {} }]
                 // responseMimeType NOT ALLOWED with tools
              };
           } else {
              // Simulate MOFA Database (Internal Knowledge)
              prompt = `Act as the official UAE Ministry of Foreign Affairs & International Cooperation (MOFAIC) database.
              List the existing diplomatic treaties and agreements between UAE and ${data.country}, specifically focusing on Labour, Economy, and Trade.
              
              ${langInstr}
              
              Return a strictly valid JSON array of objects with this structure (keys must remain in English):
              [
                {
                   "title": "string (Official Agreement Name)",
                   "date": "string (Year or Full Date)",
                   "status": "Active" | "Pending" | "Expired",
                   "summary": "string (Official purpose)"
                }
              ]`;
              config = {
                responseMimeType: 'application/json'
              };
           }

           const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: config
           });

           // Robust parsing
           const fetchedAgreements = extractAndParseJSON(response.text);
           
           if (Array.isArray(fetchedAgreements)) {
              // Append unique agreements
              setData(prev => {
                const existing = new Set(prev.bilateralAgreements.map(a => a.title));
                const uniqueNew = fetchedAgreements.filter((a: any) => !existing.has(a.title));
                return {
                   ...prev,
                   bilateralAgreements: [...prev.bilateralAgreements, ...uniqueNew]
                };
              });
           }
        }
      } catch (error) {
         console.error("Agreement Fetch Failed", error);
      } finally {
         setIsFetchingAgreements(false);
      }
   };
  
   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'uae' | 'partner', index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const list = type === 'uae' ? [...data.delegations.uae] : [...data.delegations.partner];
        list[index].imageUrl = reader.result as string;
        setData({
          ...data,
          delegations: {
            ...data.delegations,
            [type]: list
          }
        });
      };
      reader.readAsDataURL(file);
    }
   };

  const addDelegate = (type: 'uae' | 'partner') => {
    const newDelegate: Delegate = {
      id: uuidv4(),
      name: '',
      title: '',
      imageUrl: '',
      bio: ''
    };
    setData(prev => ({
      ...prev,
      delegations: {
        ...prev.delegations,
        [type]: [...prev.delegations[type], newDelegate]
      }
    }));
  };

  const removeDelegate = (type: 'uae' | 'partner', index: number) => {
    const list = type === 'uae' ? data.delegations.uae : data.delegations.partner;
    const newList = list.filter((_, i) => i !== index);
    setData(prev => ({
      ...prev,
      delegations: {
        ...prev.delegations,
        [type]: newList
      }
    }));
  };

  const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
    const reportId = id || `r-${uuidv4().slice(0, 8)}`;
    const newReport: Report = {
      id: reportId,
      userId: 'u-1',
      title: reportTitle || `Report for ${data.country || 'Unknown'}`,
      status,
      updatedAt: new Date().toISOString(),
      data
    };
    await MockService.saveReport(newReport);
    if (status === 'completed') {
      navigate('/dashboard');
    } else {
      console.log('Saved draft');
    }
  };

  const updateUaeWorkforce = (
     section: 'mohre' | 'icp', 
     type: 'byEmirate' | 'bySector', 
     index: number, 
     field: 'name' | 'value', 
     val: string | number
  ) => {
    const sectionData = data.uaeWorkforceStats[section];
    const array = [...sectionData[type]];
    
    if (field === 'value') {
       array[index].value = Number(val);
    } else {
       array[index].name = String(val);
    }
    
    setData({
      ...data,
      uaeWorkforceStats: {
        ...data.uaeWorkforceStats,
        [section]: {
          ...sectionData,
          [type]: array
        }
      }
    });
  };

  const addSector = (section: 'mohre' | 'icp') => {
    const sectionData = data.uaeWorkforceStats[section];
    setData({
      ...data,
      uaeWorkforceStats: {
        ...data.uaeWorkforceStats,
        [section]: {
          ...sectionData,
          bySector: [...sectionData.bySector, { name: '', value: 0 }]
        }
      }
    });
  };

  const removeSector = (section: 'mohre' | 'icp', index: number) => {
     const sectionData = data.uaeWorkforceStats[section];
     const newSectors = sectionData.bySector.filter((_, i) => i !== index);
     setData({
      ...data,
      uaeWorkforceStats: {
        ...data.uaeWorkforceStats,
        [section]: {
          ...sectionData,
          bySector: newSectors
        }
      }
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Profile
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="border-b dark:border-gray-700 pb-4 mb-4">
               <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2 mb-2">
                 <FileText size={20} /> {t('reportDetails')}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label={t('reportTitle')} value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="e.g. Bilateral Meeting India" />
                 <Input label={t('reportDate')} type="date" value={data.reportDate} onChange={e => setData({...data, reportDate: e.target.value})} />
               </div>
             </div>
             
             <div className="flex flex-col md:flex-row gap-4 items-end bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
               <div className="flex-1 w-full">
                 <Input label={t('country')} value={data.country} onChange={e => setData({...data, country: e.target.value})} placeholder="e.g. Vietnam" className="text-lg font-medium" />
               </div>
               <Button onClick={handleFetchData} disabled={!data.country || isFetchingAI} className="w-full md:w-auto bg-accent hover:bg-accent-light text-white border-none shadow-lg">
                {isFetchingAI ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} {t('fetchData')}
              </Button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <Input label={t('capital')} value={data.capital} onChange={e => setData({...data, capital: e.target.value})} />
              <Input label={t('officialLanguage')} value={data.officialLanguage} onChange={e => setData({...data, officialLanguage: e.target.value})} />
              
              <div className="flex flex-col gap-1.5 md:col-span-2">
                 <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 flex items-center gap-2">
                   <Plane size={14} /> {t('directFlight')}
                 </label>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setData({...data, directFlight: true})}
                      className={`flex-1 py-3 rounded-lg border font-medium transition-all ${data.directFlight ? 'bg-primary text-white border-primary shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
                    >{t('yesDirect')}</button>
                    <button 
                      onClick={() => setData({...data, directFlight: false})}
                      className={`flex-1 py-3 rounded-lg border font-medium transition-all ${!data.directFlight ? 'bg-primary text-white border-primary shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
                    >{t('noDirect')}</button>
                 </div>
              </div>

              <Input label={t('uaeEmbassy')} value={data.uaeEmbassyLocation} onChange={e => setData({...data, uaeEmbassyLocation: e.target.value})} />
              <Input label={t('foreignEmbassy')} value={data.foreignEmbassyLocation} onChange={e => setData({...data, foreignEmbassyLocation: e.target.value})} />
              <Input label={t('gdp')} value={data.gdp} onChange={e => setData({...data, gdp: e.target.value})} />
              <Input label={t('hdi')} value={data.hdi} onChange={e => setData({...data, hdi: e.target.value})} />
              <Input label={t('population')} value={data.population} onChange={e => setData({...data, population: e.target.value})} />
              <Input label={t('currency')} value={data.currency} onChange={e => setData({...data, currency: e.target.value})} />
            </div>
          </div>
        );
      case 1: // UAE Workforce
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="border-b dark:border-gray-700 pb-4">
               <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2">
                  <BarChart2 size={20} /> {t('sectionUaeWorkforce')}
               </h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown of workers by MOHRE and ICP data sources.</p>
             </div>

             <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 dark:border-primary/30">
                 <h4 className="font-bold text-primary-dark dark:text-primary-light mb-3 text-sm uppercase">{t('additionalIndicators')}</h4>
                 {data.uaeWorkforceStats.custom.map((item, i) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                       <Input value={item.label} disabled={item.isTotal} onChange={(e) => { const newCustom = [...data.uaeWorkforceStats.custom]; newCustom[i].label = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: newCustom}}); }} placeholder="Title" />
                       <Input value={item.value} onChange={(e) => { const newCustom = [...data.uaeWorkforceStats.custom]; newCustom[i].value = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: newCustom}}); }} placeholder="Value" />
                       <Input value={item.date} onChange={(e) => { const newCustom = [...data.uaeWorkforceStats.custom]; newCustom[i].date = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: newCustom}}); }} placeholder="Date" />
                       {!item.isTotal && (
                          <button className="text-red-500 hover:text-red-700" onClick={() => { const newCustom = data.uaeWorkforceStats.custom.filter(c => c.id !== item.id); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: newCustom}}); }}>X</button>
                       )}
                    </div>
                 ))}
                 <Button size="sm" variant="ghost" onClick={() => { setData({...data, uaeWorkforceStats: { ...data.uaeWorkforceStats, custom: [...data.uaeWorkforceStats.custom, { id: uuidv4(), label: '', value: '', date: '', isTotal: false }] }}) }}>+ Add Indicator</Button>
             </div>

             {/* MOHRE Data */}
             <div className="space-y-6">
                <h4 className="font-serif font-bold text-xl text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2">{t('mohreData')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
                      <h5 className="font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">{t('totalPrivate')}</h5>
                      <div className="flex gap-2">
                         <Input placeholder="Number" value={data.uaeWorkforceStats.mohre.totalPrivate.value} onChange={e => setData({ ...data, uaeWorkforceStats: { ...data.uaeWorkforceStats, mohre: { ...data.uaeWorkforceStats.mohre, totalPrivate: { ...data.uaeWorkforceStats.mohre.totalPrivate, value: e.target.value } } } })} />
                         <Input placeholder="As of (Date)" value={data.uaeWorkforceStats.mohre.totalPrivate.date} onChange={e => setData({ ...data, uaeWorkforceStats: { ...data.uaeWorkforceStats, mohre: { ...data.uaeWorkforceStats.mohre, totalPrivate: { ...data.uaeWorkforceStats.mohre.totalPrivate, date: e.target.value } } } })} />
                      </div>
                   </Card>
                   <Card className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
                      <h5 className="font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">{t('totalDomestic')}</h5>
                      <div className="flex gap-2">
                         <Input placeholder="Number" value={data.uaeWorkforceStats.mohre.totalDomestic.value} onChange={e => setData({ ...data, uaeWorkforceStats: { ...data.uaeWorkforceStats, mohre: { ...data.uaeWorkforceStats.mohre, totalDomestic: { ...data.uaeWorkforceStats.mohre.totalDomestic, value: e.target.value } } } })} />
                         <Input placeholder="As of (Date)" value={data.uaeWorkforceStats.mohre.totalDomestic.date} onChange={e => setData({ ...data, uaeWorkforceStats: { ...data.uaeWorkforceStats, mohre: { ...data.uaeWorkforceStats.mohre, totalDomestic: { ...data.uaeWorkforceStats.mohre.totalDomestic, date: e.target.value } } } })} />
                      </div>
                   </Card>
                </div>

                <div>
                   <h5 className="font-bold text-sm mb-3 text-gray-600 dark:text-gray-300">{t('workersByEmirate')}</h5>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {data.uaeWorkforceStats.mohre.byEmirate.map((em, idx) => (
                         <div key={idx} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-3">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">{em.name}</label>
                            <input type="number" className="w-full text-sm font-mono border-b dark:border-gray-600 focus:border-primary outline-none bg-transparent dark:text-white" value={em.value} onChange={e => updateUaeWorkforce('mohre', 'byEmirate', idx, 'value', e.target.value)} />
                         </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h5 className="font-bold text-sm mb-3 text-gray-600 dark:text-gray-300">{t('workersBySector')}</h5>
                   {data.uaeWorkforceStats.mohre.bySector.map((sec, idx) => (
                      <div key={idx} className="flex gap-4 mb-2 items-center">
                         <Input placeholder="Sector Name" className="flex-1" value={sec.name} onChange={e => updateUaeWorkforce('mohre', 'bySector', idx, 'name', e.target.value)} />
                         <Input type="number" placeholder="Count" className="w-32" value={sec.value} onChange={e => updateUaeWorkforce('mohre', 'bySector', idx, 'value', e.target.value)} />
                         <button onClick={() => removeSector('mohre', idx)} className="text-gray-400 hover:text-red-500">X</button>
                      </div>
                   ))}
                   <Button size="sm" variant="outline" onClick={() => addSector('mohre')}>+ Add Sector</Button>
                </div>
             </div>

             {/* ICP Data */}
             <div className="space-y-6 pt-6 border-t dark:border-gray-700">
                <h4 className="font-serif font-bold text-xl text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2">{t('icpData')}</h4>
                
                <div>
                   <h5 className="font-bold text-sm mb-3 text-gray-600 dark:text-gray-300">{t('residentsByEmirate')}</h5>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {data.uaeWorkforceStats.icp.byEmirate.map((em, idx) => (
                         <div key={idx} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-3">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">{em.name}</label>
                            <input type="number" className="w-full text-sm font-mono border-b dark:border-gray-600 focus:border-primary outline-none bg-transparent dark:text-white" value={em.value} onChange={e => updateUaeWorkforce('icp', 'byEmirate', idx, 'value', e.target.value)} />
                         </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h5 className="font-bold text-sm mb-3 text-gray-600 dark:text-gray-300">{t('workersBySector')}</h5>
                   {data.uaeWorkforceStats.icp.bySector.map((sec, idx) => (
                      <div key={idx} className="flex gap-4 mb-2 items-center">
                         <Input placeholder="Sector Name" className="flex-1" value={sec.name} onChange={e => updateUaeWorkforce('icp', 'bySector', idx, 'name', e.target.value)} />
                         <Input type="number" placeholder="Count" className="w-32" value={sec.value} onChange={e => updateUaeWorkforce('icp', 'bySector', idx, 'value', e.target.value)} />
                         <button onClick={() => removeSector('icp', idx)} className="text-gray-400 hover:text-red-500">X</button>
                      </div>
                   ))}
                   <Button size="sm" variant="outline" onClick={() => addSector('icp')}>+ Add Sector</Button>
                </div>
             </div>
          </div>
        );
      case 2: // Partner Workforce
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-gray-700 pb-4">
               <div>
                  <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2"><TrendingUp size={20} /> {t('sectionWorkforce')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Economic indicators provided by ILO & World Bank data</p>
               </div>
               <Button onClick={handleFetchData} disabled={!data.country || isFetchingAI} className="bg-accent hover:bg-accent-light text-white text-sm">
                {isFetchingAI ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} {t('fetchData')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
                 <Input label={t('avgWage')} value={data.averageWage} onChange={e => setData({...data, averageWage: e.target.value})} placeholder="e.g. $350/month" />
                 <Input label={t('minWage')} value={data.minimumWage} onChange={e => setData({...data, minimumWage: e.target.value})} placeholder="e.g. $180/month" />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('workforceStats')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} onChange={e => setData({...data, workforceStats: {...data.workforceStats, totalWorkforce: e.target.value}})} placeholder="e.g. 55 Million" />
                  <div className="relative">
                     <Input type="number" label={t('maleParticipation')} value={data.workforceStats.participationMale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationMale: Number(e.target.value)}})} />
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${data.workforceStats.participationMale}%` }}></div>
                      </div>
                  </div>
                  <div className="relative">
                    <Input type="number" label={t('femaleParticipation')} value={data.workforceStats.participationFemale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationFemale: Number(e.target.value)}})} />
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className="bg-pink-500 h-full" style={{ width: `${data.workforceStats.participationFemale}%` }}></div>
                    </div>
                  </div>
               </div>
            </div>

             <div>
               <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 block mb-2">{t('migrationDestinations')}</label>
               <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg overflow-hidden">
                 <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Destination Country</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Worker Count (Est.)</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {data.workforceStats.migrationDestinations.map((dest, i) => (
                        <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                             <Input value={dest.country} className="border-transparent bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-primary py-1 h-8" placeholder="Country Name" onChange={(e) => { const newDest = [...data.workforceStats.migrationDestinations]; newDest[i].country = e.target.value; setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: newDest}}); }} />
                          </td>
                          <td className="p-2">
                             <Input value={dest.count} className="border-transparent bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-primary py-1 h-8" placeholder="e.g. 1.2M" onChange={(e) => { const newDest = [...data.workforceStats.migrationDestinations]; newDest[i].count = e.target.value; setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: newDest}}); }} />
                          </td>
                          <td className="p-2 text-center">
                            <button onClick={() => { const newDest = data.workforceStats.migrationDestinations.filter((_, idx) => idx !== i); setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: newDest}}); }} className="text-gray-300 hover:text-red-500 transition-colors">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
                 <button className="w-full py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-dashed dark:border-gray-700" onClick={() => setData({ ...data, workforceStats: { ...data.workforceStats, migrationDestinations: [...data.workforceStats.migrationDestinations, { country: '', count: '' }] } })}>+ Add Migration Destination</button>
               </div>
            </div>

             <div>
               <h3 className="text-sm font-semibold mb-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sector Distribution</h3>
               {data.workforceStats.topSectors.map((sector, idx) => (
                 <div key={idx} className="flex gap-4 mb-2 items-center">
                   <Input placeholder="Sector Name" className="flex-1" value={sector.name} onChange={(e) => { const newSectors = [...data.workforceStats.topSectors]; newSectors[idx].name = e.target.value; setData({...data, workforceStats: {...data.workforceStats, topSectors: newSectors}}); }} />
                   <div className="w-32 relative">
                     <Input placeholder="%" type="number" value={sector.value} onChange={(e) => { const newSectors = [...data.workforceStats.topSectors]; newSectors[idx].value = parseInt(e.target.value); setData({...data, workforceStats: {...data.workforceStats, topSectors: newSectors}}); }} />
                     <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                   </div>
                   <button className="text-gray-400 hover:text-red-600 p-2" onClick={() => { const newSectors = data.workforceStats.topSectors.filter((_, i) => i !== idx); setData({...data, workforceStats: {...data.workforceStats, topSectors: newSectors}}); }}><span className="text-xl">×</span></button>
                 </div>
               ))}
               <Button variant="outline" size="sm" className="mt-2" onClick={() => setData({ ...data, workforceStats: { ...data.workforceStats, topSectors: [...data.workforceStats.topSectors, {name: '', value: 0}] } })}>+ Add Sector</Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                 <Hammer size={14} /> {t('availableSkills')}
              </h3>
              <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-4">
                 <div className="flex flex-wrap gap-2 mb-3">
                   {data.workforceStats.availableSkills?.map((skill, i) => (
                     <span key={i} className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2">
                       {skill}
                       <button onClick={() => { const newSkills = data.workforceStats.availableSkills.filter((_, idx) => idx !== i); setData({...data, workforceStats: {...data.workforceStats, availableSkills: newSkills}}); }} className="hover:text-green-900 dark:hover:text-green-100 font-bold px-1">×</button>
                     </span>
                   ))}
                 </div>
                 <div className="flex gap-2">
                    <Input placeholder="Type a skill (e.g. Welding, Software Engineering) and press Enter" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.currentTarget.value.trim(); if (val) { const currentSkills = data.workforceStats.availableSkills || []; setData({...data, workforceStats: { ...data.workforceStats, availableSkills: [...currentSkills, val] }}); e.currentTarget.value = ''; } } }} />
                 </div>
              </div>
            </div>
          </div>
        );
      case 3: // Economy
         return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-gray-700 pb-4">
               <div>
                  <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2"><Briefcase size={20} /> {t('sectionEconomy')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Official trade statistics, inflation, and educational insights</p>
               </div>
               <Button onClick={handleFetchEconomyEdu} disabled={!data.country || isFetchingEconomy} className="bg-accent hover:bg-accent-light text-white text-sm">
                {isFetchingEconomy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} {t('fetchEconomy')}
              </Button>
            </div>

            <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
               <h4 className="font-bold text-lg mb-4 text-primary-dark dark:text-primary-light">Economic Indicators</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <Input label={t('inflation')} value={data.economicStats?.inflation} onChange={e => setData({...data, economicStats: {...data.economicStats, inflation: e.target.value}})} placeholder="e.g. 4.5%" />
                 <Input label={t('gdp')} value={data.economicStats?.gdp} onChange={e => setData({...data, economicStats: {...data.economicStats, gdp: e.target.value}})} placeholder="e.g. 500 Billion USD" />
                 <Input label={t('exportsToUae')} value={data.economicStats?.totalExportsToUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalExportsToUAE: e.target.value}})} placeholder="e.g. 2.1 Billion USD" />
                 <Input label={t('importsFromUae')} value={data.economicStats?.totalImportsFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalImportsFromUAE: e.target.value}})} placeholder="e.g. 5.3 Billion USD" />
                 <Input label={t('remittances')} value={data.economicStats?.remittancesFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesFromUAE: e.target.value}})} placeholder="Manual Input required" />
                 <Input label={t('globalRemittances')} value={data.economicStats?.remittancesGlobal} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesGlobal: e.target.value}})} placeholder="e.g. 40 Billion USD" />
                 <Input label={t('tipRankLabel')} value={data.economicStats?.tipRank} onChange={e => setData({...data, economicStats: {...data.economicStats, tipRank: e.target.value}})} placeholder="e.g. Tier 2" />
               </div>
               
               <div className="space-y-4">
                 <div>
                    <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 block mb-2">{t('topExports')}</label>
                    <div className="flex flex-wrap gap-2">
                      {(data.economicStats?.topExportProducts || []).map((prod, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {prod}
                          <button onClick={() => { const newProds = data.economicStats.topExportProducts.filter((_, idx) => idx !== i); setData({...data, economicStats: {...data.economicStats, topExportProducts: newProds}}); }} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                      <input className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none text-sm px-2 w-40 dark:text-white" placeholder="+ Add Product" onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value) { setData({...data, economicStats: { ...data.economicStats, topExportProducts: [...(data.economicStats.topExportProducts || []), e.currentTarget.value] }}); e.currentTarget.value = ''; } }} />
                    </div>
                 </div>

                 <div>
                    <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 block mb-2">{t('topImports')}</label>
                    <div className="flex flex-wrap gap-2">
                      {(data.economicStats?.topImportProducts || []).map((prod, i) => (
                        <span key={i} className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {prod}
                          <button onClick={() => { const newProds = data.economicStats.topImportProducts.filter((_, idx) => idx !== i); setData({...data, economicStats: {...data.economicStats, topImportProducts: newProds}}); }} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                      <input className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none text-sm px-2 w-40 dark:text-white" placeholder="+ Add Product" onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value) { setData({...data, economicStats: { ...data.economicStats, topImportProducts: [...(data.economicStats.topImportProducts || []), e.currentTarget.value] }}); e.currentTarget.value = ''; } }} />
                    </div>
                 </div>

                 <div>
                    <h5 className="text-sm font-semibold text-foreground/80 dark:text-gray-300 block mb-2 flex items-center gap-2"><Banknote size={14} /> Custom Economic Indicators</h5>
                    <div className="space-y-3">
                       {data.economicStats.customStats?.map((stat, i) => (
                          <div key={stat.id} className="flex gap-4 items-center">
                             <Input placeholder="Indicator Title" className="flex-1" value={stat.label} onChange={(e) => { const newStats = [...(data.economicStats.customStats || [])]; newStats[i].label = e.target.value; setData({...data, economicStats: {...data.economicStats, customStats: newStats}}); }} />
                             <Input placeholder="Value" className="flex-1" value={stat.value} onChange={(e) => { const newStats = [...(data.economicStats.customStats || [])]; newStats[i].value = e.target.value; setData({...data, economicStats: {...data.economicStats, customStats: newStats}}); }} />
                             <button onClick={() => { const newStats = data.economicStats.customStats.filter(s => s.id !== stat.id); setData({...data, economicStats: {...data.economicStats, customStats: newStats}}); }} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                          </div>
                       ))}
                       <Button variant="ghost" size="sm" onClick={() => { setData({...data, economicStats: { ...data.economicStats, customStats: [...(data.economicStats.customStats || []), { id: uuidv4(), label: '', value: '' }] }}); }} className="border-dashed border-2 w-full text-gray-400 hover:text-primary dark:border-gray-700">+ Add Indicator</Button>
                    </div>
                 </div>
               </div>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
               <h4 className="font-bold text-lg mb-4 text-primary-dark dark:text-primary-light flex items-center gap-2"><GraduationCap size={20} /> {t('educationInsights')}</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 <Input label={t('primaryEnrollment')} value={data.educationStats?.primaryEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, primaryEnrollment: e.target.value}})} placeholder="e.g. 96%" />
                 <Input label={t('higherEnrollment')} value={data.educationStats?.higherEducationEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, higherEducationEnrollment: e.target.value}})} placeholder="e.g. 35%" />
               </div>
               <div>
                  <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 block mb-2">{t('topUniversities')}</label>
                  <div className="space-y-2">
                    {(data.educationStats?.topUniversities || []).map((uni, i) => (
                      <div key={i} className="flex gap-2">
                         <span className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm text-gray-500 dark:text-gray-300 w-8 text-center">{i+1}</span>
                         <Input value={uni} onChange={e => { const newUnis = [...(data.educationStats.topUniversities || [])]; newUnis[i] = e.target.value; setData({...data, educationStats: {...data.educationStats, topUniversities: newUnis}}); }} className="flex-1" />
                         <button onClick={() => { const newUnis = data.educationStats.topUniversities.filter((_, idx) => idx !== i); setData({...data, educationStats: {...data.educationStats, topUniversities: newUnis}}); }} className="text-gray-400 hover:text-red-500 p-2"><X size={18} /></button>
                      </div>
                    ))}
                    {(data.educationStats?.topUniversities?.length || 0) < 5 && (
                      <Button variant="ghost" onClick={() => { setData({...data, educationStats: { ...data.educationStats, topUniversities: [...(data.educationStats.topUniversities || []), ''] }}); }} className="w-full border-dashed border-2 border-gray-200 dark:border-gray-700">+ Add University</Button>
                    )}
                  </div>
               </div>
            </Card>

            <div>
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-lg text-primary-dark dark:text-primary-light">Additional Information</h4>
                 <Button variant="outline" size="sm" onClick={() => { setData({ ...data, customSections: [...(data.customSections || []), { id: uuidv4(), title: '', content: '' }] }) }}><Plus size={16} /> Add Custom Section</Button>
               </div>
               <div className="space-y-6">
                 {(data.customSections || []).map((section, i) => (
                   <Card key={section.id} className="relative group">
                     <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1" onClick={() => { const newSections = data.customSections.filter(s => s.id !== section.id); setData({...data, customSections: newSections}); }}><X size={20} /></button>
                     <div className="space-y-4 pr-8">
                       <Input placeholder="Section Title" value={section.title} className="font-bold text-lg border-transparent focus:border-gray-300 px-0 dark:focus:border-gray-600" onChange={e => { const newSections = [...data.customSections]; newSections[i].title = e.target.value; setData({...data, customSections: newSections}); }} />
                       <textarea className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]" placeholder="Content..." value={section.content} onChange={e => { const newSections = [...data.customSections]; newSections[i].content = e.target.value; setData({...data, customSections: newSections}); }} />
                     </div>
                   </Card>
                 ))}
               </div>
            </div>
          </div>
         );
      case 4: // NEW: Recent Interactions & News
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="border-b dark:border-gray-700 pb-4 mb-6">
                <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2">
                   <MessageSquare size={20} /> {t('sectionInteractions')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Record diplomatic visits, key discussion points, and relevant news.</p>
             </div>

             {/* Recent Interactions */}
             <div className="space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Calendar size={18} /> {t('recentInteractions')}</h4>
                {data.recentInteractions.map((item, idx) => (
                   <Card key={item.id} className="p-4 relative">
                      <button onClick={() => setData({...data, recentInteractions: data.recentInteractions.filter(i => i.id !== item.id)})} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">X</button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input label="Interaction Title" placeholder="e.g. Ministerial Visit" value={item.title} onChange={e => {
                            const list = [...data.recentInteractions]; list[idx].title = e.target.value; setData({...data, recentInteractions: list});
                         }} />
                         <div className="grid grid-cols-2 gap-4">
                           <Input label="Date" type="date" value={item.date} onChange={e => {
                              const list = [...data.recentInteractions]; list[idx].date = e.target.value; setData({...data, recentInteractions: list});
                           }} />
                           <Input label="Type" placeholder="e.g. Visit" value={item.type} onChange={e => {
                              const list = [...data.recentInteractions]; list[idx].type = e.target.value; setData({...data, recentInteractions: list});
                           }} />
                         </div>
                      </div>
                      <div className="mt-3">
                         <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300 block mb-1.5">Interaction Summary</label>
                         <textarea 
                             className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md text-sm min-h-[80px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
                             placeholder="Brief summary of what happened..." 
                             value={item.details || ''} 
                             onChange={e => {
                                const list = [...data.recentInteractions]; 
                                list[idx].details = e.target.value; 
                                setData({...data, recentInteractions: list});
                             }} 
                         />
                      </div>
                   </Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, recentInteractions: [...data.recentInteractions, { id: uuidv4(), title: '', date: '', type: '', details: '' }]})}>
                   + Add Interaction
                </Button>
             </div>
             
             {/* Points of Discussion */}
             <div className="space-y-4 pt-6 border-t dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><MessageSquare size={18} /> {t('pointsDiscussion')}</h4>
                {data.pointsOfDiscussion.map((item, idx) => (
                   <Card key={item.id} className="p-4 relative">
                      <button onClick={() => setData({...data, pointsOfDiscussion: data.pointsOfDiscussion.filter(i => i.id !== item.id)})} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">X</button>
                      <div className="space-y-3">
                         <Input placeholder="Topic Title" className="font-bold" value={item.title} onChange={e => {
                            const list = [...data.pointsOfDiscussion]; list[idx].title = e.target.value; setData({...data, pointsOfDiscussion: list});
                         }} />
                         <textarea className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md text-sm" placeholder="Details..." rows={2} value={item.content} onChange={e => {
                            const list = [...data.pointsOfDiscussion]; list[idx].content = e.target.value; setData({...data, pointsOfDiscussion: list});
                         }} />
                      </div>
                   </Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, pointsOfDiscussion: [...data.pointsOfDiscussion, { id: uuidv4(), title: '', content: '' }]})}>
                   + Add Point
                </Button>
             </div>

             {/* News */}
             <div className="space-y-4 pt-6 border-t dark:border-gray-700">
                <div className="flex justify-between items-center">
                   <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Newspaper size={18} /> {t('relatedNews')}</h4>
                   <Button size="sm" onClick={handleFetchNews} disabled={!data.country || isFetchingNews} className="bg-accent text-white">
                      {isFetchingNews ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} {t('fetchNews')}
                   </Button>
                </div>
                
                {data.relatedNews.length === 0 && <p className="text-gray-400 text-sm italic">No news fetched yet.</p>}
                
                <div className="space-y-3">
                   {data.relatedNews.map((news, idx) => (
                      <div key={news.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 relative group hover:shadow-md transition-shadow">
                         <button onClick={() => setData({...data, relatedNews: data.relatedNews.filter(n => n.id !== news.id)})} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">X</button>
                         <h5 className="font-bold text-primary dark:text-primary-light">{news.title}</h5>
                         <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 my-1">
                            <span className="font-semibold">{news.source}</span> • <span>{news.date}</span>
                         </div>
                         <p className="text-sm text-gray-700 dark:text-gray-300">{news.summary}</p>
                      </div>
                   ))}
                </div>
                <Button size="sm" variant="ghost" className="text-gray-500" onClick={() => setData({...data, relatedNews: [...data.relatedNews, { id: uuidv4(), title: 'New Article', source: '', date: '', summary: '' }]})}>
                   + Add Custom News
                </Button>
             </div>
          </div>
        );
      case 5: // Agreements (Old Step 4)
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 dark:border-primary/30 flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
               <div className="flex items-center gap-3 text-primary-dark dark:text-primary-light">
                  <div className="bg-primary/10 p-2 rounded-full"><Sparkles size={20} /></div>
                  <div>
                    <h3 className="font-bold text-sm">Automated Intelligence</h3>
                    <p className="text-xs text-primary/70 dark:text-primary-light/70">Fetch official records from MOFA or Online sources</p>
                  </div>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                 <Button onClick={() => handleFetchAgreements('MOFA')} disabled={isFetchingAgreements || !data.country} variant="outline" className="flex-1 md:flex-none border-primary text-primary hover:bg-primary hover:text-white dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light dark:hover:text-black">
                   {isFetchingAgreements ? <Loader2 className="animate-spin" size={16} /> : <LinkIcon size={16} />} {t('fetchMofa')}
                 </Button>
                 <Button onClick={() => handleFetchAgreements('GENERAL')} disabled={isFetchingAgreements || !data.country} className="flex-1 md:flex-none bg-primary text-white">
                   {isFetchingAgreements ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />} {t('searchOnline')}
                 </Button>
               </div>
            </div>

             {data.bilateralAgreements.map((agreement, idx) => (
                <Card key={idx} className="relative p-4">
                   <button onClick={() => {const f = data.bilateralAgreements.filter((_, i) => i !== idx); setData({...data, bilateralAgreements: f})}} className="absolute top-2 right-2">X</button>
                   <Input value={agreement.title} onChange={e => {const a = [...data.bilateralAgreements]; a[idx].title = e.target.value; setData({...data, bilateralAgreements: a})}} placeholder="Title" className="font-bold mb-2" />
                   <Input value={agreement.date} onChange={e => {const a = [...data.bilateralAgreements]; a[idx].date = e.target.value; setData({...data, bilateralAgreements: a})}} placeholder="Date" className="text-sm mb-2" />
                   <Input value={agreement.summary} onChange={e => {const a = [...data.bilateralAgreements]; a[idx].summary = e.target.value; setData({...data, bilateralAgreements: a})}} placeholder="Summary" className="text-sm" />
                </Card>
             ))}
             <Button variant="outline" onClick={() => setData({...data, bilateralAgreements: [...data.bilateralAgreements, { title: '', date: '', status: 'Active', summary: '' }]})}>+ Add Agreement</Button>
          </div>
        );
      case 6: // Delegations (Redesigned Layout)
        const renderDelegationList = (type: 'uae' | 'partner', list: Delegate[]) => (
           <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                 <div className="flex items-center gap-4">
                    {type === 'uae' ? (
                       <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600">
                         <img src="https://flagcdn.com/w40/ae.png" className="h-6 w-auto" alt="UAE" />
                       </div>
                    ) : (
                       <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shadow-sm border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                         <Globe size={24} />
                       </div>
                    )}
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-gray-900 dark:text-white leading-tight">
                        {type === 'uae' ? t('uaeDelegation') : `${data.country || 'Partner'} Delegation`}
                      </h3>
                      <Input 
                         className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-1 border-transparent bg-transparent px-0 py-0 h-auto focus:ring-0 focus:border-b border-gray-300 w-64 dark:focus:border-gray-500"
                         placeholder={type === 'uae' ? t('ministryOfficials') : t('counterpartOfficials')}
                         defaultValue={type === 'uae' ? t('ministryOfficials') : t('counterpartOfficials')}
                      />
                    </div>
                 </div>
                 
                 <Button 
                    size="default" 
                    variant="outline" 
                    onClick={() => addDelegate(type)}
                    className="hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm bg-white dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
                 >
                    <UserPlus size={18} /> {t('addMember')}
                 </Button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {list.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-400 gap-3">
                       <Users size={40} className="opacity-20" />
                       <p className="text-base font-medium">No delegates added yet</p>
                    </div>
                 )}

                 {list.map((delegate, idx) => (
                    <div key={delegate.id} className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/40 dark:hover:border-primary/40">
                       <button className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all opacity-0 group-hover:opacity-100" onClick={() => removeDelegate(type, idx)}>
                         <X size={20} />
                       </button>

                       <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-32 shrink-0">
                            <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative border border-gray-200 dark:border-gray-700 shadow-inner group-focus-within:ring-2 ring-primary/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => document.getElementById(`file-${delegate.id}`).click()}>
                               {delegate.imageUrl ? (
                                  <img src={delegate.imageUrl} alt={delegate.name} className="w-full h-full object-cover" />
                               ) : (
                                  <div className="text-center p-2">
                                     <UploadCloud size={24} className="mx-auto mb-1 text-gray-400" />
                                     <span className="text-[10px] uppercase font-bold text-gray-400">Upload Photo</span>
                                  </div>
                               )}
                            </div>
                            <input 
                              type="file" 
                              id={`file-${delegate.id}`} 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, type, idx)}
                            />
                          </div>

                          <div className="flex-1 space-y-4 pt-1">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input placeholder="Full Name" className="font-bold text-xl border-gray-200 dark:border-gray-600 focus:border-primary px-4 py-3 bg-gray-50/50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-colors" value={delegate.name} onChange={e => { const l = type === 'uae' ? [...data.delegations.uae] : [...data.delegations.partner]; l[idx].name = e.target.value; setData({...data, delegations: {...data.delegations, [type]: l}}); }} />
                                <div className="flex gap-2">
                                  <Input placeholder="Official Title" className="text-base border-gray-200 dark:border-gray-600 px-4 py-3" value={delegate.title} onChange={e => { const l = type === 'uae' ? [...data.delegations.uae] : [...data.delegations.partner]; l[idx].title = e.target.value; setData({...data, delegations: {...data.delegations, [type]: l}}); }} />
                                </div>
                             </div>
                             
                             <div className="relative">
                               <textarea className="w-full p-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-y min-h-[100px] leading-relaxed" placeholder="Professional biography..." value={delegate.bio} onChange={e => { const l = type === 'uae' ? [...data.delegations.uae] : [...data.delegations.partner]; l[idx].bio = e.target.value; setData({...data, delegations: {...data.delegations, [type]: l}}); }} />
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        );

        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
             <div className="flex flex-col gap-12">
                {renderDelegationList('uae', data.delegations.uae)}
                
                {/* Visual Separator */}
                <div className="flex items-center gap-4 py-4">
                  <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                  <div className="text-gray-400 font-serif italic text-sm">Counterpart Details</div>
                  <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                </div>

                {renderDelegationList('partner', data.delegations.partner)}
             </div>
          </div>
        );
      case 7: // Preview (Old Step 5, now 7)
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
               <h2 className="font-serif text-2xl mb-4 text-center dark:text-white">{reportTitle}</h2>
               <p className="text-center text-gray-500 mb-8">{data.reportDate}</p>
               <div className="bg-white p-8 shadow-diplomatic max-w-2xl mx-auto space-y-6 text-black">
                  <div>
                    <h3 className="font-serif text-lg text-primary mb-2 border-b-2 border-accent w-fit">{t('sectionUaeWorkforce')}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                       <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">MOHRE: Total Private</p>
                          <p className="font-bold">{data.uaeWorkforceStats.mohre.totalPrivate.value}</p>
                       </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">MOHRE: Total Domestic</p>
                          <p className="font-bold">{data.uaeWorkforceStats.mohre.totalDomestic.value}</p>
                       </div>
                    </div>
                  </div>
                  <div><h3 className="font-serif text-lg text-primary mb-2 border-b-2 border-accent w-fit">{t('sectionInteractions')}</h3> <p className="text-sm">{data.recentInteractions.length} Interactions, {data.relatedNews.length} News items.</p></div>
                  <div>
                    <h3 className="font-serif text-lg text-primary mb-2 border-b-2 border-accent w-fit">{t('sectionDelegation')}</h3>
                    <div className="text-sm">
                      <p className="font-bold">UAE:</p> <ul className="list-disc ml-5 mb-2">{data.delegations.uae.map(d => <li key={d.id}>{d.name}</li>)}</ul>
                      <p className="font-bold">Partner:</p> <ul className="list-disc ml-5">{data.delegations.partner.map(d => <li key={d.id}>{d.name}</li>)}</ul>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        {/* Title input moved inside Profile Step, keeping header minimal */}
        <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-white">
           {currentStep === 0 ? t('createNew') : (reportTitle || "Untitled Report")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              disabled={idx > currentStep}
              onClick={() => setCurrentStep(idx)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
                ${idx === currentStep ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                ${idx < currentStep ? 'text-primary dark:text-primary-light font-medium' : ''}
              `}
            >
              <step.icon size={18} />
              <span className="text-sm font-medium">{step.label}</span>
              {idx < currentStep && <CheckCircle size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card className="min-h-[400px]">
            {renderStep()}
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
              <ArrowLeft size={16} className={language === 'ar' ? 'rotate-180' : ''} /> {t('back')}
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave('draft')}><Save size={16} /> {t('save')}</Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>{t('next')} <ArrowRight size={16} className={language === 'ar' ? 'rotate-180' : ''} /></Button>
              ) : (
                <Button onClick={() => handleSave('completed')} className="bg-green-600 hover:bg-green-700">{t('finish')} <CheckCircle size={16} /></Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}