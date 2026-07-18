import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
// Lucide imports removed

const AnnouncementView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role_name === 'Admin' || payload.role_id === 1);
      } catch(e) {}
    }
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const res = await axios.get(`/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setAnnouncement(res.data.announcement);
      } else {
        setError('Duyuru bulunamadı.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Duyuru yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await axios.delete(`/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/dashboard/announcements');
    } catch (err) {
      alert('Silme işlemi başarısız oldu.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      default: return 'var(--info)';
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

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2.5rem', color: 'var(--error)', opacity: 0.5 }}></i>
        <p className="text-muted text-lg">{error || 'Duyuru bulunamadı.'}</p>
        <button onClick={() => navigate('/dashboard/announcements')} className="ev-btn ev-btn-secondary">
          <i className="fa-solid fa-arrow-left"></i> Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div onClick={() => navigate('/dashboard/announcements')} className="ev-btn ev-btn-icon ev-btn-secondary" style={{ cursor: 'pointer', borderRadius: '50%' }}>
          <i className="fa-solid fa-arrow-left"></i>
      </div>

        {isAdmin && (
          <div className="flex items-center gap-3 ml-auto">
            <div
              onClick={() => navigate(`/dashboard/announcements/${id}/edit`)}
              className="ev-btn ev-btn-secondary" style={{ cursor: 'pointer' }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
              Düzenle
            </div>
            <div
              onClick={handleDelete}
              className="ev-btn ev-btn-danger" style={{ cursor: 'pointer' }}
            >
              <i className="fa-solid fa-trash-can"></i>
              Sil
            </div>
          </div>
        )}
      </header>

      {/* Content Card */}
      <div className="premium-card p-0 overflow-hidden">
        {/* Title Area */}
        <div className="p-8" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="ev-icon ev-icon-purple ev-icon-lg">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <span className="badge" style={{ '--badge-color': getPriorityColor(announcement.priority) }}>
              {getPriorityLabel(announcement.priority)}
            </span>
            {announcement.is_published === 0 && (
              <span className="badge" style={{ '--badge-color': 'var(--text-subtle)' }}>
                Taslak
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient leading-tight mb-5">
            {announcement.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-user text-subtle"></i>
              {announcement.created_by_name || announcement.created_by_username}
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-calendar text-subtle"></i>
              {new Date(announcement.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-eye text-subtle"></i>
              {announcement.view_count || 0} görüntülenme
            </span>
          </div>
        </div>

        {/* Short Description */}
        <div className="px-8 py-6" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
          <p className="text-lg leading-relaxed" style={{ fontStyle: 'italic', color: 'var(--text-main)', opacity: 0.85 }}>
            {announcement.short_description}
          </p>
        </div>

        {/* Full Content */}
        <div className="p-8">
          {announcement.content ? (
            <>
              <div
                className="prose max-w-none leading-relaxed text-base"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
              <style dangerouslySetInnerHTML={{__html: `
                .prose h1, .prose h2, .prose h3 { color: var(--text-main); margin-top: 1.5em; }
                .prose p { color: var(--text-main); line-height: 1.8; margin-bottom: 1em; }
                .prose li { color: var(--text-main); }
                .prose strong { color: var(--text-main); }
                .prose a { color: var(--primary); }
                .prose blockquote { border-left-color: var(--primary); color: var(--text-muted); }
                .prose code { background: var(--bg-hover); color: var(--primary); padding: 0.15em 0.35em; border-radius: 4px; font-family: var(--font-mono); }
                .prose pre { background: var(--bg-hover); border: 1px solid var(--border-color); }
              `}} />
            </>
          ) : (
            <p className="text-subtle text-center py-8" style={{ fontStyle: 'italic' }}>Bu duyuru için ek içerik bulunmuyor.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementView;
