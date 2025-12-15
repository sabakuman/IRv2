import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MockService } from '../services/mockService';
import { Card, Button, Input } from '../components/ui/LayoutComponents';
import { Moon, Sun, User, Bell, Lock, Key, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [apiKey, setApiKey] = useState(user?.apiKey || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveApiKey = async () => {
    if (!user) return;
    setIsSavingKey(true);
    setKeyMessage(null);
    
    try {
      const updatedUser = await MockService.updateApiKey(user.id, apiKey);
      if (updatedUser) {
        updateUser(updatedUser);
        setKeyMessage({ type: 'success', text: 'API Key saved successfully.' });
      } else {
         setKeyMessage({ type: 'error', text: 'Failed to update user profile.' });
      }
    } catch (e) {
      setKeyMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary-dark dark:text-primary-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application appearance.
        </p>
      </div>

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

      {/* API Key Section (NEW) */}
      <Card className="dark:bg-secondary dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Key size={20} className="text-primary dark:text-accent" /> AI Configuration
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
           <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Gemini API Key</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                 Enter your personal Google Gemini API key to enable AI features (Data Fetching, News, etc.). 
                 This key is stored securely in your browser's local storage.
              </p>
           </div>
           
           <div className="flex flex-col gap-4">
              <Input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="font-mono text-sm"
              />
              
              <div className="flex justify-between items-center">
                 <div className="text-sm">
                    {keyMessage && (
                       <span className={`flex items-center gap-2 ${keyMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {keyMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                          {keyMessage.text}
                       </span>
                    )}
                 </div>
                 <Button onClick={handleSaveApiKey} disabled={isSavingKey}>
                    {isSavingKey ? 'Saving...' : 'Save Configuration'}
                 </Button>
              </div>
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

      {/* Placeholders for future settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
        <Card className="dark:bg-secondary dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <Bell size={20} /> Notifications
          </h2>
          <p className="text-sm text-muted-foreground">Manage email and system alerts.</p>
        </Card>
        <Card className="dark:bg-secondary dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <Lock size={20} /> Security
          </h2>
          <p className="text-sm text-muted-foreground">Password and 2FA settings.</p>
        </Card>
      </div>
    </div>
  );
}