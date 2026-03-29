import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
// Lucide imports removed
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AnnouncementForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If id exists → edit mode
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    content: '',
    priority: 'low',
    is_published: 1
  });

  useEffect(() => {
    if (isEdit) {
      const fetchAnnouncement = async () => {
        try {
          const res = await axios.get(`/api/announcements/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.data.success) {
            const a = res.data.announcement;
            setFormData({
              title: a.title || '',
              short_description: a.short_description || '',
              content: a.content || '',
              priority: a.priority || 'low',
              is_published: a.is_published ?? 1
            });
          }
        } catch (err) {
          setError('Duyuru yüklenirken hata oluştu.');
        } finally {
          setLoading(false);
        }
      };
      fetchAnnouncement();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await axios.put(`/api/announcements/${id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post('/api/announcements', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      navigate('/dashboard/announcements');
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu.');
      setSaving(false);
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
    <div className="flex flex-col gap-6 pb-12 animate-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div onClick={() => navigate('/dashboard/announcements')} className="ev-btn ev-btn-icon ev-btn-secondary" style={{ cursor: 'pointer', borderRadius: '50%' }}>
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div className="flex items-center gap-3">
          <div className="ev-icon ev-icon-purple ev-icon-lg">
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              {isEdit ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Oluştur'}
            </h1>
            <p className="text-muted">
              {isEdit ? 'Duyuru bilgilerini güncelleyebilirsiniz.' : 'Tüm kullanıcılara görünecek yeni bir duyuru ekleyin.'}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in">
          <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic Info Card */}
        <div className="premium-card">
          <div className="um-section-header mb-5">
            <h2>Duyuru Bilgileri</h2>
          </div>
          <div className="flex flex-col gap-5">
            <div className="um-field">
              <label>Duyuru Başlığı <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Duyuru başlığını girin"
                required
                maxLength={255}
                className="w-full text-lg"
                autoFocus
              />
            </div>

            <div className="um-field">
              <label>Kısa Açıklama <span className="text-red-500">*</span> <span className="text-xs text-muted font-normal ml-2">(Dashboard'da görünür – maksimum 500 karakter)</span></label>
              <textarea
                value={formData.short_description}
                onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Duyurunun kısa özetini girin"
                required
                maxLength={500}
                className="w-full"
                rows={3}
              />
              <div className="text-right text-xs text-muted mt-1">{formData.short_description.length} / 500</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="um-field">
                <label>Önem Derecesi</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full"
                >
                  <option value="low">🔵 Temel (Bilgi)</option>
                  <option value="medium">🟡 Orta (Uyarı)</option>
                  <option value="high">🔴 Önemli (Acil)</option>
                </select>
              </div>

              <div className="um-field">
                <label>Yayın Durumu</label>
                <select
                  value={formData.is_published}
                  onChange={e => setFormData({ ...formData, is_published: parseInt(e.target.value) })}
                  className="w-full"
                >
                  <option value={1}>✅ Yayınla</option>
                  <option value={0}>📋 Taslak Olarak Kaydet</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="premium-card">
          <div className="um-section-header mb-5">
            <h2>Duyuru İçeriği</h2>
          </div>
          <div className="um-field">
            <label>Genel Açıklama <span className="text-xs text-muted font-normal ml-2">(Duyuruya tıklandığında görünür)</span></label>
            <div className="bg-[var(--bg-main)] rounded-xl overflow-hidden border border-[var(--glass-border)] focus-within:border-primary/60 transition-all">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={content => setFormData({ ...formData, content })}
                placeholder="Duyurunun tüm detaylarını buraya yazın..."
                className="text-[var(--text-main)]"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'blockquote', 'code-block'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid var(--glass-border) !important; background: rgba(255,255,255,0.02); padding: 0.75rem 1rem; }
            .ql-container.ql-snow { border: none !important; color: var(--text-main); font-size: 1rem; min-height: 350px; }
            .ql-editor { min-height: 350px; padding: 1.25rem; font-size: 1rem; line-height: 1.75; }
            .ql-editor.ql-blank::before { color: var(--text-muted); opacity: 0.5; font-style: italic; }
            .ql-snow .ql-stroke { stroke: var(--text-muted); }
            .ql-snow .ql-fill { fill: var(--text-muted); }
            .ql-snow .ql-picker { color: var(--text-muted); }
            .ql-snow .ql-picker-options { background: var(--bg-main); border-color: var(--glass-border); }
            .ql-snow.ql-toolbar button:hover .ql-stroke { stroke: var(--text-main); }
          `
        }} />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate('/dashboard/announcements')} className="ev-btn ev-btn-secondary">
            İptal
          </button>
          <button type="submit" className="ev-btn ev-btn-primary" disabled={saving}>
            {saving ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-floppy-disk"></i>
            )}
            {isEdit ? 'Değişiklikleri Kaydet' : 'Duyuruyu Yayınla'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;
