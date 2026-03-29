import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const LinksDashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewLink, setViewLink] = useState(null);
  const [editLink, setEditLink] = useState(null);
  const [formData, setFormData] = useState({ title: '', url: '', username: '', password: '', notes: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copied, setCopied] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await axios.get('/api/links', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLinks(res.data.links || []);
    } catch(err) { } finally { setLoading(false); }
  };

  const handleOpenModal = (link = null) => {
    if (link) {
      setEditLink(link);
      setFormData(link);
    } else {
      setEditLink(null);
      setFormData({ title: '', url: '', username: '', password: '', notes: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.url && !payload.url.startsWith('http')) payload.url = 'https://' + payload.url;

      if (editLink) {
        await axios.put(`/api/links/${editLink.id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post('/api/links', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setShowModal(false);
      fetchLinks();
    } catch(err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/links/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchLinks();
    } catch(err) {}
  };

  const copyToClipboard = (text, type, id) => {
    navigator.clipboard.writeText(text);
    setCopied(`${id}-${type}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getDomain = (url) => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  };

  const filteredLinks = links.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gradient">
            <i className="fa-solid fa-vault text-primary text-3xl"></i> Linkler & Şifreler
          </h1>
          <p className="text-muted mt-2">Sık kullandığınız siteleri, portalları ve giriş bilgilerinizi güvenle saklayın.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="um-search-box" style={{ maxWidth: '260px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}></i>
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="um-search-input"
            />
          </div>
          <div onClick={() => handleOpenModal()} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-plus"></i>
            <span>Yeni Link</span>
          </div>
        </div>
      </header>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: '5rem' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>
      ) : filteredLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted" style={{ padding: '5rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-xl)', background: 'hsla(0,0%,0%,0.05)' }}>
          <i className="fa-solid fa-vault" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}></i>
          <p style={{ fontSize: '1.1rem' }}>{links.length === 0 ? 'Henüz kayıtlı bir linkiniz yok.' : 'Aramayla eşleşen sonuç bulunamadı.'}</p>
          {links.length === 0 && <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Yukarıdaki butona tıklayarak ilk kasanızı oluşturun.</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {filteredLinks.map(link => (
            <div 
              key={link.id} 
              className="premium-card group"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}
            >
              
              {/* Top: favicon + title + domain */}
              <div>
                <div className="flex items-center gap-2.5" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ width: '36px', height: '36px', flexShrink: 0, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <img 
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}`} 
                      alt="" 
                      style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                    <i className="fa-solid fa-globe" style={{ display: 'none', color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }} title={link.title}>
                      {link.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getDomain(link.url)}
                    </p>
                  </div>
                </div>

                {/* Username preview */}
                {link.username && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <i className="fa-solid fa-user" style={{ fontSize: '0.65rem' }}></i>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.username}</span>
                  </div>
                )}
              </div>

              {/* Bottom: Actions */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="ev-icon ev-icon-sm ev-icon-action" title="Siteye Git">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <div className="flex items-center gap-1">
                  <div onClick={() => setViewLink(link)} className="ev-icon ev-icon-sm ev-icon-action" title="Görüntüle">
                    <i className="fa-solid fa-eye"></i>
                  </div>
                  <div onClick={() => handleOpenModal(link)} className="ev-icon ev-icon-sm ev-icon-action" title="Düzenle">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </div>
                  <div onClick={() => handleDelete(link.id)} className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" title="Sil">
                    <i className="fa-solid fa-trash-can"></i>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

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
              <button onClick={() => setViewLink(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', fontSize: '1.1rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {viewLink.username && (
                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Kullanıcı Adı</span>
                  <div className="flex items-center justify-between" style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.9rem', userSelect: 'all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewLink.username}</span>
                    <button onClick={() => copyToClipboard(viewLink.username, 'user', viewLink.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '0.5rem', flexShrink: 0 }}>
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
                      <button onClick={() => togglePasswordVisibility(viewLink.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }} title="Göster/Gizle">
                        {visiblePasswords[viewLink.id] ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                      </button>
                      <button onClick={() => copyToClipboard(viewLink.password, 'pass', viewLink.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }} title="Kopyala">
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
              
              <div className="um-field">
                <label>Platform / Site Adı</label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-globe" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.85rem' }}></i>
                  <input type="text" style={{ paddingLeft: '2.5rem' }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Örn: Github Hesabım" autoFocus />
                </div>
              </div>

              <div className="um-field">
                <label>Web Adresi (URL)</label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.85rem' }}></i>
                  <input type="text" style={{ paddingLeft: '2.5rem', fontFamily: 'monospace' }} value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required placeholder="https://github.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="um-field">
                  <label>Kullanıcı Adı</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Email veya kullanıcı" />
                </div>
                <div className="um-field">
                  <label>Şifre</label>
                  <input type="text" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
              </div>

              <div className="um-field">
                <label>Özel Notlar</label>
                <textarea rows="3" style={{ resize: 'none' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Kurtarma kodları veya ekstra bilgiler..."></textarea>
              </div>
              
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
