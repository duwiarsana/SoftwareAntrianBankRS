import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Landing.css';

export default function Landing() {
  const { user, org } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: '🎫',
      title: 'Kiosk Antrian',
      desc: 'Layar sentuh untuk pelanggan memilih layanan dan mengambil nomor antrian secara mandiri.',
    },
    {
      icon: '📺',
      title: 'Display TV',
      desc: 'Monitor besar menampilkan antrian aktif, nomor yang dipanggil, dan iklan secara real-time.',
    },
    {
      icon: '🖥️',
      title: 'Counter Staff',
      desc: 'Aplikasi untuk petugas loket memanggil, melayani, dan mengelola antrian dengan mudah.',
    },
    {
      icon: '🔊',
      title: 'Panggilan Suara',
      desc: 'Pengumuman suara otomatis dalam Bahasa Indonesia saat nomor antrian dipanggil.',
    },
    {
      icon: '📊',
      title: 'Dashboard Admin',
      desc: 'Statistik real-time, kelola layanan, loket, dan iklan dalam satu dashboard.',
    },
    {
      icon: '🌐',
      title: 'Cloud-Based',
      desc: 'Akses dari mana saja. Cukup daftar, setup, dan langsung gunakan di perangkat apapun.',
    },
  ];

  return (
    <div className="landing">
      {/* Background Effects */}
      <div className="landing-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="container flex items-center justify-between">
          <div className="logo flex items-center gap-3">
            <div className="logo-icon">Q</div>
            <span className="logo-text">QueuePro</span>
          </div>
          <div className="nav-actions flex gap-3">
            {user ? (
              <>
                <Link to="/admin" className="btn btn-ghost">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Masuk</Link>
                <Link to="/register" className="btn btn-primary">Daftar Gratis</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-badge">
              <span className="badge badge-primary">✨ Sistem Antrian Modern</span>
            </div>
            <h1 className="hero-title">
              Kelola Antrian <br />
              <span className="gradient-text">Lebih Cerdas</span>
            </h1>
            <p className="hero-subtitle">
              Sistem manajemen antrian digital all-in-one untuk bank, rumah sakit, kantor pemerintah, 
              dan bisnis Anda. Real-time, dengan suara panggilan otomatis.
            </p>
            <div className="hero-actions flex gap-4">
              {user ? (
                <Link to="/admin" className="btn btn-primary btn-xl">
                  Buka Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-xl">
                    Mulai Sekarang →
                  </Link>
                  <a href="#features" className="btn btn-secondary btn-xl">
                    Lihat Fitur
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hero-visual animate-fade-in">
            <div className="queue-preview glass-card">
              <div className="preview-header">
                <span className="preview-dot red"></span>
                <span className="preview-dot yellow"></span>
                <span className="preview-dot green"></span>
                <span className="preview-title">Display Antrian</span>
              </div>
              <div className="preview-body">
                <div className="preview-calling">
                  <div className="preview-label">SEDANG DIPANGGIL</div>
                  <div className="preview-numbers">
                    <div className="preview-number-card calling">
                      <div className="pn-number">A-003</div>
                      <div className="pn-counter">→ Loket 1</div>
                    </div>
                    <div className="preview-number-card">
                      <div className="pn-number">B-007</div>
                      <div className="pn-counter">→ Loket 2</div>
                    </div>
                  </div>
                </div>
                <div className="preview-waiting">
                  <div className="preview-label">MENUNGGU</div>
                  <div className="preview-chips">
                    {['A-004', 'A-005', 'B-008', 'C-001', 'A-006'].map((n) => (
                      <span key={n} className="preview-chip">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header text-center animate-fade-in-up">
            <h2 className="section-title">Fitur <span className="gradient-text">Lengkap</span></h2>
            <p className="section-subtitle">Semua yang Anda butuhkan untuk mengelola antrian secara profesional</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card glass-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Cara <span className="gradient-text">Kerja</span></h2>
          </div>
          <div className="steps">
            <div className="step glass-card animate-fade-in-up">
              <div className="step-number">1</div>
              <h3>Daftar & Setup</h3>
              <p>Daftarkan organisasi Anda dan atur layanan serta loket dalam hitungan menit.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="step-number">2</div>
              <h3>Buka di Perangkat</h3>
              <p>Buka kiosk di tablet, display di TV, dan counter di PC petugas.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step glass-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="step-number">3</div>
              <h3>Mulai Antrian!</h3>
              <p>Pelanggan ambil nomor, petugas panggil antrian, semua otomatis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container text-center">
          <div className="cta-content glass-card animate-fade-in-up">
            <h2>Siap Upgrade Sistem Antrian Anda?</h2>
            <p>Daftar sekarang dan mulai gunakan QueuePro dalam 5 menit.</p>
            {!user && (
              <Link to="/register" className="btn btn-primary btn-xl">
                Daftar Gratis Sekarang →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container text-center">
          <p className="text-muted">© 2026 QueuePro — Sistem Manajemen Antrian Digital</p>
        </div>
      </footer>
    </div>
  );
}
