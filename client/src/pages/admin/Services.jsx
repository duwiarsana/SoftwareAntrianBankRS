import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import './Admin.css';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({ name: '', prefix: '', description: '', icon: '📋' });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const data = await api.getServices();
      setServices(data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingService(null);
    setForm({ name: '', prefix: '', description: '', icon: '📋' });
    setShowModal(true);
  }

  function openEdit(service) {
    setEditingService(service);
    setForm({ name: service.name, prefix: service.prefix, description: service.description || '', icon: service.icon });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id, form);
      } else {
        await api.createService(form);
      }
      setShowModal(false);
      loadServices();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus layanan ini?')) return;
    try {
      await api.deleteService(id);
      loadServices();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleActive(service) {
    try {
      await api.updateService(service.id, { ...service, isActive: !service.isActive });
      loadServices();
    } catch (err) {
      alert(err.message);
    }
  }

  const icons = ['📋', '🏦', '💼', '📊', '💳', '🏥', '💊', '🔬', '📝', '🎫', '📞', '📧', '🏷️', '🔧', '📦'];

  if (loading) {
    return <div className="flex justify-center" style={{ padding: '80px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="management-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Kelola Layanan</h1>
          <p className="text-muted text-sm">Atur jenis layanan yang tersedia di kiosk antrian</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Layanan</button>
      </div>

      <div className="items-list">
        {services.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-icon">🏷️</div>
            <p>Belum ada layanan. Tambah layanan pertama Anda!</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="item-card glass-card animate-fade-in">
              <div className="item-icon">{service.icon}</div>
              <div className="item-info">
                <div className="item-name">{service.name}</div>
                <div className="item-meta">
                  <span className="font-mono font-bold" style={{ color: 'var(--primary-400)' }}>
                    Prefix: {service.prefix}
                  </span>
                  <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {service.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {service._count?.tickets > 0 && (
                    <span className="badge badge-warning">
                      {service._count.tickets} menunggu
                    </span>
                  )}
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(service)}>
                  {service.isActive ? '⏸️' : '▶️'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(service)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(service.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2>{editingService ? 'Edit Layanan' : 'Tambah Layanan'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="input-group">
                <label>Nama Layanan</label>
                <input
                  className="input"
                  placeholder="Contoh: Teller, Customer Service"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Prefix (1 huruf)</label>
                <input
                  className="input"
                  placeholder="A, B, C, dll"
                  value={form.prefix}
                  onChange={(e) => setForm({ ...form, prefix: e.target.value.slice(0, 1).toUpperCase() })}
                  maxLength={1}
                  required
                />
              </div>
              <div className="input-group">
                <label>Deskripsi (opsional)</label>
                <input
                  className="input"
                  placeholder="Deskripsi singkat..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`btn btn-ghost btn-icon ${form.icon === icon ? 'active' : ''}`}
                      style={{
                        fontSize: '1.3rem',
                        border: form.icon === icon ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                      }}
                      onClick={() => setForm({ ...form, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-between" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
