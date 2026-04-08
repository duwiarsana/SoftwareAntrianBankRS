import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import './Admin.css';

export default function Settings() {
  const { org, setOrg } = useAuth();
  const [orgName, setOrgName] = useState(org?.name || '');
  const [settings, setSettings] = useState(org?.settings || {});
  const [staffList, setStaffList] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      const data = await api.getStaff();
      setStaffList(data.users);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.updateOrgSettings(orgName, settings);
      setOrg(data.org);
      setMessage('Pengaturan berhasil disimpan!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStaff(e) {
    e.preventDefault();
    try {
      await api.addStaff(staffForm);
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '' });
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Pengaturan</h1>
        <p>Konfigurasi organisasi, suara, dan akun staff</p>
      </div>

      {message && (
        <div className={`glass-card animate-fade-in-down ${message.includes('Gagal') ? '' : ''}`}
          style={{
            padding: '12px 20px',
            marginBottom: '20px',
            borderLeft: `4px solid ${message.includes('Gagal') ? 'var(--danger-500)' : 'var(--accent-500)'}`,
          }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        {/* Organization */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>🏢 Organisasi</h2>
          <div className="flex flex-col gap-4">
            <div className="input-group">
              <label>Nama Organisasi</label>
              <input
                className="input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Slug URL</label>
              <input className="input" value={org?.slug || ''} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>🔊 Pengaturan Suara</h2>
          <div className="flex flex-col gap-4">
            <div className="input-group">
              <label>Bahasa Suara</label>
              <select
                className="input"
                value={settings.voiceLang || 'id-ID'}
                onChange={(e) => setSettings({ ...settings, voiceLang: e.target.value })}
              >
                <option value="id-ID">Indonesia</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Kecepatan Bicara ({settings.voiceRate || 0.9})</label>
              <input
                type="range"
                className="input"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.voiceRate || 0.9}
                onChange={(e) => setSettings({ ...settings, voiceRate: parseFloat(e.target.value) })}
                style={{ padding: '8px' }}
              />
            </div>
            <div className="input-group">
              <label>Template Pengumuman</label>
              <input
                className="input"
                value={settings.voiceTemplate || 'Nomor antrian {number}, silakan menuju {counter}'}
                onChange={(e) => setSettings({ ...settings, voiceTemplate: e.target.value })}
                placeholder="Nomor antrian {number}, silakan menuju {counter}"
              />
              <span className="text-muted text-sm">Gunakan {'{number}'} dan {'{counter}'} sebagai placeholder</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
        </button>
      </form>

      {/* Staff Management */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '32px' }}>
        <div className="management-header" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem' }}>👥 Staff / Petugas Loket</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowStaffModal(true)}>
            + Tambah Staff
          </button>
        </div>
        {staffList.length === 0 ? (
          <p className="text-muted">Belum ada staff.</p>
        ) : (
          <div className="items-list">
            {staffList.map((staff) => (
              <div key={staff.id} className="item-card" style={{ padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                  {staff.name?.[0]?.toUpperCase()}
                </div>
                <div className="item-info">
                  <div className="item-name" style={{ fontSize: '0.9rem' }}>{staff.name}</div>
                  <div className="item-meta">
                    <span>{staff.email}</span>
                    <span className={`badge ${staff.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>
                      {staff.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={() => setShowStaffModal(false)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2>Tambah Staff</h2>
            <form onSubmit={handleAddStaff} className="flex flex-col gap-4">
              <div className="input-group">
                <label>Nama</label>
                <input className="input" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" className="input" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} required minLength={6} />
              </div>
              <div className="flex gap-3 justify-between" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowStaffModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Tambah</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
