import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TICKET_PRIORITY, EXTENSION_INFO, remainingInfo, fmtDateTime, toLocalInputValue } from '../utils/ticketHelpers';
import { initials, displayName } from '../utils/projectHelpers';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyForm = () => ({ title: '', description: '', priority: 'medium', start_at: toLocalInputValue(new Date()), assigned_to: [] });

const TicketsDashboard = () => {
  const [scope, setScope] = useState('assigned'); // 'assigned' | 'created'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [extHours, setExtHours] = useState(2);
  const [extReason, setExtReason] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeNote, setCompleteNote] = useState('');
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [, forceTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { fetchTickets(); }, [scope]);
  useEffect(() => { fetchUsers(); fetchMe(); }, []);
  useEffect(() => {
    const t = setInterval(() => forceTick(x => x + 1), 30000); // keep countdowns fresh
    return () => clearInterval(t);
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/tickets?scope=${scope}`, authHeaders());
      setTickets(res.data.tickets || []);
    } catch (err) { } finally { setLoading(false); }
  };
  const fetchUsers = async () => { try { const res = await axios.get('/api/users/managers', authHeaders()); setUsers(res.data.managers || []); } catch (err) { } };
  const fetchMe = async () => { try { const res = await axios.get('/api/auth/me', authHeaders()); setCurrentUser(res.data.user); } catch (err) { } };

  const openCreateModal = () => { setForm(emptyForm()); setShowCreateModal(true); };

  const toggleAssignee = (id) => {
    setForm(prev => ({ ...prev, assigned_to: prev.assigned_to.includes(id) ? prev.assigned_to.filter(a => a !== id) : [...prev.assigned_to, id] }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.assigned_to.length === 0) return;
    setSaving(true);
    try {
      const payload = { ...form, start_at: form.start_at.replace('T', ' ') + ':00' };
      await axios.post('/api/tickets', payload, authHeaders());
      setShowCreateModal(false);
      fetchTickets();
    } catch (err) { } finally { setSaving(false); }
  };

  const refreshDetail = async (id) => {
    const res = await axios.get(`/api/tickets/${id}`, authHeaders());
    setDetailTicket(res.data.ticket);
  };

  const openDetail = async (ticket) => {
    setShowExtensionForm(false); setExtHours(2); setExtReason('');
    setShowCompleteForm(false); setCompleteNote('');
    setShowReassignForm(false); setReassignTo('');
    setNewComment('');
    try {
      const res = await axios.get(`/api/tickets/${ticket.id}`, authHeaders());
      setDetailTicket(res.data.ticket);
    } catch (err) {
      setDetailTicket(ticket);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/tickets/${detailTicket.id}/complete`, { note: completeNote }, authHeaders());
      setDetailTicket(null);
      fetchTickets();
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ticketı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/tickets/${id}`, authHeaders());
      setDetailTicket(null);
      fetchTickets();
    } catch (err) { }
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/tickets/${detailTicket.id}/extension`, { hours: extHours, reason: extReason }, authHeaders());
      setShowExtensionForm(false);
      await refreshDetail(detailTicket.id);
      fetchTickets();
    } catch (err) { }
  };

  const handleRespondExtension = async (decision) => {
    try {
      await axios.put(`/api/tickets/${detailTicket.id}/extension/respond`, { decision }, authHeaders());
      await refreshDetail(detailTicket.id);
      fetchTickets();
    } catch (err) { }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignTo) return;
    try {
      await axios.put(`/api/tickets/${detailTicket.id}/reassign`, { assigned_to: parseInt(reassignTo, 10) }, authHeaders());
      setShowReassignForm(false);
      await refreshDetail(detailTicket.id);
      fetchTickets();
    } catch (err) { }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await axios.post(`/api/tickets/${detailTicket.id}/comments`, { comment: newComment.trim() }, authHeaders());
      setNewComment('');
      await refreshDetail(detailTicket.id);
    } catch (err) { } finally { setPostingComment(false); }
  };

  const COMMENT_TYPE_ICON = { comment: 'fa-comment', completion: 'fa-circle-check', reassignment: 'fa-people-arrows' };

  const isCreatorOf = (t) => currentUser && (t.created_by === currentUser.id || currentUser.role === 'Admin');
  const isAssigneeOf = (t) => currentUser && (t.assigned_to === currentUser.id || currentUser.role === 'Admin');

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-ticket text-primary text-3xl shrink-0"></i>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Ticketlar</h1>
            <p className="text-muted">Ekip üyeleri arasında günlük görev atamaları — bitiş süresi otomatik 24 saat.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div onClick={() => navigate('/dashboard/tickets/archived')} className="ev-btn ev-btn-secondary" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-box-archive"></i><span>Arşiv</span>
          </div>
          <div onClick={openCreateModal} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-plus"></i><span>Yeni Ticket</span>
          </div>
        </div>
      </header>

      <div className="project-tabs">
        <button className={scope === 'assigned' ? 'active' : ''} onClick={() => setScope('assigned')}><i className="fa-solid fa-inbox"></i>Bana Atananlar</button>
        <button className={scope === 'created' ? 'active' : ''} onClick={() => setScope('created')}><i className="fa-solid fa-paper-plane"></i>Oluşturduklarım</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><i className="fa-solid fa-spinner fa-spin text-primary"></i></div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted p-10 border border-dashed border-[var(--glass-border)] rounded-2xl">
          <i className="fa-solid fa-ticket mb-3 opacity-20" style={{ fontSize: '2.5rem' }}></i>
          <p>{scope === 'assigned' ? 'Size atanan bir ticket yok.' : 'Henüz bir ticket oluşturmadınız.'}</p>
        </div>
      ) : (
        <div className="vault-list">
          {tickets.map(t => {
            const prio = TICKET_PRIORITY[t.priority] || TICKET_PRIORITY.medium;
            const remaining = remainingInfo(t.due_at);
            return (
              <div key={t.id} className="vault-row" onClick={() => openDetail(t)} style={{ cursor: 'pointer' }}>
                <div className="vault-row-favicon"><i className="fa-solid fa-ticket" style={{ color: 'var(--text-muted)' }}></i></div>
                <div className="vault-row-info">
                  <div className="vault-row-title">
                    <span className="truncate" title={t.title}>{t.title}</span>
                    <span className="priority-badge" style={{ '--badge-color': prio.color }}>{prio.label}</span>
                    {t.extension_status !== 'none' && (
                      <span className="priority-badge" style={{ '--badge-color': EXTENSION_INFO[t.extension_status].color }}>{EXTENSION_INFO[t.extension_status].label}</span>
                    )}
                  </div>
                  <div className="vault-row-subtitle">
                    <span className="truncate">{scope === 'assigned' ? `Atayan: ${t.creator_name}` : `Atanan: ${t.assignee_name}`}</span>
                    <span className="vault-row-sep">•</span>
                    <span className="truncate">Bitiş: {fmtDateTime(t.due_at)}</span>
                  </div>
                </div>
                <div className="vault-row-actions" style={{ opacity: 1, transform: 'none' }} onClick={e => e.stopPropagation()}>
                  <span className="priority-badge" style={{ '--badge-color': remaining.color }}>
                    <i className="fa-solid fa-hourglass-half" style={{ marginRight: '0.3rem' }}></i>{remaining.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="um-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Yeni Ticket Oluştur</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }}></i></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="um-field"><label>Görev Başlığı *</label><input type="text" required autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Örn: Günlük satış raporunu hazırla" /></div>
              <div className="um-field"><label>Detaylı Açıklama</label><textarea rows="9" style={{ resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Görevle ilgili tüm detayları buraya yazabilirsiniz..." /></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="um-field">
                  <label>Başlangıç Tarihi/Saati</label>
                  <input type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} />
                </div>
                <div className="um-field">
                  <label>Önem Derecesi</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Düşük</option><option value="medium">Orta</option><option value="high">Yüksek</option>
                  </select>
                </div>
              </div>

              {form.start_at && (
                <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: '0.35rem' }}></i>
                  Bitiş süresi otomatik olarak <strong>{fmtDateTime(form.start_at.replace('T', ' ') + ':00').replace(/\d{2}:\d{2}$/, '')}</strong> +24 saat sonrasına ayarlanacak.
                </p>
              )}

              <div className="um-field">
                <label>Atanacak Kişi(ler) *</label>
                <div className="project-member-picker">
                  {users.length === 0 ? <span className="text-xs text-muted">Kullanıcı bulunamadı</span> : users.map(u => (
                    <label key={u.id} className="project-member-option">
                      <input type="checkbox" checked={form.assigned_to.includes(u.id)} onChange={() => toggleAssignee(u.id)} />
                      <span className="project-member-avatar">{initials(u)}</span>
                      <span className="truncate">{displayName(u)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="um-modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary" disabled={saving || form.assigned_to.length === 0}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                  Ticketı Ata
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {detailTicket && createPortal(
        <div className="um-modal-overlay" onClick={() => setDetailTicket(null)}>
          <div className="um-modal" style={{ maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>{detailTicket.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="priority-badge" style={{ '--badge-color': TICKET_PRIORITY[detailTicket.priority].color }}>{TICKET_PRIORITY[detailTicket.priority].label}</span>
                  {detailTicket.status !== 'completed' ? (
                    <span className="priority-badge" style={{ '--badge-color': remainingInfo(detailTicket.due_at).color }}>
                      <i className="fa-solid fa-hourglass-half" style={{ marginRight: '0.3rem' }}></i>{remainingInfo(detailTicket.due_at).label}
                    </span>
                  ) : (
                    <span className="priority-badge" style={{ '--badge-color': 'var(--success)' }}><i className="fa-solid fa-circle-check" style={{ marginRight: '0.3rem' }}></i>Tamamlandı</span>
                  )}
                </div>
              </div>
              <button onClick={() => setDetailTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }}></i></button>
            </div>

            {!!detailTicket.description && (
              <p className="text-sm text-muted" style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem', lineHeight: 1.6 }}>{detailTicket.description}</p>
            )}

            <div className="project-overview-meta" style={{ marginTop: 0, paddingTop: '1rem' }}>
              <div><label>Atayan</label><span>{detailTicket.creator_name}</span></div>
              <div><label>Atanan</label><span>{detailTicket.assignee_name}</span></div>
              <div><label>Başlangıç</label><span>{fmtDateTime(detailTicket.start_at)}</span></div>
              <div><label>Bitiş</label><span>{fmtDateTime(detailTicket.due_at)}</span></div>
            </div>

            {detailTicket.extension_status === 'pending' && (
              <div className="alert alert-warning" style={{ marginTop: '1rem', display: 'block' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '0.5rem' }}></i>
                <strong>{detailTicket.requested_hours} saat</strong> ek süre talep edildi.
                {!!detailTicket.extension_reason && <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', opacity: 0.85 }}>"{detailTicket.extension_reason}"</div>}
                {isCreatorOf(detailTicket) && (
                  <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                    <button onClick={() => handleRespondExtension('approve')} className="ev-btn ev-btn-primary ev-btn-sm"><i className="fa-solid fa-check"></i>Onayla</button>
                    <button onClick={() => handleRespondExtension('reject')} className="ev-btn ev-btn-secondary ev-btn-sm"><i className="fa-solid fa-xmark"></i>Reddet</button>
                  </div>
                )}
              </div>
            )}

            {showExtensionForm && (
              <form onSubmit={handleRequestExtension} className="flex flex-col gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <div className="two-cols">
                  <div className="um-field"><label>Talep Edilen Ek Süre (saat)</label><input type="number" min="1" max="72" required value={extHours} onChange={e => setExtHours(e.target.value)} /></div>
                </div>
                <div className="um-field"><label>Gerekçe</label><textarea rows="2" value={extReason} onChange={e => setExtReason(e.target.value)} placeholder="Neden ek süreye ihtiyacınız var?" /></div>
                <div className="flex gap-2">
                  <button type="submit" className="ev-btn ev-btn-primary ev-btn-sm"><i className="fa-solid fa-paper-plane"></i>Talebi Gönder</button>
                  <button type="button" onClick={() => setShowExtensionForm(false)} className="ev-btn ev-btn-secondary ev-btn-sm">Vazgeç</button>
                </div>
              </form>
            )}

            {showReassignForm && (
              <form onSubmit={handleReassign} className="flex flex-col gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <div className="um-field">
                  <label>Devredilecek Kişi</label>
                  <select required value={reassignTo} onChange={e => setReassignTo(e.target.value)}>
                    <option value="">— Kişi seçin —</option>
                    {users.filter(u => u.id !== detailTicket.assigned_to).map(u => <option key={u.id} value={u.id}>{displayName(u)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="ev-btn ev-btn-primary ev-btn-sm"><i className="fa-solid fa-people-arrows"></i>Devret</button>
                  <button type="button" onClick={() => setShowReassignForm(false)} className="ev-btn ev-btn-secondary ev-btn-sm">Vazgeç</button>
                </div>
              </form>
            )}

            {showCompleteForm && (
              <form onSubmit={handleComplete} className="flex flex-col gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <div className="um-field">
                  <label>Tamamlama Notu (opsiyonel)</label>
                  <textarea rows="3" value={completeNote} onChange={e => setCompleteNote(e.target.value)} placeholder="Nasıl tamamladınız, sorun neydi, ne yapıldı..." />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="ev-btn ev-btn-primary ev-btn-sm"><i className="fa-solid fa-circle-check"></i>Tamamlandı Olarak İşaretle</button>
                  <button type="button" onClick={() => setShowCompleteForm(false)} className="ev-btn ev-btn-secondary ev-btn-sm">Vazgeç</button>
                </div>
              </form>
            )}

            {!showExtensionForm && !showReassignForm && !showCompleteForm && detailTicket.status !== 'completed' && (
              <div className="flex flex-wrap gap-2" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                {(isAssigneeOf(detailTicket) || isCreatorOf(detailTicket)) && (
                  <button onClick={() => setShowCompleteForm(true)} className="ev-btn ev-btn-primary ev-btn-sm"><i className="fa-solid fa-circle-check"></i>Tamamlandı</button>
                )}
                {isAssigneeOf(detailTicket) && detailTicket.extension_status !== 'pending' && (
                  <button onClick={() => setShowExtensionForm(true)} className="ev-btn ev-btn-secondary ev-btn-sm"><i className="fa-solid fa-clock-rotate-left"></i>Ek Süre Talep Et</button>
                )}
                {(isAssigneeOf(detailTicket) || isCreatorOf(detailTicket)) && (
                  <button onClick={() => setShowReassignForm(true)} className="ev-btn ev-btn-secondary ev-btn-sm"><i className="fa-solid fa-people-arrows"></i>Devret</button>
                )}
                {isCreatorOf(detailTicket) && (
                  <button onClick={() => handleDelete(detailTicket.id)} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ color: 'var(--error)' }}><i className="fa-solid fa-trash-can"></i>Sil</button>
                )}
              </div>
            )}

            {/* Comment / activity thread — anyone involved can add a progress note anytime */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-subtle)' }}>Notlar & Geçmiş</span>
              <div className="flex flex-col gap-3" style={{ marginTop: '0.75rem', maxHeight: '260px', overflowY: 'auto' }}>
                {(!detailTicket.comments || detailTicket.comments.length === 0) ? (
                  <p className="text-xs text-muted">Henüz not eklenmemiş.</p>
                ) : detailTicket.comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <span className="project-member-avatar" style={{ flexShrink: 0, background: c.type === 'comment' ? undefined : 'var(--bg-hover)', color: c.type === 'comment' ? undefined : 'var(--text-muted)' }}>
                      <i className={`fa-solid ${COMMENT_TYPE_ICON[c.type] || 'fa-comment'}`} style={{ fontSize: '11px' }}></i>
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.user_name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{fmtDateTime(c.created_at)}</span>
                        {c.type === 'completion' && <span className="priority-badge" style={{ '--badge-color': 'var(--success)', fontSize: '0.6rem' }}>Tamamlama Notu</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', marginTop: '0.15rem', color: c.type === 'reassignment' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: c.type === 'reassignment' ? 'italic' : 'normal' }}>{c.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2" style={{ marginTop: '1rem' }}>
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Bir not ekleyin... (örn: bilgisayar başında değildi, dönünce haber verecek)" style={{ flex: 1 }} />
                <button type="submit" className="ev-btn ev-btn-primary ev-btn-sm" disabled={postingComment || !newComment.trim()}>
                  {postingComment ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TicketsDashboard;
