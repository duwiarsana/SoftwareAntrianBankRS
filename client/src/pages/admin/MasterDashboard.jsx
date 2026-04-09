import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import './Admin.css';

export default function MasterDashboard() {
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, orgsData] = await Promise.all([
        api.getMasterStats(),
        api.getMasterOrgs()
      ]);
      setStats(statsData);
      setOrgs(orgsData);
    } catch (err) {
      setError('Gagal mengambil data master');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrg = async (id, name) => {
    if (!window.confirm(`Hapus organisasi "${name}" beserta seluruh datanya secara PERMANEN?`)) return;

    try {
      await api.deleteMasterOrg(id);
      setOrgs(orgs.filter(o => o.id !== id));
      // Refresh stats
      const statsData = await api.getMasterStats();
      setStats(statsData);
    } catch (err) {
      alert('Gagal menghapus organisasi');
    }
  };

  if (loading) return <div className="p-8">Memuat data master...</div>;

  return (
    <div className="admin-content animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Master Dashboard</h1>
          <p className="text-muted">Kelola seluruh organisasi di sistem QueuePro</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card glass-card p-6">
          <div className="text-sm text-muted mb-1">Total Organisasi</div>
          <div className="text-3xl font-bold text-primary">{stats?.orgCount}</div>
        </div>
        <div className="stat-card glass-card p-6">
          <div className="text-sm text-muted mb-1">Total Pengguna</div>
          <div className="text-3xl font-bold text-emerald-500">{stats?.userCount}</div>
        </div>
        <div className="stat-card glass-card p-6">
          <div className="text-sm text-muted mb-1">Total Tiket</div>
          <div className="text-3xl font-bold text-rose-500">{stats?.ticketCount}</div>
        </div>
        <div className="stat-card glass-card p-6">
          <div className="text-sm text-muted mb-1">Total Layanan</div>
          <div className="text-3xl font-bold text-amber-500">{stats?.serviceCount}</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Daftar Organisasi Terdaftar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Organisasi</th>
                <th>Slug</th>
                <th>Admin (Email)</th>
                <th>IP / Lokasi</th>
                <th>Data</th>
                <th>Terdaftar Pada</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const admin = org.users[0] || {};
                return (
                  <tr key={org.id}>
                    <td>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-muted">{org.id}</div>
                    </td>
                    <td><span className="badge badge-indigo">{org.slug}</span></td>
                    <td>
                      <div>{admin.name || '-'}</div>
                      <div className="text-xs text-muted">{admin.email || '-'}</div>
                    </td>
                    <td>
                      <div className="text-xs">{admin.ipLocation || 'Unknown'}</div>
                    </td>
                    <td>
                      <div className="text-xs text-muted">User: {org._count.users}</div>
                      <div className="text-xs text-muted">Tiket: {org._count.tickets}</div>
                    </td>
                    <td>{new Date(org.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteOrg(org.id, org.name)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">Belum ada organisasi terdaftar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
