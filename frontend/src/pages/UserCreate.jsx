import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Lucide imports removed

const UserCreate = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', role_id: '2', manager_id: '',
    first_name: '', last_name: '', date_of_birth: '', national_id: '',
    gender: '', phone1: '', phone2: '',
    email1: '', email2: '', email3: '', email4: '',
    address: '', work_country: '', work_city: '', office: '',
    company: '', department: '', hire_date: '', position: '',
    description: '', is_active: '1'
  });
  const [roles, setRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
    fetchManagers();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRoles(res.data.roles || []);
    } catch (err) { /* ignore */ }
  };

  const fetchManagers = async () => {
    try {
      const res = await axios.get('/api/users/managers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setManagers(res.data.managers || []);
    } catch (err) { /* ignore */ }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = { ...formData };
      // Clean empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = undefined;
      });
      // Keep required fields
      payload.username = formData.username;
      payload.password = formData.password;
      payload.role_id = formData.role_id;

      await axios.post('/api/users', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('User created successfully!');
      setTimeout(() => navigate('/dashboard/users'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const getManagerName = (m) => {
    if (m.first_name || m.last_name) {
      return `${m.first_name || ''} ${m.last_name || ''}`.trim() + ` (@${m.username})`;
    }
    return m.username;
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in">
      <header className="flex items-center gap-4">
        <div onClick={() => navigate('/dashboard/users')} className="ev-btn ev-btn-icon ev-btn-secondary" style={{ cursor: 'pointer', borderRadius: '50%' }}>
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div>
          <h1 className="text-4xl mb-1 text-gradient">Create New User</h1>
          <p className="text-muted">Set up a new employee account</p>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in">
          <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="um-alert-success animate-in">
          <i className="fa-solid fa-circle-check w-5 h-5 flex-shrink-0"></i>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="um-form-grid">

        {/* Account Information */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-primary"><i className="fa-solid fa-user-plus"></i></div>
            <h2>Account Information</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>Username *</label>
              <input type="text" name="username" value={formData.username}
                onChange={handleChange} required placeholder="e.g. john_doe" />
            </div>
            <div className="um-field">
              <label>Password *</label>
              <input type="password" name="password" value={formData.password}
                onChange={handleChange} required placeholder="Min. 6 characters" />
            </div>
            <div className="um-field">
              <label>Role *</label>
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
                {managers.map(m => (
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

        {/* Personal Information */}
        <div className="premium-card delay-2">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-purple"><i className="fa-solid fa-user-plus"></i></div>
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
                onChange={handleChange} placeholder="National ID" maxLength="20" />
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
            <div className="ev-icon ev-icon-success"><i className="fa-solid fa-user-plus"></i></div>
            <h2>Contact Information</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>Phone 1</label>
              <input type="tel" name="phone1" value={formData.phone1}
                onChange={handleChange} placeholder="+90 555 123 4567" />
            </div>
            <div className="um-field">
              <label>Phone 2</label>
              <input type="tel" name="phone2" value={formData.phone2}
                onChange={handleChange} placeholder="Alternative phone" />
            </div>
            <div className="um-field">
              <label>Email 1</label>
              <input type="email" name="email1" value={formData.email1}
                onChange={handleChange} placeholder="primary@email.com" />
            </div>
            <div className="um-field">
              <label>Email 2</label>
              <input type="email" name="email2" value={formData.email2}
                onChange={handleChange} placeholder="secondary@email.com" />
            </div>
            <div className="um-field">
              <label>Email 3</label>
              <input type="email" name="email3" value={formData.email3}
                onChange={handleChange} placeholder="Optional" />
            </div>
            <div className="um-field">
              <label>Email 4</label>
              <input type="email" name="email4" value={formData.email4}
                onChange={handleChange} placeholder="Optional" />
            </div>
            <div className="um-field full-width">
              <label>Address</label>
              <textarea name="address" value={formData.address}
                onChange={handleChange} rows="2" placeholder="Full address" />
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="ev-icon ev-icon-warning"><i className="fa-solid fa-user-plus"></i></div>
            <h2>Work Information</h2>
          </div>
          <div className="um-field-grid">
            <div className="um-field">
              <label>Country</label>
              <input type="text" name="work_country" value={formData.work_country}
                onChange={handleChange} placeholder="e.g. Turkey" />
            </div>
            <div className="um-field">
              <label>City</label>
              <input type="text" name="work_city" value={formData.work_city}
                onChange={handleChange} placeholder="e.g. Istanbul" />
            </div>
            <div className="um-field">
              <label>Office</label>
              <input type="text" name="office" value={formData.office}
                onChange={handleChange} placeholder="Office location" />
            </div>
            <div className="um-field">
              <label>Company</label>
              <input type="text" name="company" value={formData.company}
                onChange={handleChange} placeholder="Company name" />
            </div>
            <div className="um-field">
              <label>Department</label>
              <input type="text" name="department" value={formData.department}
                onChange={handleChange} placeholder="Department" />
            </div>
            <div className="um-field">
              <label>Position</label>
              <input type="text" name="position" value={formData.position}
                onChange={handleChange} placeholder="Job title" />
            </div>
            <div className="um-field">
              <label>Hire Date</label>
              <input type="date" name="hire_date" value={formData.hire_date}
                onChange={handleChange} />
            </div>
            <div className="um-field full-width">
              <label>Description</label>
              <textarea name="description" value={formData.description}
                onChange={handleChange} rows="2" placeholder="Notes or description" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="um-form-actions">
          <button type="button" onClick={() => navigate('/dashboard/users')} className="ev-btn ev-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="ev-btn ev-btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-plus"></i>
                Create User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;
