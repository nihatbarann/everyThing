import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import InstallationWizard from './pages/InstallationWizard';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';

function App() {
  const [isInstalled, setIsInstalled] = useState(null);

  useEffect(() => {
    // Check if system is installed
    axios.get('/api/install/check')
      .then(res => {
        setIsInstalled(res.data.installed);
      })
      .catch(err => {
        console.error("Failed to check installation status", err);
        setIsInstalled(false);
      });
  }, []);

  if (isInstalled === null) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isInstalled ? (
          <>
            <Route path="/install" element={<InstallationWizard onInstallSuccess={() => setIsInstalled(true)} />} />
            <Route path="*" element={<Navigate to="/install" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
