import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import './VerifyOTPPage.css';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { setAuth } from '../utils/auth';

const VerifyOTPPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'otp' && value.length <= 6) {
      setFormData({ ...formData, [name]: value });
    } else if (name === 'email') {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.otp) {
      setError('Email dan OTP wajib diisi');
      return;
    }

    if (formData.otp.length !== 6) {
      setError('OTP harus 6 digit');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/otp/verify'), {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token && data.data) {
          setAuth(data.token, data.data);
        }
        setSuccess('Verifikasi berhasil! Anda telah masuk. Mengalihkan ke beranda...');
        setIsVisible(false);
        setTimeout(() => {
          if (data.data?.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }, 600);
      } else {
        setError(data.message || 'Verifikasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await fetch(buildApiUrl('/api/otp/resend'), {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP baru telah dikirim! Berlaku 5 menit.');
        setTimeLeft(300); // Reset timer ke 5 menit
      } else {
        setError(data.message || 'Gagal mengirim ulang OTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`verify-otp-page ${isVisible ? 'page-visible' : ''}`}>
      <div className="verify-otp-backdrop"></div>
      <div className="verify-otp-shape verify-otp-shape--1"></div>
      <div className="verify-otp-shape verify-otp-shape--2"></div>
      <div className="verify-otp-shape verify-otp-shape--3"></div>
      
      <div className="verify-otp-card">
        <div className="verify-otp-card__header">
          <button 
            onClick={() => navigate('/register')} 
            className="back-button"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>
          
          <div className="verify-otp-icon">
            <Shield size={48} />
          </div>
          <h1>Verifikasi OTP</h1>
          <p>Masukkan kode OTP yang dikirim ke email Anda</p>
        </div>

        {error && (
          <div className="verify-otp-alert verify-otp-alert--error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="verify-otp-alert verify-otp-alert--success">
            <span>✓ {success}</span>
          </div>
        )}

        <form className="verify-otp-form" onSubmit={handleVerify}>
          <div className="email-display">
            Kode dikirim ke:
            <strong>{formData.email || 'Email belum disediakan'}</strong>
          </div>

          <div className="form-group full-width">
            <label htmlFor="otp">Kode OTP</label>
            <input
              id="otp"
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              placeholder="Masukkan 6 digit OTP"
              className="form-input otp-input"
              maxLength={6}
              pattern="\d{6}"
              required
            />
          </div>

          <div className="timer-container">
            {timeLeft > 0 ? (
              <p className="timer-text">
                Kode kadaluarsa dalam: <span>{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="timer-expired">Kode OTP telah kadaluarsa</p>
            )}
          </div>

          <button 
            type="submit" 
            className="verify-otp-submit-btn" 
            disabled={loading || timeLeft === 0}
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
          </button>

          <button
            type="button"
            className="resend-otp-btn"
            onClick={handleResend}
            disabled={resending || timeLeft > 0}
          >
            <RefreshCw size={16} className={resending ? 'spinning' : ''} />
            {resending ? 'Mengirim...' : 'Kirim Ulang OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
