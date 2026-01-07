import { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminLogin, AdminPanel } from './components';
import App from './App';

function AppContent() {
  const [view, setView] = useState('pricer'); // 'pricer', 'admin-login', 'admin'
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAuthenticated, isLoading } = useAdmin();

  // Handle view changes
  const goToAdmin = () => {
    if (isAuthenticated) {
      setView('admin');
    } else {
      setView('admin-login');
    }
  };

  const goToPricer = () => {
    setView('pricer');
  };

  // Push updates to refresh the pricing engine
  const handlePushUpdates = () => {
    setRefreshKey(prev => prev + 1);
    return true;
  };

  // Auto-redirect to admin panel if already authenticated
  if (view === 'admin-login' && isAuthenticated) {
    setView('admin');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#007FFF] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Render based on view
  switch (view) {
    case 'admin-login':
      return <AdminLogin onBack={goToPricer} />;
    case 'admin':
      return isAuthenticated ? (
        <AdminPanel onBack={goToPricer} onPushUpdates={handlePushUpdates} />
      ) : (
        <AdminLogin onBack={goToPricer} />
      );
    default:
      return <App key={refreshKey} onAdminClick={goToAdmin} />;
  }
}

export default function AppWrapper() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
