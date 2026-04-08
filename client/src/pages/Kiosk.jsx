import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { applyTheme } from '../lib/theme';
import './Kiosk.css';

export default function Kiosk() {
  const { orgSlug } = useParams();
  const [services, setServices] = useState([]);
  const [org, setOrg] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadServices();
  }, [orgSlug]);

  useEffect(() => {
    if (ticket) {
      const timer = setTimeout(() => {
        setTicket(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [ticket]);

  async function loadServices() {
    try {
      const data = await api.getPublicServices(orgSlug);
      setServices(data.services);
      setOrg(data.org);
      if (data.org?.settings?.themeColor) {
        applyTheme(data.org.settings.themeColor);
      } else {
        applyTheme('indigo');
      }
    } catch (err) {
      setError('Organisasi tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }

  async function takeTicket(serviceId) {
    setCreating(true);
    try {
      const data = await api.createTicket(serviceId, orgSlug);
      setTicket(data.ticket);
    } catch (err) {
      setError('Gagal mengambil tiket');
    } finally {
      setCreating(false);
    }
  }

  function printTicket() {
    window.print();
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Memuat...</p>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="kiosk-page">
        <div className="kiosk-error">
          <div className="empty-icon">❌</div>
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  // Show ticket confirmation
  if (ticket) {
    return (
      <div className="kiosk-page">
        <div className="kiosk-bg">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
        </div>
        <div className="kiosk-ticket animate-scale-in" id="print-area">
          <div className="ticket-card">
            <div className="ticket-header">
              <div className="ticket-org">{org?.name}</div>
              <div className="ticket-service">{ticket.service?.name}</div>
            </div>
            <div className="ticket-body">
              <div className="ticket-label">NOMOR ANTRIAN ANDA</div>
              <div className="ticket-number-display">
                {ticket.ticketNumber}
              </div>
              <div className="ticket-time">
                {new Date(ticket.createdAt).toLocaleString('id-ID', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </div>
            </div>
            <div className="ticket-footer">
              <p>Mohon tunggu nomor Anda dipanggil</p>
              <div className="ticket-actions no-print">
                <button className="btn btn-primary btn-xl" onClick={printTicket}>
                  🖨️ Cetak Tiket
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => setTicket(null)}>
                  Ambil Antrian Lain
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-page">
      <div className="kiosk-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      <div className="kiosk-content">
        <div className="kiosk-header animate-fade-in-down">
          <div className="kiosk-org-name">{org?.name}</div>
          <h1>Silakan Pilih Layanan</h1>
          <p>Sentuh layanan yang Anda butuhkan</p>
        </div>

        <div className="kiosk-services animate-fade-in-up">
          {services.map((service, i) => (
            <button
              key={service.id}
              className="kiosk-service-btn glass-card"
              onClick={() => takeTicket(service.id)}
              disabled={creating}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="service-icon">{service.icon}</div>
              <div className="service-name">{service.name}</div>
              <div className="service-prefix">Seri {service.prefix}</div>
              {service.description && (
                <div className="service-desc">{service.description}</div>
              )}
            </button>
          ))}
        </div>

        <div className="kiosk-footer">
          <div className="kiosk-clock">
            <KioskClock />
          </div>
        </div>
      </div>
    </div>
  );
}

function KioskClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono">
      {time.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    </span>
  );
}
