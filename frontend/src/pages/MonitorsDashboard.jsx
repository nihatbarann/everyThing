import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyForm = { name: '', location: '', device_type: 'switch', check_type: 'tcp', target: '', port: '', username: '', password: '' };

const generatePassword = (length = 16) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+';
  const rand = new Uint32Array(length);
  crypto.getRandomValues(rand);
  return Array.from(rand, (n) => charset[n % charset.length]).join('');
};

const deviceIcon = (t) => ({
  switch: 'fa-network-wired',
  access_point: 'fa-wifi',
  modem: 'fa-ethernet',
  router: 'fa-tower-broadcast',
  camera: 'fa-video',
  server: 'fa-server',
  other: 'fa-microchip',
}[t] || 'fa-microchip');

const deviceLabel = (t) => ({
  switch: 'Switch', access_point: 'Access Point', modem: 'Modem', router: 'Router',
  camera: 'IP Kamera', server: 'Sunucu', other: 'Diğer',
}[t] || 'Diğer');

const timeAgo = (iso) => {
  if (!iso) return 'hiç kontrol edilmedi';
  const diffSec = Math.floor((Date.now() - new Date(iso.replace(' ', 'T'))) / 1000);
  if (diffSec < 60) return `${diffSec} sn önce`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} sa önce`;
  return `${Math.floor(diffSec / 86400)} gün önce`;
};

const POLL_INTERVAL_MS = 60000;

const MonitorsDashboard = () => {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [pwdVisible, setPwdVisible] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchMonitors();
    pollRef.current = setInterval(() => { handleCheckAll(true); }, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchMonitors = async () => {
    try {
      const res = await axios.get('/api/monitors', authHeaders());
      setMonitors(res.data.monitors || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const handleCheckAll = async (silent = false) => {
    if (!silent) setCheckingAll(true);
    try {
      await axios.post('/api/monitors/check-all', {}, authHeaders());
      await fetchMonitors();
    } catch (err) { } finally {
      if (!silent) setCheckingAll(false);
    }
  };

  const handleCheckOne = async (id) => {
    setCheckingId(id);
    try {
      await axios.post(`/api/monitors/${id}/check`, {}, authHeaders());
      await fetchMonitors();
    } catch (err) { } finally {
      setCheckingId(null);
    }
  };

  const openCreate = () => { setFormData(emptyForm); setEditingId(null); setPwdVisible(false); setShowModal(true); };
  const openEdit = (m) => {
    setFormData({
      name: m.name, location: m.location || '', device_type: m.device_type, check_type: m.check_type,
      target: m.target, port: m.port ?? '', username: m.username || '', password: m.password || ''
    });
    setEditingId(m.id);
    setPwdVisible(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/monitors/${editingId}`, formData, authHeaders());
      } else {
        await axios.post('/api/monitors', formData, authHeaders());
      }
      setShowModal(false);
      fetchMonitors();
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu cihazı izlemeden kaldırmak istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/monitors/${id}`, authHeaders());
      fetchMonitors();
    } catch (err) { }
  };

  const locations = Array.from(new Set(monitors.map(m => m.location || 'Diğer')));
  const downCount = monitors.filter(m => m.last_status === 'down').length;
  const existingLocations = Array.from(new Set(monitors.map(m => m.location).filter(Boolean)));

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-tower-broadcast text-primary text-3xl shrink-0"></i>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Cihaz İzleme</h1>
            <p className="text-muted">Switch, access point, modem, kamera gibi ağ cihazlarının aktiflik durumu.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div onClick={() => handleCheckAll(false)} className="ev-btn ev-btn-secondary" style={{ cursor: 'pointer' }}>
            {checkingAll ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrows-rotate"></i>}
            <span>Tümünü Kontrol Et</span>
          </div>
          <div onClick={openCreate} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-plus"></i>
            <span>Yeni Cihaz</span>
          </div>
        </div>
      </header>

      {downCount > 0 && (
        <div className="um-alert-error">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{downCount} cihaz şu anda erişilemez durumda.</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-10"><i className="fa-solid fa-spinner fa-spin text-primary"></i></div>
      ) : monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-muted border border-dashed" style={{ borderColor: 'var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
          <i className="fa-solid fa-tower-broadcast mb-4" style={{ fontSize: '3rem', opacity: 0.2 }}></i>
          <p className="text-lg">Henüz izlenen cihaz yok.</p>
          <p className="opacity-70 mt-1">"Yeni Cihaz" ile switch, AP, modem veya kamera ekleyin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {locations.map(loc => (
            <div key={loc} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)' }}>
                <i className="fa-solid fa-location-dot"></i>
                {loc}
              </div>
              <div className="grid-container grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
                {monitors.filter(m => (m.location || 'Diğer') === loc).map(m => {
                  const isUp = m.last_status === 'up';
                  const isDown = m.last_status === 'down';
                  const statusColor = isUp ? 'var(--success)' : isDown ? 'var(--error)' : 'var(--text-subtle)';
                  return (
                    <div key={m.id} className="premium-card" style={{ padding: '1.1rem' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                          <div className="ev-icon ev-icon-primary"><i className={`fa-solid ${deviceIcon(m.device_type)}`}></i></div>
                          <div className="flex flex-col" style={{ minWidth: 0 }}>
                            <span className="font-bold truncate flex items-center gap-1.5" style={{ color: 'var(--text-main)' }} title={m.name}>
                              {m.name}
                              {(m.username || m.password) && <i className="fa-solid fa-key text-subtle" style={{ fontSize: '0.7rem' }} title="Yönetim bilgileri kayıtlı"></i>}
                            </span>
                            <span className="text-subtle truncate" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{m.target}{m.port ? `:${m.port}` : ''}</span>
                          </div>
                        </div>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor, flexShrink: 0, marginTop: '4px', boxShadow: isUp ? `0 0 8px ${statusColor}` : 'none' }} title={isUp ? 'Aktif' : isDown ? 'Erişilemiyor' : 'Bilinmiyor'}></span>
                      </div>

                      <div className="flex items-center justify-between" style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                        <span className="text-subtle">{deviceLabel(m.device_type)}</span>
                        <span className="text-muted">{timeAgo(m.last_checked_at)}</span>
                      </div>

                      <div className="flex items-center justify-between" style={{ marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        <span className="text-muted">{m.last_response_ms != null ? `${m.last_response_ms} ms` : '—'}</span>
                        <span className="text-muted">{m.uptime_24h != null ? `${m.uptime_24h}% (24s)` : '—'}</span>
                      </div>

                      <div className="flex items-center gap-2" style={{ marginTop: '0.9rem' }}>
                        <div onClick={() => handleCheckOne(m.id)} className="ev-btn ev-btn-secondary ev-btn-sm" style={{ cursor: 'pointer', flex: 1 }}>
                          {checkingId === m.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrows-rotate"></i>}
                          <span>Kontrol Et</span>
                        </div>
                        <div onClick={() => openEdit(m)} className="ev-icon ev-icon-sm ev-icon-action" title="Düzenle">
                          <i className="fa-solid fa-pen-to-square"></i>
                        </div>
                        <div onClick={() => handleDelete(m.id)} className="ev-icon ev-icon-sm ev-icon-action ev-hover-error" title="Kaldır">
                          <i className="fa-solid fa-trash-can"></i>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" style={{ maxWidth: '36rem' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowModal(false)} className="um-modal-close" title="Kapat">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="um-modal-header">
              <div className="ev-icon ev-icon-lg ev-icon-primary">
                <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-tower-broadcast'}`}></i>
              </div>
              <div className="um-modal-header-text">
                <h2>{editingId ? 'Cihazı Düzenle' : 'Yeni Cihaz'}</h2>
                <p className="um-modal-header-subtitle">İzlenecek ağ cihazının bilgilerini ve erişim yöntemini tanımlayın.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="um-form-grid">
              <div className="um-form-section">
                <div className="um-form-section-title"><i className="fa-solid fa-circle-info"></i>Genel Bilgiler</div>
                <div className="um-field-grid">
                  <div className="um-field">
                    <label>Cihaz Adı *</label>
                    <div className="input-icon-wrap">
                      <i className="fa-solid fa-tag"></i>
                      <input type="text" required autoFocus value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: Merkez Ofis Switch 1" />
                    </div>
                  </div>
                  <div className="um-field">
                    <label>Lokasyon</label>
                    <div className="input-icon-wrap">
                      <i className="fa-solid fa-location-dot"></i>
                      <input type="text" list="monitor-location-options" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Örn: Merkez Ofis, Şube 1" />
                      <datalist id="monitor-location-options">
                        {existingLocations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="um-field">
                    <label>Cihaz Türü</label>
                    <select value={formData.device_type} onChange={e => setFormData({ ...formData, device_type: e.target.value })}>
                      <option value="switch">Switch</option>
                      <option value="access_point">Access Point</option>
                      <option value="modem">Modem</option>
                      <option value="router">Router</option>
                      <option value="camera">IP Kamera</option>
                      <option value="server">Sunucu</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="um-form-section">
                <div className="um-form-section-title"><i className="fa-solid fa-satellite-dish"></i>Bağlantı Ayarları</div>
                <div className="um-field-grid">
                  <div className="um-field">
                    <label>Kontrol Yöntemi</label>
                    <select value={formData.check_type} onChange={e => setFormData({ ...formData, check_type: e.target.value })}>
                      <option value="tcp">TCP Port</option>
                      <option value="http">HTTP(S)</option>
                    </select>
                  </div>
                  <div className="um-field">
                    <label>IP / Hostname *</label>
                    <div className="input-icon-wrap">
                      <i className="fa-solid fa-network-wired"></i>
                      <input type="text" required style={{ fontFamily: 'var(--font-mono)' }} value={formData.target} onChange={e => setFormData({ ...formData, target: e.target.value })} placeholder="192.168.1.10" />
                    </div>
                  </div>
                  <div className="um-field">
                    <label>Port {formData.check_type === 'tcp' ? '(vars. 80)' : '(URL ise boş bırakın)'}</label>
                    <input type="number" min="1" max="65535" value={formData.port} onChange={e => setFormData({ ...formData, port: e.target.value })} placeholder="80" />
                  </div>
                </div>
              </div>

              <div className="um-form-section">
                <div className="um-form-section-title"><i className="fa-solid fa-key"></i>Yönetim Kimlik Bilgileri (Opsiyonel)</div>
                <div className="um-field-grid">
                  <div className="um-field">
                    <label>Kullanıcı Adı</label>
                    <div className="input-icon-wrap">
                      <i className="fa-solid fa-user"></i>
                      <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="admin" autoComplete="off" />
                    </div>
                  </div>
                  <div className="um-field" style={{ gridColumn: 'span 2' }}>
                    <label>Şifre</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={pwdVisible ? 'text' : 'password'}
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', paddingRight: '5rem' }}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.15rem' }}>
                        <button type="button" onClick={() => setPwdVisible(v => !v)} className="vault-field-btn" title="Göster/Gizle">
                          <i className={pwdVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                        </button>
                        <button type="button" onClick={() => { setFormData(prev => ({ ...prev, password: generatePassword() })); setPwdVisible(true); }} className="vault-field-btn" title="Güçlü Şifre Üret">
                          <i className="fa-solid fa-dice"></i>
                        </button>
                      </div>
                    </div>
                  </div>
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

export default MonitorsDashboard;
