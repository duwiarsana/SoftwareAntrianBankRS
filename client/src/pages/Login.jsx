import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      // Don't pass orgName, it should work if the user exists
      await loginWithGoogle(credentialResponse.credential);
      navigate('/admin');
    } catch (err) {
      if (err.requireOrg) {
        setError('Akun tidak ditemukan. Silakan Daftar terlebih dahulu dan isi Nama Organisasi.');
      } else {
        setError(err.message || 'Login dengan Google gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Login Google gagal.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>
      <div className="auth-container animate-fade-in-up">
        <div className="auth-card glass-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo flex items-center gap-3">
              <div className="logo-icon">Q</div>
              <span className="logo-text">QueuePro</span>
            </Link>
            <h1>Masuk</h1>
            <p className="text-muted">Masuk ke dashboard Anda</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="nama@organisasi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk Secara Manual'}
            </button>
            <div className="auth-divider" style={{ margin: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              ATAU
            </div>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={handleGoogleError}
               text="signin_with"
               theme="filled_black"
               shape="pill"
            />
          </div>

          <div className="auth-footer">
            <p>Belum punya akun? <Link to="/register">Daftar sekarang</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
