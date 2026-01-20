import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { Report, LetterLog } from '../types';
import { Card, Button } from '../components/ui/LayoutComponents';
import { FileText, Plus, Activity, Edit3, ArrowRight, Save, X, Calendar, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = (path: string) => {
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [letters, setLetters] = useState<LetterLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Announcement state
  const [announcement, setAnnouncement] = useState<any>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editMsgEn, setEditMsgEn] = useState('');
  const [editMsgAr, setEditMsgAr] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedReports, fetchedAnnouncement, fetchedLetters] = await Promise.all([
        MockService.getReports(),
        MockService.getAnnouncement(),
        MockService.getLetters()
      ]);
      setReports(fetchedReports);
      setLetters(fetchedLetters);
      setAnnouncement(fetchedAnnouncement);
      if (fetchedAnnouncement) {
        setEditMsgEn(fetchedAnnouncement.message_en || '');
        setEditMsgAr(fetchedAnnouncement.message_ar || '');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveAnnouncement = async () => {
    const updatedData = {
      message_en: editMsgEn,
      message_ar: editMsgAr,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.fullName || 'Admin'
    };
    await MockService.updateAnnouncement(updatedData);
    setAnnouncement({ ...announcement, ...updatedData });
    setIsEditingAnnouncement(false);
  };

  const completedCount = reports.filter(r => r.status === 'completed').length;
  const totalLetters = letters.length;
  const closedLetters = letters.filter(l => l.status === 'closed').length;
  const openLetters = totalLetters - closedLetters;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-gray-400">
            {t('welcome')}, {user?.fullName}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/letters')}>
            <Mail size={18} /> {t('letterLog')}
          </Button>
          <Button onClick={() => navigate('/wizard')}>
            <Plus size={20} />
            {t('launchWizard')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('reports')}</p>
              <p className="text-3xl font-bold mt-2 dark:text-white">{reports.length}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <FileText size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-400 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/letters')}>
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-muted-foreground">{t('letterLog')}</p>
               <p className="text-3xl font-bold mt-2 dark:text-white">{totalLetters}</p>
               <div className="mt-2 space-y-1">
                 <p className="text-[10px] text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {t('closedLetters')}: <span className="font-bold text-gray-700 dark:text-gray-200">{closedLetters}</span>
                 </p>
                 <p className="text-[10px] text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    {t('openLettersCount')}: <span className="font-bold text-gray-700 dark:text-gray-200">{openLetters}</span>
                 </p>
               </div>
             </div>
             <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
               <Mail size={24} />
             </div>
           </div>
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                 {t('viewLetterLog')} <ArrowRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
              </span>
           </div>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('completed')}</p>
              <p className="text-3xl font-bold mt-2 dark:text-white">{completedCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <Activity size={24} />
            </div>
          </div>
        </Card>
      </div>

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
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-primary font-bold">
                           {report.data.country ? report.data.country.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-800 dark:text-gray-100">{report.title}</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Updated {new Date(report.updatedAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <Button variant="ghost" onClick={() => navigate(`/wizard/${report.id}`)}>
                        <Edit3 size={16} />
                     </Button>
                  </Card>
               ))}
               {reports.length === 0 && !loading && (
                 <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl">
                    No recent reports found.
                 </div>
               )}
            </div>
         </div>

         <Card className="flex flex-col border-primary/20 bg-gray-50 dark:bg-secondary/40">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-serif font-bold text-primary dark:text-primary-light flex items-center gap-2">
                  <Activity size={20} /> {t('welcomeMessage')}
               </h2>
               {user?.role === 'admin' && !isEditingAnnouncement && (
                 <Button variant="outline" size="sm" onClick={() => setIsEditingAnnouncement(true)}>
                    <Edit3 size={14} /> {t('edit')}
                 </Button>
               )}
            </div>

            {isEditingAnnouncement ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-400">English Content</label>
                   <textarea 
                     className="w-full p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-h-[80px] focus:ring-2 focus:ring-primary/20 outline-none"
                     value={editMsgEn}
                     onChange={(e) => setEditMsgEn(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-400 text-right block">المحتوى العربي</label>
                   <textarea 
                     dir="rtl"
                     className="w-full p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-h-[80px] focus:ring-2 focus:ring-primary/20 outline-none"
                     value={editMsgAr}
                     onChange={(e) => setEditMsgAr(e.target.value)}
                   />
                </div>
                <div className="flex gap-2">
                   <Button size="sm" onClick={handleSaveAnnouncement} className="flex-1">
                      <Save size={16} /> {t('save')}
                   </Button>
                   <Button size="sm" variant="outline" onClick={() => setIsEditingAnnouncement(false)} className="flex-1">
                      <X size={16} /> {t('cancel')}
                   </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                 <div className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed text-sm italic mb-4">
                    {language === 'ar' ? announcement?.message_ar : announcement?.message_en}
                 </div>
                 {announcement?.updatedAt && (
                   <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1">
                         <Calendar size={12} /> {t('lastUpdated')}: {format(new Date(announcement.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                      <span>By: {announcement.updatedBy}</span>
                   </div>
                 )}
              </div>
            )}
         </Card>
      </div>
    </div>
  );
}