
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReportData, EMPTY_REPORT_DATA, Report, Delegate, NewsItem } from '../types';
import { MockService } from '../services/mockService';
import { Button, Card, Input } from '../components/ui/LayoutComponents';
// Added missing GraduationCap import
import { ArrowLeft, ArrowRight, Save, Globe, Users, FileText, CheckCircle, Plane, Building, TrendingUp, Sparkles, Loader2, RefreshCw, X, BarChart2, MessageSquare, Newspaper, Calendar, UploadCloud, Bold, Italic, List, Briefcase, Plus, Trash2, GraduationCap } from 'lucide-react';
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
  const [skillInput, setSkillInput] = useState('');
  const [universityInput, setUniversityInput] = useState('');

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
      const prompt = `Fetch the latest official labour market and economic data for ${data.country}. All text values must be returned in ${targetLanguage}. Ensure monthly wages are in USD.`;
      
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
              averageWage: { type: Type.STRING },
              minimumWage: { type: Type.STRING },
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
              economicStats_inflation: { type: Type.STRING },
              economicStats_gdp: { type: Type.STRING },
              economicStats_totalExportsToUAE: { type: Type.STRING },
              economicStats_totalImportsFromUAE: { type: Type.STRING },
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
          economicStats: {
            ...prev.economicStats,
            inflation: aiData.economicStats_inflation || prev.economicStats.inflation,
            gdp: aiData.economicStats_gdp || prev.economicStats.gdp,
            totalExportsToUAE: aiData.economicStats_totalExportsToUAE || prev.economicStats.totalExportsToUAE,
            totalImportsFromUAE: aiData.economicStats_totalImportsFromUAE || prev.economicStats.totalImportsFromUAE,
          },
          educationStats: {
            ...prev.educationStats,
            primaryEnrollment: aiData.primaryEnrollment || prev.educationStats.primaryEnrollment,
            higherEducationEnrollment: aiData.higherEducationEnrollment || prev.educationStats.higherEducationEnrollment,
            topUniversities: aiData.topUniversities || prev.educationStats.topUniversities
          },
          workforceStats: { ...prev.workforceStats, ...aiData } 
        }));
      }
    } catch (error: any) { 
      console.error("AI Fetch Error:", error);
    } finally { 
      setIsFetchingAI(false); 
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setData({ ...data, workforceStats: { ...data.workforceStats, availableSkills: [...data.workforceStats.availableSkills, skillInput.trim()] } });
      setSkillInput('');
    }
  };

  const removeSkill = (idx: number) => {
    const list = data.workforceStats.availableSkills.filter((_, i) => i !== idx);
    setData({ ...data, workforceStats: { ...data.workforceStats, availableSkills: list } });
  };

  const addUniversity = () => {
    if (universityInput.trim()) {
      setData({ ...data, educationStats: { ...data.educationStats, topUniversities: [...data.educationStats.topUniversities, universityInput.trim()] } });
      setUniversityInput('');
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

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
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
            </div>
          </div>
        );
      case 1:
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
                <Card className="p-4 border-l-4 border-l-accent"><h5 className="font-bold text-sm mb-2">{t('icpData')}</h5><p className="text-[10px] text-gray-500 mb-2 uppercase">{t('icpDisclaimer')}</p><div className="space-y-2">{data.uaeWorkforceStats.icp.byEmirate.map((em, i) => (<div key={i} className="flex items-center gap-2 text-xs font-bold"><span className="w-20">{em.name}</span><Input value={em.value} type="number" className="h-8 py-0" onChange={e => { const list = [...data.uaeWorkforceStats.icp.byEmirate]; list[i].value = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, icp: {...data.uaeWorkforceStats.icp, byEmirate: list}}}); }} /></div>))}</div></Card>
             </div>
             <div>
                <h5 className="font-bold text-sm mb-3">{t('workersByEmirate')} (MOHRE)</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.uaeWorkforceStats.mohre.byEmirate.map((em, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 border p-3 rounded-lg">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">{em.name}</label>
                      <input type="number" className="w-full text-sm font-mono border-none outline-none bg-transparent" value={em.value} onChange={e => { const list = [...data.uaeWorkforceStats.mohre.byEmirate]; list[idx].value = Number(e.target.value); setData({...data, uaeWorkforceStats: {...data.uaeWorkforceStats, mohre: {...data.uaeWorkforceStats.mohre, byEmirate: list}}}); }} />
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
      case 2:
        return (
          <div className="space-y-6">
             <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 border-b pb-2"><Users size={20} /> {t('sectionWorkforce')}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('totalWorkforce')} value={data.workforceStats.totalWorkforce} onChange={e => setData({...data, workforceStats: {...data.workforceStats, totalWorkforce: e.target.value}})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('maleParticipation')} type="number" value={data.workforceStats.participationMale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationMale: Number(e.target.value)}})} />
                  <Input label={t('femaleParticipation')} type="number" value={data.workforceStats.participationFemale} onChange={e => setData({...data, workforceStats: {...data.workforceStats, participationFemale: Number(e.target.value)}})} />
                </div>
                <Input label={t('avgWage')} value={data.averageWage} onChange={e => setData({...data, averageWage: e.target.value})} />
                <Input label={t('minWage')} value={data.minimumWage} onChange={e => setData({...data, minimumWage: e.target.value})} />
             </div>

             <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground/80">{t('availableSkills')}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                   {data.workforceStats.availableSkills.map((skill, i) => (
                      <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                         {skill}
                         <button onClick={() => removeSkill(i)} className="hover:text-red-500"><X size={12} /></button>
                      </span>
                   ))}
                </div>
                <div className="flex gap-2">
                   <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Add a skill..." />
                   <Button onClick={addSkill} variant="outline"><Plus size={18} /></Button>
                </div>
             </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
             <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 border-b pb-2"><Briefcase size={20} /> {t('economyDetails')}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('inflation')} value={data.economicStats.inflation} onChange={e => setData({...data, economicStats: {...data.economicStats, inflation: e.target.value}})} />
                <Input label={t('gdp')} value={data.economicStats.gdp} onChange={e => setData({...data, economicStats: {...data.economicStats, gdp: e.target.value}})} />
                <Input label={t('exportsToUae')} value={data.economicStats.totalExportsToUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalExportsToUAE: e.target.value}})} />
                <Input label={t('importsFromUae')} value={data.economicStats.totalImportsFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, totalImportsFromUAE: e.target.value}})} />
                <Input label={t('tipRank')} value={data.economicStats.tipRank} onChange={e => setData({...data, economicStats: {...data.economicStats, tipRank: e.target.value}})} />
                <Input label={t('remittances')} value={data.economicStats.remittancesFromUAE} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesFromUAE: e.target.value}})} />
                <Input label={t('remittancesGlobal')} value={data.economicStats.remittancesGlobal} onChange={e => setData({...data, economicStats: {...data.economicStats, remittancesGlobal: e.target.value}})} />
             </div>

             <div className="space-y-4 pt-6 border-t">
                {/* Fixed GraduationCap missing import */}
                <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 border-b pb-2"><GraduationCap size={20} /> {t('educationDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Input label={t('primaryEnrollment')} value={data.educationStats.primaryEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, primaryEnrollment: e.target.value}})} />
                   <Input label={t('higherEducationEnrollment')} value={data.educationStats.higherEducationEnrollment} onChange={e => setData({...data, educationStats: {...data.educationStats, higherEducationEnrollment: e.target.value}})} />
                </div>
                <div className="space-y-3">
                   <label className="text-sm font-semibold text-foreground/80">{t('topUniversities')}</label>
                   <div className="space-y-2">
                      {data.educationStats.topUniversities.map((uni, i) => (
                         <div key={i} className="flex gap-2">
                            <Input value={uni} onChange={e => {
                               const list = [...data.educationStats.topUniversities];
                               list[i] = e.target.value;
                               setData({...data, educationStats: {...data.educationStats, topUniversities: list}});
                            }} />
                            <button onClick={() => {
                               const list = data.educationStats.topUniversities.filter((_, idx) => idx !== i);
                               setData({...data, educationStats: {...data.educationStats, topUniversities: list}});
                            }} className="text-red-400"><Trash2 size={16} /></button>
                         </div>
                      ))}
                      <div className="flex gap-2">
                         <Input value={universityInput} onChange={e => setUniversityInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addUniversity()} placeholder="Add university..." />
                         <Button onClick={addUniversity} variant="outline"><Plus size={18} /></Button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
             <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2 border-b pb-2"><MessageSquare size={20} /> {t('sectionInteractions')}</h3>
             {data.recentInteractions.map((int, i) => (
                <Card key={int.id} className="p-4 relative">
                   <button onClick={() => {
                      const list = data.recentInteractions.filter((_, idx) => idx !== i);
                      setData({...data, recentInteractions: list});
                   }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input label="Title" value={int.title} onChange={e => {
                         const list = [...data.recentInteractions];
                         list[i].title = e.target.value;
                         setData({...data, recentInteractions: list});
                      }} />
                      <Input label="Type" value={int.type} onChange={e => {
                         const list = [...data.recentInteractions];
                         list[i].type = e.target.value;
                         setData({...data, recentInteractions: list});
                      }} />
                      <Input label="Date" type="date" value={int.date} onChange={e => {
                         const list = [...data.recentInteractions];
                         list[i].date = e.target.value;
                         setData({...data, recentInteractions: list});
                      }} />
                   </div>
                   <textarea className="w-full p-3 rounded border text-sm" value={int.details} onChange={e => {
                      const list = [...data.recentInteractions];
                      list[i].details = e.target.value;
                      setData({...data, recentInteractions: list});
                   }} />
                </Card>
             ))}
             <Button variant="outline" onClick={() => setData({...data, recentInteractions: [...data.recentInteractions, { id: uuidv4(), title: '', type: '', date: '', details: '' }]})}>+ Add Interaction</Button>
          </div>
        );
      case 7:
        return (
          <div className="bg-gray-100 dark:bg-gray-800 p-12 rounded-2xl border text-center">
             <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
             <h2 className="text-3xl font-serif font-bold mb-4">{reportTitle || 'Ready to Finalize'}</h2>
             <Button size="lg" onClick={() => handleSave('completed')} className="bg-green-600 hover:bg-green-700 mx-auto">Complete & Return to Dashboard</Button>
          </div>
        );
      default: return (
         <div className="p-10 text-center text-gray-400 italic">
            This section is coming soon or implementation is being refined.
         </div>
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-10">
        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <button key={step.id} onClick={() => setCurrentStep(idx)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${idx === currentStep ? 'bg-primary text-white shadow-xl' : 'text-gray-400 hover:bg-gray-100'}`}>
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
