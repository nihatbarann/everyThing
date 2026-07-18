import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const SUGGESTED_CATEGORIES = ['Sosyal Medya', 'İş', 'Finans', 'E-posta', 'Alışveriş', 'Eğlence', 'Eğitim', 'Diğer'];

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
};

// Deterministic color per category name so folders read as distinct "tags", like a password manager's vault folders
const categoryColor = (cat) => {
  if (!cat) return 'hsl(220, 10%, 55%)';
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 62%, 50%)`;
};

const generatePassword = (length = 16) => {
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

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, ...STRENGTH_LEVELS[0], empty: true };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return { score, ...STRENGTH_LEVELS[Math.min(score, STRENGTH_LEVELS.length - 1)] };
};

const emptyForm = { title: '', category: '', url: '', username: '', password: '', notes: '', is_favorite: 0 };

const LinksDashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewLink, setViewLink] = useState(null);
  const [editLink, setEditLink] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formPasswordVisible, setFormPasswordVisible] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copied, setCopied] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'favorites' | <category>

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await axios.get('/api/links', authHeaders());
      setLinks(res.data.links || []);
    } catch(err) { } finally { setLoading(false); }
  };

  const categories = useMemo(() => {
    const map = new Map();
    links.forEach(l => {
      const c = l.category || 'Diğer';
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
  }, [links]);

  const favoritesCount = links.filter(l => l.is_favorite).length;

  const filteredLinks = links.filter(l => {
    if (activeFilter === 'favorites' && !l.is_favorite) return false;
    if (activeFilter !== 'all' && activeFilter !== 'favorites' && (l.category || 'Diğer') !== activeFilter) return false;
    const q = searchQuery.toLowerCase();
    return !q || l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || (l.username || '').toLowerCase().includes(q);
  });

  const handleOpenModal = (link = null) => {
    if (link) {
      setEditLink(link);
      setFormData({ ...emptyForm, ...link, category: link.category || '' });
    } else {
      setEditLink(null);
      setFormData(emptyForm);
    }
    setFormPasswordVisible(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.url && !payload.url.startsWith('http')) payload.url = 'https://' + payload.url;

      if (editLink) {
        await axios.put(`/api/links/${editLink.id}`, payload, authHeaders());
      } else {
        await axios.post('/api/links', payload, authHeaders());
      }
      setShowModal(false);
      fetchLinks();
    } catch(err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/links/${id}`, authHeaders());
      fetchLinks();
    } catch(err) {}
  };

  const toggleFavorite = async (e, link) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/links/${link.id}`, { ...link, is_favorite: link.is_favorite ? 0 : 1 }, authHeaders());
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_favorite: l.is_favorite ? 0 : 1 } : l));
    } catch(err) {}
  };

  const copyToClipboard = (e, text, type, id) => {
    e?.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(`${id}-${type}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const togglePasswordVisibility = (e, id) => {
    e?.stopPropagation();
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const applyGeneratedPassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }));
    setFormPasswordVisible(true);
  };

  const formStrength = getPasswordStrength(formData.password);

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gradient">
            <i className="fa-solid fa-vault text-primary text-3xl"></i> Linkler & Şifreler
          </h1>
          <p className="text-muted mt-2">Sık kullandığınız siteleri, portalları ve giriş bilgilerinizi güvenle saklayın.</p>
        </div>
        <div onClick={() => handleOpenModal()} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-plus"></i>
          <span>Yeni Link</span>
        </div>
      </header>

      <div className="vault-layout">
        {/* Sidebar: favorites + categories, like a password manager's vault/folder rail */}
        <aside className="vault-sidebar">
          <div className="um-search-box" style={{ marginBottom: '1rem' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}></i>
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="um-search-input"
            />
          </div>

          <nav className="vault-filter-list">
            <div
              className={`vault-filter-item${activeFilter === 'all' ? ' active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>Tümü</span>
              <span className="vault-filter-count">{links.length}</span>
            </div>
            <div
              className={`vault-filter-item${activeFilter === 'favorites' ? ' active' : ''}`}
              onClick={() => setActiveFilter('favorites')}
            >
              <i className="fa-solid fa-star" style={{ color: activeFilter === 'favorites' ? undefined : 'var(--warning)' }}></i>
              <span>Favoriler</span>
              <span className="vault-filter-count">{favoritesCount}</span>
            </div>
          </nav>

          {categories.length > 0 && (
            <>
              <div className="vault-sidebar-label">Kategoriler</div>
              <nav className="vault-filter-list">
                {categories.map(([cat, count]) => (
                  <div
                    key={cat}
                    className={`vault-filter-item${activeFilter === cat ? ' active' : ''}`}
                    onClick={() => setActiveFilter(cat)}
                  >
                    <span className="vault-cat-dot" style={{ background: categoryColor(cat) }}></span>
                    <span className="truncate">{cat}</span>
                    <span className="vault-filter-count">{count}</span>
                  </div>
                ))}
              </nav>
            </>
          )}
        </aside>

        {/* List */}
        <div className="vault-main">
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: '5rem' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted" style={{ padding: '5rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-xl)', background: 'hsla(0,0%,0%,0.05)' }}>
              <i className="fa-solid fa-vault" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}></i>
              <p style={{ fontSize: '1.1rem' }}>{links.length === 0 ? 'Henüz kayıtlı bir linkiniz yok.' : 'Aramayla eşleşen sonuç bulunamadı.'}</p>
              {links.length === 0 && <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Yukarıdaki butona tıklayarak ilk kasanızı oluşturun.</p>}
            </div>
          ) : (
            <div className="vault-list">
              {filteredLinks.map(link => (
                <div key={link.id} className="vault-row" onClick={() => setViewLink(link)}>
                  <div className="vault-row-favicon">
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}`}
                      alt=""
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                    <i className="fa-solid fa-globe" style={{ display: 'none' }}></i>
                  </div>

                  <div className="vault-row-info">
                    <div className="vault-row-title">
                      <span className="truncate" title={link.title}>{link.title}</span>
                      {!!link.category && (
                        <span className="vault-badge" style={{ '--badge-color': categoryColor(link.category) }}>{link.category}</span>
                      )}
                    </div>
                    <div className="vault-row-subtitle">
                      <span className="truncate">{getDomain(link.url)}</span>
                      {!!link.username && <><span className="vault-row-sep">•</span><span className="truncate">{link.username}</span></>}
                    </div>
                  </div>

                  <div className="vault-row-actions" onClick={e => e.stopPropagation()}>
                    <div
                      className={`ev-icon ev-icon-sm ev-icon-action${link.is_favorite ? ' vault-star-active' : ''}`}
                      onClick={(e) => toggleFavorite(e, link)}
                      title={link.is_favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                    >
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
                    <div className="ev-icon ev-icon-sm ev-icon-action" onClick={(e) => { e.stopPropagation(); handleOpenModal(link); }} title="Düzenle">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </div>
                    <div className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" onClick={(e) => { e.stopPropagation(); handleDelete(link.id); }} title="Sil">
                      <i className="fa-solid fa-trash-can"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewLink && createPortal(
        <div className="um-modal-overlay" onClick={() => setViewLink(null)}>
          <div className="um-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <div className="flex items-center gap-3" style={{ minWidth: 0, paddingRight: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(viewLink.url)}`} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  <i className="fa-solid fa-globe" style={{ display: 'none', color: 'var(--text-muted)', fontSize: '1.25rem' }}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={viewLink.title}>{viewLink.title}</h2>
                  <a href={viewLink.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {getDomain(viewLink.url)} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i>
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                <button onClick={(e) => toggleFavorite(e, viewLink)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: viewLink.is_favorite ? 'var(--warning)' : 'var(--text-muted)', padding: '0.25rem', fontSize: '1.1rem' }} title="Favori">
                  <i className={viewLink.is_favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                </button>
                <button onClick={() => setViewLink(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', fontSize: '1.1rem' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {!!viewLink.category && (
                <span className="vault-badge" style={{ '--badge-color': categoryColor(viewLink.category), alignSelf: 'flex-start' }}>{viewLink.category}</span>
              )}

              {viewLink.username && (
                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Kullanıcı Adı</span>
                  <div className="flex items-center justify-between" style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.9rem', userSelect: 'all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewLink.username}</span>
                    <button onClick={(e) => copyToClipboard(e, viewLink.username, 'user', viewLink.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '0.5rem', flexShrink: 0 }}>
                      {copied === `${viewLink.id}-user` ? <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--success)' }}></i> : <i className="fa-solid fa-clipboard"></i>}
                    </button>
                  </div>
                </div>
              )}

              {viewLink.password && (
                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Şifre</span>
                  <div className="flex items-center justify-between" style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', letterSpacing: '0.05em', userSelect: 'all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {visiblePasswords[viewLink.id] ? viewLink.password : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1" style={{ marginLeft: '0.5rem', flexShrink: 0 }}>
                      <button onClick={(e) => togglePasswordVisibility(e, viewLink.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }} title="Göster/Gizle">
                        {visiblePasswords[viewLink.id] ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                      </button>
                      <button onClick={(e) => copyToClipboard(e, viewLink.password, 'pass', viewLink.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }} title="Kopyala">
                        {copied === `${viewLink.id}-pass` ? <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--success)' }}></i> : <i className="fa-solid fa-clipboard"></i>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {viewLink.notes && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Özel Notlar</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', padding: '0.85rem 1rem', borderLeft: '3px solid var(--primary)', background: 'var(--bg-hover)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', whiteSpace: 'pre-wrap', lineHeight: 1.6, opacity: 0.9 }}>
                    {viewLink.notes}
                  </div>
                </div>
              )}

              <div className="um-modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setViewLink(null)} className="ev-btn ev-btn-secondary">Kapat</button>
                <button type="button" onClick={() => { const l = viewLink; setViewLink(null); handleOpenModal(l); }} className="ev-btn ev-btn-primary">
                  <i className="fa-solid fa-pen-to-square"></i> Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Form Modal */}
      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-3">
                {editLink ? <i className="fa-solid fa-pen-to-square text-primary" style={{ fontSize: '1.25rem' }}></i> : <i className="fa-solid fa-plus text-primary" style={{ fontSize: '1.25rem' }}></i>}
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  {editLink ? 'Kaydı Düzenle' : 'Yeni Link Ekle'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }}></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="um-field">
                  <label>Platform / Site Adı</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fa-solid fa-globe" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.85rem' }}></i>
                    <input type="text" style={{ paddingLeft: '2.5rem' }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Örn: Github Hesabım" autoFocus />
                  </div>
                </div>
                <div className="um-field">
                  <label>Kategori</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fa-solid fa-folder" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.85rem' }}></i>
                    <input type="text" style={{ paddingLeft: '2.5rem' }} list="link-category-options" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Örn: İş" />
                    <datalist id="link-category-options">
                      {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="um-field">
                <label>Web Adresi (URL)</label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.85rem' }}></i>
                  <input type="text" style={{ paddingLeft: '2.5rem', fontFamily: 'monospace' }} value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required placeholder="https://github.com" />
                </div>
              </div>

              <div className="um-field">
                <label>Kullanıcı Adı</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Email veya kullanıcı" />
              </div>

              <div className="um-field">
                <label>Şifre</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={formPasswordVisible ? 'text' : 'password'}
                    style={{ fontFamily: 'monospace', letterSpacing: '0.05em', paddingRight: '5rem' }}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.15rem' }}>
                    <button type="button" onClick={() => setFormPasswordVisible(v => !v)} className="vault-field-btn" title="Göster/Gizle">
                      <i className={formPasswordVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                    <button type="button" onClick={applyGeneratedPassword} className="vault-field-btn" title="Güçlü Şifre Üret">
                      <i className="fa-solid fa-dice"></i>
                    </button>
                  </div>
                </div>
                {!formStrength.empty && (
                  <div className="vault-strength">
                    <div className="vault-strength-bar">
                      {[0, 1, 2, 3, 4].map(i => (
                        <span key={i} className="vault-strength-seg" style={{ background: i <= formStrength.score ? formStrength.color : 'var(--glass-border)' }}></span>
                      ))}
                    </div>
                    <span className="vault-strength-label" style={{ color: formStrength.color }}>{formStrength.label}</span>
                  </div>
                )}
              </div>

              <div className="um-field">
                <label>Özel Notlar</label>
                <textarea rows="3" style={{ resize: 'none' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Kurtarma kodları veya ekstra bilgiler..."></textarea>
              </div>

              <label className="vault-favorite-toggle">
                <input type="checkbox" checked={!!formData.is_favorite} onChange={e => setFormData({...formData, is_favorite: e.target.checked ? 1 : 0})} />
                <i className={formData.is_favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                <span>Favorilere ekle</span>
              </label>

              <div className="um-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="ev-btn ev-btn-secondary">
                  İptal
                </button>
                <button type="submit" className="ev-btn ev-btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i>
                  {editLink ? 'Değişiklikleri Kaydet' : 'Yeni Kayıt Oluştur'}
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

export default LinksDashboard;
