import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Kiosk from './pages/Kiosk';
import Display from './pages/Display';
import Counter from './pages/Counter';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Services from './pages/admin/Services';
import Counters from './pages/admin/Counters';
import Advertisements from './pages/admin/Advertisements';
import Settings from './pages/admin/Settings';

// Fallback client ID so it doesn't crash if env is missing, though login will fail
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'PENDING_CLIENT_ID';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Kiosk - Customer facing */}
          <Route path="/kiosk/:orgSlug" element={<Kiosk />} />

          {/* Display - TV Monitor */}
          <Route path="/display/:orgSlug" element={<Display />} />

          {/* Counter - Staff */}
          <Route path="/counter/:orgSlug" element={<Counter />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="services" element={<Services />} />
            <Route path="counters" element={<Counters />} />
            <Route path="ads" element={<Advertisements />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '10px', color: '#94a3b8', zIndex: 9999, pointerEvents: 'none' }}>
          duwiarsana 2026
        </div>
      </BrowserRouter>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
