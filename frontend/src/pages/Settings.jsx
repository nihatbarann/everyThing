import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Lucide imports removed

const Settings = () => {
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [msg, setMsg] = useState(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState({ theme: 'light' });
  const [dbInfo, setDbInfo] = useState(null);

  // Activity Logs state
  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [logSearch, setLogSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

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
      fetchLogs(1);
    }
  }, [isAdmin]);

  const fetchLogs = async (pageToFetch = logPagination.page) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get('/api/activity-logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { page: pageToFetch, limit: logPagination.limit, search: logSearch }
      });
      if (res.data.logs) {
        setLogs(res.data.logs);
        setLogPagination(res.data.pagination);
      }
    } catch(err) { /* ignore */ }
    setLoadingLogs(false);
  };

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
        <i className="fa-solid fa-shield-halved text-warning text-6xl mb-4 opacity-50"></i>
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
          {msg.isError ? <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i> : <i className="fa-solid fa-circle-check w-5 h-5 flex-shrink-0"></i>}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid-container grid-cols-1 lg:grid-cols-2">

        {/* Database Connection Info */}
        <div className="premium-card flex flex-col delay-2">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-warning"><i className="fa-solid fa-server"></i></div>
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
                <div className="ev-icon ev-icon-success"><i className="fa-solid fa-database"></i></div>
                <h2 className="text-xl font-bold">Optimization</h2>
              </div>
              <p className="text-muted text-sm leading-relaxed max-w-sm">
                Analyze table fragmentation and reclaim unused disk space, improving query performance.
              </p>
               <div className="inline-flex max-w-fit mt-2 items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--success)] text-xs font-bold shadow-sm backdrop-blur-md">
                <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i> Recommended weekly
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-[var(--glass-border)] bg-[hsla(0,0%,0%,0.2)]">
            <button 
              onClick={optimizeDb} disabled={loadingOpt}
              className="ev-btn ev-btn-success ev-btn-block"
            >
              {loadingOpt ? <><i className="fa-solid fa-spinner fa-spin w-4 h-4 mr-2"></i> Optimizing...</> : <><i className="fa-solid fa-bolt w-4 h-4 mr-2"></i> Run Manual Optimization</>}
            </button>
          </div>
        </div>

        {/* Database Export */}
        <div className="premium-card p-0 flex flex-col delay-[400ms] border-[hsla(220,80%,50%,0.3)] shadow-[0_0_30px_hsla(220,80%,50%,0.05)]">
          <div className="p-8 relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[hsla(220,80%,50%,0.15)] rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="ev-icon ev-icon-primary"><i className="fa-solid fa-download"></i></div>
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
              className="ev-btn ev-btn-primary ev-btn-block"
            >
              {loadingExport ? <><i className="fa-solid fa-spinner fa-spin w-4 h-4 mr-2"></i> Exporting...</> : <><i className="fa-solid fa-download w-4 h-4 mr-2"></i> Download Full Database Backup</>}
            </button>
          </div>
        </div>

      </div>

      {/* Activity Logs (Admin Only) */}
      <div className="premium-card p-0 flex flex-col delay-[500ms] w-full mt-2">
        <div className="p-6 border-b border-[var(--glass-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--bg-surface)] gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="ev-icon ev-icon-sm ev-icon-purple"><i className="fa-solid fa-list-ul"></i></div>
            Activity Logs
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="um-search-box flex-1 sm:w-64">
              <i className="fa-solid fa-magnifying-glass text-muted"></i>
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchLogs(1)}
                className="um-search-input"
              />
            </div>
            <button onClick={() => fetchLogs(1)} className="ev-btn ev-btn-secondary" style={{ cursor: 'pointer' }}>
              Search
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          {loadingLogs ? (
            <div className="p-8 text-center text-muted"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted">No activity logs found.</div>
          ) : (
            <table className="um-table w-full">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">Date</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-sm text-muted">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="font-medium text-[var(--text-main)]">
                      {log.username || 'System'}
                      {log.user_id && <span className="text-muted text-xs ml-1">(#{log.user_id})</span>}
                    </td>
                    <td><span className="badge">{log.action}</span></td>
                    <td className="text-sm">{log.description}</td>
                    <td className="text-sm font-mono text-muted">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {logPagination.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--glass-border)] flex items-center justify-between bg-[hsla(0,0%,0%,0.2)]">
            <div className="text-sm text-muted">
              Page {logPagination.page} of {logPagination.totalPages} ({logPagination.total} total)
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchLogs(logPagination.page - 1)}
                disabled={logPagination.page === 1 || loadingLogs}
                className="ev-btn ev-btn-secondary ev-btn-sm"
                style={{ cursor: logPagination.page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button 
                onClick={() => fetchLogs(logPagination.page + 1)}
                disabled={logPagination.page >= logPagination.totalPages || loadingLogs}
                className="ev-btn ev-btn-secondary ev-btn-sm"
                style={{ cursor: logPagination.page >= logPagination.totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Settings;
