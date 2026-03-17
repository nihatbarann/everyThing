import React, { useState } from 'react';
import axios from 'axios';
import { DatabaseZap, Loader, Sparkles, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const optimizeDb = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await axios.post('/api/system/optimize', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMsg(res.data.message);
    } catch(err) {
      setMsg(err.response?.data?.error || 'Optimizasyon hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in">
      <header>
        <h1 className="text-4xl mb-2 text-gradient">System Settings</h1>
        <p className="text-muted text-lg">Manage database and core system parameters</p>
      </header>

      {msg && (
        <div className="premium-card p-4 flex items-center gap-3 border-[hsla(150,80%,40%,0.3)] bg-[hsla(150,80%,40%,0.05)] text-[hsl(150,80%,50%)] animate-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="premium-card p-0 flex flex-col delay-1 max-w-4xl border-[hsla(150,80%,40%,0.3)] shadow-[0_0_30px_hsla(150,80%,40%,0.05)]">
        <div className="p-8 relative overflow-hidden">
          {/* Emerald background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsla(150,80%,40%,0.1)] rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="icon-box success">
                <DatabaseZap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Database Optimization</h2>
            </div>
            
            <p className="text-muted text-lg leading-relaxed max-w-2xl">
              The EveryThing system relies on a self-optimizing database architecture. 
              Triggering this function will analyze table fragmentation and reclaim unused disk space, 
              improving query performance by reorganizing physical storage of table data and associated index data.
            </p>

            <div className="inline-flex max-w-fit mt-4 items-center gap-2 px-4 py-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--primary-light)] text-sm font-bold shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4" /> Recommended to run weekly.
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--glass-border)] bg-[hsla(0,0%,0%,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-muted uppercase tracking-wider">Storage Engine: InnoDB</span>
          
          <button 
            onClick={optimizeDb} 
            disabled={loading}
            className="w-full sm:w-auto bg-[var(--success)] hover:brightness-110 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[var(--success)]/20 disabled:opacity-50"
          >
            {loading ? 'Optimizing...' : 'Run Manual Optimization'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
