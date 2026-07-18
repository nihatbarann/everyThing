import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyForm = { title: '', type: 'domain', hostname: '', expires_at: '', provider: '', reminder_days: 30, notes: '' };

const typeLabel = (t) => t === 'ssl' ? 'SSL Sertifikası' : t === 'domain' ? 'Domain' : 'Diğer';
const typeIcon = (t) => t === 'ssl' ? 'fa-lock' : t === 'domain' ? 'fa-globe' : 'fa-file-shield';

const urgency = (daysLeft, reminderDays) => {
  if (daysLeft < 0) return { key: 'expired', label: 'Süresi Doldu', color: 'var(--error)' };
  if (daysLeft <= 7) return { key: 'critical', label: `${daysLeft} gün kaldı`, color: 'var(--error)' };
  if (daysLeft <= reminderDays) return { key: 'warning', label: `${daysLeft} gün kaldı`, color: 'var(--warning)' };
  return { key: 'ok', label: `${daysLeft} gün kaldı`, color: 'var(--success)' };
};

const CertificatesDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [checkingId, setCheckingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | domain | ssl | other

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/certificates', authHeaders());
      setItems(res.data.certificates || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const openCreate = () => { setFormData(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (item) => {
    setFormData({
      title: item.title, type: item.type, hostname: item.hostname || '',
      expires_at: item.expires_at ? item.expires_at.substring(0, 10) : '',
      provider: item.provider || '', reminder_days: item.reminder_days, notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/certificates/${editingId}`, formData, authHeaders());
      } else {
        await axios.post('/api/certificates', formData, authHeaders());
      }
      setShowModal(false);
      fetchItems();
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/certificates/${id}`, authHeaders());
      fetchItems();
    } catch (err) { }
  };

  const handleCheckNow = async (id) => {
    setCheckingId(id);
    try {
      await axios.post(`/api/certificates/${id}/check`, {}, authHeaders());
      await fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Kontrol başarısız oldu.');
    } finally {
      setCheckingId(null);
    }
  };

  const filtered = items.filter(i => filter === 'all' || i.type === filter);
  const expiringSoon = items.filter(i => i.days_left <= i.reminder_days).length;

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-certificate text-primary text-3xl shrink-0"></i>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Sertifikalar &amp; Domainler</h1>
            <p className="text-muted">Domain ve SSL sertifikası son kullanma tarihlerini takip edin.</p>
          </div>
        </div>
        <div onClick={openCreate} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-plus"></i>
          <span>Yeni Kayıt</span>
        </div>
      </header>

      {expiringSoon > 0 && (
        <div className="um-alert-error" style={{ background: 'hsla(38, 92%, 48%, 0.10)', borderColor: 'hsla(38, 92%, 48%, 0.25)', color: 'var(--warning)' }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{expiringSoon} kayıt yakında sona eriyor (hatırlatma süresi içinde).</span>
        </div>
      )}

      <div className="um-filter-group" style={{ width: 'fit-content' }}>
        {['all', 'domain', 'ssl', 'other'].map(f => (
          <button key={f} className={`um-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tümü' : typeLabel(f)}
          </button>
        ))}
      </div>

      <div className="premium-card p-0 overflow-hidden">
        {loading ? (
          <div className="um-loading">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="um-empty">Henüz kayıt yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="um-table">
              <thead>
                <tr>
                  <th>Kayıt</th>
                  <th>Tür</th>
                  <th>Son Kullanma</th>
                  <th>Durum</th>
                  <th className="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const u = urgency(item.days_left, item.reminder_days);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="ev-icon ev-icon-sm ev-icon-primary"><i className={`fa-solid ${typeIcon(item.type)}`}></i></div>
                          <div className="flex flex-col">
                            <span className="font-bold" style={{ color: 'var(--text-main)' }}>{item.title}</span>
                            {item.hostname && <span className="text-subtle" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{item.hostname}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted text-sm">{typeLabel(item.type)}</td>
                      <td className="text-muted text-sm">{new Date(item.expires_at).toLocaleDateString('tr-TR')}</td>
                      <td>
                        <span className="badge" style={{ '--badge-color': u.color }}>{u.label}</span>
                      </td>
                      <td>
                        <div className="um-actions">
                          {item.type === 'ssl' && item.hostname && (
                            <div
                              onClick={() => handleCheckNow(item.id)}
                              className="ev-icon ev-icon-sm ev-icon-action"
                              title="Şimdi Kontrol Et"
                            >
                              {checkingId === item.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrows-rotate"></i>}
                            </div>
                          )}
                          <div onClick={() => openEdit(item)} className="ev-icon ev-icon-sm ev-icon-action" title="Düzenle">
                            <i className="fa-solid fa-pen-to-square"></i>
                          </div>
                          <div onClick={() => handleDelete(item.id)} className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" title="Sil">
                            <i className="fa-solid fa-trash-can"></i>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" style={{ maxWidth: '34rem' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowModal(false)} className="um-modal-close" title="Kapat">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="um-modal-header">
              <div className="ev-icon ev-icon-lg ev-icon-primary">
                <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : typeIcon(formData.type)}`}></i>
              </div>
              <div className="um-modal-header-text">
                <h2>{editingId ? 'Kaydı Düzenle' : 'Yeni Kayıt'}</h2>
                <p className="um-modal-header-subtitle">Son kullanma tarihi yaklaştığında Dashboard'da otomatik uyarı alırsınız.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="um-form-grid">
              <div className="um-form-section">
                <div className="um-form-section-title"><i className="fa-solid fa-circle-info"></i>Genel Bilgiler</div>
                <div className="um-field">
                  <label>Başlık *</label>
                  <div className="input-icon-wrap">
                    <i className="fa-solid fa-tag"></i>
                    <input type="text" required autoFocus value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Örn: Şirket web sitesi SSL" />
                  </div>
                </div>
                <div className="um-field-grid">
                  <div className="um-field">
                    <label>Tür</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                      <option value="domain">Domain</option>
                      <option value="ssl">SSL Sertifikası</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                  {formData.type === 'ssl' && (
                    <div className="um-field" style={{ gridColumn: 'span 2' }}>
                      <label>Hostname (canlı kontrol için)</label>
                      <div className="input-icon-wrap">
                        <i className="fa-solid fa-globe"></i>
                        <input type="text" style={{ fontFamily: 'var(--font-mono)' }} value={formData.hostname} onChange={e => setFormData({ ...formData, hostname: e.target.value })} placeholder="ornek.com" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="um-form-section">
                <div className="um-form-section-title"><i className="fa-solid fa-hourglass-half"></i>Süre &amp; Hatırlatma</div>
                <div className="um-field-grid">
                  <div className="um-field">
                    <label>Son Kullanma Tarihi *</label>
                    <input type="date" required value={formData.expires_at} onChange={e => setFormData({ ...formData, expires_at: e.target.value })} />
                  </div>
                  <div className="um-field">
                    <label>Hatırlatma (gün önce)</label>
                    <input type="number" min="1" value={formData.reminder_days} onChange={e => setFormData({ ...formData, reminder_days: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="um-form-section">
                <div className="um-form-section-title"><i className="fa-solid fa-note-sticky"></i>Ek Bilgiler (Opsiyonel)</div>
                <div className="um-field">
                  <label>Sağlayıcı</label>
                  <input type="text" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} placeholder="Örn: GoDaddy, Let's Encrypt" />
                </div>
                <div className="um-field">
                  <label>Notlar</label>
                  <textarea rows="3" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                </div>
              </div>

              <div className="um-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary"><i className="fa-solid fa-floppy-disk"></i>{editingId ? 'Kaydet' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CertificatesDashboard;
