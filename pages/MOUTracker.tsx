
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { MOU } from '../types_mou';
import { MOUCard } from '../components/mou/MOUCard';
import { Button, Input, Card } from '../components/ui/LayoutComponents';
import { 
  Plus, Search, Filter, Layers, 
  CheckCircle, Clock, AlertTriangle, FileWarning, Calendar,
  Download, Users 
} from 'lucide-react';
import { format } from 'date-fns';

const MOUTracker: React.FC = () => {
  const { language, t, dir } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === 'ar';
  
  const [mous, setMous] = useState<MOU[]>([]);
  const [globalUpdates, setGlobalUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mouRes, updateRes] = await Promise.all([
        fetch('/api/mou'),
        fetch('/api/mou/updates/all')
      ]);
      setMous(await mouRes.json());
      setGlobalUpdates(await updateRes.json());
    } catch (error) {
      console.error('Error fetching MOUs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMous = mous.filter(mou => {
    const title = (isRTL ? mou.title_ar : mou.title_en) || '';
    const country = (isRTL ? mou.country_name_ar : mou.country_name_en) || (isRTL ? mou.organization_name_ar : mou.organization_name_en) || '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mou.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const meetings = globalUpdates.filter(u => u.update_type === 'meeting' || u.update_type === 'JCM');
  const upcomingMeetings = meetings.filter(m => m.date && new Date(m.date) >= new Date());
  
  // Find closest meeting day
  const closestMeeting = upcomingMeetings.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const meetingsOnClosestDay = closestMeeting ? upcomingMeetings.filter(m => m.date === closestMeeting.date).length : 0;

  const stats = {
    total: mous.length,
    active: mous.filter(m => m.status === 'active').length,
    totalMeetings: meetings.length,
    upcomingMeetings: upcomingMeetings.length,
    closestDay: closestMeeting ? format(new Date(closestMeeting.date), 'MMM dd') : '---',
    closestDayCount: meetingsOnClosestDay,
    expiring: mous.filter(m => {
      if (!m.expiry_date) return false;
      const days = (new Date(m.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return days > 0 && days <= 90;
    }).length,
  };

  const handleExport = () => {
    const headers = ['Title EN', 'Title AR', 'Type', 'Status', 'Signed Date', 'Expiry Date', 'Partner'];
    const rows = filteredMous.map(m => [
      m.title_en,
      m.title_ar,
      m.type,
      m.status,
      m.signed_date,
      m.expiry_date,
      m.country_name_en || m.organization_name_en
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MOUs_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Layers className="text-primary" size={32} />
            {t('mouTracker')}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{t('mouTrackerSubtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download size={20} />
            {t('export')}
          </Button>
          <Button onClick={() => navigate('/mou/new')} className="shadow-lg shadow-primary/20">
            <Plus size={20} />
            {t('addMOU')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 bg-white dark:bg-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('allMOUs')}</p>
            <h3 className="text-2xl font-black">{stats.total}</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'إجمالي الاجتماعات' : 'Total Meetings'}</p>
            <h3 className="text-2xl font-black">{stats.totalMeetings}</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'الاجتماعات القادمة' : 'Upcoming Meetings'}</p>
            <h3 className="text-2xl font-black">{stats.upcomingMeetings}</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'الموعد القادم' : 'Next'}: {stats.closestDay}</p>
            <h3 className="text-2xl font-black">{stats.closestDayCount} <span className="text-sm font-normal text-gray-400">{isRTL ? 'اجتماع' : 'meeting(s)'}</span></h3>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder={t('searchOnline') + '...'}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('all')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="expired">{t('expired')}</option>
              <option value="under_discussion">{t('under_discussion')}</option>
              <option value="closed">{isRTL ? 'مغلق' : 'Closed'}</option>
            </select>
            <Button variant="outline">
              <Filter size={18} />
              {t('settings')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMous.map(mou => (
            <MOUCard key={mou.id} mou={mou} onClick={(id) => navigate(`/mou/${id}`)} />
          ))}
          {filteredMous.length === 0 && (
            <div className="col-span-full py-32 text-center text-gray-400">
               <FileWarning size={64} className="mx-auto mb-4 opacity-10" />
               <p className="font-serif text-xl italic">No MOUs match your criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MOUTracker;
