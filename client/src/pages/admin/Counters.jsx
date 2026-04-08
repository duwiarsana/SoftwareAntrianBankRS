import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import './Admin.css';

export default function Counters() {
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', serviceId: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cData, sData] = await Promise.all([api.getCounters(), api.getServices()]);
      setCounters(cData.counters);
      setServices(sData.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', serviceId: '' });
    setShowModal(true);
  }

  function openEdit(counter) {
    setEditing(counter);
    setForm({ name: counter.name, serviceId: counter.serviceId || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateCounter(editing.id, form);
      } else {
        await api.createCounter(form);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus loket ini?')) return;
    try {
      await api.deleteCounter(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleActive(counter) {
    try {
      await api.updateCounter(counter.id, { ...counter, serviceId: counter.serviceId, isActive: !counter.isActive });
      loadData();
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Kelola Loket</h1>
          <p className="text-muted text-sm">Atur loket/counter pelayanan dan assign layanan</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Loket</button>
      </div>

      <div className="items-list">
        {counters.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-icon">🖥️</div>
            <p>Belum ada loket. Tambah loket pertama Anda!</p>
          </div>
        ) : (
          counters.map((counter) => (
            <div key={counter.id} className="item-card glass-card animate-fade-in">
              <div className="item-icon">🖥️</div>
              <div className="item-info">
                <div className="item-name">{counter.name}</div>
                <div className="item-meta">
                  <span style={{ color: 'var(--accent-400)' }}>
                    {counter.service ? `${counter.service.name} (${counter.service.prefix})` : 'Semua Layanan'}
                  </span>
                  <span className={`badge ${counter.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {counter.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(counter)}>
                  {counter.isActive ? '⏸️' : '▶️'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(counter)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(counter.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Loket' : 'Tambah Loket'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="input-group">
                <label>Nama Loket</label>
                <input
                  className="input"
                  placeholder="Contoh: Loket 1, Loket 2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Layanan (opsional)</label>
                <select
                  className="input"
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                >
                  <option value="">Semua Layanan</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.prefix})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-between" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
