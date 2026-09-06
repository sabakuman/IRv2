
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MOU, MOUStatus } from '../types_mou';
import { Button, Input, Card } from '../components/ui/LayoutComponents';
import { ArrowLeft, Save, Globe, Building2, Calendar, FileText, ChevronRight, ChevronLeft } from 'lucide-react';

const MOUWizard: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t, dir } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [partnershipType, setPartnershipType] = useState<'country' | 'organization'>('country');
  const [formData, setFormData] = useState<Partial<MOU>>({
    title_ar: '',
    title_en: '',
    country_name_ar: '',
    country_name_en: '',
    organization_name_ar: '',
    organization_name_en: '',
    type: 'Labour Protocol',
    type_other_text: '',
    status: 'pending',
    signed_date: '',
    expiry_date: '',
    close_date: '',
    notes: '',
    closure_notes: '',
    flag_url: ''
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchMOU();
    }
  }, [id]);

  const fetchMOU = async () => {
    try {
      const response = await fetch(`/api/mou/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
        if (data.organization_name_en || data.organization_name_ar) {
          setPartnershipType('organization');
        } else {
          setPartnershipType('country');
        }
      }
    } catch (error) {
      console.error('Error fetching MOU:', error);
    }
  };

  const handleInputChange = (field: keyof MOU, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchFlag = async (countryName: string) => {
    if (!countryName || formData.flag_url) return;
    try {
      const res = await fetch(`/api/proxy-flag?country=${encodeURIComponent(countryName)}&fullText=true`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].flags) {
          handleInputChange('flag_url', data[0].flags.png || data[0].flags.svg);
        }
      }
    } catch (err) {
      console.error('Error fetching flag:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const isNew = !id || id === 'new';
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/mou' : `/api/mou/${id}`;
      
      // Ensure only one is filled based on partnershipType
      const cleanedData = { ...formData };
      if (partnershipType === 'country') {
        cleanedData.organization_name_ar = '';
        cleanedData.organization_name_en = '';
      } else {
        cleanedData.country_name_ar = '';
        cleanedData.country_name_en = '';
        cleanedData.flag_url = '';
      }

      const payload = {
        ...cleanedData,
        created_by: user?.fullName || 'System'
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        navigate(`/mou/${isNew ? result.id : id}`);
      }
    } catch (error) {
      console.error('Error saving MOU:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/mous')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>
        <div className="flex gap-2">
            {[1, 2, 3].map(i => (
                <div 
                    key={i} 
                    className={`h-2 w-12 rounded-full transition-all ${step >= i ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                />
            ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-black text-gray-900 dark:text-white">
            {id && id !== 'new' ? t('edit') : t('addMOU')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('mouTrackerSubtitle')}</p>
        </div>
      </div>

      <Card className="p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold border-b pb-4 flex items-center gap-2">
              <Globe className="text-primary" size={20} />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400">Partnership With</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPartnershipType('country')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${partnershipType === 'country' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                  >
                    <Globe size={20} />
                    Country
                  </button>
                  <button 
                    onClick={() => setPartnershipType('organization')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${partnershipType === 'organization' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                  >
                    <Building2 size={20} />
                    Organization
                  </button>
                </div>
              </div>

              <Input
                label="Title (English)"
                value={formData.title_en}
                onChange={(e) => handleInputChange('title_en', e.target.value)}
                placeholder="Name of the MOU"
                className="py-6 px-5 border-gray-100 focus:bg-white text-lg font-bold"
              />
              <Input
                label="العنوان (بالعربية)"
                value={formData.title_ar}
                onChange={(e) => handleInputChange('title_ar', e.target.value)}
                placeholder="عنوان مذكرة التفاهم"
                className="text-right py-6 px-5 border-gray-100 focus:bg-white text-lg font-bold"
                dir="rtl"
              />

              {partnershipType === 'country' ? (
                <>
                  <Input
                    label="Country (English)"
                    value={formData.country_name_en}
                    onChange={(e) => handleInputChange('country_name_en', e.target.value)}
                    onBlur={(e) => fetchFlag(e.target.value)}
                    className="py-6 px-5 border-gray-100 font-bold"
                  />
                  <Input
                    label="الدولة (بالعربية)"
                    value={formData.country_name_ar}
                    onChange={(e) => handleInputChange('country_name_ar', e.target.value)}
                    className="text-right py-6 px-5 border-gray-100 font-bold"
                    dir="rtl"
                  />
                  <Input
                    label="Flag URL (Optional)"
                    value={formData.flag_url}
                    onChange={(e) => handleInputChange('flag_url', e.target.value)}
                    placeholder="https://..."
                    className="py-6 px-5 border-gray-100"
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Organization (English)"
                    value={formData.organization_name_en}
                    onChange={(e) => handleInputChange('organization_name_en', e.target.value)}
                  />
                  <Input
                    label="الجهة المستهدفة (بالعربية)"
                    value={formData.organization_name_ar}
                    onChange={(e) => handleInputChange('organization_name_ar', e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Status</label>
                <select 
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="pending text-gray-400 select-placeholder" disabled>Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="under_discussion">Under Discussion</option>
                  <option value="closed">Closed / Terminated</option>
                </select>
              </div>

              {formData.status === 'closed' && (
                <>
                  <Input
                    label="Close Date"
                    type="date"
                    value={formData.close_date || ''}
                    onChange={(e) => handleInputChange('close_date', e.target.value)}
                  />
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Closure Notes</label>
                    <textarea
                      className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800 min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.closure_notes || ''}
                      onChange={(e) => handleInputChange('closure_notes', e.target.value)}
                      placeholder="Reason for closure or termination details..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold border-b pb-4 flex items-center gap-2">
              <Building2 className="text-primary" size={20} />
              MOU Classification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">MOU Type</label>
                <select 
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="Labour Protocol">{isRTL ? 'اتفاقية في العمل' : 'Labour Protocol / Worker Protocol'}</option>
                  <option value="Domestic worker Protocol">{isRTL ? 'اتفاقية في العمالة المساعدة' : 'Domestic Worker Protocol'}</option>
                  <option value="Both">{isRTL ? 'كلاهما (اتفاقية في العمل والعمالة المساعدة)' : 'Both (Labour & Domestic)'}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>
              
              {formData.type === 'Other' && (
                <Input
                  label="Specify Other Type"
                  value={formData.type_other_text || ''}
                  onChange={(e) => handleInputChange('type_other_text', e.target.value)}
                  placeholder="Enter custom MOU type..."
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold border-b pb-4 flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              Dates & Additional Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Signed Date"
                type="date"
                value={formData.signed_date}
                onChange={(e) => handleInputChange('signed_date', e.target.value)}
              />
              <Input
                label="Expiry Date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              />
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Notes / Scope</label>
                <textarea
                  className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800 min-h-[150px] outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter details about the MOU scope, background, or special terms..."
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-12 pt-8 border-t">
          <Button 
            variant="outline" 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={step === 1 ? 'invisible' : ''}
          >
            <ChevronLeft size={18} />
            Previous
          </Button>
          
          <div className="flex gap-4">
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next
                <ChevronRight size={18} />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={loading}>
                <Save size={18} />
                {loading ? 'Saving...' : 'Save MOU'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MOUWizard;
