import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button, Input, Card } from '../components/ui/LayoutComponents';
import { useNavigate } from 'react-router-dom';
import { Shield, User } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (role: 'admin' | 'user') => {
    setIsLoggingIn(true);
    await signIn(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary"></div>
      <div className="absolute top-48 left-0 right-0 h-32 bg-gradient-to-b from-primary to-secondary opacity-50"></div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
           <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-diplomatic mb-4">
              <img src="https://flagcdn.com/w80/ae.png" className="w-12 h-auto" alt="UAE Emblem" />
           </div>
           <h1 className="text-white text-3xl font-serif font-bold tracking-wide">{t('ministry')}</h1>
           <p className="text-primary-light mt-2 text-sm uppercase tracking-widest font-semibold">{t('loginTitle')}</p>
        </div>

        <Card className="shadow-diplomatic">
           <div className="space-y-6">
             <div className="text-center pb-4 border-b border-gray-100">
               <h2 className="text-xl font-semibold text-foreground">{t('welcome')}</h2>
               <p className="text-sm text-gray-500">{t('loginSubtitle')}</p>
             </div>
             
             <div className="space-y-4">
               <Input 
                 label="Official Email" 
                 type="email" 
                 placeholder="username@mohre.gov.ae" 
               />
               <Input 
                 label="Password" 
                 type="password" 
                 placeholder="••••••••" 
               />
             </div>

             <div className="pt-2 space-y-3">
               <Button 
                  disabled={isLoggingIn}
                  onClick={() => handleLogin('admin')} 
                  className="w-full py-3 text-lg bg-primary-dark hover:bg-primary"
                >
                 <Shield size={18} /> Login as Admin
               </Button>
               <Button 
                  disabled={isLoggingIn}
                  onClick={() => handleLogin('user')} 
                  variant="outline" 
                  className="w-full py-3 text-lg"
                >
                 <User size={18} /> Login as Standard User
               </Button>
             </div>
           </div>

           <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => setLanguage('en')} 
                className={`text-sm font-medium ${language === 'en' ? 'text-primary' : 'text-gray-400'}`}
              >
                English
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={() => setLanguage('ar')} 
                className={`text-sm font-medium ${language === 'ar' ? 'text-primary' : 'text-gray-400'}`}
              >
                العربية
              </button>
           </div>
        </Card>
      </div>
    </div>
  );
}