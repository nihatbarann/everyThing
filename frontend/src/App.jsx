import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import InstallationWizard from './pages/InstallationWizard';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserCreate from './pages/UserCreate';
import UserProfile from './pages/UserProfile';
import UserEdit from './pages/UserEdit';
import Settings from './pages/Settings';
import Todos from './pages/Todos';
import ArchivedTodos from './pages/ArchivedTodos';
import MyProfile from './pages/MyProfile';
import NotesDashboard from './pages/NotesDashboard';
import NoteEditor from './pages/NoteEditor';
import LinksDashboard from './pages/LinksDashboard';
import Announcements from './pages/Announcements';
import AnnouncementView from './pages/AnnouncementView';
import AnnouncementForm from './pages/AnnouncementForm';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { 
    if (this.state.hasError) return <div style={{background:'black', color:'red', padding:'50px', fontSize:'20px', zIndex:99999, position:'fixed', inset:0}}>SİSTEM HATASI: {this.state.error.toString()}</div>;
    return this.props.children; 
  }
}

function App() {
  const [isInstalled, setIsInstalled] = useState(null);

  useEffect(() => {
    // 1. Check localStorage for immediate theme application
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark-theme');
    }

    // 2. Check if system is installed and verify theme with API
    axios.get('/api/install/check')
      .then(res => {
        setIsInstalled(res.data.installed);
        if (res.data.installed && localStorage.getItem('token')) {
          axios.get('/api/system/config', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }).then(configRes => {
            const apiTheme = configRes.data.config?.theme;
            if (apiTheme) {
              // Update if API differs or just to be sure
              if (apiTheme === 'dark') {
                document.documentElement.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
              } else {
                document.documentElement.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
              }
            }
          }).catch(() => { /* ignore or token might be invalid */ });
        }
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
              <Route path="users/create" element={<UserCreate />} />
              <Route path="users/:id" element={<UserProfile />} />
              <Route path="users/:id/edit" element={<UserEdit />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="todos" element={<Todos />} />
              <Route path="todos/archived" element={<ArchivedTodos />} />
              <Route path="notes" element={<NotesDashboard />} />
              <Route path="notes/:id" element={<NoteEditor />} />
              <Route path="links" element={<ErrorBoundary><LinksDashboard /></ErrorBoundary>} />
              <Route path="announcements" element={<ErrorBoundary><Announcements /></ErrorBoundary>} />
              <Route path="announcements/create" element={<ErrorBoundary><AnnouncementForm /></ErrorBoundary>} />
              <Route path="announcements/:id" element={<ErrorBoundary><AnnouncementView /></ErrorBoundary>} />
              <Route path="announcements/:id/edit" element={<ErrorBoundary><AnnouncementForm /></ErrorBoundary>} />
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
