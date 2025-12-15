import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { 
  Globe, Users, TrendingUp, Building, 
  Handshake, Landmark, Plane, Banknote, 
  Printer, X, AlertTriangle, ShieldAlert,
  GraduationCap, Briefcase, MessageSquare, FileText, Calendar, Activity,
  ArrowDownLeft, ArrowUpRight, BookOpen, Building2, Shield
} from 'lucide-react';
import { PageContainer, HeaderBand, SectionHeader, KPI } from '../components/PrintUI';
import { useLanguage } from '../context/LanguageContext';

const BLUE_PALETTE = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

export default function PrintView() {
  const { id } = useParams();
  const { t, language, dir } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      MockService.getReportById(id).then(r => {
        if (r) {
          setReport(r);
        } else {
          setError(true);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (report) {
      document.fonts.ready.then(() => {
         // Auto-print disabled for dev experience
      });
    }
  }, [report]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4 no-print" dir={dir}>
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">{t('reportNotFound')}</h2>
        <p className="text-sm">{t('reportNotFoundMsg')}</p>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">{t('closeWindow')}</button>
      </div>
    );
  }

  if (!report) return (
    <div className="h-screen flex items-center justify-center text-primary font-serif animate-pulse no-print" dir={dir}>
      {t('generatingDoc')}
    </div>
  );

  const { data } = report;
  const isRTL = language === 'ar';

  const formatCompactNumber = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const getSource = (type: string) => {
     if (language === 'ar') {
        switch(type) {
           case 'demo': return '*(البنك الدولي، 2025)';
           case 'economy': return '*(البنك الدولي، 2025)';
           case 'trade': return '*(كوم تريد/إحصاءات وطنية، 2025)';
           case 'edu': return '*(اليونسكو/البنك الدولي، 2025)';
           case 'gov': return '*(بوابة الحكومة الرسمية، 2025)';
           case 'crime': return '*(مكتب الأمم المتحدة المعني بالمخدرات والجريمة، 2025)';
           case 'literacy': return '*(اليونسكو، 2025)';
           case 'tip': return '*(تقرير الاتجار بالأشخاص الأمريكي، 2024)';
           case 'mohre': return '*(بيانات إدارية – وزارة الموارد البشرية والتوطين، 2025)';
           case 'icp': return '*(بيانات إدارية – الهيئة الاتحادية للهوية والجنسية، 2025)';
           default: return '';
        }
     } else {
        switch(type) {
           case 'demo': return '*(World Bank, 2025)';
           case 'economy': return '*(World Bank, 2025)';
           case 'trade': return '*(UN Comtrade / National Statistics, 2025)';
           case 'edu': return '*(UNESCO / World Bank, 2025)';
           case 'gov': return '*(Official Government Portal, 2025)';
           case 'crime': return '*(UNODC / National Police Statistics, 2025)';
           case 'literacy': return '*(UNESCO, 2025)';
           case 'tip': return '*(US TIP Report, 2024)';
           case 'mohre': return '*(MOHRE Administrative Data, 2025)';
           case 'icp': return '*(ICP Administrative Data, 2025)';
           default: return '';
        }
     }
  };

  const translateEmirate = (name: string) => {
     if (!isRTL) return name;
     const map: Record<string, string> = {
        'Abu Dhabi': 'أبوظبي',
        'Dubai': 'دبي',
        'Sharjah': 'الشارقة',
        'Ajman': 'عجمان',
        'Umm Al Quwain': 'أم القيوين',
        'Ras Al Khaimah': 'رأس الخيمة',
        'Fujairah': 'الفجيرة'
     };
     return map[name] || name;
  };

  const DefaultFooter = () => (
    <div className="border-t border-gray-100 pt-2 flex justify-between items-center mt-2">
      <p className="text-[8px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans" dir="ltr">{new Date().toLocaleDateString(language === 'ar' ? "en-GB" : "en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest">
        {t('ministry')}
      </p>
    </div>
  );

  // Pagination Logic for Page 4
  const interactionsPerPage = 4;
  const hasExtraPage = data.recentInteractions.length > interactionsPerPage || data.pointsOfDiscussion.length > 3;
  const firstPageInteractions = data.recentInteractions.slice(0, interactionsPerPage);
  const secondPageInteractions = data.recentInteractions.slice(interactionsPerPage);

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <div className={`fixed top-4 z-50 flex gap-2 no-print ${isRTL ? 'left-4' : 'right-4'}`}>
         <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold">
            <Printer size={18} /> {t('printNow')}
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-600 p-2.5 rounded-lg shadow-lg hover:bg-gray-100 transition-all border border-gray-200">
            <X size={20} />
         </button>
      </div>

      {/* --- PAGE 1: COVER --- */}
      <div className="w-[210mm] h-[297mm] bg-white mx-auto flex flex-col relative overflow-hidden page-break shadow-xl print:shadow-none mb-8 print:mb-0">
         {/* Background Map Outline (SVG) */}
         <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 1000 500" className="w-[150%] h-auto text-primary fill-current">
               <path d="M50,250 Q250,50 500,250 T950,250" stroke="currentColor" strokeWidth="2" fill="none" />
               <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="2" fill="none" />
               <circle cx="800" cy="300" r="80" stroke="currentColor" strokeWidth="2" fill="none" />
               <path d="M0,0 L1000,500 M1000,0 L0,500" stroke="currentColor" strokeWidth="0.5" />
            </svg>
         </div>
         <div className={`absolute top-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/2 ${isRTL ? 'left-0 -translate-x-1/3' : 'right-0 translate-x-1/3'}`}></div>
         
         <div className="flex-1 flex flex-col justify-center px-16 relative z-10">
            <div className={`mb-10 border-accent py-4 ${isRTL ? 'border-r-[6px] pr-10' : 'border-l-[6px] pl-10'}`}>
               <div className="flex items-center gap-3 mb-6 opacity-60">
                 <img src="https://flagcdn.com/w40/ae.png" className="h-5 w-auto" alt="UAE" />
                 <span className="text-xs