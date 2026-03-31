import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
// Lucide imports removed

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [roles, setRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [userRes, rolesRes, managersRes, permsRes] = await Promise.all([
        axios.get(`/api/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/roles', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/users/managers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/permissions', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const u = userRes.data.user;
      setFormData({
        role_id: u.role_id?.toString() || '2',
        manager_id: u.manager_id?.toString() || '',
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        date_of_birth: u.date_of_birth || '',
        national_id: u.national_id || '',
        gender: u.gender || '',
        phone1: u.phone1 || '',
        phone2: u.phone2 || '',
        email1: u.email1 || '',
        email2: u.email2 || '',
        email3: u.email3 || '',
        email4: u.email4 || '',
        address: u.address || '',
        work_country: u.work_country || '',
        work_city: u.work_city || '',
        office: u.office || '',
        company: u.company || '',
        department: u.department || '',
        hire_date: u.hire_date || '',
        position: u.position || '',
        description: u.description || '',
        is_active: u.is_active?.toString() || '1',
        _username: u.username,
        _role_name: u.role_name,
        permissions: u.permissions?.map(p => p.toString()) || []
      });

      setRoles(rolesRes.data.roles || []);
      setManagers(managersRes.data.managers || []);
      setPermissions(permsRes.data.permissions || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError(err.response?.data?.error || 'Failed to load user.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionToggle = (permId) => {
    const idStr = permId.toString();
    setFormData(prev => {
      const perms = prev.permissions || [];
      if (perms.includes(idStr)) {
        return { ...prev, permissions: perms.filter(p => p !== idStr) };
      } else {
        return { ...prev, permissions: [...perms, idStr] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = { ...formData };
      delete payload._username;
      delete payload._role_name;

      await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('User updated successfully!');
      setTimeout(() => navigate(`/dashboard/users/${id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const getManagerName = (m) => {
    if (m.first_name || m.last_name) {
      return `${m.first_name || ''} ${m.last_name || ''}`.trim() + ` (@${m.username})`;
    }
    return m.username;
  };

  if (loading || !formData) {
    return (
      <div className="um-loading-page animate-in">
        <i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i>
        <span>Loading user data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in">
      <header className="flex items-center gap-4">
        <div onClick={() => navigate(`/dashboard/users/${id}`)} className="ev-btn ev-btn-icon ev-btn-secondary" style={{ cursor: 'pointer', borderRadius: '50%' }}>
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div>
          <h1 className="text-4xl mb-1 text-gradient">Edit User</h1>
          <p className="text-muted">Editing @{formData._username} ({formData._role_name})</p>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in">
          <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="um-alert-success animate-in">
          <i className="fa-solid fa-circle-check w-5 h-5 flex-shrink-0"></i><span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="um-form-grid">

        {/* Account Settings */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-primary"><i className="fa-solid fa-pen-to-square"></i></div>
            <h2>Account Settings</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>Username</label>
              <input type="text" value={formData._username} disabled className="um-input-disabled" />
              <span className="text-xs text-muted mt-1">Username cannot be changed</span>
            </div>
            <div className="um-field">
              <label>Role</label>
              <select name="role_id" value={formData.role_id} onChange={handleChange}>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="um-field">
              <label>Manager</label>
              <select name="manager_id" value={formData.manager_id} onChange={handleChange}>
                <option value="">No Manager (Top Level)</option>
                {managers.filter(m => m.id.toString() !== id).map(m => (
                  <option key={m.id} value={m.id}>{getManagerName(m)}</option>
                ))}
              </select>
            </div>
            <div className="um-field">
              <label>Status</label>
              <select name="is_active" value={formData.is_active} onChange={handleChange}>
                <option value="1">Active</option>
                <option value="0">Passive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="premium-card delay-2">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-error"><i className="fa-solid fa-shield-halved"></i></div>
            <h2>Permissions (Yetkiler)</h2>
          </div>
          <p className="text-muted text-sm mb-4">Select the specific actions this user is allowed to perform.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions.map(p => {
              const isActive = formData.permissions.includes(p.id.toString());
              return (
                <label 
                  key={p.id} 
                  className={`permission-card ${isActive ? 'active' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={() => handlePermissionToggle(p.id)}
                    style={{ display: 'none' }}
                  />
                  <div className="permission-indicator">
                    <i className="fa-solid fa-check text-xs"></i>
                  </div>
                  <div className="permission-info">
                    <span className="permission-title">{p.name}</span>
                    <span className="permission-desc">{p.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Personal Information */}
        <div className="premium-card delay-2">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-purple"><i className="fa-solid fa-user"></i></div>
            <h2>Personal Information</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>First Name</label>
              <input type="text" name="first_name" value={formData.first_name}
                onChange={handleChange} placeholder="First name" />
            </div>
            <div className="um-field">
              <label>Last Name</label>
              <input type="text" name="last_name" value={formData.last_name}
                onChange={handleChange} placeholder="Last name" />
            </div>
            <div className="um-field">
              <label>Date of Birth</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth}
                onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>National ID (TC Kimlik No)</label>
              <input type="text" name="national_id" value={formData.national_id}
                onChange={handleChange} maxLength="20" />
            </div>
            <div className="um-field">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="premium-card delay-3">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-success"><i className="fa-solid fa-address-book"></i></div>
            <h2>Contact Information</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>Phone 1</label>
              <input type="tel" name="phone1" value={formData.phone1} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Phone 2</label>
              <input type="tel" name="phone2" value={formData.phone2} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Email 1</label>
              <input type="email" name="email1" value={formData.email1} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Email 2</label>
              <input type="email" name="email2" value={formData.email2} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Email 3</label>
              <input type="email" name="email3" value={formData.email3} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Email 4</label>
              <input type="email" name="email4" value={formData.email4} onChange={handleChange} />
            </div>
            <div className="um-field full-width">
              <label>Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows="2" />
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-warning"><i className="fa-solid fa-briefcase"></i></div>
            <h2>Work Information</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>Country</label>
              <input type="text" name="work_country" value={formData.work_country} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>City</label>
              <input type="text" name="work_city" value={formData.work_city} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Office</label>
              <input type="text" name="office" value={formData.office} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Company</label>
              <input type="text" name="company" value={formData.company} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Department</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Position</label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label>Hire Date</label>
              <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} />
            </div>
            <div className="um-field full-width">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="2" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="um-form-actions">
          <button type="button" onClick={() => navigate(`/dashboard/users/${id}`)} className="ev-btn ev-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="ev-btn ev-btn-primary" disabled={saving}>
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;
