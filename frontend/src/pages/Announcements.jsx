import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Lucide imports removed

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
        <i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ev-icon ev-icon-purple"><i className="fa-solid fa-bullhorn"></i></div>
            <h1 className="text-3xl font-bold text-gradient">Tüm Duyurular</h1>
          </div>
          <p className="text-muted text-lg">Sistemdeki tüm yayınlanmış ve geçmiş duyuruları buradan takip edebilirsiniz.</p>
        </div>
        {isAdmin && (
          <div
            onClick={() => navigate('/dashboard/announcements/create')}
            className="ev-btn ev-btn-primary"
            style={{ cursor: 'pointer' }}
          >
            <i className="fa-solid fa-plus"></i>
            Yeni Duyuru Ekle
          </div>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {announcements.length === 0 ? (
          <div className="premium-card p-12 text-center text-slate-400 flex flex-col items-center">
            <i className="fa-solid fa-bullhorn w-16 h-16 mb-4 opacity-20"></i>
            <h3 className="text-xl font-medium mb-2">Henüz Duyuru Yok</h3>
            <p className="max-w-md">Sistemde kayıtlı herhangi bir duyuru bulunmuyor.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`premium-card p-6 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group flex flex-col md:flex-row gap-6 ${ann.is_published === 0 ? 'opacity-60' : ''}`}
              style={{ padding: '1.5rem' }}
              onClick={() => navigate(`/dashboard/announcements/${ann.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-primary transition-colors">
                    {ann.title}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border shrink-0 ${getPriorityColor(ann.priority)}`}>
                    {getPriorityLabel(ann.priority)}
                  </span>
                  {ann.is_published === 0 && (
                    <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full border text-[var(--text-muted)] bg-[var(--bg-hover)] border-[var(--border-color)] shrink-0 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation w-3 h-3"></i> Taslak
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-muted)] mb-5 text-base leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.short_description}</p>

                <div className="flex flex-wrap items-center gap-6 text-[13px] font-medium text-[var(--text-subtle)] bg-[var(--bg-hover)] p-3 rounded-lg border border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-user text-[var(--primary)]"></i>
                    {ann.created_by_name || ann.created_by_username}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-calendar text-[var(--primary)]"></i>
                    {new Date(ann.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-eye text-[var(--primary)]"></i>
                    {ann.view_count || 0} görüntülenme
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex md:flex-col items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <div
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/announcements/${ann.id}/edit`); }}
                    className="ev-icon ev-icon-sm ev-icon-action ring-1 ring-[var(--border-color)]"
                    title="Düzenle"
                  >
                    <i className="fa-solid fa-pen-to-square text-[var(--primary)]"></i>
                  </div>
                  <div
                    onClick={(e) => handleDelete(ann.id, e)}
                    className="ev-icon ev-icon-sm ev-icon-action ev-hover-error ring-1 ring-[var(--border-color)]"
                    title="Sil"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
