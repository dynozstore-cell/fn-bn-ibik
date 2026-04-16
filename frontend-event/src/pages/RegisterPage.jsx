import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { buildApiUrl, defaultHeaders } from '../utils/api';

/* ── Password rules ── */
const RULES = [
  { label: 'Min. 8 karakter',    test: (p) => p.length >= 8 },
  { label: 'Huruf besar (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { label: 'Huruf kecil (a-z)',   test: (p) => /[a-z]/.test(p) },
  { label: 'Angka (0-9)',         test: (p) => /[0-9]/.test(p) },
  { label: 'Simbol (@, #, !…)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pw) {
  return RULES.filter((r) => r.test(pw)).length; // 0-5
}

const STRENGTH_LABELS = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Baik', 'Kuat'];
const STRENGTH_COLORS = ['', '#ef4444', '#ef4444', '#f59e0b', '#06b6d4', '#10b981'];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    no_hp: '',
    kategori_pendaftar: '',
    password: '',
    konfirmasi_password: '',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') setShowRules(true);
  };

  const strength = getStrength(formData.password);
  const allRulesMet = strength === 5 &&
    formData.password === formData.konfirmasi_password &&
    formData.konfirmasi_password.length > 0;

  const validateForm = () => {
    if (!formData.nama_lengkap.trim()) { setError('Nama lengkap tidak boleh kosong'); return false; }
    if (!formData.email.includes('@'))  { setError('Email tidak valid'); return false; }
    if (!formData.no_hp.trim())         { setError('Nomor handphone tidak boleh kosong'); return false; }
    if (!formData.kategori_pendaftar)   { setError('Silakan pilih kategori pendaftar'); return false; }

    if (formData.password.length < 8)           { setError('Password minimal 8 karakter'); return false; }
    if (!/[A-Z]/.test(formData.password))       { setError('Password harus mengandung huruf besar'); return false; }
    if (!/[a-z]/.test(formData.password))       { setError('Password harus mengandung huruf kecil'); return false; }
    if (!/[0-9]/.test(formData.password))       { setError('Password harus mengandung angka'); return false; }
    if (!/[^A-Za-z0-9]/.test(formData.password)) { setError('Password harus mengandung simbol'); return false; }
    if (formData.password !== formData.konfirmasi_password) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/register'), {
        method:  'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          nama_lengkap:        formData.nama_lengkap,
          email:               formData.email.trim().toLowerCase(),
          no_hp:               formData.no_hp,
          kategori_pendaftar:  formData.kategori_pendaftar,
          password:            formData.password,
          password_confirmation: formData.konfirmasi_password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Pendaftaran berhasil! Mengalihkan ke verifikasi OTP...');
        setIsVisible(false);
        setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(data.data.email)}`), 600);
      } else {
        const errorData = await response.json();
        // Ambil error pertama dari validation errors
        const firstError = errorData.errors
          ? Object.values(errorData.errors)[0]?.[0]
          : null;
        setError(firstError || errorData.message || 'Pendaftaran gagal. Coba lagi.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`register-page ${isVisible ? 'page-visible' : ''}`}>
      <div className="register-backdrop"></div>
      <div className="register-shape register-shape--1"></div>
      <div className="register-shape register-shape--2"></div>
      <div className="register-shape register-shape--3"></div>
      <div className="register-shape register-shape--4"></div>
      <div className="register-shape register-shape--5"></div>
      <div className="register-card">
        <div className="register-card__header">
          <div className="register-icon">
            <UserPlus size={48} />
          </div>
          <h1>Buat Akun Baru</h1>
          <p>Daftarkan diri Anda dan mulai ikuti event-event menarik bersama kami.</p>
        </div>

        {error && (
          <div className="register-alert register-alert--error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="register-alert register-alert--success">
            <span>✓ {success}</span>
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <div className="form-group full-width">
            <label htmlFor="nama_lengkap">Nama Lengkap</label>
            <input
              id="nama_lengkap" type="text" name="nama_lengkap"
              value={formData.nama_lengkap} onChange={handleChange}
              placeholder="Masukkan nama lengkap Anda"
              className="form-input" required
            />
          </div>

          {/* Email */}
          <div className="form-group full-width">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="Masukkan email Anda"
              className="form-input" required
            />
          </div>

          {/* No Handphone */}
          <div className="form-group">
            <label htmlFor="no_hp">Nomor Handphone</label>
            <input
              id="no_hp" type="tel" name="no_hp"
              value={formData.no_hp} onChange={handleChange}
              placeholder="Masukkan nomor handphone"
              className="form-input" required
            />
          </div>

          {/* Kategori Pendaftar */}
          <div className="form-group">
            <label htmlFor="kategori_pendaftar">Kategori Pendaftar</label>
            <select
              id="kategori_pendaftar" name="kategori_pendaftar"
              value={formData.kategori_pendaftar} onChange={handleChange}
              className="form-input form-select" required
            >
              <option value="" disabled hidden>Pilih kategori</option>
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="Umum">Umum</option>
              <option value="Dosen">Dosen</option>
            </select>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password" value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 karakter"
                className="form-input" required
              />
              <button type="button" className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength Bar */}
            {formData.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: strength >= i ? STRENGTH_COLORS[strength] : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: STRENGTH_COLORS[strength] }}>
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Password Rules */}
          {showRules && (
            <div style={{
              gridColumn: '1 / -1',
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 6, padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, marginTop: -12,
            }}>
              {RULES.map((rule, i) => {
                const met = rule.test(formData.password);
                return (
                  <div key={i} style={{
                    fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                    color: met ? '#34d399' : '#94a3b8', transition: 'color 0.2s',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    {rule.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Konfirmasi Password */}
          <div className="form-group">
            <label htmlFor="konfirmasi_password">Konfirmasi Kata Sandi</label>
            <div className="password-input-wrapper">
              <input
                id="konfirmasi_password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="konfirmasi_password" value={formData.konfirmasi_password}
                onChange={handleChange}
                placeholder="Ketik ulang kata sandi"
                className="form-input" required
              />
              <button type="button" className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.konfirmasi_password.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600, marginTop: 4,
                color: formData.password === formData.konfirmasi_password ? '#34d399' : '#f87171',
              }}>
                {formData.password === formData.konfirmasi_password ? '✓ Password cocok' : '✗ Password tidak cocok'}
              </span>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="register-submit-btn" disabled={loading}>
            {loading ? 'Sedang Mendaftar...' : 'Daftar Sekarang'}
          </button>

          <div className="login-copy">
            Sudah punya akun? <Link to="/login" className="login-link">Masuk di sini</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
