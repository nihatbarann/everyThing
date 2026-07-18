import React, { useState } from 'react';
import axios from 'axios';
// Lucide imports removed

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', formData);
      if(res.data.success) {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden p-4">
      {/* Ambient background glow */}
      <div className="blob-shape blob-1"></div>
      <div className="blob-shape blob-2"></div>

      <div className="card max-w-sm w-full p-8 animate-fade-in z-10">
        <div className="text-center mb-8 animate-fade-in stagger-1 opacity-0">
          <div className="ev-icon ev-icon-lg ev-icon-primary mb-4" style={{ margin: '0 auto 1rem' }}>
            <i className="fa-solid fa-user"></i>
          </div>
          <h1 className="text-3xl mb-1">Welcome Back</h1>
          <p className="text-muted text-sm">Sign in to EveryThing Console</p>
        </div>

        <div className="animate-fade-in stagger-2 opacity-0">
          {error && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-user"></i>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. everything"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group mb-6">
              <label>Password</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn animate-fade-in stagger-3 opacity-0" disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin w-5 h-5"></i> : (
                <>Sign In <i className="fa-solid fa-right-to-bracket w-4 h-4 ml-1"></i></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
