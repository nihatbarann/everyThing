import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Globe, Plus, Loader, Trash2, Edit, Copy, Eye, EyeOff, ExternalLink, CircleCheck, X, Save } from 'lucide-react';

const LinksDashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewLink, setViewLink] = useState(null);
  const [editLink, setEditLink] = useState(null);
  const [formData, setFormData] = useState({ title: '', url: '', username: '', password: '', notes: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copied, setCopied] = useState(null);

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

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)] w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gradient">
            <Globe className="text-primary w-8 h-8" /> Linkler & Şifreler
          </h1>
          <p className="text-muted mt-2">Sık kullandığınız siteleri, portalları ve giriş bilgilerinizi güvenle saklayın.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="um-btn-primary whitespace-nowrap px-5 py-2.5 flex items-center gap-2">
          <Plus className="w-5 h-5"/> Yeni Link Ekle
        </button>
      </header>

      {/* Grid Status */}
      {loading ? (
        <div className="flex items-center justify-center p-10"><Loader className="w-8 h-8 animate-spin text-primary"/></div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-muted border border-dashed border-[var(--glass-border)] rounded-2xl bg-[hsla(0,0%,0%,0.1)]">
          <Globe className="w-16 h-16 mb-4 opacity-30"/>
          <p className="text-lg">Henüz kayıtlı bir linkiniz yok.</p>
          <p className="opacity-70 mt-1">Yarıdaki butona tıklayarak ilk kasanızı oluşturun.</p>
        </div>
      ) : (
        <div 
          className="w-full mb-10" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', 
            gap: '1rem' 
          }}
        >
          {links.map(link => (
            <div 
              key={link.id} 
              className="premium-card hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] transition-all group flex flex-col justify-between p-3.5 h-[105px]"
            >
              
              <div className="flex items-center gap-2 mb-1 w-full overflow-hidden">
                <div className="w-6 h-6 shrink-0 bg-[var(--bg-hover)] rounded-md flex items-center justify-center overflow-hidden border border-[var(--glass-border)] shadow-inner">
                  <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}`} alt="logo" className="w-3.5 h-3.5 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                  <Globe className="w-3 h-3 text-[var(--text-muted)] hidden" />
                </div>
                <h3 className="font-bold text-[13px] leading-tight truncate text-[var(--text-main)] flex-1" title={link.title}>
                  {link.title}
                </h3>
              </div>
              
              <div className="mt-auto flex justify-between items-center pt-2.5 border-t border-[var(--glass-border)] text-[var(--text-muted)] opacity-70 group-hover:opacity-100 transition-opacity">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md hover:text-primary transition-colors flex items-center justify-center" title="Siteye Git">
                  <ExternalLink className="w-[15px] h-[15px]"/>
                </a>
                <button onClick={() => setViewLink(link)} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md hover:text-[var(--text-main)] transition-colors flex items-center justify-center" title="Görüntüle">
                  <Eye className="w-[15px] h-[15px]"/>
                </button>
                <button onClick={() => handleOpenModal(link)} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md hover:text-primary transition-colors flex items-center justify-center" title="Düzenle">
                  <Edit className="w-[15px] h-[15px]"/>
                </button>
                <button onClick={() => handleDelete(link.id)} className="p-1.5 hover:bg-[var(--error)]/20 rounded-md hover:text-[var(--error)] transition-colors flex items-center justify-center" title="Sil">
                  <Trash2 className="w-[15px] h-[15px]"/>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* View Modal Overlay */}
      {viewLink && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setViewLink(null)} />
          <div className="bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-[450px] relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 isolate my-auto">
            <button onClick={() => setViewLink(null)} className="absolute right-4 top-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-full transition-colors z-20">
              <X className="w-5 h-5"/>
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--glass-border)]">
              <div className="w-12 h-12 bg-[var(--bg-surface)] rounded-xl border border-[var(--glass-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(viewLink.url)}`} alt="logo" className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <Globe className="w-6 h-6 text-[var(--text-muted)] hidden" />
              </div>
              <div className="min-w-0 pr-6">
                <h2 className="text-xl font-bold text-[var(--text-main)] truncate" title={viewLink.title}>{viewLink.title}</h2>
                <a href={viewLink.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate w-full flex items-center gap-1" title={viewLink.url}>
                  {viewLink.url.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3"/>
                </a>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {viewLink.username && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1 block">Kullanıcı Adı</span>
                  <div className="flex items-center justify-between bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--glass-border)] hover:border-primary/20 transition-colors">
                    <span className="text-sm truncate select-all">{viewLink.username}</span>
                    <button onClick={() => copyToClipboard(viewLink.username, 'user', viewLink.id)} className="text-muted hover:text-primary transition-colors ml-2 shrink-0">
                      {copied === `${viewLink.id}-user` ? <CircleCheck className="w-5 h-5 text-success"/> : <Copy className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>
              )}

              {viewLink.password && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1 block">Şifre</span>
                  <div className="flex items-center justify-between bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--glass-border)] hover:border-primary/20 transition-colors">
                    <span className="text-sm truncate select-all tracking-wider font-mono">
                      {visiblePasswords[viewLink.id] ? viewLink.password : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <button onClick={() => togglePasswordVisibility(viewLink.id)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1" title="Göster/Gizle">
                        {visiblePasswords[viewLink.id] ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                      </button>
                      <button onClick={() => copyToClipboard(viewLink.password, 'pass', viewLink.id)} className="text-muted hover:text-primary transition-colors p-1" title="Kopyala">
                        {copied === `${viewLink.id}-pass` ? <CircleCheck className="w-5 h-5 text-success"/> : <Copy className="w-5 h-5"/>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {viewLink.notes && (
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-bold block">Özel Notlar</span>
                  <div className="text-sm text-[var(--text-main)] overflow-hidden px-4 py-3 border-l-[3px] border-primary/50 bg-[var(--bg-hover)] rounded-r-xl break-words whitespace-pre-wrap leading-relaxed opacity-90">
                    {viewLink.notes}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Form Modal Overlay */}
      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {editLink ? <Edit className="w-6 h-6 text-primary"/> : <Plus className="w-6 h-6 text-primary"/>}
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  {editLink ? 'Kaydı Düzenle' : 'Yeni Link Ekle'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="um-field">
                <label>Platform / Site Adı</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                  <input type="text" className="w-full pl-10" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Örn: Github Hesabım" autoFocus />
                </div>
              </div>

              <div className="um-field">
                <label>Web Adresi (URL)</label>
                <div className="relative">
                  <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                  <input type="text" className="w-full pl-10 font-mono" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required placeholder="https://github.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="um-field">
                  <label>Kullanıcı Adı</label>
                  <input type="text" className="w-full" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Email veya kullanıcı" />
                </div>
                <div className="um-field">
                  <label>Şifre</label>
                  <input type="text" className="w-full font-mono tracking-wider" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
              </div>

              <div className="um-field">
                <label>Özel Notlar</label>
                <textarea rows="3" className="w-full resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Kurtarma kodları veya ekstra bilgiler..."></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="um-btn-secondary">
                  İptal
                </button>
                <button type="submit" className="um-btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4"/> 
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
