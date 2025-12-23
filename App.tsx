
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wizard from './pages/Wizard';
import PrintView from './pages/PrintView';
import ReportsList from './pages/ReportsList';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';
import Settings from './pages/Settings';

// Route Guard Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    window.location.hash = '/login';
    return null;
  }
  return <>{children}</>;
};

// Admin Guard Component
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'admin') {
    window.location.hash = '/dashboard';
    return null;
  }
  return <>{children}</>;
};

// Fixed: Replaced missing HashRouter/Routes with manual state-based routing
const Router = () => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const hash = currentHash.replace('#', '') || '/';

  // Extract ID if present (e.g., /wizard/r-101 or /print/r-101)
  const parts = hash.split('/');
  const routeBase = parts[1] || '';
  const routeId = parts[2] || '';

  if (hash === '/login') return <Login />;
  if (routeBase === 'print') return <PrintView />;

  return (
    <ProtectedRoute>
      <Layout>
        {(() => {
          if (hash === '/' || hash === '/dashboard') return <Dashboard />;
          if (hash === '/reports') return <ReportsList />;
          if (routeBase === 'wizard') return <Wizard />;
          if (hash === '/account') return <Settings />;
          
          if (hash === '/admin/users') return <AdminRoute><AdminUsers /></AdminRoute>;
          if (hash === '/admin/logs') return <AdminRoute><AdminLogs /></AdminRoute>;

          // Fallback
          return <Dashboard />;
        })()}
      </Layout>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
