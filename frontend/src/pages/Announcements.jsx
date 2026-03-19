import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Edit2, Trash2, Calendar, User as UserIcon, Loader, Eye, AlertTriangle } from 'lucide-react';

const Announcements = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role_name === 'Admin' || payload.role_id === 1);
      } catch(e) {}
    }
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/announcements', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAnnouncements();
    } catch (err) {
      alert('Silme işlemi başarısız oldu.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/25';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '🔴 Önemli';
      case 'medium': return '🟡 Orta';
      default: return '🔵 Temel';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="icon-box purple"><Megaphone className="w-6 h-6" /></div>
            <h1 className="text-3xl font-bold text-gradient">Tüm Duyurular</h1>
          </div>
          <p className="text-muted text-lg">Sistemdeki tüm yayınlanmış ve geçmiş duyuruları buradan takip edebilirsiniz.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/dashboard/announcements/create')}
            className="um-btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Yeni Duyuru Ekle
          </button>
        )}
      </header>

      <div className="premium-card p-0 overflow-hidden">
        {announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Megaphone className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium mb-2">Henüz Duyuru Yok</h3>
            <p className="max-w-md">Sistemde kayıtlı herhangi bir duyuru bulunmuyor.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-6 hover:bg-slate-800/30 transition-all cursor-pointer group flex flex-col md:flex-row gap-6 ${ann.is_published === 0 ? 'opacity-60' : ''}`}
                onClick={() => navigate(`/dashboard/announcements/${ann.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {ann.title}
                    </h3>
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 ${getPriorityColor(ann.priority)}`}>
                      {getPriorityLabel(ann.priority)}
                    </span>
                    {ann.is_published === 0 && (
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border text-slate-400 bg-slate-800 border-slate-700 shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Taslak
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 mb-4 text-base line-clamp-2">{ann.short_description}</p>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      {ann.created_by_name || ann.created_by_username}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(ann.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {ann.view_count || 0} görüntülenme
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex md:flex-col items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/announcements/${ann.id}/edit`); }}
                      className="p-2.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(ann.id, e)}
                      className="p-2.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
