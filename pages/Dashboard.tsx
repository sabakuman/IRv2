
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { Report, Bulletin } from '../types';
import { Card, Button } from '../components/ui/LayoutComponents';
import { FileText, Plus, Activity, Edit3, ArrowRight, Bell, Save, X, User } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = (path: string) => {
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [isEditingBulletin, setIsEditingBulletin] = useState(false);
  const [bulletinContent, setBulletinContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedReports, fetchedBulletin] = await Promise.all([
        MockService.getReports(),
        MockService.getBulletin()
      ]);
      setReports(fetchedReports);
      setBulletin(fetchedBulletin);
      if (fetchedBulletin) setBulletinContent(fetchedBulletin.content);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveBulletin = async () => {
    if (!user) return;
    const success = await MockService.updateBulletin(bulletinContent, user.fullName);
    if (success) {
      setBulletin({
        id: 1,
        content: bulletinContent,
        authorName: user.fullName,
        timestamp: new Date().toISOString()
      });
      setIsEditingBulletin(false);
    }
  };

  const draftCount = reports.filter(r => r.status === 'draft').length;
  const completedCount = reports.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Bulletin Message Area - Minimal & Clean */}
      <Card className="border-l-4 border-l-accent bg-accent/5 p-4 shadow-sm relative rounded-xl">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
              <Bell size={12} /> System Announcement
           </h3>
           {user?.role === 'admin' && !isEditingBulletin && (
             <button 
              onClick={() => setIsEditingBulletin(true)}
              className="p-1 hover:bg-accent/10 rounded text-accent transition-colors"
             >
               <Edit3 size={12} />
             </button>
           )}
        </div>

        {isEditingBulletin ? (
          <div className="space-y-3">
            <textarea 
              className="w-full p-3 rounded-lg border border-accent/20 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-accent/20 min-h-[80px] text-sm"
              value={bulletinContent}
              onChange={(e) => setBulletinContent(e.target.value)}
              placeholder="Type welcome message..."
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingBulletin(false)}>
                <X size={14} /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveBulletin} className="bg-accent hover:bg-accent-light">
                <Save size={14} /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-base font-medium text-primary-dark dark:text-gray-200 italic leading-relaxed">
              "{bulletin?.content || 'Welcome to the UAE Labour Market Intelligence portal.'}"
            </p>
            <div className="mt-2 flex items-center gap-4 text-[9px] uppercase font-bold tracking-widest text-gray-400">
               <span className="flex items-center gap-1"><User size={9} /> {bulletin?.authorName}</span>
               <span className="w-1 h-1 bg-gray-300 rounded-full" />
               <span>{bulletin?.timestamp ? format(new Date(bulletin.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-dark">
            {t('dashboard')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('welcome')}, {user?.fullName}
          </p>
        </div>
        <Button onClick={() => navigate('/wizard')} size="default">
          <Plus size={18} />
          {t('launchWizard')}
        </Button>
      </div>

      {/* Stats Cards - Original 3-col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t('reports')}</p>
              <p className="text-2xl font-bold mt-1">{reports.length}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <FileText size={20} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t('draft')}</p>
              <p className="text-2xl font-bold mt-1">{draftCount}</p>
            </div>
            <div className="p-2.5 bg-accent/10 rounded-lg text-accent">
              <Edit3 size={20} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t('completed')}</p>
              <p className="text-2xl font-bold mt-1">{completedCount}</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <Activity size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity - Original Side-by-Side (or stacked on mobile) */}
      <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold font-serif text-foreground">{t('recentReports')}</h2>
             <button onClick={() => navigate('/reports')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                {t('viewAll')} <ArrowRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {reports.slice(0, 3).map(report => (
                <Card key={report.id} className="p-3 flex items-center justify-between group hover:border-primary/30 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded flex items-center justify-center text-primary font-bold text-xs">
                         {report.data.country.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{report.title}</h4>
                         <p className="text-[10px] text-gray-400">Updated {format(new Date(report.updatedAt), 'MMM dd')}</p>
                      </div>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => navigate(`/wizard/${report.id}`)}>
                      <Edit3 size={14} />
                   </Button>
                </Card>
             ))}
          </div>
      </div>
    </div>
  );
}
