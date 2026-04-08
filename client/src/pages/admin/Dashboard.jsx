import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import './Admin.css';

export default function Dashboard() {
  const { org } = useAuth();
  const [stats, setStats] = useState(null);
  const [serviceStats, setServiceStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const data = await api.getStats();
      setStats(data.stats);
      setServiceStats(data.serviceStats);
    } catch (err) {
      console.error('Load stats error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset semua antrian hari ini?')) return;
    try {
      await api.resetQueue();
      await loadStats();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Statistik antrian hari ini — {org?.name}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-card animate-fade-in-up">
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Total Antrian</div>
        </div>
        <div className="stat-card glass-card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="stat-value" style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stats?.done || 0}
          </div>
          <div className="stat-label">Selesai Dilayani</div>
        </div>
        <div className="stat-card glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-value">{stats?.waiting || 0}</div>
          <div className="stat-label">Menunggu</div>
        </div>
        <div className="stat-card glass-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="stat-value">{stats?.serving || 0}</div>
          <div className="stat-label">Sedang Dilayani</div>
        </div>
        <div className="stat-card glass-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="stat-value">{stats?.avgWaitTime || 0}</div>
          <div className="stat-label">Rata-rata Tunggu (mnt)</div>
        </div>
        <div className="stat-card glass-card animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="stat-value" style={{ background: 'var(--gradient-warm)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stats?.skipped || 0}
          </div>
          <div className="stat-label">Dilewati</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>🚀 Aksi Cepat</h2>
      <div className="quick-actions">
        <Link to={`/kiosk/${org?.slug}`} target="_blank" className="btn btn-primary">
          🎫 Buka Kiosk
        </Link>
        <Link to={`/display/${org?.slug}`} target="_blank" className="btn btn-accent">
          📺 Buka Display
        </Link>
        <Link to={`/counter/${org?.slug}`} className="btn btn-secondary">
          🖥️ Buka Counter
        </Link>
        <button className="btn btn-danger btn-sm" onClick={handleReset}>
          🔄 Reset Antrian
        </button>
      </div>

      {/* Service Stats */}
      <h2 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>📊 Per Layanan</h2>
      <div className="service-stats-grid">
        {serviceStats.map((s, i) => (
          <div key={s.id} className="service-stat-card glass-card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="ssc-header">
              <span className="ssc-icon">{s.icon}</span>
              <span className="ssc-name">{s.name}</span>
              <span className="ssc-prefix">{s.prefix}</span>
            </div>
            <div className="ssc-stats">
              <div className="ssc-stat">
                <span className="ssc-stat-value">{s.waiting}</span>
                <span className="ssc-stat-label">Menunggu</span>
              </div>
              <div className="ssc-stat">
                <span className="ssc-stat-value">{s.total}</span>
                <span className="ssc-stat-label">Total</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="glass-card" style={{ padding: '20px', marginTop: '32px' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>ℹ️ Link Aplikasi</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
          <p className="text-muted">
            <strong>Kiosk:</strong> <code className="font-mono">/kiosk/{org?.slug}</code> — Buka di tablet/touchscreen untuk pelanggan
          </p>
          <p className="text-muted">
            <strong>Display:</strong> <code className="font-mono">/display/{org?.slug}</code> — Buka di TV/monitor besar
          </p>
          <p className="text-muted">
            <strong>Counter:</strong> <code className="font-mono">/counter/{org?.slug}</code> — Buka di PC petugas loket
          </p>
        </div>
      </div>
    </div>
  );
}
