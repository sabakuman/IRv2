import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { Card, Button } from '../components/ui/LayoutComponents';
import { FileText, Plus, Activity, Edit3, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedReports = await MockService.getReports();
      setReports(fetchedReports);
      setLoading(false);
    };
    fetchData();
  }, []);

  const myReports = reports.filter(r => r.userId === user?.id);
  const draftCount = reports.filter(r => r.status === 'draft').length;
  const completedCount = reports.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-dark">
            {t('dashboard')}
          </h1>
          <p className="text-muted-foreground mt-1">
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
               <h2 className="text-xl font-bold font-serif text-foreground">{t('recentReports')}</h2>
               <button onClick={() => navigate('/reports')} className="text-sm text-primary hover:underline flex items-center gap-1">
                  {t('viewAll')} <ArrowRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
               </button>
            </div>
            <div className="space-y-4">
               {reports.slice(0, 3).map(report => (
                  <Card key={report.id} className="p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary font-bold">
                           {report.data.country.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-800">{report.title}</h4>
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

         <Card className="bg-primary text-white p-8 flex flex-col justify-center items-start">
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