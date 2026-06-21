
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
import LetterLogList from './pages/LetterLogList';
import MOUTracker from './pages/MOUTracker';
import MOUDetail from './pages/MOUDetail';
import MOUWizard from './pages/MOUWizard';
import MOUPrintView from './pages/MOUPrintView';

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Route Guard Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Guard Component
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/print/:id" element={<PrintView />} />
      <Route path="/mou/:id/print" element={<MOUPrintView />} />
      
      {/* Protected App Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="letters" element={<LetterLogList />} />
        <Route path="mous" element={<MOUTracker />} />
        <Route path="mou/new" element={<MOUWizard />} />
        <Route path="mou/:id" element={<MOUDetail />} />
        <Route path="mou/:id/edit" element={<MOUWizard />} />
        <Route path="wizard" element={<Wizard />} />
        <Route path="wizard/:id" element={<Wizard />} />
        <Route path="account" element={<Settings />} />
        
        {/* Admin Routes */}
        <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
        
        {/* Fallback for protected area */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
