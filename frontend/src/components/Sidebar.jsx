import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Removed Lucide imports: LayoutDashboard, Users, Settings, LogOut, Shield, ListTodo, StickyNote, Vault, Megaphone, Bell

const Sidebar = ({ isOpen, onClose }) => {
  const [menus, setMenus] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Drag and Drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

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

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.classList.add('dragging'), 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (index !== draggedItemIndex) {
      setDragOverItemIndex(index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDrop = async (e, droppedOnIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === droppedOnIndex) return;

    const newMenus = [...menus];
    const draggedItem = newMenus[draggedItemIndex];
    
    // Remove dragged item and insert at new position
    newMenus.splice(draggedItemIndex, 1);
    newMenus.splice(droppedOnIndex, 0, draggedItem);
    
    setMenus(newMenus);
    setDragOverItemIndex(null);
    
    // Save to backend
    const menuOrder = newMenus.map(m => m.id);
    try {
      await axios.post('/api/menus/order', { menu_order: menuOrder }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {

    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home':         return <i className="fa-solid fa-house"></i>;
      case 'users':        return <i className="fa-solid fa-users"></i>;
      case 'settings':     return <i className="fa-solid fa-gear"></i>;
      case 'CheckSquare':  
      case 'ListTodo':     return <i className="fa-solid fa-list-check"></i>;
      case 'file-text':    
      case 'StickyNote':   return <i className="fa-solid fa-note-sticky"></i>;
      case 'globe':        
      case 'Vault':        return <i className="fa-solid fa-vault"></i>;
      case 'megaphone':    return <i className="fa-solid fa-bullhorn"></i>;
      case 'bell':         return <i className="fa-solid fa-bell"></i>;
      case 'wrench':       return <i className="fa-solid fa-wrench"></i>;
      default:             return <i className="fa-solid fa-house"></i>;
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
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <span className="sidebar-logo-text">EveryThing</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>

          {menus.map((menu, index) => (
            <NavLink
              key={menu.id}
              to={menu.path}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              onClick={(e) => {
                if (draggedItemIndex !== null) {
                  e.preventDefault();
                } else {
                  handleNavClick();
                }
              }}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''} ${dragOverItemIndex === index ? 'drag-over' : ''}`
              }
            >
              <i className="fa-solid fa-grip-vertical drag-handle"></i>
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

          <div className="sidebar-logout-btn group" onClick={handleLogout}>
            <div className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" style={{ marginRight: '0.75rem' }}>
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            <span>Sign Out</span>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
