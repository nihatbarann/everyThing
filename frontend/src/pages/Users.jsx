import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Lucide imports removed

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissions, setPermissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPermissions(res.data.user?.permissions || []);
    } catch (err) { /* ignore */ }
  };

  const hasPerm = (key) => permissions.includes(key);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`/api/users/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getDisplayName = (u) => {
    if (u.first_name || u.last_name) {
      return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    }
    return u.username;
  };

  const getManagerDisplayName = (u) => {
    if (u.manager_name && u.manager_name.trim() && u.manager_name.trim() !== '') {
      return u.manager_name;
    }
    return u.manager_username || '—';
  };

  // Filter users
  const filtered = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.last_name && u.last_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active == 1) ||
      (statusFilter === 'passive' && u.is_active == 0);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">User Management</h1>
          <p className="text-muted text-lg">Manage access control and employee accounts</p>
        </div>
        {hasPerm('user_create') && (
          <div
            onClick={() => navigate('/dashboard/users/create')}
            className="ev-btn ev-btn-primary"
            style={{ cursor: 'pointer' }}
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>Create User</span>
          </div>
        )}
      </header>

      {error && (
        <div className="um-alert-error animate-in">
          <i className="fa-solid fa-circle-exclamation" style={{ flexShrink: 0 }}></i>
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="premium-card p-4">
        <div className="um-filters">
          <div className="um-search-box">
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="um-search-input"
            />
          </div>
          <div className="um-filter-group">
            <button
              className={`um-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >All</button>
            <button
              className={`um-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >Active</button>
            <button
              className={`um-filter-btn ${statusFilter === 'passive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('passive')}
            >Passive</button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="premium-card p-0 overflow-hidden delay-1">
        <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i> Directory
          </h2>
          <div className="badge positive">
            {filtered.length} / {users.length} Users
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="um-loading">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="um-empty">No users found.</div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="um-avatar">
                          {(u.first_name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-[var(--text-main)]">{getDisplayName(u)}</span>
                      </div>

                    </td>
                    <td className="text-muted font-mono text-sm">@{u.username}</td>
                    <td>
                      <div className={`badge ${u.role_name === 'Admin' ? 'positive' : ''}`}>
                        {u.role_name === 'Admin' ? <i className="fa-solid fa-shield-halved" style={{ fontSize: '0.75rem' }}></i> : <i className="fa-solid fa-user" style={{ fontSize: '0.75rem' }}></i>}
                        {u.role_name}
                      </div>
                    </td>
                    <td className="text-muted text-sm">{getManagerDisplayName(u)}</td>
                    <td>
                      <div className={`um-status-badge ${u.is_active == 1 ? 'active' : 'passive'}`}>
                        <span className="um-status-dot"></span>
                        {u.is_active == 1 ? 'Active' : 'Passive'}
                      </div>
                    </td>
                    <td>
                      <div className="um-actions">
                        <div
                          onClick={() => navigate(`/dashboard/users/${u.id}`)}
                          className="ev-icon ev-icon-sm ev-icon-action"
                          title="View Profile"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </div>

                        {hasPerm('user_update') && (
                          <div
                            onClick={() => navigate(`/dashboard/users/${u.id}/edit`)}
                            className="ev-icon ev-icon-sm ev-icon-action"
                            title="Edit User"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </div>
                        )}

                        {hasPerm('user_update') && (
                          <div
                            onClick={() => handleToggleStatus(u.id)}
                            className={`ev-icon ev-icon-sm ev-icon-action ${u.is_active == 1 ? 'ev-hover-warning' : 'ev-hover-success'}`}
                            title={u.is_active == 1 ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active == 1 ? <i className="fa-solid fa-toggle-on"></i> : <i className="fa-solid fa-toggle-off"></i>}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
