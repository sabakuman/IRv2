
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOU, MOUUpdate, MOUAction } from '../types_mou';
import { PageContainer, SectionHeader, KPI } from '../components/PrintUI';
import { useLanguage } from '../context/LanguageContext';
import { 
  Building2, Calendar, Globe2, FileText, 
  Clock, CheckSquare, Printer, X, ShieldAlert 
} from 'lucide-react';
import { format } from 'date-fns';

export default function MOUPrintView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, dir, setLanguage } = useLanguage();
  const isRTL = language === 'ar';

  const [mou, setMou] = useState<MOU | null>(null);
  const [updates, setUpdates] = useState<MOUUpdate[]>([]);
  const [actions, setActions] = useState<MOUAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for lang query parameter - with HashRouter, it's in the hash
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    const params = new URLSearchParams(queryIndex !== -1 ? hash.substring(queryIndex) : '');
    const langParam = params.get('lang');
    if (langParam && (langParam === 'en' || langParam === 'ar') && langParam !== language) {
      setLanguage(langParam as any);
    }
  }, [language, setLanguage]);

  useEffect(() => {
    if (id) {
      Promise.all([
        fetch(`/api/mou/${id}`).then(res => res.json()),
        fetch(`/api/mou/${id}/updates`).then(res => res.json()),
        fetch(`/api/mou/${id}/actions`).then(res => res.json())
      ]).then(([mData, uData, aData]) => {
        setMou(mData);
        setUpdates(uData);
        setActions(aData);
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse">Preparing document...</div>;
  if (!mou) return <div className="h-screen flex items-center justify-center">MOU Not Found</div>;

  const title = isRTL ? mou.title_ar : mou.title_en;
  const entityName = isRTL 
    ? (mou.country_name_ar || mou.organization_name_ar) 
    : (mou.country_name_en || mou.organization_name_en);

  const DefaultFooter = () => (
    <div className="pt-2 flex justify-between items-center bg-white w-full border-t border-gray-100">
      <p className="text-[8px] text-gray-400 font-sans">
        {t('generatedOn')} <span className="font-sans">{new Date().toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US')}</span>
      </p>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest">{t('ministry')}</p>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:pb-0 print:bg-white" dir={dir}>
      <style>
        {`
          .report-root { font-family: "Sakkal Majalla", serif !important; }
          .report-root * { font-family: "Sakkal Majalla", serif !important; }
          
          @media print {
            .page-break {
              break-after: page;
              page-break-after: always;
            }
            .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className={`fixed top-6 z-50 flex gap-3 no-print p-2 rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl border border-white/20 ${isRTL ? 'left-6' : 'right-6'}`}>
         <button 
           onClick={() => {
             window.focus();
             window.print();
           }} 
           className="bg-primary text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-bold active:scale-95"
         >
            <Printer size={18} /> {t('printNow')}
         </button>
         <button onClick={() => window.close()} className="bg-white text-gray-500 hover:text-red-500 p-2.5 rounded-xl transition-all border border-gray-100 hover:bg-red-50">
            <X size={20} />
         </button>
      </div>

      <div id="mou-print-content" className="overflow-visible report-root">
        {/* Page 1: Summary */}
        <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
            <div className="flex items-center gap-3">
              {mou.flag_url ? (
                <img src={mou.flag_url} className="h-6 w-auto shadow-sm" alt="flag" />
              ) : (
                <Globe2 size={24} className="text-gray-300" />
              )}
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">{isRTL ? 'ملف مذكرة تفاهم' : 'MOU PROFILE'}</p>
                <p className="text-sm font-bold text-primary-dark uppercase">
                  {entityName} • {isRTL ? 'تقرير داخلي' : 'Internal Report'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="p-1 px-3 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-100 flex items-center gap-1">
                <ShieldAlert size={12} /> {isRTL ? 'محظور' : 'Restricted'}
              </span>
              <span className="text-[9px] text-gray-400 font-mono">REF: {mou.id}</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">{isRTL ? 'عنوان المذكرة' : 'MOU TITLE'}</p>
            <h1 className="text-3xl font-serif font-bold text-gray-900 leading-tight">{title}</h1>
          </div>

          <SectionHeader icon={FileText} title={t('overview')} compact />
          <div className="grid grid-cols-4 gap-3 mb-8">
            <KPI 
              icon={Calendar} 
              label={t('signedDate')} 
              value={mou.signed_date ? format(new Date(mou.signed_date), 'dd/MM/yyyy') : (isRTL ? 'قيد التوقيع' : 'Pending')} 
            />
            <KPI 
              icon={Clock} 
              label={isRTL ? 'إجمالي الاجتماعات' : 'Total Meetings'} 
              value={updates.length.toString()} 
            />
            <KPI 
              icon={Building2} 
              label={t('status')} 
              value={t(mou.status as any)} 
              chip={t(mou.status as any)}
              tone={mou.status === 'active' ? 'ok' : mou.status === 'expired' || mou.status === 'closed' ? 'restrict' : 'info'}
            />
            <KPI 
              icon={Globe2} 
              label={t('mouType')} 
              value={mou.type} 
            />
          </div>

          {mou.status === 'closed' && (
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100 mb-8 avoid-break">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 border-b border-red-200 pb-2 flex items-center gap-2">
                <ShieldAlert size={14} />
                {isRTL ? 'معلومات الإغلاق / الإنهاء' : 'CLOSURE / TERMINATION DETAILS'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{isRTL ? 'تاريخ الإغلاق' : 'CLOSE DATE'}</p>
                    <p className="text-sm font-bold text-red-600">{mou.close_date ? format(new Date(mou.close_date), 'dd/MM/yyyy') : '---'}</p>
                </div>
              </div>
              <p className="text-[12px] text-gray-700 leading-relaxed italic">
                {mou.closure_notes || (isRTL ? 'لم يتم ذكر ملاحظات إغلاق.' : 'No closure notes provided.')}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">{t('notes')}</h4>
            <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">
              {mou.notes || 'No description provided.'}
            </p>
          </div>

          <SectionHeader icon={Clock} title={t('timeline')} subtitle={isRTL ? 'الاجتماعات والتفاعلات الأخيرة' : 'Recent Interactions'} compact />
          <div className="space-y-4">
            {updates.slice(0, 3).map((update, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-4 mb-4 last:border-0 avoid-break">
                <div className="flex justify-between items-baseline mb-1">
                   <div className="flex items-center gap-4">
                      <div className="w-16 flex-shrink-0">
                        <span className="text-[8px] font-black uppercase text-primary-dark bg-primary/5 px-1 py-0.5 rounded border border-primary/10 block text-center truncate">
                          {update.update_type}
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-gray-900">
                        {isRTL ? update.title_ar : update.title_en}
                      </p>
                   </div>
                   <span className="text-[10px] font-mono font-medium text-gray-400">
                     {update.date ? format(new Date(update.date), 'dd/MM/yyyy') : ''}
                   </span>
                </div>
                <div className={isRTL ? 'pr-20' : 'pl-20'}>
                  <p className="text-[11px] text-gray-600 leading-relaxed italic">
                    {isRTL ? update.description_ar : update.description_en}
                  </p>
                </div>
              </div>
            ))}
            {updates.length === 0 && <p className="text-center py-8 text-gray-300 italic text-sm">No recorded interactions.</p>}
          </div>
        </PageContainer>

        {/* Subsequent Pages for interactions if many */}
        {updates.length > 3 && Array.from({ length: Math.ceil((updates.length - 3) / 3) }).map((_, pIdx) => (
           <PageContainer key={pIdx} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
             <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
                <div className="flex items-center gap-3">
                   <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                     {isRTL ? `سجل التفاعلات (${pIdx + 2})` : `INTERACTION RECORDS (${pIdx + 2})`}
                   </p>
                </div>
                <span className="text-[9px] text-gray-400 font-mono italic">
                  {isRTL ? `الجزء ${pIdx + 2}` : `Part ${pIdx + 2}`}
                </span>
             </div>
             <div className="space-y-6">
                {updates.slice(3 + pIdx * 3, 3 + (pIdx + 1) * 3).map((update, idx) => (
                   <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 avoid-break">
                     <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-4">
                           <div className="w-16 flex-shrink-0">
                             <span className="text-[8px] font-black uppercase text-primary-dark bg-primary/5 px-1 py-0.5 rounded border border-primary/10 block text-center truncate">
                               {update.update_type}
                             </span>
                           </div>
                           <p className="text-[13px] font-bold text-gray-900">
                             {isRTL ? update.title_ar : update.title_en}
                           </p>
                        </div>
                        <span className="text-[10px] font-mono font-medium text-gray-400">
                          {update.date ? format(new Date(update.date), 'dd/MM/yyyy') : ''}
                        </span>
                     </div>
                     <div className={isRTL ? 'pr-20' : 'pl-20'}>
                       <p className="text-[11px] text-gray-600 leading-relaxed italic">
                          {isRTL ? update.description_ar : update.description_en}
                       </p>
                     </div>
                   </div>
                ))}
             </div>
           </PageContainer>
        ))}

        {/* Page for recommendations - First Page */}
        {actions.length > 0 && (
          <PageContainer footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
               <div className="flex items-center gap-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">{isRTL ? 'إجراءات المتابعة / التوصيات' : 'FOLLOW-UP ACTIONS / RECOMMENDATIONS'}</p>
               </div>
               <span className="text-[9px] text-gray-400 font-mono italic">STRATEGIC DIRECTIVES</span>
            </div>

            <div className="space-y-5">
              {actions.slice(0, 3).map((action, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col shadow-sm avoid-break relative">
                  <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'}`}>
                    <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase border ${
                      action.status === 'closed' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {t(action.status === 'closed' ? 'completed' : 'pending')}
                    </span>
                  </div>
                  
                  <div className="pr-24">
                    <p className="text-sm font-bold text-gray-900 mb-2">{action.title}</p>
                    <div className="flex gap-4 mb-4">
                       {action.suggested_date && (
                         <p className="text-[9px] text-gray-500 flex items-center gap-1 font-medium">
                           <Calendar size={10} />
                           {isRTL ? 'تاريخ البدء' : 'Initiated'}: {format(new Date(action.suggested_date), 'dd/MM/yyyy')}
                         </p>
                       )}
                       <p className={`text-[9px] font-bold flex items-center gap-1 ${action.status === 'open' ? 'text-red-600' : 'text-gray-400'}`}>
                         <Clock size={10} />
                         {isRTL ? 'تاريخ الاستحقاق' : 'Deadline'}: {action.due_date ? format(new Date(action.due_date), 'dd/MM/yyyy') : '---'}
                       </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 items-start italic flex-1 mb-3">
                    {action.notes || (isRTL ? 'لا توجد ملاحظات إضافية.' : 'No additional notes recorded.')}
                  </div>

                  {action.points && action.points.filter(p => p.trim() !== '').length > 0 && (
                    <div className="pl-4 space-y-1">
                       {action.points.filter(p => p.trim() !== '').map((point, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 text-[10px] text-gray-700">
                             <div className="w-1 h-1 bg-primary rounded-full" />
                             <span>{point}</span>
                          </div>
                       ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </PageContainer>
        )}

        {/* Subsequent Pages for recommendations if many */}
        {actions.length > 3 && Array.from({ length: Math.ceil((actions.length - 3) / 3) }).map((_, pIdx) => (
           <PageContainer key={`actions-${pIdx}`} footer={<DefaultFooter />} className="shadow-xl print:shadow-none mb-8 print:mb-0">
             <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
                <div className="flex items-center gap-3">
                   <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                     {isRTL ? `إجراءات المتابعة / التوصيات (${pIdx + 2})` : `FOLLOW-UP ACTIONS / RECOMMENDATIONS (${pIdx + 2})`}
                   </p>
                </div>
                <span className="text-[9px] text-gray-400 font-mono italic">
                  {isRTL ? `الجزء ${pIdx + 2}` : `Part ${pIdx + 2}`}
                </span>
             </div>
             <div className="space-y-5">
                {actions.slice(3 + pIdx * 3, 3 + (pIdx + 1) * 3).map((action, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col shadow-sm avoid-break relative">
                    <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'}`}>
                      <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase border ${
                        action.status === 'closed' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {t(action.status === 'closed' ? 'completed' : 'pending')}
                      </span>
                    </div>
                    
                    <div className="pr-24">
                      <p className="text-sm font-bold text-gray-900 mb-2">{action.title}</p>
                      <div className="flex gap-4 mb-4">
                         {action.suggested_date && (
                           <p className="text-[9px] text-gray-500 flex items-center gap-1 font-medium">
                             <Calendar size={10} />
                             {isRTL ? 'تاريخ البدء' : 'Initiated'}: {format(new Date(action.suggested_date), 'dd/MM/yyyy')}
                           </p>
                         )}
                         <p className={`text-[9px] font-bold flex items-center gap-1 ${action.status === 'open' ? 'text-red-600' : 'text-gray-400'}`}>
                           <Clock size={10} />
                           {isRTL ? 'تاريخ الاستحقاق' : 'Deadline'}: {action.due_date ? format(new Date(action.due_date), 'dd/MM/yyyy') : '---'}
                         </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 items-start italic flex-1 mb-3">
                      {action.notes || (isRTL ? 'لا توجد ملاحظات إضافية.' : 'No additional notes recorded.')}
                    </div>

                    {action.points && action.points.filter(p => p.trim() !== '').length > 0 && (
                      <div className="pl-4 space-y-1">
                         {action.points.filter(p => p.trim() !== '').map((point, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 text-[10px] text-gray-700">
                               <div className="w-1 h-1 bg-primary rounded-full" />
                               <span>{point}</span>
                            </div>
                         ))}
                      </div>
                    )}
                  </div>
                ))}
             </div>
           </PageContainer>
        ))}
      </div>
    </div>
  );
}
