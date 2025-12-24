
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, Input } from '../components/ui/LayoutComponents';
import { Moon, Sun, User, Bell, Lock, ShieldCheck, CheckCircle, XCircle, Key, RefreshCw, Loader2 } from 'lucide-react';
import { MockService } from '../services/mockService';
import { GoogleGenAI } from "@google/genai";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [apiKey, setApiKey] = useState(user?.apiKey || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const handleSaveApiKey = async () => {
    if (!user) return;
    setIsSavingKey(true);
    try {
      const updated = await MockService.updateApiKey(user.id, apiKey);
      if (updated) {
        updateUser(updated);
        alert("API Key saved successfully to your profile.");
      }
    } catch (e) {
      alert("Failed to save API Key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      alert("Please enter an API Key first.");
      return;
    }
    setTestStatus('testing');
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Test connection. Respond with 'OK'.",
      });
      if (response.text?.includes('OK')) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
      }
    } catch (e) {
      console.error(e);
      setTestStatus('failed');
    }
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-primary-foreground">
          Settings & Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your ministerial profile and AI connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Connectivity Section - Requested Field */}
          <Card className="border-l-4 border-l-accent bg-accent/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent">
              <Key size={20} /> AI Integration (Google Gemini)
            </h2>
            <div className="space-y-4">
               <p className="text-sm text-gray-600 mb-4">
                 Input your personal Google Gemini API key here. This key is used for real-time market data fetching and news summarization.
               </p>
               <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Input 
                      label="Your Gemini API Key" 
                      type="password" 
                      placeholder="Paste your key here..." 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveApiKey} disabled={isSavingKey} className="h-10">
                    {isSavingKey ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />} 
                    Save Key
                  </Button>
               </div>
               
               <div className="pt-4 border-t border-accent/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Connection Status:</span>
                    {testStatus === 'success' && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle size={14} /> ACTIVE</span>}
                    {testStatus === 'failed' && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle size={14} /> FAILED</span>}
                    {testStatus === 'idle' && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">NOT TESTED</span>}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                    {testStatus === 'testing' ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} 
                    Test Connection
                  </Button>
               </div>
            </div>
          </Card>

          {/* Profile Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <User size={20} className="text-primary" /> Ministerial Profile
            </h2>
            <div className="flex items-center gap-6">
               <img src={user?.avatarUrl} className="w-24 h-24 rounded-full border-4 border-primary/10 shadow-lg" alt="Profile" />
               <div className="space-y-1">
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.fullName}</h3>
                 <p className="text-muted-foreground">{user?.email}</p>
                 <div className="flex gap-2 mt-2">
                   <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest">{user?.role}</span>
                 </div>
               </div>
            </div>
          </Card>

          {/* Appearance Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <Sun size={20} className="text-primary" /> Appearance
            </h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Theme Preference</h3>
                <p className="text-sm text-gray-500">Toggle between Light and Dark mode.</p>
              </div>
              <button onClick={toggleTheme} className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-md border border-gray-200">
                {theme === 'light' ? <Moon size={20} className="text-gray-600" /> : <Sun size={20} className="text-yellow-400" />}
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-white">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 opacity-80">
              <ShieldCheck size={16} /> Security Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Notifications</span>
                <div className="w-10 h-5 bg-white/20 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-Factor Auth</span>
                <div className="w-10 h-5 bg-white/20 rounded-full relative"><div className="absolute left-1 top-1 w-3 h-3 bg-white/40 rounded-full"></div></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
