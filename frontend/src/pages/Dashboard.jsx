import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Users, Database, Zap, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Megaphone, Calendar, User as UserIcon, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, colorClass, delay }) => {
  const isPositive = trend === 'up';
  return (
    <div className={`premium-card animate-in ${delay}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`icon-box ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`badge ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      </div>
      <div>
        <h3 className="stat-value">{value}</h3>
        <p className="stat-label">{title}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch(e){}
    }
    fetchLatestAnnouncements();
  }, []);

  const fetchLatestAnnouncements = async () => {
    try {
      const res = await axios.get('/api/announcements/latest', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  const openAnnouncement = async (ann) => {
    setSelectedAnnouncement(ann);
    try {
      // Fetch full details to increment view count
      const res = await axios.get(`/api/announcements/${ann.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setSelectedAnnouncement(res.data.announcement);
      }
    } catch (err) {
      console.error('Failed to fetch full announcement', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Önemli';
      case 'medium': return 'Orta';
      default: return 'Temel';
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">Dashboard Overview</h1>
          <p className="text-muted text-lg">
            Welcome back, <span className="text-[var(--text-main)] font-bold">{user?.username || 'Admin'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] rounded-lg border border-[var(--border-color)] text-sm font-medium text-[var(--text-muted)] shadow-sm backdrop-blur-md">
          <Clock className="w-4 h-4 text-blue-400" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid-auto-fit">
        <StatCard 
          title="Total Users" 
          value="1,248" 
          trend="up" 
          trendValue="12%" 
          icon={Users} 
          colorClass="" 
          delay="delay-1" 
        />
        <StatCard 
          title="Active Sessions" 
          value="42" 
          trend="up" 
          trendValue="5%" 
          icon={Activity} 
          colorClass="success" 
          delay="delay-2" 
        />
        <StatCard 
          title="System Load" 
          value="12%" 
          trend="down" 
          trendValue="2%" 
          icon={Zap} 
          colorClass="warning" 
          delay="delay-3" 
        />
        <StatCard 
          title="Database Health" 
          value="99.9%" 
          trend="up" 
          trendValue="Optimal" 
          icon={Database} 
          colorClass="purple" 
          delay="[animation-delay:400ms]" 
        />
      </div>

      <div className="grid-container grid-cols-1 lg:grid-cols-3">
        {/* Son Duyurular (Latest Announcements) */}
        <div className="premium-card flex flex-col p-0 animate-in delay-2 lg:col-span-2">
          <div className="p-6 border-b border-[var(--border-color)] bg-[hsla(0,0%,0%,0.2)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-box purple"><Megaphone className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold">Son Duyurular</h2>
            </div>
            <Link to="/dashboard/announcements" className="um-btn-secondary text-sm py-1.5 px-3">Tümünü Gör</Link>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            {announcements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <Megaphone className="w-12 h-12 mb-3 opacity-20" />
                <p>Henüz yayınlanmış bir duyuru bulunmuyor.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {announcements.map((ann) => (
                  <div 
                    key={ann.id} 
                    className="p-5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-start gap-4"
                    onClick={() => openAnnouncement(ann)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[var(--text-main)] group-hover:text-primary transition-colors">
                          {ann.title}
                        </h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(ann.priority)}`}>
                          {getPriorityLabel(ann.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">{ann.short_description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-[var(--text-subtle)]">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" />
                          {ann.created_by_name}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ann.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Actions Timeline */}
        <div className="premium-card flex flex-col p-0 animate-in delay-3">
          <div className="p-6 border-b border-[var(--border-color)] bg-[hsla(0,0%,0%,0.2)]">
            <h2 className="text-lg font-bold">Activity Feed</h2>
          </div>
          <div className="p-6 flex-1 overflow-auto">
            <div className="activity-list">
              {[
                { title: 'System Optimized', time: '10 mins ago', desc: 'Auto-script completed' },
                { title: 'New Employee', time: '1 hour ago', desc: 'User johndoe logged in' },
                { title: 'Daily Backup', time: '3 hours ago', desc: 'DB snapshot saved' },
                { title: 'Role Updated', time: '5 hours ago', desc: 'Admin modified permissions' }
              ].map((item, i) => (
                <div key={i} className="activity-item">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0 text-[var(--text-muted)]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">{item.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{item.desc}</p>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-2 block">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && createPortal(
        <div className="um-modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
          <div className="um-modal max-w-2xl w-full p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-surface)] flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    {selectedAnnouncement.title}
                  </h2>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(selectedAnnouncement.priority)}`}>
                    {getPriorityLabel(selectedAnnouncement.priority)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5"/> {selectedAnnouncement.created_by_name}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {new Date(selectedAnnouncement.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="text-lg text-[var(--text-main)] font-medium mb-6 pb-6 border-b border-[var(--border-color)] leading-relaxed">
                {selectedAnnouncement.short_description}
              </div>
              <div 
                className="prose prose-invert prose-blue max-w-none text-[var(--text-main)] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content || selectedAnnouncement.short_description }}
              />
            </div>
            
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex justify-end">
              <button onClick={() => setSelectedAnnouncement(null)} className="um-btn-primary py-2 px-6">
                Kapat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
