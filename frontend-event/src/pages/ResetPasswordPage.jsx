import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { LockKeyhole, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import './ResetPasswordPage.css';
import { buildApiUrl, defaultHeaders } from '../utils/api';

/* ── Password strength helper ── */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;
  return score; // 0-4
}

const STRENGTH_MAP = [
  { label: 'Sangat Lemah', cls: 'weak' },
  { label: 'Lemah',        cls: 'weak' },
  { label: 'Cukup',        cls: 'fair' },
  { label: 'Baik',         cls: 'good' },
  { label: 'Kuat',         cls: 'strong' },
];

const BAR_ACTIVE = ['active-weak', 'active-fair', 'active-good', 'active-strong'];

const RULES = [
  { label: 'Min. 8 karakter',    test: (p) => p.length >= 8 },
  { label: 'Huruf besar (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { label: 'Huruf kecil (a-z)',   test: (p) => /[a-z]/.test(p) },
  { label: 'Angka (0-9)',         test: (p) => /[0-9]/.test(p) },
  { label: 'Simbol (@, #, !…)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: 'Password cocok',      test: (p, c) => p === c && p.length > 0 },
];

/* ─────────────────────────────────────────────────────────── */

const ResetPasswordPage = () => {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Link reset tidak valid. Minta link baru dari halaman lupa password.');
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (strength < 4) {
      setError('Password terlalu lemah. Pastikan memenuhi semua aturan di bawah.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(buildApiUrl('/api/reset-password'), {
        method:  'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          email,
          token,
          password:              form.password,
          password_confirmation: form.password_confirmation,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // Tampilkan error pertama dari validation jika ada
        const firstError =
          data.errors
            ? Object.values(data.errors)[0]?.[0]
            : null;
        setError(firstError || data.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Invalid token (tidak ada param) ── */
  if (!token || !email) {
    return (
      <div className={`rp-page ${isVisible ? 'page-visible' : ''}`}>
        <div className="rp-backdrop" />
        <div className="rp-orb rp-orb--1" />
        <div className="rp-orb rp-orb--2" />
        <div className="rp-card">
          <div className="rp-invalid-state">
            <div className="rp-invalid-icon"><XCircle size={40} /></div>
            <h2>Link Tidak Valid</h2>
            <p>
              Link reset password ini tidak valid atau sudah kadaluarsa.
              Silakan minta link baru.
            </p>
            <Link to="/forgot-password" className="rp-submit-btn" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>
              Minta Link Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className={`rp-page ${isVisible ? 'page-visible' : ''}`}>
        <div className="rp-backdrop" />
        <div className="rp-orb rp-orb--1" />
        <div className="rp-card">
          <div className="rp-success-state">
            <div className="rp-success-icon"><CheckCircle2 size={40} /></div>
            <h2>Password Berhasil Direset!</h2>
            <p>
              Password Anda telah diperbarui. Anda akan diarahkan ke halaman login
              dalam 3 detik...
            </p>
            <Link to="/login" className="rp-submit-btn" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>
              Login Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Form ── */
  return (
    <div className={`rp-page ${isVisible ? 'page-visible' : ''}`}>
      <div className="rp-backdrop" />
      <div className="rp-orb rp-orb--1" />
      <div className="rp-orb rp-orb--2" />

      <div className="rp-card">
        <div className="rp-card__header">
          <div className="rp-icon">
            <LockKeyhole size={36} />
          </div>
          <h1>Buat Password Baru</h1>
          <p>Password baru harus kuat dan berbeda dari sebelumnya.</p>
        </div>

        {error && (
          <div className="rp-alert rp-alert--error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form className="rp-form" onSubmit={handleSubmit}>
          {/* Password Baru */}
          <div className="form-group">
            <label htmlFor="rp-password">Password Baru</label>
            <div className="rp-password-wrapper">
              <input
                id="rp-password"
                type={showPw ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Buat password kuat"
                value={form.password}
                onChange={handleChange}
                required
                autoFocus
              />
              <button
                type="button"
                className="rp-toggle-btn"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength */}
            {form.password.length > 0 && (
              <div className="rp-strength">
                <div className="rp-strength-bars">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`rp-strength-bar ${strength > i ? BAR_ACTIVE[Math.min(strength - 1, 3)] : ''}`}
                    />
                  ))}
                </div>
                <span className={`rp-strength-label ${STRENGTH_MAP[strength].cls}`}>
                  {STRENGTH_MAP[strength].label}
                </span>
              </div>
            )}
          </div>

          {/* Password Rules */}
          <div className="rp-rules">
            {RULES.map((rule, i) => {
              const met = rule.test(form.password, form.password_confirmation);
              return (
                <div key={i} className={`rp-rule ${met ? 'met' : ''}`}>
                  <span className="rp-rule-dot" />
                  {rule.label}
                </div>
              );
            })}
          </div>

          {/* Konfirmasi Password */}
          <div className="form-group">
            <label htmlFor="rp-confirm">Konfirmasi Password</label>
            <div className="rp-password-wrapper">
              <input
                id="rp-confirm"
                type={showCpw ? 'text' : 'password'}
                name="password_confirmation"
                className="form-input"
                placeholder="Ketik ulang password baru"
                value={form.password_confirmation}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="rp-toggle-btn"
                onClick={() => setShowCpw(!showCpw)}
                aria-label={showCpw ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="rp-submit-btn"
            disabled={loading || strength < 4}
          >
            {loading ? (
              <>
                <span className="rp-spinner" />
                Menyimpan...
              </>
            ) : 'Simpan Password Baru'}
          </button>
        </form>

        <div className="rp-footer-links">
          <Link to="/login">Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
