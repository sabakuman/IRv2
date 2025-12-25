
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MockService } from '../services/mockService';
import { LetterLog, LetterLogNote } from '../types';
import { Button, Card, Input, Badge } from '../components/ui/LayoutComponents';
import { 
  Plus, Search, Filter, Mail, Calendar, User, 
  ChevronRight, X, Trash2, Save, FileText, 
  AlertCircle, CheckCircle, MessageSquare, Paperclip, Loader2,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function LetterLogList() {
  const { user } = useAuth();
  const { t, language, dir } = useLanguage();
  const isRTL = language === 'ar';

  const [letters, setLetters] = useState<LetterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Modal / Drawer state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<LetterLog | null>(null);
  const [letterNotes, setLetterNotes] = useState<LetterLogNote[]>([]);
  const [newNote, setNewNote] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<LetterLog>>({
    status: 'open',
    label: '',
    label_color: '#3B82F6' // default blue
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await MockService.getLetters();
    setLetters(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetails = async (letter: LetterLog) => {
    setCurrentLetter(letter);
    const notes = await MockService.getLetterNotes(letter.id);
    setLetterNotes(notes);
    setIsDetailsOpen(true);
  };

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const letter: LetterLog = {
      id: currentLetter?.id || uuidv4(),
      title: formData.title!,
      internal_ref: formData.internal_ref || '',
      topic: formData.topic || '',
      external_ref: formData.external_ref || '',
      status: formData.status as 'open' | 'closed',
      label: formData.label || '',
      label_color: formData.label_color || '#3B82F6',
      notes: formData.notes || '',
      attachment_url: formData.attachment_url || '',
      created_by: currentLetter?.created_by || user?.fullName || '',
      created_by_id: currentLetter?.created_by_id || user?.id || '',
      created_at: currentLetter?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await MockService.saveLetter(letter);
    setIsEditorOpen(false);
    fetchData();
  };

  const handleDeleteLetter = async (id: string) => {
    if (window.confirm('Are you sure? This letter record will be permanently removed.')) {
      await MockService.deleteLetter(id);
      setIsDetailsOpen(false);
      fetchData();
    }
  };

  const handleAddNote = async () => {
    if (!newNote || !currentLetter) return;
    const note: LetterLogNote = {
      id: uuidv4(),
      letter_id: currentLetter.id,
      note: newNote,
      created_by: user?.fullName || '',
      created_by_id: user?.id || '',
      created_at: new Date().toISOString()
    };
    await MockService.addLetterNote(note);
    setNewNote('');
    const updatedNotes = await MockService.getLetterNotes(currentLetter.id);
    setLetterNotes(updatedNotes);
  };

  const filteredLetters = letters.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         l.internal_ref.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-white flex items-center gap-3">
             <Mail size={32} /> {t('letterLog')}
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-gray-400">
             Track strategic correspondence, incoming/outgoing ministerial letters, and their status.
          </p>
        </div>
        <Button onClick={() => { setCurrentLetter(null); setFormData({ status: 'open', label_color: '#3B82F6' }); setIsEditorOpen(true); }}>
           <Plus size={18} /> {t('addLetter')}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
         <div className="flex-1 w-full flex items-center gap-3 border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 px-4 py-2 rounded-lg">
            <Search size={18} className="text-gray-400" />
            <input 
              className="bg-transparent border-none outline-none w-full text-sm dark:text-white"
              placeholder="Search by title, topic, or ref..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-gray-400" />
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
               {(['all', 'open', 'closed'] as const).map(s => (
                 <button 
                  key={s} 
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase ${statusFilter === s ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}
                 >
                    {t(s as any)}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* List / Grid */}
      <div className="grid grid-cols-1 gap-4">
         {loading ? (
           <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={40} /></div>
         ) : filteredLetters.length === 0 ? (
           <div className="p-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Mail size={48} className="mx-auto mb-4 opacity-20" />
              <p>No letter records match your criteria.</p>
           </div>
         ) : (
           filteredLetters.map(letter => (
             <Card 
               key={letter.id} 
               className="p-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-all border-l-[6px]" 
               style={{ borderLeftColor: letter.label_color }}
               onClick={() => handleOpenDetails(letter)}
             >
                <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                   <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                         <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${letter.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {t(letter.status)}
                         </span>
                         {letter.label && (
                           <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase" style={{ backgroundColor: letter.label_color }}>
                              {letter.label}
                           </span>
                         )}
                         <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">{letter.internal_ref || 'No Ref'}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{letter.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                         <FileText size={14} /> {letter.topic}
                      </p>
                   </div>
                   <div className="flex flex-row md:flex-col items-end gap-2 text-right">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                         <Calendar size={12} /> {format(new Date(letter.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                         <User size={12} /> {letter.created_by}
                      </div>
                      <ChevronRight size={18} className={`text-gray-300 group-hover:text-primary transition-all mt-2 ${isRTL ? 'rotate-180' : ''}`} />
                   </div>
                </div>
             </Card>
           ))
         )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                 <h2 className="text-xl font-bold font-serif flex items-center gap-2 text-primary dark:text-white">
                    {currentLetter ? t('edit') : t('addLetter')}
                 </h2>
                 <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><X /></button>
              </div>
              <form onSubmit={handleSaveLetter} className="p-8 max-h-[80vh] overflow-y-auto space-y-6">
                 <Input label={t('reportTitle')} required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label={t('internalRef')} value={formData.internal_ref} onChange={e => setFormData({...formData, internal_ref: e.target.value})} />
                    <Input label={t('externalRef')} value={formData.external_ref} onChange={e => setFormData({...formData, external_ref: e.target.value})} />
                    <Input label={t('topic')} value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
                    <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-foreground/80">{t('status')}</label>
                       <select 
                        className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-primary transition-all"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                       >
                          <option value="open">{t('open')}</option>
                          <option value="closed">{t('closed')}</option>
                       </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label={t('priority')} value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
                    <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-foreground/80">{t('color')}</label>
                       <div className="flex gap-2">
                          {['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899'].map(c => (
                            <button key={c} type="button" onClick={() => setFormData({...formData, label_color: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.label_color === c ? 'border-gray-900 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">{t('notes')}</label>
                    <textarea 
                      className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 min-h-[100px] outline-none"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                 </div>
                 <Input label={t('attachment') + " (URL)"} value={formData.attachment_url} onChange={e => setFormData({...formData, attachment_url: e.target.value})} placeholder="Paste document link or path" />
                 
                 <div className="pt-6 flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsEditorOpen(false)}>{t('cancel')}</Button>
                    <Button type="submit" className="flex-1"><Save size={18} /> {t('save')}</Button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* --- DETAILS DRAWER --- */}
      {isDetailsOpen && currentLetter && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in" dir={dir}>
           <div className={`w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}>
              {/* Drawer Header */}
              <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                 <div>
                    <h2 className="text-xl font-bold text-primary dark:text-white leading-tight">{currentLetter.title}</h2>
                    <p className="text-xs text-gray-500 mt-1">{currentLetter.internal_ref} • {currentLetter.topic}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                       <button onClick={() => handleDeleteLetter(currentLetter.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title={t('deleteLetter')}><Trash2 size={20} /></button>
                    )}
                    <button onClick={() => { setIsEditorOpen(true); setFormData({...currentLetter}); }} className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit3 size={20} /></button>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 text-gray-400 hover:text-gray-900"><X size={20} /></button>
                 </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 {/* Metadata Grid */}
                 <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('status')}</p><Badge color={currentLetter.status === 'closed' ? 'green' : 'yellow'}>{t(currentLetter.status as any)}</Badge></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('priority')}</p><span className="text-xs font-bold px-2 py-1 rounded text-white" style={{ backgroundColor: currentLetter.label_color }}>{currentLetter.label || 'None'}</span></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('externalRef')}</p><p className="text-sm font-bold dark:text-white">{currentLetter.external_ref || 'N/A'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('lastUpdated')}</p><p className="text-sm dark:text-gray-300">{format(new Date(currentLetter.updated_at), 'yyyy/MM/dd HH:mm')}</p></div>
                 </div>

                 {/* Main Notes */}
                 <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                       <FileText size={16} /> {t('notes')}
                    </h4>
                    <div className="p-5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 shadow-sm italic whitespace-pre-line">
                       {currentLetter.notes || 'No description provided.'}
                    </div>
                 </div>

                 {/* Attachment Link */}
                 {currentLetter.attachment_url && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <Paperclip size={20} className="text-primary" />
                          <div><p className="text-xs font-bold text-primary uppercase">{t('attachment')}</p><p className="text-sm truncate max-w-[200px] text-gray-500">{currentLetter.attachment_url}</p></div>
                       </div>
                       <a href={currentLetter.attachment_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline px-3 py-1 bg-white rounded-lg shadow-sm">OPEN</a>
                    </div>
                 )}

                 {/* Notices / Comments Section */}
                 <div className="space-y-4 pt-6 border-t dark:border-gray-800">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                       <MessageSquare size={16} /> {t('notices')}
                    </h4>
                    <div className="space-y-4">
                       {letterNotes.map(note => (
                          <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 animate-in slide-in-from-bottom-2">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-primary uppercase">{note.created_by}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{format(new Date(note.created_at), 'MMM dd, HH:mm')}</span>
                             </div>
                             <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-snug">{note.note}</p>
                          </div>
                       ))}
                       {letterNotes.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">No follow-up notices recorded yet.</p>}
                    </div>

                    {/* Add Note Input */}
                    <div className="mt-6 space-y-3">
                       <textarea 
                         className="w-full p-4 text-sm rounded-xl border dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                         placeholder="Enter follow-up information or decision..."
                         value={newNote}
                         onChange={e => setNewNote(e.target.value)}
                       />
                       <Button size="sm" onClick={handleAddNote} className="w-full">
                          <Plus size={14} /> {t('addNote')}
                       </Button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
