import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import './Counter.css';

export default function Counter() {
  const { orgSlug } = useParams();
  const { user, org } = useAuth();
  const navigate = useNavigate();
  const [counters, setCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [waitingTickets, setWaitingTickets] = useState([]);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCounters();
  }, [user]);

  useEffect(() => {
    if (selectedCounter && org) {
      loadCounterData();
      socketRef.current = connectSocket(org.id);

      socketRef.current.on('ticket:new', () => loadCounterData());
      socketRef.current.on('ticket:complete', () => loadCounterData());
      socketRef.current.on('ticket:skip', () => loadCounterData());
      socketRef.current.on('ticket:call', () => loadCounterData());
      socketRef.current.on('queue:reset', () => loadCounterData());

      return () => {
        socketRef.current?.off('ticket:new');
        socketRef.current?.off('ticket:complete');
        socketRef.current?.off('ticket:skip');
        socketRef.current?.off('ticket:call');
        socketRef.current?.off('queue:reset');
      };
    }
  }, [selectedCounter, org]);

  async function loadCounters() {
    try {
      const data = await api.getCounters();
      setCounters(data.counters);
    } catch (err) {
      setError('Gagal memuat data loket');
    } finally {
      setLoading(false);
    }
  }

  async function loadCounterData() {
    if (!selectedCounter) return;
    try {
      const data = await api.getCounterTickets(selectedCounter.id);
      setCurrentTicket(data.current || null);
      setWaitingTickets(data.waiting || []);
      setDoneCount(data.done?.length || 0);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Load counter data error:', err);
    }
  }

  async function callNext() {
    setActionLoading(true);
    try {
      const data = await api.callNext(selectedCounter.id, selectedCounter.serviceId);
      if (data.ticket) {
        setCurrentTicket(data.ticket);
      } else {
        setError('Tidak ada antrian menunggu');
        setTimeout(() => setError(''), 3000);
      }
      await loadCounterData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function recallTicket() {
    if (!currentTicket) return;
    try {
      await api.recallTicket(currentTicket.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeTicket() {
    if (!currentTicket) return;
    setActionLoading(true);
    try {
      await api.completeTicket(currentTicket.id);
      setCurrentTicket(null);
      await loadCounterData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function skipTicket() {
    if (!currentTicket) return;
    setActionLoading(true);
    try {
      await api.skipTicket(currentTicket.id);
      setCurrentTicket(null);
      await loadCounterData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Memuat...</p>
      </div>
    );
  }

  // Counter Selection
  if (!selectedCounter) {
    return (
      <div className="counter-page">
        <div className="counter-bg">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
        </div>
        <div className="counter-select animate-fade-in-up">
          <div className="counter-select-header">
            <h1>Pilih Loket Anda</h1>
            <p className="text-muted">Halo, {user?.name}! Pilih loket yang akan Anda operasikan.</p>
          </div>
          <div className="counter-select-grid">
            {counters.map((counter) => (
              <button
                key={counter.id}
                className="counter-select-btn glass-card"
                onClick={() => setSelectedCounter(counter)}
              >
                <div className="cs-icon">🖥️</div>
                <div className="cs-name">{counter.name}</div>
                <div className="cs-service">
                  {counter.service ? `${counter.service.name} (${counter.service.prefix})` : 'Semua layanan'}
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="counter-page">
      <div className="counter-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      <div className="counter-layout">
        {/* Top Bar */}
        <div className="counter-topbar glass-card">
          <div className="topbar-left">
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCounter(null)}>
              ← Ganti Loket
            </button>
            <div className="topbar-info">
              <span className="topbar-counter">{selectedCounter.name}</span>
              <span className="topbar-service">
                {selectedCounter.service?.name || 'Semua layanan'}
              </span>
            </div>
          </div>
          <div className="topbar-stats">
            <div className="ts-item">
              <span className="ts-value">{doneCount}</span>
              <span className="ts-label">Selesai</span>
            </div>
            <div className="ts-item">
              <span className="ts-value">{waitingTickets.length}</span>
              <span className="ts-label">Menunggu</span>
            </div>
            <div className="ts-item">
              <span className="ts-value">{totalCount}</span>
              <span className="ts-label">Total</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="counter-error animate-fade-in-down">
            {error}
          </div>
        )}

        <div className="counter-main">
          {/* Current Ticket */}
          <div className="counter-current glass-card">
            <div className="current-label">SEDANG DILAYANI</div>
            {currentTicket ? (
              <div className="current-ticket animate-scale-in">
                <div className="current-number">{currentTicket.ticketNumber}</div>
                <div className="current-service">{currentTicket.service?.name}</div>
                <div className="current-time">
                  Dipanggil: {new Date(currentTicket.calledAt).toLocaleTimeString('id-ID')}
                </div>
              </div>
            ) : (
              <div className="current-empty">
                <div className="ce-icon">📋</div>
                <p>Tidak ada antrian aktif</p>
                <p className="text-sm text-muted">Tekan "Panggil Berikutnya" untuk memulai</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="counter-actions">
            <button
              className="btn btn-primary btn-xl action-btn call-btn"
              onClick={callNext}
              disabled={actionLoading}
            >
              <span className="action-icon">📢</span>
              <span>Panggil Berikutnya</span>
              {waitingTickets.length > 0 && (
                <span className="action-badge">{waitingTickets.length}</span>
              )}
            </button>

            <div className="action-row">
              <button
                className="btn btn-secondary action-btn"
                onClick={recallTicket}
                disabled={!currentTicket || actionLoading}
              >
                🔄 Panggil Ulang
              </button>
              <button
                className="btn btn-accent action-btn"
                onClick={completeTicket}
                disabled={!currentTicket || actionLoading}
              >
                ✅ Selesai
              </button>
              <button
                className="btn btn-danger action-btn"
                onClick={skipTicket}
                disabled={!currentTicket || actionLoading}
              >
                ⏭️ Lewati
              </button>
            </div>
          </div>

          {/* Waiting Queue */}
          <div className="counter-waiting glass-card">
            <h3>⏳ Antrian Menunggu ({waitingTickets.length})</h3>
            {waitingTickets.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p className="text-muted">Tidak ada antrian menunggu</p>
              </div>
            ) : (
              <div className="waiting-list-items">
                {waitingTickets.map((ticket, i) => (
                  <div key={ticket.id} className="wl-item">
                    <span className="wl-pos">{i + 1}</span>
                    <span className="wl-number font-mono font-bold">{ticket.ticketNumber}</span>
                    <span className="wl-service text-muted text-sm">{ticket.service?.name}</span>
                    <span className="wl-time text-muted text-sm">
                      {new Date(ticket.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
