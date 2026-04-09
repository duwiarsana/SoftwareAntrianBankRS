import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import './Admin.css';

export default function Advertisements() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', duration: 5, mediaUrl: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    try {
      const data = await api.getAds();
      setAds(data.advertisements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('duration', form.duration);
      if (file) {
        formData.append('media', file);
        formData.append('mediaType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
      } else if (form.mediaUrl) {
        formData.append('mediaUrl', form.mediaUrl);
      }
      await api.createAd(formData);
      setShowModal(false);
      setForm({ title: '', duration: 5, mediaUrl: '' });
      setFile(null);
      loadAds();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleActive(ad) {
    try {
      await api.updateAd(ad.id, { isActive: !ad.isActive });
      loadAds();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus iklan ini?')) return;
    try {
      await api.deleteAd(id);
      loadAds();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="flex justify-center" style={{ padding: '80px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="management-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Kelola Iklan</h1>
          <p className="text-muted text-sm">Kelola iklan yang ditampilkan di layar display</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Tambah Iklan</button>
      </div>

      <div className="items-list">
        {ads.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-icon">📺</div>
            <p>Belum ada iklan. Upload iklan untuk ditampilkan di layar display.</p>
          </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="item-card glass-card animate-fade-in">
              <div style={{ width: 80, height: 50, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                {ad.mediaUrl && (
                  <img
                    src={ad.mediaUrl}
                    alt={ad.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div className="item-info">
                <div className="item-name">{ad.title}</div>
                <div className="item-meta">
                  <span className="badge badge-primary">{ad.mediaType}</span>
                  <span>{ad.duration}s</span>
                  <span className={`badge ${ad.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {ad.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(ad)}>
                  {ad.isActive ? '⏸️' : '▶️'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(ad.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2>Tambah Iklan</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="input-group">
                <label>Judul Iklan</label>
                <input
                  className="input"
                  placeholder="Judul iklan..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Upload Gambar/Video</label>
                <input
                  type="file"
                  className="input"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              <div className="input-group">
                <label>Durasi tampil (detik)</label>
                <input
                  type="number"
                  className="input"
                  min={3}
                  max={60}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex gap-3 justify-between" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
