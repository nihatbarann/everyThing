import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark-theme');
  });

  useEffect(() => {
    // Keep internal state sync'd with DOM in case it changed elsewhere
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark-theme'));
    };
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    if (newIsDark) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(newIsDark);
    
    // Optional: Persist to API if token exists
    const token = localStorage.getItem('token');
    if (token) {
      import('axios').then(axios => {
        axios.default.put('/api/system/config', { theme: newIsDark ? 'dark' : 'light' }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {}); // fire and forget
      });
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>

      {/* Sidebar – receives isOpen + onClose so it fully controls the overlay too */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="p-2.5 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center justify-center"
        style={{ 
          position: 'fixed', 
          top: '16px', 
          right: '16px', 
          zIndex: 99999,
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.12)',
          color: isDark ? '#fff' : '#1e293b',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
        title={isDark ? "Koyu Tema (Dark)" : "Açık Tema (Light)"}
      >
        {isDark ? <Moon className="w-5 h-5" style={{color:'#6366f1'}} /> : <Sun className="w-5 h-5 text-yellow-500" />}

      </button>

      {/* Main content column */}
      <main className="main-container">

        {/* Mobile-only sticky header with hamburger button */}
        <div className="mobile-header">
          <span className="mobile-header-brand">EveryThing</span>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="main-content animate-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
