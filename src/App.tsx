// اپلیکیشن اصلی لذیذ - مجموعه غذایی بندرعباس
import { useState, useEffect } from 'react';
import type { AppView } from './types';
import { getAuth } from './store';
import ClientView from './components/ClientView';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState<AppView>('client');

  // بررسی وضعیت احراز هویت هنگام بارگذاری
  useEffect(() => {
    const auth = getAuth();
    if (auth.isAuthenticated) {
      // اگر قبلاً وارد شده، نمایش داشبورد
      // setView('admin-dashboard');
    }
  }, []);

  const handleAdminClick = () => {
    const auth = getAuth();
    if (auth.isAuthenticated) {
      setView('admin-dashboard');
    } else {
      setView('admin-login');
    }
  };

  const handleLogin = () => {
    setView('admin-dashboard');
  };

  const handleLogout = () => {
    setView('client');
  };

  const handleBackToClient = () => {
    setView('client');
  };

  return (
    <div className="min-h-screen">
      {view === 'client' && (
        <ClientView onAdminClick={handleAdminClick} />
      )}
      {view === 'admin-login' && (
        <AdminLogin onLogin={handleLogin} onBack={handleBackToClient} />
      )}
      {view === 'admin-dashboard' && (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}
