import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Home, FileText, Settings, Globe, Menu, Users, ShieldAlert, FileClock } from 'lucide-react';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const active = location.pathname.startsWith(path);
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
          ${active ? 'bg-primary-light text-white shadow-lg' : 'text-blue-100 hover:bg-primary-dark hover:text-white'}
        `}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-secondary/30 dark:bg-background flex transition-colors duration-300" dir={dir}>
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shadow-diplomatic z-20 sticky top-0 h-screen border-r border-primary-light">
        <div className="p-6 border-b border-primary-light">
          <h2 className="font-serif font-bold text-lg leading-tight opacity-90">{t('ministry')}</h2>
          <p className="text-xs text-accent mt-2 uppercase tracking-wider font-bold">IR REPORT LOG</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Standard Navigation */}
          <div className="mb-2 px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">General</div>
          <NavItem icon={Home} label={t('dashboard')} path="/dashboard" />
          <NavItem icon={FileText} label={t('reports')} path="/reports" />
          <NavItem icon={Settings} label="Settings" path="/account" />

          {/* Admin Navigation */}
          {user?.role === 'admin' && (
            <div className="mt-8 animate-in fade-in slide-in-from-left-4">
              <div className="mb-2 px-4 text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={12} /> Administration
              </div>
              <div className="space-y-1 bg-primary-dark/30 rounded-xl p-2">
                <NavItem icon={Users} label="User Management" path="/admin/users" />
                <NavItem icon={FileClock} label="System Logs" path="/admin/logs" />
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-primary-light bg-primary-dark/20">
          <div className="flex items-center gap-3 mb-4 px-2">
             <img src={user?.avatarUrl} className="w-10 h-10 rounded-full border-2 border-accent" alt="Profile" />
             <div className="overflow-hidden">
               <p className="font-medium text-sm truncate">{user?.fullName}</p>
               <p className="text-xs text-blue-200 truncate capitalize flex items-center gap-1">
                 {user?.role === 'admin' ? <ShieldAlert size={10} className="text-accent" /> : null}
                 {user?.role}
               </p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-200 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background transition-colors duration-300">
        {/* Top Header */}
        <header className="bg-white dark:bg-secondary border-b dark:border-gray-800 h-16 flex items-center justify-between px-6 shadow-sm transition-colors duration-300">
          <button className="md:hidden text-gray-600 dark:text-gray-300"><Menu /></button>
          
          <div className="ml-auto flex items-center gap-4">
             <button 
               onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
               className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
             >
               <Globe size={16} />
               {language === 'en' ? 'Arabic' : 'English'}
             </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}