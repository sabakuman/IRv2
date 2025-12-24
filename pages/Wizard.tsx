
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReportData, EMPTY_REPORT_DATA, Report, Delegate } from '../types';
import { MockService } from '../services/mockService';
import { Button, Card, Input } from '../components/ui/LayoutComponents';
import { ArrowLeft, ArrowRight, Save, Globe, Users, FileText, CheckCircle, Plane, Building, TrendingUp, Sparkles, Loader2, RefreshCw, Link as LinkIcon, Search, Hammer, GraduationCap, Briefcase, Plus, X, Banknote, UserPlus, BarChart2, MessageSquare, Newspaper, Calendar, UploadCloud, ShieldAlert, BookOpen, Bold, Italic, List } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Custom Textarea with Rich Text Toolbar
const RichTextarea = ({ label, value, onChange, placeholder }: any) => {
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
      {label && <label className="text-[14.5px] font-bold text-foreground/80 dark:text-gray-300">{label}</label>}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
        <div className="flex gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
           <button type="button" onClick={() => insertText('bold')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Bold"><Bold size={16} /></button>
           <button type="button" onClick={() => insertText('italic')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Italic"><Italic size={16} /></button>
           <button type="button" onClick={() => insertText('bullet')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Bullet List"><List size={16} /></button>
        </div>
        <textarea 
          id={`rt-${label}`}
          className="w-full p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none min-h-[140px] resize-y text-[15px] font-medium leading-relaxed placeholder:text-gray-400" 
          placeholder={placeholder || "Your text here..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default function Wizard() {
  const getParamId = () => {
    const hash = window.location.hash;
    const parts = hash.split('/');
    if (parts.length >= 3 && parts[1] === 'wizard') return parts[2];
    return undefined;
  };
  const id = getParamId();
  
  const navigate = (path: string) => {
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  };

  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
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

  const handleFetchData = async () => {
    if (!data.country) {
      alert("Please enter a country name first.");
      return;
    }
    
    // Priority: User's personal API key, then system default
    const aiKey = user?.apiKey || process.env.API_KEY;
    
    if (!aiKey) {
      alert("No API key configured. Please set one in Settings.");
      return;
    }

    setIsFetchingAI(true);
    const targetLanguage = language === 'ar' ? 'Arabic' : 'English';
    try {
      const ai = new GoogleGenAI({ apiKey: aiKey });
      const prompt = `Fetch the latest official labour market and economic data for ${data.country}. IMPORTANT: All text values (capital, names, categories, etc.) MUST be returned in ${targetLanguage}. Ensure numeric values are returned as strings if they contain currency or units.`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
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
              }
            }
          }
        }
      });
      
      if (response.text) {
        const aiData = JSON.parse(response.text);
        setData(prev => ({ 
          ...prev, 
          ...aiData, 
          workforceStats: { ...prev.workforceStats, ...aiData } 
        }));
      }
    } catch (error) { 
      console.error("AI Fetch Error:", error);
      alert("Failed to fetch data via AI. Please ensure your API key is valid and has sufficient quota.");
    } finally { 
      setIsFetchingAI(false); 
    }
  };

  const handleFetchNews = async () => {
     if (!data.country) return;
     
     const aiKey = user?.apiKey || process.env.API_KEY;
     if (!aiKey) return;

     setIsFetchingNews(true);
     const targetLanguage = language === 'ar' ? 'Arabic' : 'English';
     try {
       const ai = new GoogleGenAI({ apiKey: aiKey });
       const prompt = `Find 5 recent news articles (2024-2025) about workforce cooperation or bilateral agreements between the UAE and ${data.country}. IMPORTANT: The news titles and summaries MUST be returned in ${targetLanguage}. Output as JSON array.`;
       
       const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  date: { type: Type.STRING },
                  summary: { type: Type.STRING }
                }
              }
            }
          },
       });
       
       if (response.text) {
         const newsItems = JSON.parse(response.text);
         if (Array.isArray(newsItems)) {
            setData(prev => ({ 
              ...prev, 
              relatedNews: [...(prev.relatedNews || []), ...newsItems.map(n => ({ ...n, id: uuidv4() }))] 
            }));
         }
       }
     } catch (error) { 
       console.error("AI News Fetch Error:", error); 
     } finally { 
       setIsFetchingNews(false); 
     }
  };

  const addDelegate = (type: 'uae' | 'partner') => {
    const newDelegate: Delegate = { id: uuidv4(), name: '', title: '', imageUrl: '', bio: '' };
    setData(prev => ({ ...prev, delegations: { ...prev.delegations, [type]: [...prev.delegations[type], newDelegate] } }));
  };

  const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
    const reportId = id || `r-${uuidv4().slice(0, 8)}`;
    
    // Transfer ownership to current editor
    const newReport: Report = { 
      id: reportId, 
      userId: user?.id || 'u-admin', 
      title: reportTitle || `Report for ${data.country || 'Unknown'}`, 
      status, 
      updatedAt: new Date().toISOString(), 
      data 
    };
    
    await MockService.saveReport(newReport);
    
    if (status === 'completed') {
      navigate('/dashboard');
    } else if (!id) {
      // If it was a new report, navigate to its URL to allow further editing
      navigate(`/wizard/${reportId}`);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="border-b dark:border-gray-700 pb-4 mb-4">
               <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2 mb-2"><FileText size={20} /> {t('reportDetails')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label={t('reportTitle')} value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="e.g. India Bilateral Meeting Oct 2025" />
                 <Input label={t('reportDate')} type="date" value={data.reportDate} onChange={e => setData({...data, reportDate: e.target.value})} />
               </div>
             </div>
             <div className="flex flex-col md:flex-row gap-4 items-start bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
               <div className="shrink-0 flex flex-col items-center gap-2">
                  <label className="text-[14.5px] font-bold uppercase text-primary/80 dark:text-primary-light/80">Flag</label>
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden shadow-sm" onClick={() => document.getElementById('flag-upload')?.click()}>
                     {data.flagUrl ? <img src={data.flagUrl} className="w-full h-full object-cover" /> : <UploadCloud className="text-gray-400" size={20} />}
                  </div>
                  <input type="file" id="flag-upload" className="hidden" accept="image/png, image/jpeg" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setData(prev => ({ ...prev, flagUrl: reader.result as string })); reader.readAsDataURL(file); } }} />
               </div>
               <div className="flex-1 w-full"><Input label={t('country')} value={data.country} onChange={e => setData({...data, country: e.target.value})} placeholder="e.g. Philippines" /></div>
               <Button onClick={handleFetchData} disabled={isFetchingAI} className="mt-1">
                 {isFetchingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} 
                 {t('fetchData')}
               </Button>
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
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4"><h5 className="font-bold text-sm mb-2">{t('totalPrivate')}</h5><div className="flex gap-2"><Input value={data.uaeWorkforceStats.mohre.totalPrivate.value} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalPrivate: {...data.uaeWorkforceStats.mohre.totalPrivate, value: e.target.value}}}})} /><Input value={data.uaeWorkforceStats.mohre.totalPrivate.date} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalPrivate: {...data.uaeWorkforceStats.mohre.totalPrivate, date: e.target.value}}}})} /></div></Card>
                <Card className="p-4"><h5 className="font-bold text-sm mb-2">{t('totalDomestic')}</h5><div className="flex gap-2"><Input value={data.uaeWorkforceStats.mohre.totalDomestic.value} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalDomestic: {...data.uaeWorkforceStats.mohre.totalDomestic, value: e.target.value}}}})} /><Input value={data.uaeWorkforceStats.mohre.totalDomestic.date} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalDomestic: {...data.uaeWorkforceStats.mohre.totalDomestic, date: e.target.value}}}})} /></div></Card>
             </div>
             <div>
                <h5 className="font-bold text-sm mb-3">{t('workersByEmirate')}</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.uaeWorkforceStats.mohre.byEmirate.map((em, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 border p-3 rounded-lg">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">{em.name}</label>
                      <input type="number" className="w-full text-sm font-mono border-none outline-none bg-transparent" value={em.value} onChange={e => { const list = [...data.uaeWorkforceStats.mohre.byEmirate]; list[idx].value = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, byEmirate: list}}}); }} />
                    </div>
                  ))}
                </div>
             </div>
             <div>
                <h5 className="font-bold text-sm mb-3">{t('workersBySector')}</h5>
                {data.uaeWorkforceStats.mohre.bySector.map((sec, idx) => (
                  <div key={idx} className="flex gap-4 mb-2"><Input value={sec.name} className="flex-1" onChange={e => { const list = [...data.uaeWorkforceStats.mohre.bySector]; list[idx].name = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: list}}}); }} /><Input value={sec.value} type="number" className="w-32" onChange={e => { const list = [...data.uaeWorkforceStats.mohre.bySector]; list[idx].value = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: list}}}); }} /><button onClick={() => { const list = data.uaeWorkforceStats.mohre.bySector.filter((_, i) => i !== idx); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: list}}}); }} className="text-red-400">X</button></div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, bySector: [...data.uaeWorkforceStats.mohre.bySector, { name: '', value: 0 }]}}})}>+ Add Sector</Button>
             </div>
          </div>
        );
      case 2:
      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             {currentStep === 2 ? (
               <>
                 <div className="grid grid-cols-2 gap-6"><Input label={t('avgWage')} value={data.averageWage} onChange={e => setData({...data, averageWage: e.target.value})} /><Input label={t('minWage')} value={data.minimumWage} onChange={e => setData({...data, minimumWage: e.target.value})} /></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} onChange={e => setData({...data, workforceStats: {...data.workforceStats, totalWorkforce: e.target.value}})} />
                    <Input label={t('maleParticipation')} type="number" value={data.workforceStats.participationMale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationMale: Number(e.target.value)}})} />
                    <Input label={t('femaleParticipation')} type="number" value={data.workforceStats.participationFemale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationFemale: Number(e.target.value)}})} />
                 </div>
                 <div>
                   <label className="text-[14.5px] font-bold mb-2 block">{t('migrationDestinations')}</label>
                   {data.workforceStats.migrationDestinations.map((dest, i) => (
                     <div key={i} className="flex gap-2 mb-2"><Input value={dest.country} placeholder="Country" onChange={e => { const list = [...data.workforceStats.migrationDestinations]; list[i].country = e.target.value; setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: list}}); }} /><Input value={dest.count} placeholder="Count" onChange={e => { const list = [...data.workforceStats.migrationDestinations]; list[i].count = e.target.value; setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: list}}); }} /></div>
                   ))}
                   <Button size="sm" variant="outline" onClick={() => setData({...data, workforceStats: {...data.workforceStats, migrationDestinations: [...data.workforceStats.migrationDestinations, { country: '', count: '' }]}})}>+ Add Destination</Button>
                 </div>
                 <div>
                   <label className="text-[14.5px] font-bold mb-2 block">{t('sectorDistribution')}</label>
                   {data.workforceStats.topSectors.map((sec, i) => (
                     <div key={i} className="flex gap-2 mb-2"><Input value={sec.name} placeholder="Sector" onChange={e => { const list = [...data.workforceStats.topSectors]; list[i].name = e.target.value; setData({...data, workforceStats: {...data.workforceStats, topSectors: list}}); }} /><Input value={sec.value} type="number" placeholder="Value" onChange={e => { const list = [...data.workforceStats.topSectors]; list[i].value = Number(e.target.value); setData({...data, workforceStats: {...data.workforceStats, topSectors: list}}); }} /></div>
                   ))}
                   <Button size="sm" variant="outline" onClick={() => setData({...data, workforceStats: {...data.workforceStats, topSectors: [...data.workforceStats.topSectors, { name: '', value: 0 }]}})}>+ Add Sector</Button>
                 </div>
               </>
             ) : (
               <>
                 <div className="grid grid-cols-2 gap-6"><Input label={t('inflation')} value={data.economicStats.inflation} onChange={e => setData({...data, economicStats: {...data.economicStats, inflation: e.target.value}})} /><Input label={t('gdp')} value={data.economicStats.gdp} onChange={e => setData({...data, economicStats: {...data.economicStats, gdp: e.target.value}})} /><Input label={t('exportsToUae')} value={data.economicStats.totalExportsToUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalExportsToUAE: e.target.value}})} /><Input label={t('importsFromUae')} value={data.economicStats.totalImportsFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalImportsFromUAE: e.target.value}})} /></div>
                 <div className="grid grid-cols-2 gap-6"><Input label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, primaryEnrollment: e.target.value}})} /><Input label={t('higherEnrollment')} value={data.educationStats.higherEducationEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, higherEducationEnrollment: e.target.value}})} /></div>
               </>
             )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2"><Calendar size={18} /> {t('recentInteractions')}</h4>
                {data.recentInteractions.map((item, idx) => (
                   <Card key={item.id} className="p-4"><div className="grid grid-cols-2 gap-4 mb-4"><Input value={item.title} label="Title" onChange={e => { const list = [...data.recentInteractions]; list[idx].title = e.target.value; setData({...data, recentInteractions: list}); }} /><Input value={item.date} type="date" label="Date" onChange={e => { const list = [...data.recentInteractions]; list[idx].date = e.target.value; setData({...data, recentInteractions: list}); }} /></div><RichTextarea label="Details" value={item.details} onChange={(val: string) => { const list = [...data.recentInteractions]; list[idx].details = val; setData({...data, recentInteractions: list}); }} /></Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, recentInteractions: [...data.recentInteractions, { id: uuidv4(), title: '', date: '', type: 'Meeting', details: '' }]})}>+ Add Interaction</Button>
             </div>
             <div className="space-y-4 pt-6 border-t">
                <h4 className="font-bold flex items-center gap-2"><MessageSquare size={18} /> {t('pointsDiscussion')}</h4>
                {data.pointsOfDiscussion.map((item, idx) => (
                   <Card key={item.id} className="p-4"><Input value={item.title} className="font-bold mb-4" placeholder="Topic Title" onChange={e => { const list = [...data.pointsOfDiscussion]; list[idx].title = e.target.value; setData({...data, pointsOfDiscussion: list}); }} /><RichTextarea label="Content" value={item.content} onChange={(val: string) => { const list = [...data.pointsOfDiscussion]; list[idx].content = val; setData({...data, pointsOfDiscussion: list}); }} /></Card>
                ))}
                <Button variant="outline" onClick={() => setData({...data, pointsOfDiscussion: [...data.pointsOfDiscussion, { id: uuidv4(), title: '', content: '' }]})}>+ Add Point</Button>
             </div>
             <div className="pt-6 border-t">
               <Button onClick={handleFetchNews} disabled={isFetchingNews} className="w-full flex items-center justify-center gap-2">
                 {isFetchingNews ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                 {t('fetchNews')}
               </Button>
             </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             {data.bilateralAgreements.map((agreement, idx) => (
                <Card key={idx} className="p-4"><Input value={agreement.title} className="font-bold mb-2" onChange={e => { const list = [...data.bilateralAgreements]; list[idx].title = e.target.value; setData({...data, bilateralAgreements: list}); }} /><Input value={agreement.date} label="Date" className="mb-2" onChange={e => { const list = [...data.bilateralAgreements]; list[idx].date = e.target.value; setData({...data, bilateralAgreements: list}); }} /><RichTextarea label="Summary" value={agreement.summary} onChange={(val: string) => { const list = [...data.bilateralAgreements]; list[idx].summary = val; setData({...data, bilateralAgreements: list}); }} /></Card>
             ))}
             <Button variant="outline" onClick={() => setData({...data, bilateralAgreements: [...data.bilateralAgreements, { title: '', date: '', status: 'Active', summary: '' }]})}>+ Add Agreement</Button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
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
                              <div className="w-32 h-44 shrink-0 bg-gray-100 rounded-xl overflow-hidden relative cursor-pointer group" onClick={() => document.getElementById(`file-${delegate.id}`).click()}>
                                 {delegate.imageUrl ? <img src={delegate.imageUrl} className="w-full h-full object-cover" /> : <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 font-bold text-[10px]"><UploadCloud size={24} className="mb-2" /> UPLOAD</div>}
                                 <input type="file" id={`file-${delegate.id}`} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].imageUrl = reader.result as string; setData({...data, delegations: {...data.delegations, [type]: list}}); }; reader.readAsDataURL(file); } }} />
                              </div>
                              <div className="flex-1 space-y-4">
                                 <div className="grid grid-cols-2 gap-4"><Input label="Name" value={delegate.name} onChange={e => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].name = e.target.value; setData({...data, delegations: {...data.delegations, [type]: list}}); }} /><Input label="Title" value={delegate.title} onChange={e => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].title = e.target.value; setData({...data, delegations: {...data.delegations, [type]: list}}); }} /></div>
                                 <RichTextarea label="Biography" value={delegate.bio} onChange={(val: string) => { const list = [...data.delegations[type as 'uae'|'partner']]; list[idx].bio = val; setData({...data, delegations: {...data.delegations, [type]: list}}); }} />
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
          <Card className="min-h-[500px] p-8 shadow-2xl">{renderStep()}</Card>
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
