import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Key, ToggleLeft, ToggleRight, Trash2,
  User as UserIcon, Mail, Phone, MapPin, Building2, Calendar,
  Shield, Clock, AlertCircle, CheckCircle2, Loader
} from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchPermissions();
  }, [id]);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPermissions(res.data.user?.permissions || []);
    } catch (err) { /* ignore */ }
  };

  const hasPerm = (key) => permissions.includes(key);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(res.data.user);
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

  const handleToggleStatus = async () => {
    try {
      const res = await axios.put(`/api/users/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMsg(res.data.message);
      fetchUser();
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setResetLoading(true);
    try {
      await axios.put(`/api/users/${id}/reset-password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMsg('Password reset successfully!');
      setShowResetModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action uses soft-delete.')) return;
    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/dashboard/users');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="um-loading-page animate-in">
        <Loader className="w-8 h-8 animate-spin text-primary" />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="um-loading-page animate-in">
        <AlertCircle className="w-8 h-8 text-[var(--error)]" />
        <span>{error || 'User not found'}</span>
        <button onClick={() => navigate('/dashboard/users')} className="um-btn-secondary mt-4">
          Back to Users
        </button>
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/users')} className="um-back-btn">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="um-profile-avatar">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">{fullName}</h1>
              <p className="text-muted">@{user.username} · {user.role_name}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="um-actions-bar">
          {hasPerm('user_update') && (
            <>
              <button onClick={() => navigate(`/dashboard/users/${id}/edit`)} className="um-btn-secondary">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => setShowResetModal(true)} className="um-btn-secondary">
                <Key className="w-4 h-4" /> Reset Password
              </button>
              <button onClick={handleToggleStatus}
                className={`um-btn-secondary ${user.is_active ? 'text-success' : 'text-warning'}`}>
                {user.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {user.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </>
          )}
          {hasPerm('user_delete') && (
            <button onClick={handleDelete} className="um-btn-danger">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div className="um-alert-error animate-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}
      {msg && (
        <div className="um-alert-success animate-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" /><span>{msg}</span>
        </div>
      )}

      <div className="um-profile-grid">
        {/* Status & Role Card */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="icon-box"><Shield className="w-5 h-5" /></div>
            <h2>Account Status</h2>
          </div>
          <div className="um-detail-list">
            <div className="um-detail-row">
              <span className="um-detail-label">Status</span>
              <div className={`um-status-badge ${user.is_active ? 'active' : 'passive'}`}>
                <span className="um-status-dot"></span>
                {user.is_active ? 'Active' : 'Passive'}
              </div>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Role</span>
              <div className={`badge ${user.role_name === 'Admin' ? 'positive' : ''}`}>
                {user.role_name === 'Admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                {user.role_name}
              </div>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Manager</span>
              <span className="um-detail-value">
                {user.manager_name || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="premium-card delay-2">
          <div className="um-section-header">
            <div className="icon-box purple"><UserIcon className="w-5 h-5" /></div>
            <h2>Personal Information</h2>
          </div>
          <div className="um-detail-list">
            <div className="um-detail-row">
              <span className="um-detail-label">First Name</span>
              <span className="um-detail-value">{user.first_name || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Last Name</span>
              <span className="um-detail-value">{user.last_name || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Date of Birth</span>
              <span className="um-detail-value">{formatDate(user.date_of_birth)}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">National ID</span>
              <span className="um-detail-value">{user.national_id || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Gender</span>
              <span className="um-detail-value" style={{ textTransform: 'capitalize' }}>{user.gender || '—'}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="premium-card delay-3">
          <div className="um-section-header">
            <div className="icon-box success"><Mail className="w-5 h-5" /></div>
            <h2>Contact Information</h2>
          </div>
          <div className="um-detail-list">
            <div className="um-detail-row">
              <span className="um-detail-label"><Phone className="w-3 h-3" /> Phone 1</span>
              <span className="um-detail-value">{user.phone1 || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Phone className="w-3 h-3" /> Phone 2</span>
              <span className="um-detail-value">{user.phone2 || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Mail className="w-3 h-3" /> Email 1</span>
              <span className="um-detail-value">{user.email1 || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Mail className="w-3 h-3" /> Email 2</span>
              <span className="um-detail-value">{user.email2 || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Mail className="w-3 h-3" /> Email 3</span>
              <span className="um-detail-value">{user.email3 || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Mail className="w-3 h-3" /> Email 4</span>
              <span className="um-detail-value">{user.email4 || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><MapPin className="w-3 h-3" /> Address</span>
              <span className="um-detail-value">{user.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="premium-card delay-1">
          <div className="um-section-header">
            <div className="icon-box warning"><Building2 className="w-5 h-5" /></div>
            <h2>Work Information</h2>
          </div>
          <div className="um-detail-list">
            <div className="um-detail-row">
              <span className="um-detail-label">Country</span>
              <span className="um-detail-value">{user.work_country || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">City</span>
              <span className="um-detail-value">{user.work_city || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Office</span>
              <span className="um-detail-value">{user.office || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Company</span>
              <span className="um-detail-value">{user.company || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Department</span>
              <span className="um-detail-value">{user.department || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Position</span>
              <span className="um-detail-value">{user.position || '—'}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Hire Date</span>
              <span className="um-detail-value">{formatDate(user.hire_date)}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label">Description</span>
              <span className="um-detail-value">{user.description || '—'}</span>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="premium-card delay-2">
          <div className="um-section-header">
            <div className="icon-box"><Clock className="w-5 h-5" /></div>
            <h2>System Information</h2>
          </div>
          <div className="um-detail-list">
            <div className="um-detail-row">
              <span className="um-detail-label"><Calendar className="w-3 h-3" /> Created At</span>
              <span className="um-detail-value">{formatDateTime(user.created_at)}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Calendar className="w-3 h-3" /> Updated At</span>
              <span className="um-detail-value">{formatDateTime(user.updated_at)}</span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><UserIcon className="w-3 h-3" /> Created By</span>
              <span className="um-detail-value">
                {user.created_by_name || '—'}
              </span>
            </div>
            <div className="um-detail-row">
              <span className="um-detail-label"><Clock className="w-3 h-3" /> Last Login</span>
              <span className="um-detail-value">{formatDateTime(user.last_login)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p className="text-muted text-sm mb-4">Set a new password for <strong>@{user.username}</strong></p>
            <div className="um-field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoFocus
              />
            </div>
            <div className="um-field mt-4">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Retype new password"
              />
            </div>
            <div className="um-modal-actions mt-6">
              <button onClick={() => { setShowResetModal(false); setNewPassword(''); setConfirmPassword(''); }} className="um-btn-secondary">
                Cancel
              </button>
              <button onClick={handleResetPassword} className="um-btn-primary" disabled={resetLoading}>
                {resetLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Reset
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserProfile;
