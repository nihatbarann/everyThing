import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Shield, User as UserIcon, AlertCircle } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role_id: '2' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError('Erişim hatası veya yetkisiz.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await axios.post('/api/users', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMsg('Kullanıcı başarıyla oluşturuldu!');
      setFormData({ username: '', password: '', role_id: '2' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Emin misiniz?')) return;
    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı silinemedi.');
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in">
      <header>
        <h1 className="text-4xl mb-2 text-gradient">User Management</h1>
        <p className="text-muted text-lg">Manage access control and employee accounts</p>
      </header>

      {error && (
        <div className="premium-card p-4 flex items-center gap-3 border-[hsla(350,80%,50%,0.3)] bg-[hsla(350,80%,50%,0.05)] text-[hsl(350,80%,60%)] animate-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {msg && (
        <div className="premium-card p-4 flex items-center gap-3 border-[hsla(150,80%,40%,0.3)] bg-[hsla(150,80%,40%,0.05)] text-[hsl(150,80%,50%)] animate-in">
          <span>{msg}</span>
        </div>
      )}

      <div className="grid-container grid-cols-1 lg:grid-cols-3">
        {/* Create User Form */}
        <div className="premium-card h-fit flex flex-col delay-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="icon-box">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">New User</h2>
          </div>
          
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-bold text-muted mb-2 block uppercase tracking-wide">Username</label>
              <input 
                type="text" 
                className="w-full bg-[hsla(220,30%,8%,0.5)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-bold text-muted mb-2 block uppercase tracking-wide">Password</label>
              <input 
                type="password" 
                className="w-full bg-[hsla(220,30%,8%,0.5)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
            <div className="mb-2">
              <label className="text-sm font-bold text-muted mb-2 block uppercase tracking-wide">Role</label>
              <select 
                className="w-full bg-[hsla(220,30%,8%,0.5)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none"
                value={formData.role_id} 
                onChange={e => setFormData({...formData, role_id: e.target.value})}
              >
                <option value="1">Admin</option>
                <option value="2">Employee</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="premium-card lg:col-span-2 flex flex-col p-0 delay-2 overflow-hidden">
          <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--bg-surface)]">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Directory
            </h2>
            <div className="badge positive">
              {users.length} Total
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr>
                  <th className="p-4 border-b border-[var(--glass-border)] text-muted text-xs uppercase tracking-wider font-bold">ID</th>
                  <th className="p-4 border-b border-[var(--glass-border)] text-muted text-xs uppercase tracking-wider font-bold">User</th>
                  <th className="p-4 border-b border-[var(--glass-border)] text-muted text-xs uppercase tracking-wider font-bold">Role</th>
                  <th className="p-4 border-b border-[var(--glass-border)] text-muted text-xs uppercase tracking-wider font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[hsla(0,0%,100%,0.02)] transition-colors">
                    <td className="p-4 text-muted font-mono text-sm border-b border-[var(--glass-border)]/50">#{u.id}</td>
                    <td className="p-4 border-b border-[var(--glass-border)]/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center font-bold text-sm text-primary border border-[var(--border-color)]">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white tracking-wide">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-4 border-b border-[var(--glass-border)]/50">
                      <div className={`badge ${u.role_name === 'Admin' ? 'positive' : ''}`}>
                        {u.role_name === 'Admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {u.role_name}
                      </div>
                    </td>
                    <td className="p-4 border-b border-[var(--glass-border)]/50 text-right">
                      {u.username !== 'everything' && (
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-muted hover:text-[var(--error)] hover:bg-[hsla(350,80%,50%,0.1)] rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
