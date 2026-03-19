import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Users, Settings, LogOut, Shield, CheckSquare, FileText, Globe, Megaphone, Bell } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const [menus, setMenus] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {}
    }

    axios.get('/api/menus', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMenus(res.data.menus || []))
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home':         return <LayoutDashboard />;
      case 'users':        return <Users />;
      case 'settings':     return <Settings />;
      case 'CheckSquare':  return <CheckSquare />;
      case 'file-text':    return <FileText />;
      case 'globe':        return <Globe />;
      case 'megaphone':    return <Megaphone />;
      case 'bell':         return <Bell />;
      default:             return <LayoutDashboard />;
    }
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a nav item
    if (window.innerWidth <= 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Dark backdrop overlay – only visible on mobile when sidebar is open */}
      <div
        className={`sidebar-overlay${isOpen ? ' visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar-container${isOpen ? ' open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield size={20} />
          </div>
          <span className="sidebar-logo-text">EveryThing</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>

          {menus.map(menu => (
            <NavLink
              key={menu.id}
              to={menu.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              {getIcon(menu.icon)}
              <span>{menu.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user && (
            <div 
              className="sidebar-user-card cursor-pointer hover:bg-white/5 transition-colors" 
              onClick={() => {
                navigate('/dashboard/profile');
                handleNavClick(); // close sidebar on mobile
              }}
              title="Profilimi Görüntüle"
            >
              <div className="sidebar-user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.username}</div>
                <div className="sidebar-user-role">{user.role_name}</div>
              </div>
            </div>
          )}

          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
