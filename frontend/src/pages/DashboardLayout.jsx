import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
