import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Lucide imports removed

const MyProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({});
  
  // Password Reset State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(res.data.user);
      setFormData(res.data.user);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setError('Profil yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    
    try {
      await axios.put(`/api/users/${user.id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMsg('Profil başarıyla güncellendi.');
      fetchProfile(); // refresh data
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Güncelleme başarısız.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setPasswordLoading(true);
    try {
      // Assuming the backend allows users to hit this endpoint for themselves
      await axios.put(`/api/users/${user.id}/reset-password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMsg('Şifreniz başarıyla değiştirildi!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Şifre değiştirilemedi.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('tr-TR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="um-loading-page animate-in">
        <i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i>
        <span>Profil yükleniyor...</span>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role_name === 'Admin';
  // If not admin, completely disable all inputs visually and functionally
  const isReadonly = !isAdmin;

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Profilim</h1>
          <p className="text-muted">Profil bilgilerinizi buradan {isAdmin ? 'görüntüleyebilir ve düzenleyebilirsiniz.' : 'tüm detaylarıyla görüntüleyebilirsiniz.'}</p>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in">
          <i className="fa-solid fa-circle-exclamation w-5 h-5 shrink-0"></i><span>{error}</span>
        </div>
      )}
      {msg && (
        <div className="um-alert-success animate-in">
          <i className="fa-solid fa-circle-check w-5 h-5 shrink-0"></i><span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* Şifre Değiştirme Butonu */}
        <div className="flex justify-end">
          <button 
            type="button" 
            onClick={() => setShowPasswordModal(true)} 
            className="ev-btn ev-btn-secondary"
          >
            <i className="fa-solid fa-key"></i> Şifremi Değiştir
          </button>
        </div>

        {/* Hesap Bilgileri */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-primary"><i className="fa-solid fa-shield-halved"></i></div>
            <h2>Hesap Durumu</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="um-field opacity-70">
              <label>Rol</label>
              <input type="text" value={user.role_name || '—'} disabled className="w-full" />
            </div>
            <div className="um-field opacity-70">
              <label>Yönetici (Manager)</label>
              <input type="text" value={user.manager_name || '—'} disabled className="w-full" />
            </div>
            <div className="um-field opacity-70">
              <label>Durum</label>
              <input type="text" value={user.is_active ? 'Aktif' : 'Pasif'} disabled className="w-full" />
            </div>
          </div>
        </div>

        {/* Kişisel Bilgiler */}
        <div className="premium-card delay-2">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-purple"><i className="fa-solid fa-user"></i></div>
            <h2>Kişisel Bilgiler</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Kullanıcı Adı</label>
              <input type="text" name="username" value={formData.username || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>TC Kimlik Nu.</label>
              <input type="text" name="national_id" value={formData.national_id || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Ad</label>
              <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Soyad</label>
              <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Doğum Tarihi</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Cinsiyet</label>
              <select name="gender" value={formData.gender || ''} onChange={handleChange} disabled={isReadonly} className="w-full">
                <option value="">Seçiniz</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="premium-card delay-3">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-success"><i className="fa-solid fa-envelope"></i></div>
            <h2>İletişim Bilgileri</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Email 1</label>
              <input type="email" name="email1" value={formData.email1 || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Email 2</label>
              <input type="email" name="email2" value={formData.email2 || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Email 3</label>
              <input type="email" name="email3" value={formData.email3 || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Email 4</label>
              <input type="email" name="email4" value={formData.email4 || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label><i className="fa-solid fa-phone w-3 h-3 inline mr-1"></i> Telefon 1</label>
              <input type="text" name="phone1" value={formData.phone1 || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label><i className="fa-solid fa-phone w-3 h-3 inline mr-1"></i> Telefon 2</label>
              <input type="text" name="phone2" value={formData.phone2 || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field md:col-span-2 ${isReadonly ? 'opacity-70' : ''}`}>
              <label><i className="fa-solid fa-location-dot w-3 h-3 inline mr-1"></i> Adres</label>
              <textarea name="address" value={formData.address || ''} onChange={handleChange} disabled={isReadonly} className="w-full" rows="3"></textarea>
            </div>
          </div>
        </div>

        {/* İş Bilgileri */}
        <div className="premium-card">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-warning"><i className="fa-solid fa-building"></i></div>
            <h2>İş Bilgileri</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Ülke</label>
              <input type="text" name="work_country" value={formData.work_country || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Şehir</label>
              <input type="text" name="work_city" value={formData.work_city || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Ofis</label>
              <input type="text" name="office" value={formData.office || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Şirket</label>
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Departman</label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Pozisyon</label>
              <input type="text" name="position" value={formData.position || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field ${isReadonly ? 'opacity-70' : ''}`}>
              <label>İşe Giriş Tarihi (Hire Date)</label>
              <input type="date" name="hire_date" value={formData.hire_date || ''} onChange={handleChange} disabled={isReadonly} className="w-full" />
            </div>
            <div className={`um-field md:col-span-2 ${isReadonly ? 'opacity-70' : ''}`}>
              <label>Açıklama (Description)</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange} disabled={isReadonly} className="w-full" rows="3"></textarea>
            </div>
          </div>
        </div>

        {/* Sistem Bilgileri */}
        <div className="premium-card">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-primary"><i className="fa-solid fa-clock"></i></div>
            <h2>Sistem Bilgileri</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="um-field opacity-70">
              <label><i className="fa-solid fa-calendar-alt w-3 h-3 inline mr-1"></i> Kayıt Tarihi</label>
              <input type="text" value={formatDateTime(user.created_at)} disabled className="w-full" />
            </div>
            <div className="um-field opacity-70">
              <label><i className="fa-solid fa-calendar-alt w-3 h-3 inline mr-1"></i> Son Güncelleme</label>
              <input type="text" value={formatDateTime(user.updated_at)} disabled className="w-full" />
            </div>
            <div className="um-field opacity-70">
              <label><i className="fa-solid fa-user-circle w-3 h-3 inline mr-1"></i> Oluşturan</label>
              <input type="text" value={user.created_by_name || '—'} disabled className="w-full" />
            </div>
            <div className="um-field opacity-70">
              <label><i className="fa-solid fa-clock w-3 h-3 inline mr-1"></i> Son Giriş</label>
              <input type="text" value={formatDateTime(user.last_login)} disabled className="w-full" />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end mt-4">
            <button type="submit" className="ev-btn ev-btn-primary" disabled={saving}>
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
              Değişiklikleri Kaydet
            </button>
          </div>
        )}
      </form>

      {/* Password Reset Modal */}
      {showPasswordModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h3>Şifre Değiştir</h3>
            <p className="text-muted text-sm mb-4">Lütfen yeni şifrenizi girin.</p>
            <div className="um-field">
              <label>Yeni Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                autoFocus
              />
            </div>
            <div className="um-field mt-3">
              <label>Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Şifreyi doğrulayın"
              />
            </div>
            <div className="um-modal-actions mt-6">
              <button type="button" onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }} className="ev-btn ev-btn-secondary">
                İptal
              </button>
              <button type="button" onClick={handleChangePassword} className="ev-btn ev-btn-primary" disabled={passwordLoading}>
                {passwordLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-key"></i>}
                Şifreyi Güncelle
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyProfile;
