import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { PRIORITY_INFO, countdownInfo, initials, displayName } from '../utils/projectHelpers';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';

/* ───────────────────────── Notes Tab ───────────────────────── */

const ProjectNotesTab = ({ projectId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchNotes(); }, [projectId]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/notes`, authHeaders());
      setNotes(res.data.notes || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/projects/${projectId}/notes/${id}`, authHeaders());
      fetchNotes();
    } catch (err) { }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div onClick={() => navigate(`/dashboard/projects/${projectId}/notes/new`)} className="ev-btn ev-btn-primary ev-btn-sm" style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-note-sticky"></i><span>Yeni Not</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><i className="fa-solid fa-spinner fa-spin text-primary"></i></div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted p-10 border border-dashed border-[var(--glass-border)] rounded-2xl">
          <i className="fa-solid fa-note-sticky mb-3 opacity-20" style={{ fontSize: '2.5rem' }}></i>
          <p>Bu projede henüz not veya şema yok.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {notes.map(note => (
            <div key={note.id} onClick={() => navigate(`/dashboard/projects/${projectId}/notes/${note.id}`)} className="premium-card cursor-pointer hover:border-primary/50 transition-all flex flex-col h-32" style={{ padding: '1rem' }}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm truncate pr-2 flex items-center gap-2" title={note.title}>
                  <i className={`fa-solid ${note.type === 'diagram' ? 'fa-diagram-project' : 'fa-note-sticky'} text-primary`}></i>
                  <span className="truncate">{note.title}</span>
                </h3>
                <div onClick={(e) => handleDelete(e, note.id)} className="ev-icon ev-icon-sm ev-icon-action ev-hover-error"><i className="fa-solid fa-trash-can"></i></div>
              </div>
              <div className="mt-auto text-xs text-muted flex justify-between items-center pt-2 border-t border-[var(--glass-border)]">
                <span>{note.creator_username}</span>
                <span>{fmtDate(note.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ───────────────────────── Links (Vault) Tab ───────────────────────── */

const linkCategoryColor = (cat) => {
  if (!cat) return 'hsl(220, 10%, 55%)';
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 62%, 50%)`;
};

const genPassword = (length = 16) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+';
  const rand = new Uint32Array(length);
  crypto.getRandomValues(rand);
  return Array.from(rand, (n) => charset[n % charset.length]).join('');
};

const STRENGTH_LEVELS = [
  { label: 'Çok Zayıf', color: 'var(--error)' },
  { label: 'Zayıf', color: 'var(--error)' },
  { label: 'Orta', color: 'var(--warning)' },
  { label: 'İyi', color: 'hsl(90, 55%, 42%)' },
  { label: 'Güçlü', color: 'var(--success)' },
  { label: 'Çok Güçlü', color: 'var(--success)' },
];

const pwdStrength = (pwd) => {
  if (!pwd) return { score: 0, ...STRENGTH_LEVELS[0], empty: true };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return { score, ...STRENGTH_LEVELS[Math.min(score, STRENGTH_LEVELS.length - 1)] };
};

const emptyLinkForm = { title: '', category: '', url: '', username: '', password: '', notes: '', is_favorite: 0 };

const ProjectLinksTab = ({ projectId }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [formData, setFormData] = useState(emptyLinkForm);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copied, setCopied] = useState(null);

  useEffect(() => { fetchLinks(); }, [projectId]);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/links`, authHeaders());
      setLinks(res.data.links || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const filtered = links.filter(l => {
    const q = searchQuery.toLowerCase();
    return !q || l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || (l.username || '').toLowerCase().includes(q);
  });

  const openModal = (link = null) => {
    if (link) { setEditLink(link); setFormData({ ...emptyLinkForm, ...link, category: link.category || '' }); }
    else { setEditLink(null); setFormData(emptyLinkForm); }
    setPwdVisible(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.url && !payload.url.startsWith('http')) payload.url = 'https://' + payload.url;
      if (editLink) await axios.put(`/api/projects/${projectId}/links/${editLink.id}`, payload, authHeaders());
      else await axios.post(`/api/projects/${projectId}/links`, payload, authHeaders());
      setShowModal(false);
      fetchLinks();
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try { await axios.delete(`/api/projects/${projectId}/links/${id}`, authHeaders()); fetchLinks(); } catch (err) { }
  };

  const toggleFavorite = async (e, link) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/projects/${projectId}/links/${link.id}`, { ...link, is_favorite: link.is_favorite ? 0 : 1 }, authHeaders());
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_favorite: l.is_favorite ? 0 : 1 } : l));
    } catch (err) { }
  };

  const copyToClipboard = (e, text, type, id) => {
    e?.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(`${id}-${type}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const getDomain = (url) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } };
  const strength = pwdStrength(formData.password);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="um-search-box" style={{ maxWidth: '260px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
          <input type="text" placeholder="Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="um-search-input" />
        </div>
        <div onClick={() => openModal()} className="ev-btn ev-btn-primary ev-btn-sm" style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-plus"></i><span>Yeni Link</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><i className="fa-solid fa-spinner fa-spin text-primary"></i></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted p-10 border border-dashed border-[var(--glass-border)] rounded-2xl">
          <i className="fa-solid fa-vault mb-3 opacity-20" style={{ fontSize: '2.5rem' }}></i>
          <p>{links.length === 0 ? 'Bu projede henüz kayıtlı bir link yok.' : 'Aramayla eşleşen sonuç yok.'}</p>
        </div>
      ) : (
        <div className="vault-list">
          {filtered.map(link => (
            <div key={link.id} className="vault-row" onClick={() => openModal(link)}>
              <div className="vault-row-favicon">
                <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}`} alt="" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <i className="fa-solid fa-globe" style={{ display: 'none' }}></i>
              </div>
              <div className="vault-row-info">
                <div className="vault-row-title">
                  <span className="truncate" title={link.title}>{link.title}</span>
                  {!!link.category && <span className="vault-badge" style={{ '--badge-color': linkCategoryColor(link.category) }}>{link.category}</span>}
                </div>
                <div className="vault-row-subtitle">
                  <span className="truncate">{getDomain(link.url)}</span>
                  {!!link.username && <><span className="vault-row-sep">•</span><span className="truncate">{link.username}</span></>}
                </div>
              </div>
              <div className="vault-row-actions" onClick={e => e.stopPropagation()}>
                <div className={`ev-icon ev-icon-sm ev-icon-action${link.is_favorite ? ' vault-star-active' : ''}`} onClick={(e) => toggleFavorite(e, link)} title="Favori">
                  <i className={link.is_favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                </div>
                {!!link.username && (
                  <div className="ev-icon ev-icon-sm ev-icon-action" onClick={(e) => copyToClipboard(e, link.username, 'user', link.id)} title="Kullanıcı Adını Kopyala">
                    {copied === `${link.id}-user` ? <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> : <i className="fa-solid fa-user"></i>}
                  </div>
                )}
                {!!link.password && (
                  <div className="ev-icon ev-icon-sm ev-icon-action" onClick={(e) => copyToClipboard(e, link.password, 'pass', link.id)} title="Şifreyi Kopyala">
                    {copied === `${link.id}-pass` ? <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> : <i className="fa-solid fa-key"></i>}
                  </div>
                )}
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="ev-icon ev-icon-sm ev-icon-action" title="Siteye Git" onClick={e => e.stopPropagation()}>
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <div className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" onClick={(e) => { e.stopPropagation(); handleDelete(link.id); }} title="Sil">
                  <i className="fa-solid fa-trash-can"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{editLink ? 'Kaydı Düzenle' : 'Yeni Link Ekle'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }}></i></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="um-field"><label>Platform / Site Adı</label><input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required placeholder="Örn: Sunucu Paneli" autoFocus /></div>
                <div className="um-field"><label>Kategori</label><input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Örn: Hosting" /></div>
              </div>
              <div className="um-field"><label>Web Adresi (URL)</label><input type="text" style={{ fontFamily: 'monospace' }} value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required placeholder="https://..." /></div>
              <div className="um-field"><label>Kullanıcı Adı</label><input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Email veya kullanıcı" /></div>
              <div className="um-field">
                <label>Şifre</label>
                <div style={{ position: 'relative' }}>
                  <input type={pwdVisible ? 'text' : 'password'} style={{ fontFamily: 'monospace', paddingRight: '5rem' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" autoComplete="new-password" />
                  <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.15rem' }}>
                    <button type="button" onClick={() => setPwdVisible(v => !v)} className="vault-field-btn"><i className={pwdVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i></button>
                    <button type="button" onClick={() => { setFormData(prev => ({ ...prev, password: genPassword() })); setPwdVisible(true); }} className="vault-field-btn"><i className="fa-solid fa-dice"></i></button>
                  </div>
                </div>
                {!strength.empty && (
                  <div className="vault-strength">
                    <div className="vault-strength-bar">{[0, 1, 2, 3, 4].map(i => <span key={i} className="vault-strength-seg" style={{ background: i <= strength.score ? strength.color : 'var(--glass-border)' }}></span>)}</div>
                    <span className="vault-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>
              <div className="um-field"><label>Özel Notlar</label><textarea rows="3" style={{ resize: 'none' }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Ekstra bilgiler..."></textarea></div>
              <label className="vault-favorite-toggle">
                <input type="checkbox" checked={!!formData.is_favorite} onChange={e => setFormData({ ...formData, is_favorite: e.target.checked ? 1 : 0 })} />
                <i className={formData.is_favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                <span>Favorilere ekle</span>
              </label>
              <div className="um-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary"><i className="fa-solid fa-floppy-disk"></i>{editLink ? 'Kaydet' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ───────────────────────── Todos (Kanban) Tab ───────────────────────── */

const TODO_PRIORITY = {
  low: { label: 'Düşük', color: 'var(--primary)' },
  medium: { label: 'Orta', color: 'var(--warning)' },
  high: { label: 'Yüksek', color: 'var(--error)' },
};

const emptyTodoForm = { title: '', description: '', target_date: '', priority: 'medium', status: 'todo', assigned_to: '' };

const ProjectTodosTab = ({ projectId, members }) => {
  const [todos, setTodos] = useState({ todo: [], in_progress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyTodoForm);
  const [dragged, setDragged] = useState(null);

  useEffect(() => { fetchTodos(); }, [projectId]);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/todos`, authHeaders());
      const grouped = { todo: [], in_progress: [], done: [] };
      (res.data.todos || []).forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });
      setTodos(grouped);
    } catch (err) { } finally { setLoading(false); }
  };

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setForm({ title: task.title || '', description: task.description || '', target_date: task.target_date ? task.target_date.split(' ')[0] : '', priority: task.priority || 'medium', status: task.status, assigned_to: task.assigned_to || '' });
    } else {
      setEditingTask(null);
      setForm(emptyTodoForm);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      if (editingTask) await axios.put(`/api/projects/${projectId}/todos/${editingTask.id}`, form, authHeaders());
      else await axios.post(`/api/projects/${projectId}/todos`, form, authHeaders());
      setShowModal(false);
      fetchTodos();
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try { await axios.delete(`/api/projects/${projectId}/todos/${id}`, authHeaders()); fetchTodos(); } catch (err) { }
  };

  const onDragStart = (e, task, col) => { setDragged({ ...task, sourceColumn: col }); e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.5'; };
  const onDragEnd = (e) => { e.target.style.opacity = '1'; setDragged(null); };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!dragged) return;
    const { sourceColumn, id } = dragged;
    if (sourceColumn === targetColumn) { setDragged(null); return; }

    setTodos(prev => {
      const sourceList = [...prev[sourceColumn]];
      const targetList = [...prev[targetColumn]];
      const idx = sourceList.findIndex(t => t.id === id);
      if (idx > -1) { const [moved] = sourceList.splice(idx, 1); moved.status = targetColumn; targetList.unshift(moved); }
      return { ...prev, [sourceColumn]: sourceList, [targetColumn]: targetList };
    });

    try {
      await axios.put(`/api/projects/${projectId}/todos/${id}/status`, { status: targetColumn }, authHeaders());
    } catch (err) { fetchTodos(); }
    setDragged(null);
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, m, d] = dateStr.split(' ')[0].split('-');
    const target = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)); target.setHours(0, 0, 0, 0);
    return target <= today;
  };

  const columns = [
    { key: 'todo', label: 'Yapılacak', color: 'var(--primary)', icon: 'fa-circle-dot' },
    { key: 'in_progress', label: 'Yapılıyor', color: 'var(--warning)', icon: 'fa-stopwatch' },
    { key: 'done', label: 'Yapıldı', color: 'var(--success)', icon: 'fa-circle-check' },
  ];

  if (loading) return <div className="flex items-center justify-center p-10"><i className="fa-solid fa-spinner fa-spin text-primary"></i></div>;

  return (
    <div className="flex flex-col gap-4">
      <div onClick={() => openModal()} className="ev-btn ev-btn-primary ev-btn-sm self-start" style={{ cursor: 'pointer' }}>
        <i className="fa-solid fa-plus"></i><span>Yeni Görev</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', minWidth: '760px', overflowX: 'auto' }}>
        {columns.map(col => (
          <div key={col.key}
            className="kanban-column"
            style={{ '--col-color': col.color }}
            onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.key)}
          >
            <div className="kanban-column-header">
              <h2><i className={`fa-solid ${col.icon}`}></i>{col.label}</h2>
              <span className="kanban-column-count">{todos[col.key].length}</span>
            </div>
            <div className="kanban-column-body" style={{ minHeight: '200px', maxHeight: '480px' }}>
              {todos[col.key].map(task => {
                const prio = TODO_PRIORITY[task.priority] || TODO_PRIORITY.medium;
                let highlightClass = '';
                if (task.status === 'done') highlightClass = 'card-done';
                else if (isOverdue(task.target_date)) highlightClass = 'overdue';
                else if (task.status === 'in_progress') highlightClass = 'card-in-progress';
                else if (task.status === 'todo') highlightClass = 'card-todo';

                return (
                  <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task, col.key)} onDragEnd={onDragEnd}
                    onClick={() => openModal(task)}
                    className={`um-kanban-card cursor-pointer flex flex-col gap-2 ${highlightClass}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold leading-snug">{task.title}</h4>
                      <span className="priority-badge" style={{ '--badge-color': prio.color }}>{prio.label}</span>
                    </div>
                    {!!task.description && <p className="text-xs text-muted line-clamp-3">{task.description}</p>}
                    <div className="flex items-center justify-between pt-2 mt-auto border-t border-[var(--glass-border)]">
                      <span className="text-[10px] text-muted"><i className="fa-solid fa-calendar-days" style={{ marginRight: '0.25rem' }}></i>{task.target_date ? fmtDate(task.target_date) : '—'}</span>
                      <div className="flex items-center gap-1">
                        {task.assigned_name && <span className="project-member-avatar" style={{ width: '20px', height: '20px', fontSize: '9px' }} title={task.assigned_name}>{task.assigned_name.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase()}</span>}
                        <div className="kanban-card-actions">
                          <div onClick={(e) => { e.stopPropagation(); openModal(task); }} className="ev-icon ev-icon-sm ev-icon-action" title="Düzenle"><i className="fa-solid fa-pen-to-square"></i></div>
                          <div onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" title="Sil"><i className="fa-solid fa-trash-can"></i></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {todos[col.key].length === 0 && <div className="kanban-column-empty">Görev yok</div>}
            </div>
          </div>
        ))}
      </div>

      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h3 className="mb-4">{editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="um-field"><label>Başlık *</label><input type="text" required autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Görev başlığı..." /></div>
              <div className="um-field"><label>Açıklama</label><textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Neler yapılacak?..." /></div>
              <div className="two-cols">
                <div className="um-field"><label>Son Tarih</label><input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></div>
                <div className="um-field"><label>Önem Derecesi</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Düşük</option><option value="medium">Orta</option><option value="high">Yüksek</option>
                  </select>
                </div>
              </div>
              <div className="two-cols">
                <div className="um-field"><label>Durum</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">Yapılacak</option><option value="in_progress">Yapılıyor</option><option value="done">Yapıldı</option>
                  </select>
                </div>
                <div className="um-field"><label>Atanan Kişi</label>
                  <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                    <option value="">— Seçilmedi —</option>
                    {members.map(m => <option key={m.id} value={m.id}>{displayName(m)}</option>)}
                  </select>
                </div>
              </div>
              <div className="um-modal-actions">
                {editingTask && <button type="button" onClick={() => { setShowModal(false); handleDelete(editingTask.id); }} className="ev-btn ev-btn-secondary ev-hover-error" style={{ marginRight: 'auto' }}><i className="fa-solid fa-trash-can"></i></button>}
                <button type="button" onClick={() => setShowModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary">{editingTask ? 'Güncelle' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ───────────────────────── Main Detail Page ───────────────────────── */

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('notes');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm());

  function emptyForm() { return { name: '', description: '', start_date: '', end_date: '', priority: 'medium' }; }

  useEffect(() => { fetchProject(); fetchUsers(); fetchMe(); }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}`, authHeaders());
      setProject(res.data.project);
    } catch (err) {
      navigate('/dashboard/projects');
    } finally { setLoading(false); }
  };
  const fetchUsers = async () => { try { const res = await axios.get('/api/users/managers', authHeaders()); setAllUsers(res.data.managers || []); } catch (err) { } };
  const fetchMe = async () => { try { const res = await axios.get('/api/auth/me', authHeaders()); setCurrentUser(res.data.user); } catch (err) { } };

  const openEditModal = () => {
    setEditForm({
      name: project.name,
      description: project.description || '',
      start_date: project.start_date ? project.start_date.split(' ')[0] : '',
      end_date: project.end_date ? project.end_date.split(' ')[0] : '',
      priority: project.priority
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/projects/${projectId}`, editForm, authHeaders());
      setShowEditModal(false);
      fetchProject();
    } catch (err) { }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz? Tüm notlar, linkler ve görevler de silinecek.')) return;
    try {
      await axios.delete(`/api/projects/${projectId}`, authHeaders());
      navigate('/dashboard/projects');
    } catch (err) { }
  };

  const toggleMember = async (userId, isMember) => {
    try {
      if (isMember) await axios.delete(`/api/projects/${projectId}/members/${userId}`, authHeaders());
      else await axios.post(`/api/projects/${projectId}/members`, { user_id: userId }, authHeaders());
      fetchProject();
    } catch (err) { }
  };

  if (loading || !project) {
    return <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>;
  }

  const prio = PRIORITY_INFO[project.priority] || PRIORITY_INFO.medium;
  const countdown = countdownInfo(project.end_date);
  const isOwner = currentUser && (currentUser.id === project.created_by || currentUser.role === 'Admin');
  const memberIds = project.members.map(m => m.id);

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      <button onClick={() => navigate('/dashboard/projects')} className="note-editor-back-btn self-start">
        <i className="fa-solid fa-arrow-left"></i><span>Projeler</span>
      </button>

      <div className="premium-card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span className="priority-badge" style={{ '--badge-color': prio.color, fontSize: '0.75rem', padding: '0.2rem 0.75rem' }}>{prio.label} Öncelik</span>
            </div>
            {!!project.description && <p className="text-muted">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div onClick={openEditModal} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ cursor: 'pointer' }}><i className="fa-solid fa-pen-to-square"></i><span>Düzenle</span></div>
            {isOwner && <div onClick={handleDeleteProject} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ cursor: 'pointer', color: 'var(--error)' }}><i className="fa-solid fa-trash-can"></i></div>}
          </div>
        </div>

        <div className="project-overview-meta">
          <div><label>Başlangıç</label><span>{fmtDate(project.start_date)}</span></div>
          <div><label>Bitiş</label><span>{fmtDate(project.end_date)}</span></div>
          <div><label>Kalan Süre</label><span style={{ color: countdown.color, fontWeight: 700 }}>{countdown.label}</span></div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
          <div className="project-avatar-stack">
            {project.members.slice(0, 8).map(m => (
              <span key={m.id} className="project-member-avatar" title={displayName(m)}>{initials(m)}</span>
            ))}
            {project.members.length === 0 && <span className="text-xs text-muted">Henüz ekip üyesi yok</span>}
          </div>
          <div onClick={() => setShowMemberModal(true)} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-users"></i><span>Ekip Üyeleri</span>
          </div>
        </div>
      </div>

      <div className="project-tabs">
        <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}><i className="fa-solid fa-note-sticky"></i>Notlar & Şemalar</button>
        <button className={activeTab === 'links' ? 'active' : ''} onClick={() => setActiveTab('links')}><i className="fa-solid fa-vault"></i>Linkler & Şifreler</button>
        <button className={activeTab === 'todos' ? 'active' : ''} onClick={() => setActiveTab('todos')}><i className="fa-solid fa-list-check"></i>Yapılacaklar</button>
      </div>

      {activeTab === 'notes' && <ProjectNotesTab projectId={projectId} />}
      {activeTab === 'links' && <ProjectLinksTab projectId={projectId} />}
      {activeTab === 'todos' && <ProjectTodosTab projectId={projectId} members={project.members} />}

      {showEditModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="um-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>Projeyi Düzenle</h2>
            <form onSubmit={handleUpdateProject} className="flex flex-col gap-4">
              <div className="um-field"><label>Proje Adı *</label><input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="um-field"><label>Açıklama</label><textarea rows="3" style={{ resize: 'none' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="um-field"><label>Başlangıç Tarihi</label><input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} /></div>
                <div className="um-field"><label>Bitiş Tarihi</label><input type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} /></div>
              </div>
              <div className="um-field">
                <label>Önem Derecesi</label>
                <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                  <option value="low">Düşük</option><option value="medium">Orta</option><option value="high">Yüksek</option><option value="critical">Kritik</option>
                </select>
              </div>
              <div className="um-modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary"><i className="fa-solid fa-floppy-disk"></i>Kaydet</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showMemberModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="um-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ekip Üyeleri</h2>
              <button onClick={() => setShowMemberModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i></button>
            </div>
            <div className="project-member-picker">
              {allUsers.map(u => {
                const isMember = memberIds.includes(u.id);
                return (
                  <label key={u.id} className="project-member-option">
                    <input type="checkbox" checked={isMember} onChange={() => toggleMember(u.id, isMember)} />
                    <span className="project-member-avatar">{initials(u)}</span>
                    <span className="truncate">{displayName(u)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectDetail;
