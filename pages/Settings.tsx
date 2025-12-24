import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, Input } from '../components/ui/LayoutComponents';
import { 
  Moon, Sun, User, Lock, ShieldCheck, CheckCircle, 
  XCircle, Eye, EyeOff, Play, Loader2, Sparkles, Save 
} from 'lucide-react';
import { MockService } from '../services/mockService';
import { GoogleGenAI } from "@google/genai";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // API Key State
  const [apiKey, setApiKey] = useState(user?.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Test State
  const [testStatus, setTestStatus] = useState<'none' | 'loading' | 'success' | 'error'>('none');
  const [testError, setTestError] = useState('');

  const handleSaveKey = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser = await MockService.updateApiKey(user.id, apiKey);
      if (updatedUser) {
        updateUser(updatedUser);
        alert("API Key updated successfully.");
      }
    } catch (err) {
      alert("Failed to save API Key.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey) {
      setTestStatus('error');
      setTestError('Please enter an API key first.');
      return;
    }

    setTestStatus('loading');
    setTestError('');

    try {
      // Use a new instance to ensure we test the exact string in the input
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Respond with the word "OK" only.',
      });

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
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-primary-foreground">
          Settings
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

          {/* AI Configuration Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <Sparkles size={20} className="text-primary dark:text-accent" /> AI API Key
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure your personal Google Gemini API key to enable intelligence features.
            </p>
            
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  label="Gemini API Key"
                  type={showKey ? "text" : "password"}
                  placeholder="Enter your API Key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  onClick={handleSaveKey} 
                  disabled={isSaving}
                  className="min-w-[120px]"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Key
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestKey}
                  disabled={testStatus === 'loading'}
                  className="min-w-[120px]"
                >
                  {testStatus === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                  Test Key
                </Button>
              </div>

              {testStatus === 'success' && (
                <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle size={16} /> Connection Successful! Your API key is valid.
                </div>
              )}

              {testStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 animate-in fade-in slide-in-from-top-1">
                  <XCircle size={16} /> {testError}
                </div>
              )}
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
                <span className="text-sm text-gray-600 dark:text-gray-400">User Configuration</span>
                {user?.apiKey ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle size={12} /> PERSONAL KEY
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <ShieldCheck size={12} /> SYSTEM DEFAULT
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                The application uses a secure system default key unless you provide your own personal Google Gemini API key above.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
