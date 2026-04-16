import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import './ForgotPasswordPage.css';
import { buildApiUrl, defaultHeaders } from '../utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(buildApiUrl('/api/forgot-password'), {
        method:  'POST',
        headers: defaultHeaders,
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fp-page ${isVisible ? 'page-visible' : ''}`}>
      <div className="fp-backdrop" />
      <div className="fp-orb fp-orb--1" />
      <div className="fp-orb fp-orb--2" />
      <div className="fp-orb fp-orb--3" />

      <div className="fp-card">
        {submitted ? (
          /* ── Success State ── */
          <div className="fp-success-state">
            <div className="fp-success-icon">
              <CheckCircle2 size={40} />
            </div>
            <h2>Cek Email Anda!</h2>
            <p>
              Kami telah mengirimkan link reset password ke{' '}
              <strong>{email}</strong>.<br />
              Link berlaku selama <strong>60 menit</strong>.
            </p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Tidak menerima email? Periksa folder spam atau{' '}
              <button
                style={{
                  background: 'none', border: 'none',
                  color: '#818cf8', fontWeight: 600,
                  cursor: 'pointer', fontSize: '13px',
                  padding: 0, textDecoration: 'underline',
                }}
                onClick={() => { setSubmitted(false); setEmail(''); }}
              >
                coba lagi
              </button>
              .
            </p>

            <div className="fp-footer-links" style={{ marginTop: 32 }}>
              <Link to="/login">
                <ArrowLeft size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Kembali ke halaman Login
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form State ── */
          <>
            <div className="fp-card__header">
              <div className="fp-icon">
                <KeyRound size={36} />
              </div>
              <h1>Lupa Password?</h1>
              <p>
                Masukkan email Anda dan kami akan mengirimkan<br />
                link untuk mereset password.
              </p>
            </div>

            {error && (
              <div className="fp-alert fp-alert--error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form className="fp-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fp-email">Alamat Email</label>
                <input
                  id="fp-email"
                  type="email"
                  className="form-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="fp-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="fp-spinner" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Kirim Link Reset Password
                  </>
                )}
              </button>
            </form>

            <div className="fp-footer-links">
              <Link to="/login">
                <ArrowLeft size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Kembali ke Login
              </Link>
              <span className="separator">·</span>
              <Link to="/register">Buat Akun Baru</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
