import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { setAuth } from '../utils/auth';
import { buildApiUrl, defaultHeaders } from '../utils/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible]       = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(buildApiUrl('/api/login'), {
        method:  'POST',
        headers: defaultHeaders,
        body:    JSON.stringify({
          email:    formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuth(data.token, data.data);
        setSuccess('Login berhasil! Mengalihkan...');
        setIsVisible(false);
        setTimeout(() => navigate('/'), 600);
      } else if (response.status === 403 && data.error_code === 'email_not_verified') {
        // Email belum diverifikasi → arahkan ke OTP verify
        setError(data.message || 'Email belum diverifikasi.');
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(data.email || formData.email)}`);
        }, 2000);
      } else {
        setError(data.message || 'Email atau password salah');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isVisible ? 'page-visible' : ''}`}>
      <div className="login-backdrop"></div>
      <div className="login-shape login-shape--1"></div>
      <div className="login-shape login-shape--2"></div>
      <div className="login-shape login-shape--3"></div>
      <div className="login-shape login-shape--4"></div>
      <div className="login-shape login-shape--5"></div>
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-icon">
            <Lock size={48} />
          </div>
          <h1>Selamat Datang Kembali!</h1>
          <p>Masukkan kredensial Anda untuk melanjutkan perjalanan bersama kami.</p>
        </div>

        {error && (
          <div className="login-alert login-alert--error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="login-alert login-alert--success">
            <span>✓ {success}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email Anda"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan kata sandi Anda"
                className="form-input"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />
              Ingat saya
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Lupa kata sandi?
            </Link>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="signup-copy">
          Belum punya akun?{' '}
          <Link to="/register" className="signup-link">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
