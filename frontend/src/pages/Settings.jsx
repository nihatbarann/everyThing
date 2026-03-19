import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DatabaseZap, Loader, Sparkles, CheckCircle2, 
  Download, Moon, Sun, Server, ShieldCheck, AlertCircle 
} from 'lucide-react';

const Settings = () => {
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [msg, setMsg] = useState(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState({ theme: 'light' });
  const [dbInfo, setDbInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role_name === 'Admin');
      } catch(e) {}
    }

    if (isAdmin) {
      fetchConfig();
      fetchDbInfo();
    }
  }, [isAdmin]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/system/config', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.config) {
        setConfig(res.data.config);
        applyTheme(res.data.config.theme);
      }
    } catch(err) { /* ignore */ }
  };

  const fetchDbInfo = async () => {
    try {
      const res = await axios.get('/api/system/db-info', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDbInfo(res.data.dbInfo);
    } catch(err) { /* ignore */ }
  };

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };


  const toggleTheme = async () => {
    const newTheme = config.theme === 'dark' ? 'light' : 'dark';
    setConfig({ ...config, theme: newTheme });
    applyTheme(newTheme);

    try {
      await axios.put('/api/system/config', { theme: newTheme }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showMsg('Theme updated successfully.');
    } catch(err) {
      showMsg('Failed to save theme setting.', true);
    }
  };

  const optimizeDb = async () => {
    setLoadingOpt(true);
    setMsg(null);
    try {
      const res = await axios.post('/api/system/optimize', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showMsg(res.data.message);
    } catch(err) {
      showMsg(err.response?.data?.error || 'Optimization error.', true);
    } finally {
      setLoadingOpt(false);
    }
  };

  const exportDb = async () => {
    setLoadingExport(true);
    try {
      const res = await axios.get('/api/system/export-db', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `everything_backup_${new Date().getTime()}.sql`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      showMsg('Database exported successfully.');
    } catch(err) {
      showMsg('Export failed. Ensure you have admin privileges.', true);
    } finally {
      setLoadingExport(false);
    }
  };

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in">
        <ShieldCheck className="w-16 h-16 text-warning mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted">You do not have permission to view system settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">System Settings</h1>
          <p className="text-muted text-lg">Manage database, connection info, and interface preferences</p>
        </div>
      </header>

      {msg && (
        <div className={`um-alert-${msg.isError ? 'error' : 'success'} animate-in`}>
          {msg.isError ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid-container grid-cols-1 lg:grid-cols-2">

        {/* Database Connection Info */}
        <div className="premium-card flex flex-col delay-2">
          <div className="um-section-header">
            <div className="icon-box warning"><Server className="w-5 h-5" /></div>
            <h2>SQL Connection Info</h2>
          </div>
          {dbInfo ? (
            <div className="flex-1 flex flex-col gap-2 p-4 rounded-xl bg-[hsla(0,0%,0%,0.2)] border border-[var(--glass-border)] font-mono text-sm">
              <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
                <span className="text-muted">Host</span>
                <span className="text-white font-bold">{dbInfo.host}:{dbInfo.port}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--glass-border)] py-2">
                <span className="text-muted">Database</span>
                <span className="text-white font-bold">{dbInfo.database}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--glass-border)] py-2">
                <span className="text-muted">Username</span>
                <span className="text-white font-bold">{dbInfo.username}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted">Password</span>
                <span className="text-white font-bold">{dbInfo.password}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">Loading connection info...</div>
          )}
        </div>

      </div>

      <div className="grid-container grid-cols-1 lg:grid-cols-2">

        {/* Database Optimization */}
        <div className="premium-card p-0 flex flex-col delay-3 border-[hsla(150,80%,40%,0.3)] shadow-[0_0_30px_hsla(150,80%,40%,0.05)]">
          <div className="p-8 relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[hsla(150,80%,40%,0.1)] rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="icon-box success"><DatabaseZap className="w-5 h-5" /></div>
                <h2 className="text-xl font-bold">Optimization</h2>
              </div>
              <p className="text-muted text-sm leading-relaxed max-w-sm">
                Analyze table fragmentation and reclaim unused disk space, improving query performance.
              </p>
              <div className="inline-flex max-w-fit mt-2 items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--success)] text-xs font-bold shadow-sm backdrop-blur-md">
                <Sparkles className="w-3 h-3" /> Recommended weekly
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-[var(--glass-border)] bg-[hsla(0,0%,0%,0.2)]">
            <button 
              onClick={optimizeDb} disabled={loadingOpt}
              className="um-btn-primary w-full !bg-[var(--success)] !from-[var(--success)] !to-[hsl(150,80%,30%)] !shadow-[0_4px_15px_hsla(150,80%,40%,0.3)]"
            >
              {loadingOpt ? <><Loader className="w-4 h-4 animate-spin"/> Optimizing...</> : <><DatabaseZap className="w-4 h-4"/> Run Manual Optimization</>}
            </button>
          </div>
        </div>

        {/* Database Export */}
        <div className="premium-card p-0 flex flex-col delay-[400ms] border-[hsla(220,80%,50%,0.3)] shadow-[0_0_30px_hsla(220,80%,50%,0.05)]">
          <div className="p-8 relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[hsla(220,80%,50%,0.15)] rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="icon-box"><Download className="w-5 h-5" /></div>
                <h2 className="text-xl font-bold">Export Backup</h2>
              </div>
              <p className="text-muted text-sm leading-relaxed max-w-sm">
                Generate and download a complete SQL dump of the EveryThing system database including schema and data.
              </p>
            </div>
          </div>
          <div className="p-6 border-t border-[var(--glass-border)] bg-[hsla(0,0%,0%,0.2)]">
            <button 
              onClick={exportDb} disabled={loadingExport}
              className="um-btn-primary w-full"
            >
              {loadingExport ? <><Loader className="w-4 h-4 animate-spin"/> Exporting...</> : <><Download className="w-4 h-4"/> Download Full Database Backup</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
