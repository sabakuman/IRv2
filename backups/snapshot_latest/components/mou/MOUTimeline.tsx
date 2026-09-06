
import React from 'react';
import { MOUUpdate } from '../../types_mou';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import { 
  FileCheck, Users, Handshake, MessageSquare, 
  RotateCw, AlertTriangle, Info, Calendar as CalendarIcon, Trash2, Edit3, 
  Clock as ClockIcon 
} from 'lucide-react';

interface MOUTimelineProps {
  updates: MOUUpdate[];
  onEdit?: (update: MOUUpdate) => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

const getUpdateIcon = (type: string) => {
  switch (type) {
    case 'signing': return <FileCheck className="text-green-500" />;
    case 'JCM': return <Users className="text-blue-500" />;
    case 'technical': return <RotateCw className="text-purple-500" />;
    case 'meeting': return <Handshake className="text-indigo-500" />;
    case 'dispute': return <AlertTriangle className="text-red-500" />;
    case 'renewal': return <RotateCw className="text-orange-500" />;
    case 'general':
    default: return <Info className="text-gray-500" />;
  }
};

export const MOUTimeline: React.FC<MOUTimelineProps> = ({ updates, onEdit, onDelete, showDelete }) => {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  if (updates.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed">
        <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
        <p>{t('noAgreements')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {updates.map((update) => (
        <div key={update.id} className="group relative">
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center z-10 shadow-sm">
            {getUpdateIcon(update.update_type)}
          </div>
          
          <div className="h-full bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary px-3 py-1 bg-primary/5 rounded-full">
                {t(update.update_type as any)}
              </span>
              <div className={`flex items-center gap-1 transition-opacity ${showDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(update)}
                    className="text-gray-400 hover:text-primary transition-colors p-1.5 hover:bg-primary/5 rounded-lg"
                    title="Edit Entry"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                {showDelete && onDelete && (
                  <button 
                    onClick={() => onDelete(update.id)}
                    className="text-red-500 hover:text-red-600 transition-colors p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg ml-1"
                    title="Delete Entry"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[10px] font-bold text-gray-400 mb-1">
              {update.date ? format(new Date(update.date), 'dd MMMM yyyy') : '---'}
            </p>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">
              {isRTL ? update.title_ar : update.title_en}
            </h4>
            
            <div className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6">
              {isRTL ? update.description_ar : update.description_en}
            </div>

            <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {update.created_by?.charAt(0) || 'S'}
                 </div>
                 <span className="text-[10px] font-bold text-gray-400">
                   {update.created_by}
                 </span>
               </div>
               <div className="flex items-center gap-1 text-[10px] text-gray-300">
                  <ClockIcon size={10} />
                  {format(new Date(update.created_at), 'HH:mm')}
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
