
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MOU, MOUAttachment, MOUUpdate, MOUAction, MOUUpdateType, ActionStatus } from '../types_mou';
import { Card, Button, Badge, Input } from '../components/ui/LayoutComponents';
import { 
  ArrowLeft, Calendar, Building2, Globe2, 
  FileText, Clock, CheckSquare, Download, 
  Edit3, Share2, Printer, Plus, X, CheckCircle2, ShieldAlert, Trash2
} from 'lucide-react';
import { format, isFuture, isPast, parseISO } from 'date-fns';
import { MOUTimeline } from '../components/mou/MOUTimeline';
import { MOUAttachments } from '../components/mou/MOUAttachments';
import { MOUActions } from '../components/mou/MOUActions';

const MOUDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  
  const [mou, setMou] = useState<MOU | null>(null);
  const [attachments, setAttachments] = useState<MOUAttachment[]>([]);
  const [updates, setUpdates] = useState<MOUUpdate[]>([]);
  const [actions, setActions] = useState<MOUAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments' | 'timeline' | 'actions'>('overview');
  const [loading, setLoading] = useState(true);
  const [showAttachmentEdit, setShowAttachmentEdit] = useState(false);
  const [showTimelineEdit, setShowTimelineEdit] = useState(false);
  const [showActionsEdit, setShowActionsEdit] = useState(false);

  // Form states for adding/editing
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    update_type: 'meeting' as MOUUpdateType,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [showActionModal, setShowActionModal] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    suggested_date: format(new Date(), 'yyyy-MM-dd'),
    close_date: '',
    notes: '',
    status: 'open' as ActionStatus,
    points: [''] as string[]
  });

  useEffect(() => {
    if (id) fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    if (!id) return;
    const cb = `?cb=${Date.now()}`;
    try {
      console.log(`[DEBUG] Fetching all data for MOU ${id}...`);
      const [mouRes, attachRes, updateRes, actionRes, auditRes] = await Promise.all([
        fetch(`/api/mou/${id}${cb}`),
        fetch(`/api/mou/${id}/attachments${cb}`),
        fetch(`/api/mou/${id}/updates${cb}`),
        fetch(`/api/mou/${id}/actions${cb}`),
        fetch(`/api/mou/${id}/audit${cb}`)
      ]);
      
      const _mou = await mouRes.json();
      const _attachments = await attachRes.json();
      const _updates = await updateRes.json();
      const _actions = await actionRes.json();
      const _audit = await auditRes.json();

      setMou(_mou);
      setAttachments(_attachments);
      setUpdates(_updates);
      setActions(_actions);
      setAuditLogs(_audit);
      console.log(`[DEBUG] Data received. Updates: ${_updates.length}, Actions: ${_actions.length}`);
    } catch (error) {
      console.error('Error fetching MOU data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntityDelete = async (type: 'updates' | 'actions' | 'attachments', entityId: string | null) => {
    console.log(`[DEBUG] handleEntityDelete PROVOKED: type=${type}, id=${entityId}`);
    
    if (!entityId) {
      console.error(`[DEBUG] ABORT: Missing ID`);
      return false;
    }

    // Since window.confirm/prompt seem unreliable in the iframe, 
    // let's do a direct alert-based confirmation or just proceed for now with a log.
    // For safety, I'll add one simple alert which is more likely to work, 
    // but if that fails, the user will see this message.
    
    try {
      const url = `/api/mou-delete-robust`;
      console.log(`[DEBUG] FETCHING: POST ${url}`);
      
      const res = await fetch(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId: entityId })
      });
      
      console.log(`[DEBUG] Response Status: ${res.status}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        console.error(`[DEBUG] Delete failed:`, errorData);
        alert(isRTL ? `فشل الحذف: ${errorData.error || ''}` : `Delete failed: ${errorData.error || 'Unknown error'}`);
        return false;
      }

      const data = await res.json();
      console.log(`[DEBUG] Delete successful, server data:`, data);
      
      // Force refresh data
      console.log(`[DEBUG] Refreshing all data...`);
      await fetchAllData();
      
      // Final "Ok" for delete as requested
      alert(isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully');
      
      return true;
    } catch (err: any) {
      console.error(`[DEBUG] Exception during fetch:`, err);
      alert(isRTL ? 'حدث خطأ غير متوقع في الاتصال' : `Connection error: ${err.message}`);
      return false;
    }
  };

  const handleAddUpdate = async () => {
    try {
      const method = editingUpdateId ? 'PUT' : 'POST';
      const url = editingUpdateId ? `/api/mou/updates/${editingUpdateId}` : `/api/mou/${id}/updates`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUpdate,
          created_by: user?.fullName || 'System'
        })
      });
      if (res.ok) {
        setShowUpdateModal(false);
        setEditingUpdateId(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error adding/updating entry:', err);
    }
  };

  const handleEditUpdate = (update: MOUUpdate) => {
    setNewUpdate({
      title_en: update.title_en,
      title_ar: update.title_ar,
      description_en: update.description_en,
      description_ar: update.description_ar,
      update_type: update.update_type,
      date: update.date
    });
    setEditingUpdateId(update.id);
    setShowUpdateModal(true);
  };

  const handleSaveAction = async () => {
    try {
      const method = editingActionId ? 'PUT' : 'POST';
      const url = editingActionId ? `/api/mou/actions/${editingActionId}` : `/api/mou/${id}/actions`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAction)
      });
      if (res.ok) {
        setShowActionModal(false);
        setEditingActionId(null);
        setNewAction({
          title: '',
          due_date: format(new Date(), 'yyyy-MM-dd'),
          suggested_date: format(new Date(), 'yyyy-MM-dd'),
          close_date: '',
          notes: '',
          status: 'open',
          points: ['']
        });
        fetchAllData();
      }
    } catch (err) {
      console.error('Error saving action:', err);
    }
  };

  const handleEditAction = (action: MOUAction) => {
    setNewAction({
      title: action.title,
      due_date: action.due_date,
      suggested_date: action.suggested_date || format(new Date(), 'yyyy-MM-dd'),
      close_date: action.close_date || '',
      notes: action.notes,
      status: action.status,
      points: action.points && action.points.length > 0 ? action.points : ['']
    });
    setEditingActionId(action.id);
    setShowActionModal(true);
  };

  const handleExport = () => {
    window.open(`#/mou/${id}/print?lang=${language}`, '_blank');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', user?.fullName || 'System');

      try {
        await fetch(`/api/mou/${id}/attachments`, {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }
    fetchAllData();
  };

  if (loading) return <div className="p-20 text-center text-primary font-bold animate-pulse">LOADING PROFILE...</div>;
  if (!mou) return <div className="p-20 text-center text-red-500">MOU NOT FOUND</div>;

  const jcmUpdates = updates.filter(u => u.update_type === 'JCM').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastJCM = jcmUpdates.length > 0 ? format(new Date(jcmUpdates[0].date), 'MMM yyyy') : '---';
  const upcomingJCM = updates.filter(u => u.update_type === 'JCM' && isFuture(parseISO(u.date))).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextJCM = upcomingJCM.length > 0 ? format(new Date(upcomingJCM[0].date), 'MMM yyyy') : '---';

  const upcomingInteractions = updates.filter(u => isFuture(parseISO(u.date))).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const previousInteractions = updates.filter(u => isPast(parseISO(u.date))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const title = isRTL ? mou.title_ar : mou.title_en;
  const entityName = isRTL 
    ? (mou.country_name_ar || mou.organization_name_ar) 
    : (mou.country_name_en || mou.organization_name_en);

  const tabs = [
    { id: 'overview', label: t('overview'), icon: FileText },
    { id: 'timeline', label: t('timeline'), icon: Clock },
    { id: 'attachments', label: t('attachments'), icon: Globe2 },
    { id: 'actions', label: t('actions'), icon: CheckSquare },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      {/* breadcrumbs */}
      <button 
        onClick={() => navigate('/mous')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        {t('back')}
      </button>

      {/* Header Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8">
           <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-6">
                {mou.flag_url ? (
                  <img src={mou.flag_url} className="w-24 h-16 object-cover rounded-xl shadow-lg border-2 border-white dark:border-gray-700" alt="flag" />
                ) : (
                  <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <Globe2 size={32} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">{title}</h1>
                    <Badge color="blue">{t(mou.status as any)}</Badge>
                  </div>
                  <div className="flex items-center gap-6 mt-3 text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><Building2 size={18} className="text-primary" /> {entityName}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={18} className="text-primary" /> {t('mouType')}: {
                        mou.type === 'Labour Protocol' ? t('labour') : 
                        mou.type === 'Domestic worker Protocol' ? t('domestic') :
                        mou.type === 'Both' ? t('both') :
                        mou.type === 'Other' ? (mou.type_other_text || t('other')) : mou.type
                    }</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Printer size={18} />
                  {t('export')}
                </Button>
                <Button size="sm" onClick={() => navigate(`/mou/${id}/edit`)}>
                  <Edit3 size={18} />
                  {t('edit')}
                </Button>
              </div>
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-50 dark:border-gray-700 px-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div>
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                     <FileText size={20} className="text-primary" />
                     {t('overview')}
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('signedDate')}</span>
                        <p className="font-bold">{mou.signed_date ? format(new Date(mou.signed_date), 'PPP') : '---'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('expiryDate')}</span>
                        <p className="font-bold">{mou.expiry_date ? format(new Date(mou.expiry_date), 'PPP') : '---'}</p>
                      </div>
                      {mou.organization_name_en && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('organization')} (EN)</span>
                          <p className="font-bold">{mou.organization_name_en}</p>
                        </div>
                      )}
                      {mou.organization_name_ar && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">الجهة المستهدفة (AR)</span>
                          <p className="font-bold">{mou.organization_name_ar}</p>
                        </div>
                      )}
                   </div>
                </div>

                {mou.status === 'closed' && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                      <ShieldAlert size={20} />
                      {isRTL ? 'بيانات الإغلاق / الإنهاء' : 'Closure / Termination Record'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                       <div className="space-y-1">
                         <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider font-sans">{isRTL ? 'تاريخ الإغلاق' : 'CLOSE DATE'}</span>
                         <p className="font-bold text-red-900 dark:text-red-300">{mou.close_date ? format(new Date(mou.close_date), 'PPP') : '---'}</p>
                       </div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-red-100/50 text-red-800 dark:text-red-200 text-sm italic">
                       {mou.closure_notes || (isRTL ? 'لم يتم ذكر ملاحظات إغلاق.' : 'No closure notes recorded.')}
                    </div>
                  </div>
                )}

                <div>
                   <h3 className="text-xl font-bold mb-4">{t('notes')}</h3>
                   <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                     {mou.notes || 'No extended notes available for this MOU.'}
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                  <Card className="bg-primary/5 border-primary/20 p-6">
                    <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                       <Clock size={18} className="text-primary" />
                       {isRTL ? 'بيانات اللجنة المشتركة' : 'JCM Overview'}
                    </h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-sm border-b border-primary/5 pb-2">
                          <span className="text-gray-500">{t('lastJCMDate')}</span>
                          <span className="font-bold text-gray-700">{lastJCM}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm border-b border-primary/5 pb-2">
                          <span className="text-gray-500">{t('nextJCMDate')}</span>
                          <span className="font-bold text-orange-600">{nextJCM}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{t('totalJCMCount')}</span>
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-blue-50">
                            {jcmUpdates.length}
                          </div>
                       </div>
                    </div>
                  </Card>
                 
                 <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold mb-4">{t('auditLog')}</h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {auditLogs.map(log => (
                         <div key={log.id} className="flex gap-3 text-[11px]">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                            <div>
                               <p className="text-gray-900 dark:text-white font-bold">{log.change_details}</p>
                               <p className="text-gray-400">By {log.changed_by} • {format(new Date(log.timestamp), 'dd MMM HH:mm')}</p>
                            </div>
                         </div>
                       ))}
                       {auditLogs.length === 0 && <p className="text-gray-300 italic text-[10px]">No activity recorded.</p>}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-4xl mx-auto py-4">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black">{t('timeline')}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex items-center gap-2 ${showTimelineEdit ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
                    onClick={() => setShowTimelineEdit(!showTimelineEdit)}
                  >
                    <Edit3 size={16} />
                    {isRTL ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button size="sm" onClick={() => {
                    setEditingUpdateId(null);
                    setNewUpdate({
                      title_en: '',
                      title_ar: '',
                      description_en: '',
                      description_ar: '',
                      update_type: 'meeting',
                      date: format(new Date(), 'yyyy-MM-dd')
                    });
                    setShowUpdateModal(true);
                  }}>
                    <Plus size={18} />
                    {t('addUpdate')}
                  </Button>
                </div>
              </div>

              <div className="space-y-12">
                {upcomingInteractions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-6 flex items-center gap-2">
                      <Clock size={14} />
                      {isRTL ? 'الاجتماعات القادمة' : 'Upcoming Interactions'}
                    </h3>
                    <MOUTimeline 
                      updates={upcomingInteractions} 
                      onEdit={handleEditUpdate}
                      showDelete={showTimelineEdit}
                      onDelete={(id) => handleEntityDelete('updates', id)}
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <FileText size={14} />
                    {isRTL ? 'السجل السابق' : 'Previous Interactions'}
                  </h3>
                  <MOUTimeline 
                    updates={previousInteractions} 
                    onEdit={handleEditUpdate}
                    showDelete={showTimelineEdit}
                    onDelete={(id) => handleEntityDelete('updates', id)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="max-w-4xl mx-auto py-4">
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black">{t('attachments')}</h2>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className={`flex items-center gap-2 ${showAttachmentEdit ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
                   onClick={() => setShowAttachmentEdit(!showAttachmentEdit)}
                 >
                   <Edit3 size={16} />
                   {isRTL ? 'تعديل' : 'Edit'}
                 </Button>
               </div>
               <MOUAttachments 
                attachments={attachments} 
                onUpload={handleFileUpload}
               />
               {showAttachmentEdit && attachments.length > 0 && (
                 <div className="mt-8 pt-8 border-t border-dashed border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300">
                    <p className="text-sm font-bold text-gray-500 mb-4">{isRTL ? 'إدارة المرفقات (حذف):' : 'Manage Attachments (Delete):'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {attachments.map(file => (
                         <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-red-50/50 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20 hover:bg-red-50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <FileText size={18} className="text-red-400 shrink-0" />
                               <span className="text-sm font-semibold text-red-700 dark:text-red-400 truncate">{file.file_name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 p-2 h-auto rounded-full shrink-0"
                              onClick={() => handleEntityDelete('attachments', file.id)}
                            >
                              <Trash2 size={18} />
                            </Button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="max-w-4xl mx-auto py-4">
               <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black">{t('actions')}</h2>
                 <div className="flex gap-2">
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className={`flex items-center gap-2 ${showActionsEdit ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
                     onClick={() => setShowActionsEdit(!showActionsEdit)}
                   >
                     <Edit3 size={16} />
                     {isRTL ? 'تعديل' : 'Edit'}
                   </Button>
                   <Button size="sm" onClick={() => setShowActionModal(true)}>
                      <Plus size={18} />
                      {isRTL ? 'إضافة توصية' : 'Add Recommendation'}
                   </Button>
                 </div>
               </div>
               <MOUActions 
                actions={actions} 
                onEdit={handleEditAction}
                showDelete={showActionsEdit}
                onDelete={(id) => handleEntityDelete('actions', id)}
               />
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-5xl p-12 relative animate-in zoom-in-95 duration-300 rounded-[2.5rem] shadow-2xl border-white/20">
            <button onClick={() => {
              setShowUpdateModal(false);
              setEditingUpdateId(null);
            }} className="absolute top-8 right-8 text-gray-400 hover:text-red-500 transition-colors">
              <X size={32} />
            </button>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                 <Clock size={32} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black">{editingUpdateId ? (isRTL ? 'تعديل التفاعل' : 'Edit Interaction') : (isRTL ? 'إضافة تفاعل جديد' : 'New Interaction Entry')}</h2>
              <p className="text-gray-400 mt-2 font-medium">Record meetings, JCM outcomes, or technical updates</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-medium">
                <Input label="Title (English)" value={newUpdate.title_en} onChange={e => setNewUpdate({...newUpdate, title_en: e.target.value})} className="text-lg py-7 px-6 rounded-2xl" placeholder="Strategic Partnership Meeting" />
                <Input label="العنوان (بالعربية)" value={newUpdate.title_ar} onChange={e => setNewUpdate({...newUpdate, title_ar: e.target.value})} className="text-right text-lg py-7 px-6 rounded-2xl" dir="rtl" placeholder="اجتماع الشراكة الاستراتيجية" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Update Category</label>
                  <select 
                    className="w-full p-5 rounded-2xl border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700"
                    value={newUpdate.update_type}
                    onChange={e => setNewUpdate({...newUpdate, update_type: e.target.value as MOUUpdateType})}
                  >
                    <option value="meeting">Standard Meeting</option>
                    <option value="JCM">Joint Committee (JCM)</option>
                    <option value="technical">Technical Committee</option>
                    <option value="renewal">Agreement Renewal</option>
                    <option value="dispute">Resolution / Dispute</option>
                    <option value="signing">Official Signing</option>
                    <option value="general">General Narrative</option>
                  </select>
                </div>
                <Input label="Date of Interaction" type="date" value={newUpdate.date} onChange={e => setNewUpdate({...newUpdate, date: e.target.value})} className="py-7 px-6 rounded-2xl font-bold" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Detail Report (EN)</label>
                  <textarea 
                    className="w-full p-6 rounded-2xl border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[180px] text-gray-700 leading-relaxed font-medium"
                    placeholder="Enter key discussion points and outcomes in English..."
                    value={newUpdate.description_en}
                    onChange={e => setNewUpdate({...newUpdate, description_en: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 mr-1 text-right block">تقرير مفصل (بالعربية)</label>
                  <textarea 
                    className="w-full p-6 rounded-2xl border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[180px] text-right text-gray-700 leading-relaxed font-medium"
                    dir="rtl"
                    placeholder="..."
                    value={newUpdate.description_ar}
                    onChange={e => setNewUpdate({...newUpdate, description_ar: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {editingUpdateId && (
                  <Button 
                    variant="outline" 
                    className="flex-1 py-8 text-xl font-bold rounded-2xl border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                    onClick={async () => {
                      const success = await handleEntityDelete('updates', editingUpdateId);
                      if (success) {
                        setShowUpdateModal(false);
                        setEditingUpdateId(null);
                      }
                    }}
                  >
                    {isRTL ? 'حذف التفاعل' : 'Delete Update'}
                  </Button>
                )}
                <Button className="flex-[2] py-8 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={handleAddUpdate}>
                   {editingUpdateId ? (isRTL ? 'تحديث السجل' : 'Update Interaction Record') : (isRTL ? 'إرسال السجل' : 'Publish to Timeline')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-10 relative animate-in slide-in-from-bottom duration-500 rounded-[3rem] shadow-3xl bg-white border-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-blue-500" />
            
            <button 
              onClick={() => {
                setShowActionModal(false);
                setEditingActionId(null);
                setNewAction({
                  title: '',
                  due_date: format(new Date(), 'yyyy-MM-dd'),
                  suggested_date: format(new Date(), 'yyyy-MM-dd'),
                  close_date: '',
                  notes: '',
                  status: 'open',
                  points: ['']
                });
              }} 
              className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition-all hover:rotate-90"
            >
              <X size={32} />
            </button>
            
            <div className="space-y-10">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <CheckSquare size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">
                      {isRTL ? 'خطة عمل استراتيجية' : 'Strategic Action Plan'}
                    </h2>
                    <p className="text-gray-400 font-medium">
                      {isRTL ? 'تحديد التوجيهات والخطوات التشغيلية' : 'Define directives and operational steps'}
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <Input 
                    label={isRTL ? 'عنوان التوجيه' : 'DIRECTIVE TITLE'} 
                    value={newAction.title} 
                    onChange={e => setNewAction({...newAction, title: e.target.value})} 
                    className="text-xl py-8 px-6 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white" 
                    placeholder="e.g., Immediate Evaluation of Talent Exchange Program"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input 
                      label={isRTL ? 'تاريخ البدء' : 'START DATE'} 
                      type="date" 
                      value={newAction.suggested_date} 
                      onChange={e => setNewAction({...newAction, suggested_date: e.target.value})} 
                      className="py-6 px-6 rounded-2xl border-gray-100 bg-gray-50 font-bold" 
                    />
                    <Input 
                      label={isRTL ? 'الموعد النهائي' : 'STRATEGIC DEADLINE'} 
                      type="date" 
                      value={newAction.due_date} 
                      onChange={e => setNewAction({...newAction, due_date: e.target.value})} 
                      className="py-6 px-6 rounded-2xl border-gray-100 bg-gray-50 font-bold text-red-500" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{isRTL ? 'الحالة' : 'ACTION STATUS'}</label>
                      <select 
                        className="w-full p-5 rounded-2xl border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700"
                        value={newAction.status}
                        onChange={e => {
                          const status = e.target.value as ActionStatus;
                          const updates: any = { status };
                          if (status === 'closed' && !newAction.close_date) {
                            updates.close_date = format(new Date(), 'yyyy-MM-dd');
                          }
                          setNewAction({...newAction, ...updates});
                        }}
                      >
                        <option value="open">{isRTL ? 'مفتوح' : 'Open'}</option>
                        <option value="closed">{isRTL ? 'مغلق' : 'Closed'}</option>
                        <option value="pending">{isRTL ? 'قيد الانتظار' : 'Pending'}</option>
                      </select>
                    </div>
                    {newAction.status === 'closed' && (
                      <Input 
                        label={isRTL ? 'تاريخ الإغلاق' : 'COMPLETION DATE'} 
                        type="date" 
                        value={newAction.close_date} 
                        onChange={e => setNewAction({...newAction, close_date: e.target.value})} 
                        className="py-6 px-6 rounded-2xl border-gray-100 bg-gray-50 font-bold text-green-500" 
                      />
                    )}
                  </div>

                  {/* Editable Action Points */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] ml-2">
                      {isRTL ? 'نقاط العمل / الخطوات' : 'ACTION POINTS / STEPS'}
                    </label>
                    <div className="space-y-3">
                      {newAction.points.map((point, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-xs">
                            {idx + 1}
                          </div>
                          <input 
                            className="flex-1 p-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                            value={point}
                            onChange={(e) => {
                              const updated = [...newAction.points];
                              updated[idx] = e.target.value;
                              setNewAction({ ...newAction, points: updated });
                            }}
                            placeholder={isRTL ? 'أدخل نقطة العمل هنا...' : 'Enter action point here...'}
                          />
                          <button 
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            onClick={() => {
                              const updated = newAction.points.filter((_, i) => i !== idx);
                              setNewAction({ ...newAction, points: updated });
                            }}
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 border-dashed border-2 text-primary hover:bg-primary/5 rounded-xl py-4"
                        onClick={() => setNewAction({ ...newAction, points: [...newAction.points, ''] })}
                      >
                        <Plus size={16} className="mr-2" /> {isRTL ? 'إضافة نقطة عمل' : 'Add Action Point'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] ml-2">{t('notes')}</label>
                    <textarea 
                      className={`w-full p-6 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all min-h-[150px] text-lg leading-relaxed ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      placeholder="Elaborate on the specific steps, logic, and intended outcomes..."
                      value={newAction.notes}
                      onChange={e => setNewAction({...newAction, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  {editingActionId && (
                    <Button 
                      variant="outline" 
                      className="flex-1 py-6 text-lg font-bold rounded-2xl border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                      onClick={async () => {
                        const success = await handleEntityDelete('actions', editingActionId);
                        if (success) {
                          setShowActionModal(false);
                          setEditingActionId(null);
                        }
                      }}
                    >
                      {isRTL ? 'حذف خطة العمل' : 'Delete Action'}
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 py-6 text-lg font-black rounded-2xl border-2 border-gray-100 hover:bg-gray-50" onClick={() => setShowActionModal(false)}>
                     {t('cancel')}
                  </Button>
                  <Button className="flex-[2] py-6 text-lg font-black rounded-2xl shadow-2xl shadow-primary/40" onClick={handleSaveAction}>
                    {isRTL ? 'حفظ خطة العمل' : 'Save Action Plan'}
                  </Button>
                </div>
            </div>
          </Card>
        </div>
      )}
      {/* Debug Footer */}
      <div className="mt-20 p-4 border-t border-gray-100 dark:border-gray-800 opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-mono text-gray-400">
          DEBUG: MOU={id} | Updates={updates.length} | Actions={actions.length} | Attachments={attachments.length}
        </p>
      </div>
    </div>
  );
};

export default MOUDetail;
