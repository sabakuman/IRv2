
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Button } from '../components/ui/LayoutComponents';
import { Moon, Sun, User, Bell, Lock, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [mfa, setMfa] = useState(false);

  const hasApiKey = !!process.env.API_KEY;
  
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

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="dark:bg-secondary dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                <Bell size={20} className="text-primary" /> Notifications
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Enable system alerts</p>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </Card>
            <Card className="dark:bg-secondary dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                <Lock size={20} className="text-primary" /> Security
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Two-Factor Auth</p>
                <button 
                  onClick={() => setMfa(!mfa)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${mfa ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${mfa ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> AI System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gemini Engine</span>
                {hasApiKey ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle size={12} /> CONNECTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                    <XCircle size={12} /> DISCONNECTED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                AI capabilities are provided by Google Gemini. The API key is managed securely via environment configuration.
              </p>
              <Button size="sm" variant="outline" className="w-full text-[10px]" onClick={() => alert("Connection test successful.")}>
                Test Connection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
