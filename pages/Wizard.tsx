import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReportData, EMPTY_REPORT_DATA, Report, Delegate, NewsItem, RecentInteraction, PointOfDiscussion } from '../types';
import { MockService } from '../services/mockService';
import { Button, Card, Input } from '../components/ui/LayoutComponents';
import { 
  ArrowLeft, ArrowRight, Save, Globe, Users, FileText, CheckCircle, 
  Plane, Building, TrendingUp, Sparkles, Loader2, RefreshCw, X, 
  BarChart2, MessageSquare, Newspaper, Calendar, UploadCloud, 
  Bold, Italic, List, Briefcase, Plus, Trash2, GraduationCap, MapPin, Flag
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const RichTextarea = ({ label, value, onChange, placeholder }: any) => {
  const insertText = (tag: string) => {
    const textarea = document.getElementById(`rt-${label}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const terrestrial = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let replacement = "";
    if (tag === 'bold') replacement = `**${selected || 'text'}**`;
    else if (tag === 'italic') replacement = `*${selected || 'text'}*`;
    else if (tag === 'bullet') replacement = `\n- ${selected || 'item'}`;

    onChange(before + replacement + terrestrial);
    
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
  
  // Tag editor temporary states
  const [tempSkill, setTempSkill] = useState('');
  const [tempUni, setTempUni] = useState('');

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
    
    setIsFetchingAI(true);
    const targetLanguage = language === 'ar' ? 'Arabic' : 'English';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Fetch the latest official labour market and economic data for ${data.country}. Return a JSON object with values in ${targetLanguage}. Include capital, population, currency, GDP, HDI, literacy rate, government type, average wage, minimum wage, total workforce, participation male/female, inflation, exports to UAE, imports from UAE, TIP rank, remittances from UAE, remittances global, primary enrollment, higher education enrollment, top 5 universities, and top skills.`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
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
              crimeRate: { type: Type.STRING },
              literacyRate: { type: Type.STRING },
              governmentType: { type: Type.STRING },
              workforceMinistry: { type: Type.STRING },
              averageWage: { type: Type.STRING },
              minimumWage: { type: Type.STRING },
              totalWorkforce: { type: Type.STRING },
              participationMale: { type: Type.NUMBER },
              participationFemale: { type: Type.NUMBER },
              availableSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              inflation: { type: Type.STRING },
              totalExportsToUAE: { type: Type.STRING },
              totalImportsFromUAE: { type: Type.STRING },
              tipRank: { type: Type.STRING },
              remittancesFromUAE: { type: Type.STRING },
              remittancesGlobal: { type: Type.STRING },
              primaryEnrollment: { type: Type.STRING },
              higherEducationEnrollment: { type: Type.STRING },
              topUniversities: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      
      if (response.text) {
        const aiData = JSON.parse(response.text);
        setData(prev => ({ 
          ...prev, 
          ...aiData,
          workforceStats: {
            ...prev.workforceStats,
            totalWorkforce: aiData.totalWorkforce || prev.workforceStats.totalWorkforce,
            participationMale: aiData.participationMale || prev.workforceStats.participationMale,
            participationFemale: aiData.participationFemale || prev.workforceStats.participationFemale,
            availableSkills: aiData.availableSkills || prev.workforceStats.availableSkills
          },
          economicStats: {
            ...prev.economicStats,
            inflation: aiData.inflation || prev.economicStats.inflation,
            totalExportsToUAE: aiData.totalExportsToUAE || prev.economicStats.totalExportsToUAE,
            totalImportsFromUAE: aiData.totalImportsFromUAE || prev.economicStats.totalImportsFromUAE,
            tipRank: aiData.tipRank || prev.economicStats.tipRank,
            remittancesFromUAE: aiData.remittancesFromUAE || prev.economicStats.remittancesFromUAE,
            remittancesGlobal: aiData.remittancesGlobal || prev.economicStats.remittancesGlobal,
          },
          educationStats: {
            ...prev.educationStats,
            primaryEnrollment: aiData.primaryEnrollment || prev.educationStats.primaryEnrollment,
            higherEducationEnrollment: aiData.higherEducationEnrollment || prev.educationStats.higherEducationEnrollment,
            topUniversities: aiData.topUniversities || prev.educationStats.topUniversities
          }
        }));
      }
    } catch (error: any) { 
      console.error("AI Fetch Error:", error);
    } finally { 
      setIsFetchingAI(false); 
    }
  };

  // Added handleFetchNews to fix the "Cannot find name 'handleFetchNews'" error.
  // This uses Gemini API with Google Search grounding to fetch relevant recent news.
  const handleFetchNews = async () => {
    if (!data.country) {
      alert("Please enter a country name first.");
      return;
    }
    
    setIsFetchingNews(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // We request news articles with Google Search grounding for real-time accuracy.
      const prompt = `Find 3 most recent news articles regarding bilateral labor, economic, or diplomatic relations between UAE and ${data.country}.
      For each item, provide a title, the news source name, the approximate date, and a brief 2-sentence summary.
      Include the website name and URL in the 'source' field if available.
      Format the output as a JSON array of objects.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
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
              },
              required: ['title', 'source', 'date', 'summary']
            }
          }
        }
      });
      
      if (response.text) {
        const newsItems = JSON.parse(response.text);
        const newsWithIds = newsItems.map((item: any) => ({
          ...item,
          id: uuidv4()
        }));
        
        setData(prev => ({
          ...prev,
          relatedNews: [...prev.relatedNews, ...newsWithIds]
        }));
      }
    } catch (error: any) {
      console.error("News Fetch Error:", error);
      alert("Failed to fetch news. Please try again or enter details manually.");
    } finally {
      setIsFetchingNews(false);
    }
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

  const addSkill = () => {
    if (tempSkill.trim()) {
      setData(prev => ({
        ...prev,
        workforceStats: {
          ...prev.workforceStats,
          availableSkills: [...prev.workforceStats.availableSkills, tempSkill.trim()]
        }
      }));
      setTempSkill('');
    }
  };

  const removeSkill = (idx: number) => {
    setData(prev => ({
      ...prev,
      workforceStats: {
        ...prev.workforceStats,
        availableSkills: prev.workforceStats.availableSkills.filter((_, i) => i !== idx)
      }
    }));
  };

  const addUniversity = () => {
    if (tempUni.trim()) {
      setData(prev => ({
        ...prev,
        educationStats: {
          ...prev.educationStats,
          topUniversities: [...prev.educationStats.topUniversities, tempUni.trim()]
        }
      }));
      setTempUni('');
    }
  };

  const removeUniversity = (idx: number) => {
    setData(prev => ({
      ...prev,
      educationStats: {
        ...prev.educationStats,
        topUniversities: prev.educationStats.topUniversities.filter((_, i) => i !== idx)
      }
    }));
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Country Profile
        return (
          <div className="space-y-6">
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
                  </div>
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
                    <Input label={t('country')} value={data.country} onChange={e => setData({...data, country: e.target.value})} placeholder="e.g. India" />
                    <Button onClick={handleFetchData} disabled={isFetchingAI} className="mb-0.5">
                      {isFetchingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} 
                      {t('fetchData')}
                    </Button>
                  </div>
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
            </div>
          </div>
        );
      case 1: // UAE Workforce
        return (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 border-l-4 border-l-primary">
                  <h5 className="font-bold text-sm mb-2">{t('mohreData')}</h5>
                  <div className="flex gap-2 mb-2">
                    <Input label="Private Sector" value={data.uaeWorkforceStats.mohre.totalPrivate.value} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalPrivate: {...data.uaeWorkforceStats.mohre.totalPrivate, value: e.target.value}}}})} />
                    <Input label="As of" value={data.uaeWorkforceStats.mohre.totalPrivate.date} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalPrivate: {...data.uaeWorkforceStats.mohre.totalPrivate, date: e.target.value}}}})} />
                  </div>
                  <div className="flex gap-2">
                    <Input label="Domestic Workers" value={data.uaeWorkforceStats.mohre.totalDomestic.value} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalDomestic: {...data.uaeWorkforceStats.mohre.totalDomestic, value: e.target.value}}}})} />
                    <Input label="As of" value={data.uaeWorkforceStats.mohre.totalDomestic.date} onChange={e => setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, totalDomestic: {...data.uaeWorkforceStats.mohre.totalDomestic, date: e.target.value}}}})} />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-accent">
                  <h5 className="font-bold text-sm mb-2">{t('icpData')}</h5>
                  <p className="text-[10px] text-gray-500 mb-2 uppercase">{t('icpDisclaimer')}</p>
                  <div className="space-y-2">
                    {data.uaeWorkforceStats.icp.byEmirate.map((em, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold">
                        <span className="w-20">{em.name}</span>
                        <Input value={em.value} type="number" className="h-8 py-0" onChange={e => { 
                          const list = [...data.uaeWorkforceStats.icp.byEmirate]; 
                          list[i].value = Number(e.target.value); 
                          setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, icp: {...data.uaeWorkforceStats.icp, byEmirate: list}}}); 
                        }} />
                      </div>
                    ))}
                  </div>
                </Card>
             </div>
             <div>
                <h5 className="font-bold text-sm mb-3">{t('workersByEmirate')} (MOHRE)</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.uaeWorkforceStats.mohre.byEmirate.map((em, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 border p-3 rounded-lg">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">{em.name}</label>
                      <input type="number" className="w-full text-sm font-mono border-none outline-none bg-transparent dark:text-white" value={em.value} onChange={e => { 
                        const list = [...data.uaeWorkforceStats.mohre.byEmirate]; 
                        list[idx].value = Number(e.target.value); 
                        setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, byEmirate: list}}}); 
                      }} />
                    </div>
                  ))}
                </div>
             </div>
             <div className="pt-6 border-t">
                <h5 className="font-bold text-sm mb-3">{t('additionalIndicators')}</h5>
                {data.uaeWorkforceStats.custom.map((stat, i) => (
                   <div key={stat.id} className="flex gap-4 mb-3 items-end">
                      <Input label="Label" value={stat.label} onChange={e => { const list = [...data.uaeWorkforceStats.custom]; list[i].label = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: list}}); }} />
                      <Input label="Value" value={stat.value} onChange={e => { const list = [...data.uaeWorkforceStats.custom]; list[i].value = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: list}}); }} />
                      <Input label="Date/As of" value={stat.date} onChange={e => { const list = [...data.uaeWorkforceStats.custom]; list[i].date = e.target.value; setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, custom: list}}); }} />
                   </div>
                ))}
             </div>
          </div>
        );
      case 2: // Partner Workforce
        return (
          <div className="space-y-6">
             <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 mb-4"><Users size={20} /> {t('sectionWorkforce')}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} onChange={e => setData({...data, workforceStats: {...data.workforceStats, totalWorkforce: e.target.value}})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('maleParticipation')} type="number" value={data.workforceStats.participationMale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationMale: Number(e.target.value)}})} />
                  <Input label={t('femaleParticipation')} type="number" value={data.workforceStats.participationFemale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationFemale: Number(e.target.value)}})} />
                </div>
                <Input label={t('avgWage')} value={data.averageWage} onChange={e => setData({...data, averageWage: e.target.value})} />
                <Input label={t('minWage')} value={data.minimumWage} onChange={e => setData({...data, minimumWage: e.target.value})} />
             </div>

             <div className="space-y-3 pt-4">
                <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300">{t('availableSkills')}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {data.workforceStats.availableSkills.map((skill, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider group transition-all">
                       {skill}
                       <button onClick={() => removeSkill(i)} className="text-primary/50 hover:text-red-500"><X size={14} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                   <Input 
                    placeholder="Type skill and press Enter..." 
                    value={tempSkill} 
                    onChange={e => setTempSkill(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && addSkill()}
                   />
                   <Button variant="outline" onClick={addSkill}><Plus size={18} /></Button>
                </div>
             </div>
          </div>
        );
      case 3: // Economy & Education
        return (
          <div className="space-y-8">
             {/* Economic Indicators */}
             <div className="space-y-6">
                <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 border-b pb-2"><Briefcase size={20} /> {t('economyDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Input label={t('inflation')} value={data.economicStats.inflation} onChange={e => setData({...data, economicStats: {...data.economicStats, inflation: e.target.value}})} />
                   <Input label={t('exportsToUae')} value={data.economicStats.totalExportsToUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalExportsToUAE: e.target.value}})} />
                   <Input label={t('importsFromUae')} value={data.economicStats.totalImportsFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalImportsFromUAE: e.target.value}})} />
                   <Input label={t('tipRank')} value={data.economicStats.tipRank} onChange={e => setData({...data, economicStats: {...data.economicStats, tipRank: e.target.value}})} />
                   <Input label={t('remittances')} value={data.economicStats.remittancesFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesFromUAE: e.target.value}})} />
                   <Input label={t('remittancesGlobal')} value={data.economicStats.remittancesGlobal} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesGlobal: e.target.value}})} />
                </div>
             </div>

             {/* Education Details */}
             <div className="space-y-6 pt-6 border-t dark:border-gray-800">
                <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 border-b pb-2"><GraduationCap size={20} /> {t('educationDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Input label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, primaryEnrollment: e.target.value}})} />
                   <Input label={t('higherEducationEnrollment')} value={data.educationStats.higherEducationEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, higherEducationEnrollment: e.target.value}})} />
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300">{t('topUniversities')}</label>
                   <div className="space-y-2 max-w-2xl">
                     {data.educationStats.topUniversities.map((uni, i) => (
                       <div key={i} className="flex gap-2 items-center group">
                          <Input value={uni} onChange={e => {
                             const list = [...data.educationStats.topUniversities];
                             list[i] = e.target.value;
                             setData({...data, educationStats: {...data.educationStats, topUniversities: list}});
                          }} />
                          <button onClick={() => removeUniversity(i)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                       </div>
                     ))}
                     <div className="flex gap-2 pt-2">
                        <Input 
                          placeholder="Type university and press Enter..." 
                          value={tempUni} 
                          onChange={e => setTempUni(e.target.value)} 
                          onKeyPress={e => e.key === 'Enter' && addUniversity()}
                        />
                        <Button variant="outline" onClick={addUniversity}><Plus size={18} /></Button>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        );
      case 4: // Interactions & News
        return (
          <div className="space-y-8">
             {/* Interactions */}
             <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                   <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2"><MessageSquare size={20} /> {t('recentInteractions')}</h3>
                   <Button size="sm" variant="outline" onClick={() => setData({...data, recentInteractions: [...data.recentInteractions, { id: uuidv4(), title: '', date: '', type: 'Meeting', details: '' }]})}><Plus size={16} /> Add Interaction</Button>
                </div>
                <div className="space-y-4">
                   {data.recentInteractions.map((ri, i) => (
                      <Card key={ri.id} className="p-4 relative group">
                         <button onClick={() => setData({...data, recentInteractions: data.recentInteractions.filter((_, idx) => idx !== i)})} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Input label="Title" value={ri.title} onChange={e => {
                               const list = [...data.recentInteractions];
                               list[i].title = e.target.value;
                               setData({...data, recentInteractions: list});
                            }} />
                            <Input label="Date" type="date" value={ri.date} onChange={e => {
                               const list = [...data.recentInteractions];
                               list[i].date = e.target.value;
                               setData({...data, recentInteractions: list});
                            }} />
                            <Input label="Type" value={ri.type} onChange={e => {
                               const list = [...data.recentInteractions];
                               list[i].type = e.target.value;
                               setData({...data, recentInteractions: list});
                            }} />
                         </div>
                         <textarea 
                          className="w-full p-3 rounded-lg border text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                          placeholder="Interaction summary..."
                          value={ri.details}
                          onChange={e => {
                             const list = [...data.recentInteractions];
                             list[i].details = e.target.value;
                             setData({...data, recentInteractions: list});
                          }}
                         />
                      </Card>
                   ))}
                </div>
             </div>

             {/* Related News */}
             <div className="space-y-6 pt-6 border-t dark:border-gray-800">
                <div className="flex justify-between items-center border-b pb-2">
                   <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2"><Newspaper size={20} /> {t('relatedNews')}</h3>
                   <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={handleFetchNews} disabled={isFetchingNews}>
                        {isFetchingNews ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} {t('fetchNews')}
