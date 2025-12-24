
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, Input } from '../components/ui/LayoutComponents';
import { Moon, Sun, User, ShieldCheck, CheckCircle, XCircle, Key, RefreshCw, Loader2 } from 'lucide-react';
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
        alert("API Key updated successfully.");
      }
    } catch (e) {
      alert("Failed to update API Key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey) {
      alert("Please enter an API Key first.");
      return;
    }
    setTestStatus('testing');
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Respond with 'OK' if you can hear me.",
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
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* API Key Management */}
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <Key size={20} className="text-primary" /> Gemini API Key
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter your personal Google Gemini API key to enable AI features like automated data fetching and news analysis.
              </p>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Input 
                    label="API Key" 
                    type="password" 
                    placeholder="Enter your API Key..." 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveApiKey} disabled={isSavingKey} className="h-10">
                  {isSavingKey ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                </Button>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-400">STATUS:</span>
                  {testStatus === 'success' && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle size={14} /> ACTIVE</span>}
                  {testStatus === 'failed' && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle size={14} /> INVALID</span>}
                  {testStatus === 'idle' && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">NOT TESTED</span>}
                  {testStatus === 'testing' && <Loader2 className="animate-spin text-primary" size={16} />}
                </div>
                <Button variant="outline" size="sm" onClick={handleTestKey} disabled={testStatus === 'testing'}>
                  <RefreshCw size={14} /> Test Connection
                </Button>
              </div>
            </div>
          </Card>

          {/* Profile Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <User size={20} className="text-primary" /> Profile Information
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
                 <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wide">
                   {user?.role}
                 </span>
               </div>
            </div>
          </Card>

          {/* Appearance Section */}
          <Card className="dark:bg-secondary dark:border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <Sun size={20} className="text-primary" /> Appearance
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
          <Card className="bg-primary text-white">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 opacity-80">
              <ShieldCheck size={16} /> Security Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Type</span>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">SECURE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Sync</span>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">ACTIVE</span>
              </div>
              <p className="text-[10px] text-blue-100 leading-relaxed italic opacity-80 mt-4">
                Encryption is managed at the transport layer for all bilateral data exchanges.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
