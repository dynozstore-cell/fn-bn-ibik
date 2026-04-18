import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, Key, LogOut, Camera, Save,
  CheckCircle, Eye, EyeOff, Lock, AlertCircle, Edit3, Info
} from 'lucide-react';
import '../styles/AdminProfilePage.css';

/* ── Password strength helper ─────────────────────────── */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Lemah', color: '#ef4444' };
  if (score <= 3) return { score, label: 'Cukup', color: '#f59e0b' };
  return { score, label: 'Kuat', color: '#10b981' };
}

/* ── Initials avatar helper ───────────────────────────── */
function getInitials(name) {
  return (name || 'A')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/* ── Password input with show/hide toggle ─────────────── */
function PasswordInput({ name, value, onChange, placeholder, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="aprof-input-icon-wrap">
      <Lock size={17} className="aprof-input-icon-left" />
      <input
        type={show ? 'text' : 'password'}
        className="aprof-input has-icon"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        {...props}
      />
      <button
        type="button"
        className="aprof-toggle-pw"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function AdminProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    name: 'Admin EventHub',
    email: 'admin@eventhub.com',
    phone: '081234567890',
    bio: 'Administrator utama platform EventHub.',
    avatarUrl: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [edited, setEdited] = useState(false);

  const strength = getPasswordStrength(passwordData.newPassword);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.name || u.email) {
        setProfileData(prev => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
        }));
      }
    } catch (_) {}
  }, []);

  /* ─── Handlers ──────────────────────────────────────── */
  const handleProfileChange = e => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setEdited(true);
  };

  const handlePasswordChange = e => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError('');
  };

  const handleAvatarUpload = e => {
    const file = e.target.files[0];
    if (file) setProfileData(prev => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
  };

  const toast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveProfile = e => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...u, name: profileData.name, email: profileData.email }));
      setIsSaving(false);
      setEdited(false);
      toast();
    }, 900);
  };

  const handleSavePassword = e => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordError('Konfirmasi password baru tidak cocok.');
    }
    if (passwordData.newPassword.length < 8) {
      return setPasswordError('Password baru minimal 8 karakter.');
    }
    setIsSaving(true);
    setPasswordError('');
    setTimeout(() => {
      setIsSaving(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast();
    }, 900);
  };

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar dari sesi admin?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="aprof-wrap">
      {/* ── Toast ─────────────────────────────── */}
      <div className={`aprof-toast ${saveSuccess ? 'show' : ''}`}>
        <CheckCircle size={18} /> Perubahan berhasil disimpan!
      </div>

      {/* ── Header Profile ───────────────────────── */}
      <div className="aprof-header-profile">
        <div className="aprof-header-profile-left">
          {/* Avatar */}
          <div className="aprof-avatar-container">
            <div className="aprof-avatar-ring">
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" className="aprof-avatar-img" />
              ) : (
                <div className="aprof-avatar-initials">
                  {getInitials(profileData.name)}
                </div>
              )}
            </div>
            <label className="aprof-avatar-cam" title="Ganti Foto">
              <Camera size={15} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          </div>

          {/* User Info */}
          <div className="aprof-user-info">
            <h1 className="aprof-user-name">{profileData.name}</h1>
            <div className="aprof-user-badges">
              <span className="aprof-badge blue"><Shield size={13} /> Administrator</span>
              <span className="aprof-badge gray"><Mail size={13} /> {profileData.email}</span>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button className="aprof-logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Logout
        </button>
      </div>

      {/* ── Body ──────────────────────────────── */}
      <div className="aprof-body">

        {/* ── Tab Switcher ──────────────────── */}
        <div className="aprof-tab-row">
          {[
            { id: 'profile', icon: <User size={17} />, label: 'Edit Profil' },
            { id: 'password', icon: <Key size={17} />, label: 'Keamanan' },
          ].map(t => (
            <button
              key={t.id}
              className={`aprof-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            TAB: EDIT PROFILE
        ══════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="aprof-card fade-in">
            <div className="aprof-card-head">
              <div>
                <h2><Edit3 size={18} className="aprof-card-icon" /> Informasi Profil</h2>
                <p>Perbarui data diri yang tampil pada sistem dan notifikasi.</p>
              </div>
              {edited && <span className="aprof-unsaved-badge">Ada perubahan belum tersimpan</span>}
            </div>

            <form onSubmit={handleSaveProfile} className="aprof-form">
              {/* Name + Phone */}
              <div className="aprof-form-grid">
                <div className="aprof-field">
                  <label>Nama Lengkap</label>
                  <div className="aprof-input-icon-wrap">
                    <User size={17} className="aprof-input-icon-left" />
                    <input
                      type="text"
                      className="aprof-input has-icon"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Nama lengkap Anda"
                      required
                    />
                  </div>
                </div>
                <div className="aprof-field">
                  <label>Nomor Telepon</label>
                  <div className="aprof-input-icon-wrap">
                    <Phone size={17} className="aprof-input-icon-left" />
                    <input
                      type="tel"
                      className="aprof-input has-icon"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="aprof-field">
                <label>Alamat Email</label>
                <div className="aprof-input-icon-wrap">
                  <Mail size={17} className="aprof-input-icon-left" />
                  <input
                    type="email"
                    className="aprof-input has-icon"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="email@contoh.com"
                    required
                  />
                </div>
                <span className="aprof-hint"><Info size={12} /> Email ini digunakan untuk login dan notifikasi sistem.</span>
              </div>

              {/* Bio */}
              <div className="aprof-field">
                <label>Bio / Catatan Pribadi</label>
                <textarea
                  className="aprof-input"
                  rows={3}
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  placeholder="Ceritakan sedikit tentang Anda..."
                />
              </div>

              {/* Action */}
              <div className="aprof-form-foot">
                <button type="submit" className="aprof-btn-primary" disabled={isSaving}>
                  {isSaving ? <span className="aprof-spinner" /> : <Save size={17} />}
                  {isSaving ? 'Menyimpan…' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: CHANGE PASSWORD
        ══════════════════════════════════════ */}
        {activeTab === 'password' && (
          <div className="aprof-card fade-in">
            <div className="aprof-card-head">
              <div>
                <h2><Key size={18} className="aprof-card-icon" /> Ganti Password</h2>
                <p>Gunakan kombinasi huruf besar, angka, dan simbol agar lebih aman.</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="aprof-form">
              {/* Error Alert */}
              {passwordError && (
                <div className="aprof-alert-error">
                  <AlertCircle size={17} /> {passwordError}
                </div>
              )}

              {/* Current Password */}
              <div className="aprof-field">
                <label>Password Saat Ini</label>
                <PasswordInput
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan password lama"
                  required
                />
              </div>

              <div className="aprof-divider-line"><span>Password Baru</span></div>

              {/* New Password */}
              <div className="aprof-field">
                <label>Password Baru</label>
                <PasswordInput
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                />
                {/* Strength Bar */}
                {passwordData.newPassword && (
                  <div className="aprof-strength-wrap">
                    <div className="aprof-strength-bar-row">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="aprof-strength-seg"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }}
                        />
                      ))}
                    </div>
                    <span className="aprof-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="aprof-field">
                <label>Konfirmasi Password Baru</label>
                <PasswordInput
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Ketik ulang password baru"
                  required
                />
                {/* Match indicator */}
                {passwordData.confirmPassword && (
                  passwordData.newPassword === passwordData.confirmPassword
                    ? <span className="aprof-match ok"><CheckCircle size={13} /> Password cocok</span>
                    : <span className="aprof-match err"><AlertCircle size={13} /> Tidak cocok</span>
                )}
              </div>

              {/* Action */}
              <div className="aprof-form-foot">
                <button type="submit" className="aprof-btn-primary" disabled={isSaving}>
                  {isSaving ? <span className="aprof-spinner" /> : <Key size={17} />}
                  {isSaving ? 'Memperbarui…' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
