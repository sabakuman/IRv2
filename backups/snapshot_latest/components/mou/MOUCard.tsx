
import React from 'react';
import { MOU } from '../../types_mou';
import { Card, Badge } from '../ui/LayoutComponents';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, Building2, Globe2, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface MOUCardProps {
  mou: MOU;
  onClick: (id: string) => void;
}

export const MOUCard: React.FC<MOUCardProps> = ({ mou, onClick }) => {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  
  const title = isRTL ? mou.title_ar : mou.title_en;
  const entity = isRTL 
    ? (mou.country_name_ar || mou.organization_name_ar) 
    : (mou.country_name_en || mou.organization_name_en);
  
  const signedDate = mou.signed_date ? new Date(mou.signed_date) : null;
  const expiryDate = mou.expiry_date ? new Date(mou.expiry_date) : null;
  
  const daysToExpiry = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 90;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'closed': return 'red';
      case 'pending':
      case 'under_discussion': return 'yellow';
      case 'expired': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all group border-l-4" 
      style={{ borderLeftColor: isRTL ? undefined : getStatusColor(mou.status) === 'green' ? '#10b981' : getStatusColor(mou.status) === 'yellow' ? '#f59e0b' : '#3b82f6', borderRightColor: isRTL ? (getStatusColor(mou.status) === 'green' ? '#10b981' : getStatusColor(mou.status) === 'yellow' ? '#f59e0b' : '#3b82f6') : undefined, borderRightWidth: isRTL ? '4px' : '0' }}
      onClick={() => onClick(mou.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {mou.flag_url ? (
            <img src={mou.flag_url} alt="flag" className="w-10 h-7 object-cover rounded shadow-sm" />
          ) : (
            <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center">
              <Globe2 size={16} className="text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 size={14} />
              {entity}
            </p>
          </div>
        </div>
        <Badge color={getStatusColor(mou.status) as any}>
          {t(mou.status as any)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('signedDate')}</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
            <Calendar size={14} className="text-primary" />
            {mou.signed_date ? format(signedDate!, 'dd/MM/yyyy') : '---'}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('expiryDate')}</span>
          <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${isExpiringSoon ? 'text-orange-600' : ''}`}>
            <Calendar size={14} className={isExpiringSoon ? 'text-orange-600' : 'text-primary'} />
            {mou.expiry_date ? format(expiryDate!, 'dd/MM/yyyy') : '---'}
          </div>
        </div>
      </div>

      {isExpiringSoon && (
        <div className="mt-4 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center gap-2 text-[11px] text-orange-700 dark:text-orange-400 font-bold border border-orange-100 dark:border-orange-900/30">
          <AlertCircle size={14} />
          {daysToExpiry} {t('daysRemaining')}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[10px] text-gray-400">
        <span className="uppercase tracking-widest">
            {mou.type === 'Labour Protocol' ? t('labour') : 
             mou.type === 'Domestic worker Protocol' ? t('domestic') :
             mou.type === 'Both' ? t('both') :
             mou.type === 'Other' ? (mou.type_other_text || t('other')) : mou.type}
        </span>
        <span>{t('lastUpdate')}: {mou.updated_at ? format(new Date(mou.updated_at), 'dd/MM/yyyy') : '---'}</span>
      </div>
    </Card>
  );
};
