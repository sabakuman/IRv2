
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Bulletin Message Banner */}
      <div className="relative group">
         <Card className="border-l-4 border-l-accent bg-accent/5 p-5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Bell size={64} className="text-accent rotate-12" />
            </div>
            
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                  <Bell size={16} /> Welcome Bulletin
               </h3>
               {user?.role === 'admin' && !isEditingBulletin && (
                 <button 
                  onClick={() => setIsEditingBulletin(true)}
                  className="p-1.5 hover:bg-accent/10 rounded-lg text-accent transition-colors"
                 >
                   <Edit3 size={16} />
                 </button>
               )}
            </div>

            {isEditingBulletin ? (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <textarea 
                  className="w-full p-4 rounded-xl border border-accent/20 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-accent/20 min-h-[100px] text-sm"
                  value={bulletinContent}
                  onChange={(e) => setBulletinContent(e.target.value)}
                  placeholder="Type your welcome message here..."
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingBulletin(false)}>
                    <X size={14} /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveBulletin} className="bg-accent hover:bg-accent-light">
                    <Save size={14} /> Save Message
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-serif italic text-primary-dark dark:text-gray-200 leading-relaxed mb-4">
                  "{bulletin?.content || 'Welcome to the system.'}"
                </p>
                <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                   <span className="flex items-center gap-1"><User size={10} /> {bulletin?.authorName}</span>
                   <span className="w-1 h-1 bg-gray-300 rounded-full" />
                   <span>{bulletin?.timestamp ? format(new Date(bulletin.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                </div>
              </div>
            )}
         </Card>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-gray-400">
            {t('welcome')}, {user?.fullName}
          </p>
        </div>
        <Button onClick={() => navigate('/wizard')}>
          <Plus size={20} />
          {t('launchWizard')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('reports')}</p>
              <p className="text-3xl font-bold mt-2">{reports.length}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <FileText size={24} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('draft')}</p>
              <p className="text-3xl font-bold mt-2">{draftCount}</p>
            </div>
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <Edit3 size={24} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('completed')}</p>
              <p className="text-3xl font-bold mt-2">{completedCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <Activity size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold font-serif text-foreground dark:text-white">{t('recentReports')}</h2>
               <button onClick={() => navigate('/reports')} className="text-sm text-primary hover:underline flex items-center gap-1">
                  {t('viewAll')} <ArrowRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
               </button>
            </div>
            <div className="space-y-4">
               {reports.slice(0, 3).map(report => (
                  <Card key={report.id} className="p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-primary dark:text-primary-light font-bold">
                           {report.data.country.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-800 dark:text-gray-200">{report.title}</h4>
                           <p className="text-xs text-gray-500">Updated {new Date(report.updatedAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <Button variant="ghost" onClick={() => navigate(`/wizard/${report.id}`)}>
                        <Edit3 size={16} />
                     </Button>
                  </Card>
               ))}
            </div>
         </div>

         <Card className="bg-primary text-white p-8 flex flex-col justify-center items-start shadow-xl">
            <h2 className="text-2xl font-serif font-bold mb-4">{t('startNewAnalysis')}</h2>
            <p className="text-blue-100 mb-6 max-w-md">
               {t('startAnalysisDesc')}
            </p>
            <Button className="bg-accent text-white border-none hover:bg-accent-light" onClick={() => navigate('/wizard')}>
               <Plus size={18} /> {t('launchWizard')}
            </Button>
         </Card>
      </div>
    </div>
  );
}
