import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Megaphone, Calendar, User as UserIcon, Eye, Edit2, Trash2, Loader, AlertCircle } from 'lucide-react';

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

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-16 h-16 text-red-400 opacity-50" />
        <p className="text-slate-400 text-lg">{error || 'Duyuru bulunamadı.'}</p>
        <button onClick={() => navigate('/dashboard/announcements')} className="um-btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <button onClick={() => navigate('/dashboard/announcements')} className="um-back-btn">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {isAdmin && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => navigate(`/dashboard/announcements/${id}/edit`)}
              className="um-btn-secondary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Düzenle
            </button>
            <button
              onClick={handleDelete}
              className="um-btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Sil
            </button>
          </div>
        )}
      </header>

      {/* Content Card */}
      <div className="premium-card p-0 overflow-hidden">
        {/* Title Area */}
        <div className="p-8 border-b border-slate-800/50 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="icon-box purple">
              <Megaphone className="w-6 h-6" />
            </div>
            <span className={`text-xs uppercase font-bold px-3 py-1.5 rounded-full border ${getPriorityColor(announcement.priority)}`}>
              {getPriorityLabel(announcement.priority)}
            </span>
            {announcement.is_published === 0 && (
              <span className="text-xs uppercase font-bold px-3 py-1.5 rounded-full border text-slate-400 bg-slate-800 border-slate-700">
                Taslak
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient leading-tight mb-5">
            {announcement.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-500" />
              {announcement.created_by_name || announcement.created_by_username}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              {new Date(announcement.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              {announcement.view_count || 0} görüntülenme
            </span>
          </div>
        </div>

        {/* Short Description */}
        <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/50">
          <p className="text-lg text-slate-300 leading-relaxed italic">
            {announcement.short_description}
          </p>
        </div>

        {/* Full Content */}
        <div className="p-8 bg-slate-900/20">
          {announcement.content ? (
            <>
              <div
                className="prose prose-invert prose-blue max-w-none text-slate-200 leading-relaxed text-base"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
              <style dangerouslySetInnerHTML={{__html: `
                .prose h1, .prose h2, .prose h3 { color: white; margin-top: 1.5em; }
                .prose p { color: rgb(203 213 225); line-height: 1.8; margin-bottom: 1em; }
                .prose li { color: rgb(203 213 225); }
                .prose strong { color: white; }
                .prose a { color: rgb(96 165 250); }
                .prose blockquote { border-left-color: rgb(96 165 250); color: rgb(148 163 184); }
                .prose code { background: rgba(255,255,255,0.08); color: rgb(196 228 255); padding: 0.15em 0.35em; border-radius: 4px; }
                .prose pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); }
              `}} />
            </>
          ) : (
            <p className="text-slate-500 italic text-center py-8">Bu duyuru için ek içerik bulunmuyor.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementView;
