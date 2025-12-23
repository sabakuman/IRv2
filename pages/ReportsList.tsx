
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { Card, Button, Badge } from '../components/ui/LayoutComponents';
import { Search, Plus, Edit3, Trash2, Printer, FileText, Lock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  // Fixed: Replaced missing useNavigate hook with manual hash navigation
  const navigate = (path: string) => {
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const data = await MockService.getReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await MockService.deleteReport(id);
        // Force refresh from service to ensure sync
        await fetchReports();
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete report.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handlePrint = (id: string) => {
    // Robust URL construction for any hosting environment (Root, Subfolder, Docker, etc.)
    // We utilize the current location to preserve protocol, domain, port, and sub-paths.
    const href = window.location.href;
    const hashIndex = href.indexOf('#');
    
    // Extract base URL (everything before the hash)
    let baseUrl = hashIndex !== -1 ? href.substring(0, hashIndex) : href;
    
    // Ensure we don't end up with double slashes if the base ends with one
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Construct the print view URL
    const printUrl = `${baseUrl}/#/print/${id}`;
    
    window.open(printUrl, '_blank');
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.data.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-white">
            {t('reports')}
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-gray-400">
            {t('reportsDescription')}
          </p>
        </div>
        <Button onClick={() => navigate('/wizard')}>
          <Plus size={20} />
          {t('createNew')}
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Search className="text-gray-400" size={20} />
        <input 
          placeholder="Search reports by title or country..." 
          className="flex-1 outline-none text-sm bg-transparent dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={fetchReports} className="text-gray-400 hover:text-primary transition-colors" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card overflow-hidden border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
             Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p>No reports found.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-secondary/50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">{t('country')}</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">{t('colReportTitle')}</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">{t('colCreatedBy')}</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">{t('colLastModified')}</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">{t('colStatus')}</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredReports.map((report) => {
                // Permission Logic
                const isOwner = user?.id === report.userId;
                const isAdmin = user?.role === 'admin';
                const canEdit = isAdmin || isOwner;
                const isDeleting = deletingId === report.id;
                
                // Flag logic
                const flagSrc = report.data.flagUrl || `https://flagcdn.com/w40/${report.data.country === 'Philippines' ? 'ph' : report.data.country === 'India' ? 'in' : 'ae'}.png`;

                return (
                  <tr key={report.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="p-4 font-medium text-primary dark:text-primary-light flex items-center gap-3">
                       <img 
                        src={flagSrc} 
                        className="w-6 h-auto shadow-sm rounded-sm object-cover"
                        alt="flag"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                       />
                       {report.data.country}
                    </td>
                    <td className="p-4 text-sm font-medium dark:text-gray-200">{report.title}</td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      {report.userId === 'u-1' ? 'Ahmed Al-Mansouri' : 'Sarah Khan'}
                      {isOwner && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded">You</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(report.updatedAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <Badge color={report.status === 'completed' ? 'green' : 'yellow'}>
                        {t(report.status)}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         {canEdit ? (
                           <>
                            <button 
                              onClick={() => navigate(`/wizard/${report.id}`)}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                              title="Edit Report"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(report.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                              title="Delete Report"
                            >
                              {isDeleting ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />}
                            </button>
                           </>
                         ) : (
                           <span className="text-gray-300 dark:text-gray-600 p-2 cursor-not-allowed" title="View Only">
                             <Lock size={16} />
                           </span>
                         )}
                        
                        {(canEdit || isAdmin) && (
                          <button 
                            onClick={() => handlePrint(report.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                            title="Export PDF"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
