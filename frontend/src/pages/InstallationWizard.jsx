import React, { useState } from 'react';
import axios from 'axios';
// Lucide imports removed

const InstallationWizard = ({ onInstallSuccess }) => {
  const [formData, setFormData] = useState({
    db_host: 'localhost',
    db_port: '3306',
    db_name: 'everything_db',
    db_user: 'root',
    db_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    setTestSuccess(null); 
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setTestSuccess(null);
    try {
      const res = await axios.post('/api/install/test', formData);
      if(res.data.success) {
        setTestSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Database connection failed.');
    } finally {
      setTesting(false);
    }
  };

  const handleInstall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/install/setup', formData);
      if(res.data.success) {
        onInstallSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred during installation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden p-4">
      {/* Animated Background Blobs */}
      <div className="blob-shape blob-1"></div>
      <div className="blob-shape blob-2"></div>

      <div className="card max-w-md w-full p-8 animate-fade-in z-10">
        <div className="text-center mb-8 animate-fade-in stagger-1 opacity-0">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 rounded-full animate-pulse"></div>
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/50 relative z-10 shadow-xl">
                <i className="fa-solid fa-database w-10 h-10 text-blue-400 flex items-center justify-center"></i>
              </div>
            </div>
          </div>
          <h1 className="text-3xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">System Setup</h1>
          <p className="text-muted text-sm">Configure your MySQL connection</p>
        </div>

        <div className="animate-fade-in stagger-2 opacity-0">
          {error && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {testSuccess && (
            <div className="alert alert-success">
              <i className="fa-solid fa-circle-check w-5 h-5 flex-shrink-0"></i>
              <span>{testSuccess}</span>
            </div>
          )}

          <form onSubmit={handleInstall} className="space-y-4">
            <div className="two-cols">
              <div className="form-group mb-0">
                <label><i className="fa-solid fa-server w-4 h-4 inline mr-1 align-text-bottom"></i> Host</label>
                <input type="text" name="db_host" value={formData.db_host} onChange={handleChange} required />
              </div>
              <div className="form-group mb-0">
                <label>Port</label>
                <input type="text" name="db_port" value={formData.db_port} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Database Name</label>
              <input type="text" name="db_name" value={formData.db_name} onChange={handleChange} required />
            </div>

            <div className="two-cols">
              <div className="form-group mb-0">
                <label>Username</label>
                <input type="text" name="db_user" value={formData.db_user} onChange={handleChange} required />
              </div>
              <div className="form-group mb-0">
                <label><i className="fa-solid fa-key w-4 h-4 inline mr-1 align-text-bottom"></i> Password</label>
                <input type="password" name="db_password" value={formData.db_password} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 animate-fade-in stagger-3 opacity-0">
              <button 
                type="button" 
                className="btn btn-secondary w-1/2" 
                onClick={handleTestConnection} 
                disabled={testing || loading}
              >
                {testing ? <i className="fa-solid fa-spinner fa-spin w-5 h-5"></i> : 'Test Context'}
              </button>
              <button type="submit" className="btn w-1/2" disabled={loading || testing}>
                {loading ? <i className="fa-solid fa-spinner fa-spin w-5 h-5"></i> : (
                  <>Install <i className="fa-solid fa-arrow-right w-4 h-4 ml-1"></i></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstallationWizard;
