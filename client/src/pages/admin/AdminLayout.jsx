import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Admin.css';

export default function AdminLayout() {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  if (!user) return null;

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/services', icon: '🏷️', label: 'Layanan' },
    { path: '/admin/counters', icon: '🖥️', label: 'Loket' },
    { path: '/admin/ads', icon: '📺', label: 'Iklan' },
    { path: '/admin/settings', icon: '⚙️', label: 'Pengaturan' },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo flex items-center gap-3">
            <div className="logo-icon">Q</div>
            {sidebarOpen && <span className="logo-text">QueuePro</span>}
          </Link>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-divider"></div>

        <div className="sidebar-links">
          <Link to={`/kiosk/${org?.slug}`} target="_blank" className="sidebar-item sidebar-link">
            <span className="sidebar-icon">🎫</span>
            {sidebarOpen && <span className="sidebar-label">Buka Kiosk</span>}
          </Link>
          <Link to={`/display/${org?.slug}`} target="_blank" className="sidebar-item sidebar-link">
            <span className="sidebar-icon">📺</span>
            {sidebarOpen && <span className="sidebar-label">Buka Display</span>}
          </Link>
          <Link to={`/counter/${org?.slug}`} className="sidebar-item sidebar-link">
            <span className="sidebar-icon">🖥️</span>
            {sidebarOpen && <span className="sidebar-label">Buka Counter</span>}
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user.name?.[0]?.toUpperCase()}</div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-org">{org?.name}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Keluar
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
