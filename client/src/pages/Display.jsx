import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { getAnnouncer } from '../lib/voice';
import { applyTheme } from '../lib/theme';
import './Display.css';

export default function Display() {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [serving, setServing] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [stats, setStats] = useState({ total: 0, done: 0, waiting: 0, serving: 0 });
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [callingTicket, setCallingTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const announcer = useRef(null);

  useEffect(() => {
    loadData();
    return () => {
      if (org?.id) disconnectSocket(org.id);
    };
  }, [orgSlug]);

  useEffect(() => {
    if (org?.id) {
      socketRef.current = connectSocket(org.id);

      socketRef.current.on('ticket:new', (data) => {
        loadData();
      });

      socketRef.current.on('ticket:call', async (data) => {
        setCallingTicket(data.ticket);
        loadData();

        // Play voice announcement
        try {
          if (!announcer.current) {
            announcer.current = getAnnouncer();
          }
          const settings = org.settings || {};
          await announcer.current.announce(
            data.ticket.ticketNumber,
            data.ticket.counterName,
            settings
          );
          // Repeat after delay
          setTimeout(async () => {
            await announcer.current.announce(
              data.ticket.ticketNumber,
              data.ticket.counterName,
              settings
            );
          }, 2000);
        } catch (e) {
          console.log('Voice error:', e);
        }

        // Clear calling highlight after 10s
        setTimeout(() => setCallingTicket(null), 10000);
      });

      socketRef.current.on('ticket:complete', () => loadData());
      socketRef.current.on('ticket:skip', () => loadData());
      socketRef.current.on('queue:reset', () => loadData());

      return () => {
        socketRef.current?.off('ticket:new');
        socketRef.current?.off('ticket:call');
        socketRef.current?.off('ticket:complete');
        socketRef.current?.off('ticket:skip');
        socketRef.current?.off('queue:reset');
      };
    }
  }, [org]);

  // Ad rotation
  useEffect(() => {
    if (ads.length === 0) return;
    const duration = (ads[currentAdIndex]?.duration || 5) * 1000;
    const timer = setTimeout(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentAdIndex, ads]);

  async function loadData() {
    try {
      const [queueData, adsData] = await Promise.all([
        api.getCurrentQueue(orgSlug),
        api.getPublicAds(orgSlug),
      ]);
      setServing(queueData.serving);
      setWaiting(queueData.waiting);
      setStats(queueData.stats);
      setOrg(queueData.org);
      
      if (queueData.org?.settings?.themeColor) {
        applyTheme(queueData.org.settings.themeColor);
      } else {
        applyTheme('indigo');
      }

      if (adsData.advertisements.length > 0) {
        setAds(adsData.advertisements);
      }
    } catch (err) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Memuat Display...</p>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="display-page">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="display-page" onClick={() => {
      // Initialize audio context on first click (required by browsers)
      if (!announcer.current) {
        announcer.current = getAnnouncer();
      }
    }}>
      {/* Background */}
      <div className="display-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Header */}
      <header className="display-header">
        <div className="display-org">
          <div className="display-logo">Q</div>
          <span className="display-org-name">{org?.name}</span>
        </div>
        <div className="display-title">SISTEM ANTRIAN</div>
        <DisplayClock />
      </header>

      {/* Main Content */}
      <div className="display-main">
        {/* Currently Calling - Featured */}
        {callingTicket && (
          <div className="display-calling animate-scale-in">
            <div className="calling-label">🔔 SEDANG DIPANGGIL</div>
            <div className="calling-card">
              <div className="calling-number">{callingTicket.ticketNumber}</div>
              <div className="calling-counter">
                <span className="calling-arrow">→</span>
                {callingTicket.counterName}
              </div>
            </div>
          </div>
        )}

        <div className="display-content">
          {/* Serving Section */}
          <div className="display-section serving-section">
            <div className="section-title-bar">
              <div className="section-icon">🟢</div>
              <h2>SEDANG DILAYANI</h2>
            </div>
            <div className="serving-grid">
              {serving.length === 0 ? (
                <div className="empty-serving">Belum ada antrian aktif</div>
              ) : (
                serving.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`serving-card glass-card ${
                      callingTicket?.id === ticket.id ? 'is-calling' : ''
                    }`}
                  >
                    <div className="serving-number">{ticket.ticketNumber}</div>
                    <div className="serving-counter">
                      <span className="serving-arrow">→</span>
                      {ticket.counter?.name || '-'}
                    </div>
                    <div className="serving-service">{ticket.service?.name}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Waiting + Ads */}
          <div className="display-right">
            {/* Waiting Section */}
            <div className="display-section waiting-section">
              <div className="section-title-bar">
                <div className="section-icon">⏳</div>
                <h2>MENUNGGU</h2>
                <span className="waiting-count">{waiting.length}</span>
              </div>
              <div className="waiting-list">
                {waiting.length === 0 ? (
                  <div className="empty-waiting">Tidak ada antrian menunggu</div>
                ) : (
                  <div className="waiting-grid">
                    {waiting.slice(0, 20).map((ticket) => (
                      <div key={ticket.id} className="waiting-chip">
                        <span className="wc-number">{ticket.ticketNumber}</span>
                      </div>
                    ))}
                    {waiting.length > 20 && (
                      <div className="waiting-chip waiting-more">
                        +{waiting.length - 20}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ads Section */}
            {ads.length > 0 && (
              <div className="display-ads">
                <div className="ad-container">
                  {ads[currentAdIndex]?.mediaType === 'VIDEO' ? (
                    <video
                      key={ads[currentAdIndex].id}
                      src={ads[currentAdIndex].mediaUrl}
                      autoPlay
                      muted
                      loop
                      className="ad-media"
                    />
                  ) : (
                    <img
                      key={ads[currentAdIndex].id}
                      src={ads[currentAdIndex].mediaUrl}
                      alt={ads[currentAdIndex].title}
                      className="ad-media"
                    />
                  )}
                  <div className="ad-title">{ads[currentAdIndex]?.title}</div>
                </div>
                {ads.length > 1 && (
                  <div className="ad-dots">
                    {ads.map((_, i) => (
                      <span key={i} className={`ad-dot ${i === currentAdIndex ? 'active' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Ticker */}
      <div className="display-ticker">
        <div className="ticker-content">
          <span className="ticker-stats">
            📊 Total Hari Ini: <strong>{stats.total}</strong> &nbsp;|&nbsp;
            ✅ Selesai: <strong>{stats.done}</strong> &nbsp;|&nbsp;
            ⏳ Menunggu: <strong>{stats.waiting}</strong> &nbsp;|&nbsp;
            🟢 Dilayani: <strong>{stats.serving}</strong>
          </span>
          <span className="ticker-separator">•</span>
          <span className="ticker-message">Selamat datang di {org?.name}. Mohon menunggu nomor antrian Anda dipanggil. Terima kasih.</span>
        </div>
      </div>

      {/* Click hint for audio */}
      <div className="display-audio-hint" id="audioHint">
        Klik layar untuk mengaktifkan suara 🔊
      </div>
    </div>
  );
}

function DisplayClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="display-clock">
      <div className="clock-time font-mono">
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="clock-date">
        {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}
