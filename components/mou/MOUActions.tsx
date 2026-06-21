
import React from 'react';
import { MOUAction } from '../../types_mou';
import { useLanguage } from '../../context/LanguageContext';
import { format, isPast } from 'date-fns';
import { CheckCircle2, Circle, Clock, MessageCircle, Trash2, Edit3 } from 'lucide-react';
import { Badge } from '../ui/LayoutComponents';

interface MOUActionsProps {
  actions: MOUAction[];
  onEdit?: (action: MOUAction) => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export const MOUActions: React.FC<MOUActionsProps> = ({ actions, onEdit, onDelete, showDelete }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {actions.map((action) => {
        const isOverdue = action.status === 'open' && isPast(new Date(action.due_date));
        
        return (
          <div 
            key={action.id} 
            className={`group relative h-full p-6 bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-300 ${
              action.status === 'closed' 
                ? 'border-gray-100 opacity-60 grayscale' 
                : isOverdue ? 'border-red-200 shadow-lg shadow-red-500/5 hover:-translate-y-1' : 'border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 size={16} />
              </div>
              
              <div className={`flex items-center gap-2 transition-opacity ${showDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <Badge color={action.status === 'closed' ? 'green' : 'red'}>
                  {t(action.status as any)}
                </Badge>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(action)}
                    className="text-gray-400 hover:text-primary transition-colors p-1.5 hover:bg-primary/5 rounded-lg"
                    title="Edit Plan"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                {showDelete && onDelete && (
                  <button 
                    onClick={() => onDelete(action.id)}
                    className="text-red-500 hover:text-red-600 transition-colors p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg ml-1"
                    title="Delete Plan"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <h5 className={`text-xl font-bold mb-4 leading-tight transition-all ${action.status === 'closed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {action.title}
            </h5>
            
            <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 text-sm italic mb-4 min-h-[60px] ${action.status === 'closed' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {action.notes || 'No description provided.'}
            </div>

            {/* Action Points List */}
            {action.points && action.points.filter(p => p.trim() !== '').length > 0 && (
              <div className="space-y-2 mb-6">
                 {action.points.filter(p => p.trim() !== '').map((point, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-3 text-xs font-medium text-gray-600">
                       <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                       <span>{point}</span>
                    </div>
                 ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
               <div className="flex flex-col gap-1">
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                     <Clock size={12} />
                     <span className="opacity-60">{t('expiryDate')}:</span> {format(new Date(action.due_date), 'dd MMM yyyy')}
                  </div>
                  {action.suggested_date && (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                      <MessageCircle size={10} />
                      <span className="opacity-60">{isRTL ? 'تاريخ البدء:' : 'Initiated:'}</span> {format(new Date(action.suggested_date), 'dd MMM yyyy')}
                    </div>
                  )}
                  {action.status === 'closed' && action.close_date && (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-500">
                      <CheckCircle2 size={10} />
                      <span className="opacity-60">{isRTL ? 'تاريخ الإغلاق:' : 'Closed At:'}</span> {format(new Date(action.close_date), 'dd MMM yyyy')}
                    </div>
                  )}
               </div>
               {isOverdue && (
                 <span className="text-[10px] font-bold text-red-500 animate-pulse">OVERDUE</span>
               )}
            </div>
          </div>
        );
      })}

      {actions.length === 0 && (
        <div className="col-span-full py-20 text-center text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed">
          <CheckCircle2 size={64} className="mx-auto mb-4 opacity-10" />
          <p className="font-bold uppercase tracking-[0.3em] text-[10px]">Strategic Horizon Clear</p>
          <p className="text-xs mt-2 opacity-50">No pending recommendations</p>
        </div>
      )}
    </div>
  );
};
