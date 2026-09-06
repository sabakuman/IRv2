
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, Button, Input } from '../components/ui/LayoutComponents';
import { 
  Moon, Sun, User, ShieldCheck, CheckCircle, 
  XCircle, Eye, EyeOff, Play, Loader2, Sparkles, Save 
} from 'lucide-react';
import { MockService } from '../services/mockService';
import { GoogleGenAI } from "@google/genai";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  // Test State
  const [testStatus, setTestStatus] = useState<'none' | 'loading' | 'success' | 'error'>('none');
  const [testType, setTestType] = useState<'system' | 'personal'>('system');
  const [testError, setTestError] = useState('');

  // Personal Key State
  const [personalKey, setPersonalKey] = useState(user?.apiKey || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'none' | 'success' | 'error'>('none');
  const [showPersonalKey, setShowPersonalKey] = useState(false);

  const handleTestKey = async (type: 'system' | 'personal') => {
    setTestStatus('loading');
    setTestType(type);
    setTestError('');

    try {
      const activeKey = type === 'personal' ? personalKey.trim() : '';

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-apikey': activeKey
        },
        body: JSON.stringify({
          prompt: 'Respond with the word "OK" only.',
          model: 'gemini-2.5-flash'
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Connection verification failed.');
      }

      const response = await res.json();
      if (response.text) {
        setTestStatus('success');
      } else {
        throw new Error("No response received from API.");
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestError(err.message || "Invalid API Key or connection error.");
    }
  };

  const handleSavePersonalKey = async () => {
    if (!user) return;
    setIsSavingKey(true);
    setSaveStatus('none');
    try {
      const updatedUser = await MockService.updateApiKey(user.id, personalKey.trim());
      if (updatedUser) {
        updateUser(updatedUser);
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    } finally {
      setIsSavingKey(false);
    }
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-primary-foreground">
          {t('settings')}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <User size={20} className="text-primary dark:text-accent" /> Profile Information
            </h2>
            <div className="flex items-start gap-6">
               <img 
                src={user?.avatarUrl} 
                className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-700 shadow-md" 
                alt="Profile" 
               />
               <div className="space-y-1">
                 <h3 className="text-lg font-bold dark:text-white">{user?.fullName}</h3>
                 <p className="text-muted-foreground">{user?.email}</p>
                 <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary dark:text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                   {user?.role}
                 </span>
               </div>
            </div>
          </Card>

          {/* AI Connection & API Key Configuration */}
          <Card className="dark:bg-secondary dark:border-gray-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 dark:text-white">
                <Sparkles size={20} className="text-primary dark:text-accent" /> AI &amp; Gemini API Configuration
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure and test your connection to the Google Gemini AI system.
              </p>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-6">
              {/* System Key Section */}
              <div className="space-y-2">
                <h3 className="text-md font-semibold text-gray-950 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Secure System Key (Default)
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl">
                  By default, all reports generate using our secure, pre-configured server-side API Key. No user configuration is required.
                </p>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestKey('system')}
                    disabled={testStatus === 'loading'}
                    className="gap-2"
                  >
                    {testStatus === 'loading' && testType === 'system' ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                    Test System Key Connection
                  </Button>
                </div>
              </div>

              {/* Personal API Key Section */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                <h3 className="text-md font-semibold text-gray-950 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> Personal Gemini API Key
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Want to use your own Gemini billing? Provide your personal API Key. The application will securely prioritize your key over the system default.
                </p>

                <div className="flex gap-2 max-w-xl pt-2 items-end">
                  <div className="relative flex-1">
                    <Input 
                      type={showPersonalKey ? "text" : "password"}
                      value={personalKey}
                      onChange={(e) => setPersonalKey(e.target.value)}
                      placeholder="AIzaSy..."
                      label="Your Gemini API Key"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPersonalKey(!showPersonalKey)}
                      className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showPersonalKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <Button 
                    onClick={handleSavePersonalKey}
                    disabled={isSavingKey}
                    className="flex items-center gap-2 h-[38px] mb-0.5"
                  >
                    {isSavingKey ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Key
                  </Button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestKey('personal')}
                    disabled={testStatus === 'loading' || !personalKey}
                    className="gap-2"
                  >
                    {testStatus === 'loading' && testType === 'personal' ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                    Test Personal Key
                  </Button>
                </div>

                {saveStatus === 'success' && (
                  <p className="text-xs text-green-600 font-medium">Personal API Key saved and synced successfully to your profile!</p>
                )}
                {saveStatus === 'error' && (
                  <p className="text-xs text-red-600 font-medium">Failed to save personal key to profile.</p>
                )}
              </div>

              {/* Status and Error Alerts */}
              <div className="space-y-2">
                {testStatus === 'success' && (
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/50">
                    <CheckCircle size={16} /> Connection Successful! The {testType === 'personal' ? 'personal' : 'system'} API key is verified and fully functional.
                  </div>
                )}

                {testStatus === 'error' && (
                  <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50">
                    <XCircle size={16} /> {testError}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Appearance Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <Sun size={20} className="text-primary dark:text-accent" /> Appearance
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Application Theme</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize how the application looks.
                </p>
              </div>
              
              <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                 <button 
                   onClick={() => theme === 'dark' && toggleTheme()}
                   className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                 >
                   <Sun size={16} /> Light
                 </button>
                 <button 
                   onClick={() => theme === 'light' && toggleTheme()}
                   className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-gray-600 shadow text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}
                 >
                   <Moon size={16} /> Dark
                 </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> AI System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">System Integration</span>
                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                   <ShieldCheck size={12} /> SYSTEM
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                The application is using the secure pre-configured system API key exclusively.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
