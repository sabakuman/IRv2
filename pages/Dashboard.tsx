
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { Report, Bulletin } from '../types';
import { Card, Button } from '../components/ui/LayoutComponents';
import { FileText, Plus, Activity, Edit3, ArrowRight, Bell, Save, X, User, Calendar } from 'lucide-react';
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
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {/* Bulletin Message Banner - Pretty Ministerial Style */}
      <div className="relative">
         <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary-light rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
         <Card className="relative border-none bg-white dark:bg-gray-800 p-8 shadow-xl overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none rtl:left-0 rtl:right-auto">
              <Bell size={120} className="text-primary rotate-12" />
            </div>
            
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                    <Bell size={24} />
                  </div>
                  <h3 className="text-base font-bold uppercase tracking-[0.25em] text-accent">
                    System Bulletin
                  </h3>
               </div>
               {user?.role === 'admin' && !isEditingBulletin && (
                 <button 
                  onClick={() => setIsEditingBulletin(true)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-accent hover:text-white rounded-xl text-gray-400 transition-all flex items-center gap-2 text-xs font-bold"
                 >
                   <Edit3 size={14} /> Edit Announcement
                 </button>
               )}
            </div>

            {isEditingBulletin ? (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <textarea 
                  className="w-full p-6 rounded-2xl border-2 border-accent/20 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-4 focus:ring-accent/10 min-h-[150px] text-lg font-serif italic"
                  value={bulletinContent}
                  onChange={(e) => setBulletinContent(e.target.value)}
                  placeholder="Draft the new ministerial announcement..."
                />
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setIsEditingBulletin(false)}>
                    <X size={16} /> Cancel
                  </Button>
                  <Button onClick={handleSaveBulletin} className="bg-accent hover:bg-accent-light px-8">
                    <Save size={16} /> Publish Announcement
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-3xl font-serif italic text-primary-dark dark:text-gray-100 leading-snug max-w-4xl">
                  "{bulletin?.content || 'Welcome to the UAE Labour Market Intelligence portal.'}"
                </p>
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={14} />
                     </div>
                     <span>{bulletin?.authorName || 'System Admin'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                     <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <Calendar size={14} />
                     </div>
                     <span className="font-sans">{bulletin?.timestamp ? format(new Date(bulletin.timestamp), 'MMMM dd, yyyy • HH:mm') : 'N/A'}</span>
                   </div>
                </div>
              </div>
            )}
         </Card>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary-dark dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-lg text-muted-foreground mt-1 dark:text-gray-400">
            Welcome back, <span className="text-primary font-bold">{user?.fullName}</span>
          </p>
        </div>
        <Button onClick={() => navigate('/wizard')} size="lg" className="shadow-xl">
          <Plus size={24} />
          {t('launchWizard')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-l-8 border-l-primary hover:shadow-2xl transition-all cursor-pointer p-8" onClick={() => navigate('/reports')}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-base font-bold uppercase tracking-widest text-muted-foreground">{t('reports')}</p>
              <p className="text-5xl font-bold mt-4 text-primary">{reports.length}</p>
            </div>
            <div className="p-5 bg-primary/10 rounded-2xl text-primary">
              <FileText size={40} />
            </div>
          </div>
        </Card>
        <Card className="border-l-8 border-l-accent p-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-base font-bold uppercase tracking-widest text-muted-foreground">{t('draft')}</p>
              <p className="text-5xl font-bold mt-4 text-accent">{draftCount}</p>
            </div>
            <div className="p-5 bg-accent/10 rounded-2xl text-accent">
              <Edit3 size={40} />
            </div>
          </div>
        </Card>
        <Card className="border-l-8 border-l-green-600 p-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-base font-bold uppercase tracking-widest text-muted-foreground">{t('completed')}</p>
              <p className="text-5xl font-bold mt-4 text-green-600">{completedCount}</p>
            </div>
            <div className="p-5 bg-green-50 rounded-2xl text-green-600">
              <Activity size={40} />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold font-serif text-foreground dark:text-white">{t('recentReports')}</h2>
               <button onClick={() => navigate('/reports')} className="text-sm font-bold text-primary hover:underline flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full transition-all">
                  {t('viewAll')} <ArrowRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
               </button>
            </div>
            <div className="space-y-4">
               {reports.slice(0, 3).map(report => (
                  <Card key={report.id} className="p-6 flex items-center justify-between group hover:border-primary/50 transition-all hover:translate-x-1 rtl:hover:-translate-x-1 shadow-md">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                           {report.data.country.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">{report.title}</h4>
                           <p className="text-sm text-gray-500 font-sans">Last updated: {format(new Date(report.updatedAt), 'MMM dd, yyyy')}</p>
                        </div>
                     </div>
                     <Button variant="ghost" className="rounded-full w-12 h-12 p-0" onClick={() => navigate(`/wizard/${report.id}`)}>
                        <Edit3 size={20} />
                     </Button>
                  </Card>
               ))}
            </div>
         </div>

         <Card className="bg-primary-dark text-white p-10 flex flex-col justify-center items-start shadow-2xl relative overflow-hidden rounded-3xl">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            <h2 className="text-3xl font-serif font-bold mb-6">{t('startNewAnalysis')}</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-md leading-relaxed">
               {t('startAnalysisDesc')}
            </p>
            <Button size="lg" className="bg-accent text-white border-none hover:bg-accent-light px-10 py-6 text-xl rounded-2xl shadow-xl" onClick={() => navigate('/wizard')}>
               <Plus size={24} /> {t('launchWizard')}
            </Button>
         </Card>
      </div>
    </div>
  );
}
