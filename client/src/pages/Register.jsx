import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Register() {
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await register(orgName, name, email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    if (!orgName) {
      setError('Nama Organisasi harus diisi sebelum mendaftar dengan Google.');
      // Optional: focus the orgName input
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential, orgName);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Gagal registrasi dengan Google');
      if (err.requireOrg) {
        setError('Pendaftaran dengan Google memerlukan Nama Organisasi. Silakan isi terlebih dahulu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Login Google gagal.');
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
            <h1>Daftar</h1>
            <p className="text-muted">Buat akun dan mulai kelola antrian Anda</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="orgName">Nama Organisasi</label>
              <input
                id="orgName"
                type="text"
                className="input"
                placeholder="RS Harapan Bunda, Bank XYZ, dll."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="name">Nama Anda</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Mendaftar...' : 'Daftar Secara Rekomen / Biasa'}
            </button>
            <div className="auth-divider" style={{ margin: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              ATAU
            </div>
          </form>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={handleGoogleError}
               text="signup_with"
               theme="filled_black"
               shape="pill"
            />
          </div>

          <div className="auth-footer">
            <p>Sudah punya akun? <Link to="/login">Masuk</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
