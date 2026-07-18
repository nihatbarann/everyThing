import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PRIORITY_INFO, countdownInfo, initials, displayName } from '../utils/projectHelpers';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const emptyForm = { name: '', description: '', start_date: '', end_date: '', priority: 'medium', member_ids: [] };

const ProjectsDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects', authHeaders());
      setProjects(res.data.projects || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users/managers', authHeaders());
      setUsers(res.data.managers || []);
    } catch (err) { }
  };

  const handleOpenModal = () => {
    setFormData(emptyForm);
    setShowModal(true);
  };

  const toggleMember = (id) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(id) ? prev.member_ids.filter(m => m !== id) : [...prev.member_ids, id]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post('/api/projects', formData, authHeaders());
      setShowModal(false);
      if (res.data.id) navigate(`/dashboard/projects/${res.data.id}`);
      else fetchProjects();
    } catch (err) { } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-diagram-project text-primary text-3xl shrink-0"></i>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Projeler</h1>
            <p className="text-muted">Ekibinizin çalıştığı projeleri, notları, erişim bilgilerini ve görevleri tek yerden yönetin.</p>
          </div>
        </div>
        <div onClick={handleOpenModal} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-plus"></i>
          <span>Yeni Proje</span>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: '5rem' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted" style={{ padding: '5rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-xl)', background: 'hsla(0,0%,0%,0.05)' }}>
          <i className="fa-solid fa-diagram-project" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}></i>
          <p style={{ fontSize: '1.1rem' }}>Henüz kayıtlı bir proje yok.</p>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>"Yeni Proje" butonuna tıklayarak başlayın.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {projects.map(project => {
            const prio = PRIORITY_INFO[project.priority] || PRIORITY_INFO.medium;
            const countdown = countdownInfo(project.end_date);
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                className="premium-card cursor-pointer hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] transition-all flex flex-col"
                style={{ padding: '1.25rem', minHeight: '190px' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-snug" title={project.name}>{project.name}</h3>
                  <span className="priority-badge" style={{ '--badge-color': prio.color }}>{prio.label}</span>
                </div>

                {!!project.description && (
                  <p className="text-sm text-muted line-clamp-2 mb-3">{project.description}</p>
                )}

                <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-calendar-days" style={{ fontSize: '0.7rem' }}></i>
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('tr-TR') : '—'}
                      {' '}→{' '}
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('tr-TR') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: countdown.color }}>
                      <i className="fa-solid fa-hourglass-half" style={{ fontSize: '0.7rem', marginRight: '0.3rem' }}></i>
                      {countdown.label}
                    </span>
                    <span className="text-xs text-subtle flex items-center gap-1">
                      <i className="fa-solid fa-users" style={{ fontSize: '0.7rem' }}></i>
                      {project.member_count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-diagram-project text-primary" style={{ fontSize: '1.25rem' }}></i>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Yeni Proje Oluştur</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }}></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="um-field">
                <label>Proje Adı *</label>
                <input type="text" required autoFocus value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: Web Sitesi Yenileme" />
              </div>

              <div className="um-field">
                <label>Açıklama</label>
                <textarea rows="3" style={{ resize: 'none' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Proje hakkında kısa bilgi..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="um-field">
                  <label>Başlangıç Tarihi</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="um-field">
                  <label>Bitiş Tarihi</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>

              <div className="um-field">
                <label>Önem Derecesi</label>
                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="critical">Kritik</option>
                </select>
              </div>

              <div className="um-field">
                <label>Ekip Üyeleri</label>
                <div className="project-member-picker">
                  {users.length === 0 ? (
                    <span className="text-xs text-muted">Kullanıcı bulunamadı</span>
                  ) : users.map(u => (
                    <label key={u.id} className="project-member-option">
                      <input type="checkbox" checked={formData.member_ids.includes(u.id)} onChange={() => toggleMember(u.id)} />
                      <span className="project-member-avatar">{initials(u)}</span>
                      <span className="truncate">{displayName(u)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="um-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary" disabled={saving}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                  Projeyi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectsDashboard;
