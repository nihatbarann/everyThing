import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Lucide imports removed
import { useNavigate } from 'react-router-dom';

const ArchivedTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedTodos();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const perms = res.data.user?.permissions || [];
      setPermissions(perms);
    } catch (err) { /* ignore */ }
  };

  const fetchArchivedTodos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/todos/archived', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTodos(res.data.todos || []);
    } catch (err) {
      setError('Arşivlenmiş görevler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id) => {
    try {
      await axios.put(`/api/todos/${id}/unarchive`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Görevi geri alma hatası.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Bu görevi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Görevi silme hatası.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <header className="flex items-center gap-4 flex-shrink-0">
        <button onClick={() => navigate('/dashboard/todos')} className="ev-btn ev-btn-icon ev-btn-secondary" style={{ borderRadius: '50%' }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-4xl text-gradient">Arşivlenenler</h1>
          <p className="text-muted text-lg">Tamamlanmış veya arşive kaldırılmış görevler</p>
        </div>
        
        <div className="flex-1 max-w-md px-4">
          <div className="um-search-box !bg-white/5 border border-white/10 hover:border-primary/30 focus-within:border-primary/50 transition-all">
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
            <input 
              type="text" 
              placeholder="Arşivde ara..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="um-search-input !text-[var(--text-main)]"
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in flex-shrink-0">
          <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="um-loading-page flex-1">
          <i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i>
          <span>Arşiv yükleniyor...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted">
              <i className="fa-solid fa-box-archive w-16 h-16 mb-4 opacity-20"></i>
              <p className="text-xl">Arşivde görev bulunmuyor</p>
            </div>
          ) : (
            <div className="grid-container grid-cols-3">
              {todos.filter(t =>
                ((t.title || '') + ' ' + (t.description || '')).toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => {
                const getPriorityInfo = (p) => {
                  switch(p) {
                    case 'high': return { label: 'Yüksek', color: 'var(--error)' };
                    case 'medium': return { label: 'Orta', color: 'var(--warning)' };
                    case 'low': return { label: 'Düşük', color: 'var(--primary)' };
                    default: return { label: 'Orta', color: 'var(--warning)' };
                  }
                };
                const priority = getPriorityInfo(task.priority);
                
                return (
                  <div key={task.id} className="um-kanban-card card-todo group relative overflow-hidden opacity-90 hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-[var(--text-main)] leading-snug">{task.title || 'İsimsiz Görev'}</h4>
                        <span className="priority-badge" style={{ '--badge-color': priority.color }}>
                          {priority.label}
                        </span>
                      </div>
                      {!!task.description && (
                        <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap line-clamp-4">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--glass-border)]">
                      <div className="flex items-center gap-1.5 shrink-0 text-muted">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase text-[9px]">
                          {task.status.replace('_', ' ')}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-max bg-[hsla(0,0%,100%,0.05)]">
                          <i className="fa-solid fa-calendar w-3 h-3"></i>
                          {formatDate(task.created_at)} {task.target_date ? `- ${formatDate(task.target_date)}` : ''}
                        </div>
                      </div>

                      {/* Horizontal Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0 bg-black/20 p-1 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => handleUnarchive(task.id)}
                          className="p-1.5 rounded-md text-muted hover:bg-[hsla(210,100%,50%,0.2)] hover:text-[#3b82f6] transition-colors"
                          title="Geri Al (Unarchive)"
                        >
                          <i className="fa-solid fa-rotate-left w-3.5 h-3.5"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 rounded-md text-muted hover:bg-[hsla(0,80%,50%,0.2)] hover:text-[#e74c3c] transition-colors"
                          title="Kalıcı Sil"
                        >
                          <i className="fa-solid fa-trash-can w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchivedTodos;
