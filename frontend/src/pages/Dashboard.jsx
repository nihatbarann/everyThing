import React, { useEffect, useState } from 'react';
import { Activity, Users, Database, Zap, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck } from 'lucide-react';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch(e){}
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">Dashboard Overview</h1>
          <p className="text-muted text-lg">
            Welcome back, <span className="text-white font-medium">{user?.username || 'Admin'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm font-medium text-slate-300 shadow-sm backdrop-blur-md">
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
        {/* Main Chart Area */}
        <div className="premium-card lg:col-span-2 p-0 flex flex-col animate-in delay-2">
          <div className="p-6 border-b border-slate-800/80 flex justify-between items-center bg-slate-800/20">
            <h2 className="text-lg font-bold">System Activity</h2>
          </div>
          
          <div className="flex-1 px-6 chart-container relative">
            <div className="w-full flex justify-between items-end gap-2 relative z-10 h-full">
              {[30, 45, 25, 60, 40, 75, 50, 85, 60, 95, 70, 40].map((h, i) => (
                <div key={i} className="chart-bar-group group" title={`${h}k requests`}>
                  <div className="chart-bar" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Actions Timeline */}
        <div className="premium-card flex flex-col p-0 animate-in delay-3">
          <div className="p-6 border-b border-slate-800/80 bg-slate-800/20">
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
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2 block">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
