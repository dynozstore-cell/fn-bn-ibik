import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Key, LogOut, Camera, Save,
  CheckCircle, Eye, EyeOff, Lock, AlertCircle, Edit3, Info,
  Building2, Shield
} from 'lucide-react';
import { getUser, clearAuth, setAuth, getToken } from '../utils/auth';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import '../styles/AdminProfilePage.css';

/* ── Password strength ─────────────────────────────────── */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Lemah',  color: '#ef4444' };
  if (score <= 3) return { score, label: 'Cukup',  color: '#f59e0b' };
  return              { score, label: 'Kuat',   color: '#10b981' };
}

function getInitials(name) {
  return (name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function getCategoryStyle(cat) {
  const map = {
    'Unit Kerja': { color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
    'Mahasiswa':  { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
    'Komunitas':  { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  };
  return map[cat] ?? { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
}

function PasswordInput({ name, value, onChange, placeholder, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="aprof-input-icon-wrap">
      <Lock size={17} className="aprof-input-icon-left" />
      <input
        type={show ? 'text' : 'password'}
        className="aprof-input has-icon"
        name={name} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete="off" {...props}
      />
      <button type="button" className="aprof-toggle-pw"
        onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function PenyelenggaraProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    name: '', username: '', email: '', phone: '', kategori: '', avatarUrl: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [isSaving, setIsSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess]     = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [profileError, setProfileError]   = useState('');
  const [edited, setEdited]               = useState(false);

  const strength   = getPasswordStrength(passwordData.newPassword);
  const catStyle   = getCategoryStyle(profileData.kategori);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setProfileData(prev => ({
        ...prev,
        name:     u.nama_lengkap        || u.name || '',
        username: u.username            || '',
        email:    u.email               || '',
        phone:    u.no_hp               || '',
        kategori: u.kategori_pendaftar  || '',
      }));
    }

    const token = getToken() || '';
    
    // Fetch fresh user data
    fetch(buildApiUrl('/api/me'), {
      headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res && res.data) {
          const freshUser = res.data;
          setProfileData(prev => ({
            ...prev,
            name:     freshUser.nama_lengkap        || freshUser.name || prev.name,
            username: freshUser.username            || prev.username,
            email:    freshUser.email               || prev.email,
            phone:    freshUser.no_hp               || prev.phone,
            kategori: freshUser.kategori_pendaftar  || prev.kategori,
            avatarUrl: freshUser.avatarUrl          || prev.avatarUrl,
          }));
          setAuth(token, freshUser);
        }
      })
      .catch(() => {});
  }, []);

  const handleProfileChange = e => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setEdited(true); setProfileError('');
  };
  const handlePasswordChange = e => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError('');
  };
  const handleAvatarUpload = e => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatarUrl: reader.result }));
        setEdited(true);
      };
      reader.readAsDataURL(file);
    }
  };
  const toast = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); };

  const handleSaveProfile = async e => {
    e.preventDefault();
    setIsSaving(true); setProfileError('');
    try {
      const token  = getToken() || '';
      const formData = new FormData();
      formData.append('nama_lengkap', profileData.name);
      formData.append('username', profileData.username);
      formData.append('no_hp', profileData.phone);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await fetch(buildApiUrl('/api/user/profile'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan profil');

      setAuth(token, data.data);
      setProfileData(prev => ({ ...prev, avatarUrl: data.data.avatarUrl }));
      setAvatarFile(null);
      setEdited(false); toast();
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = e => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return setPasswordError('Konfirmasi password baru tidak cocok.');
    if (passwordData.newPassword.length < 6)
      return setPasswordError('Password baru minimal 6 karakter.');
    setIsSaving(true); setPasswordError('');
    setTimeout(() => {
      setIsSaving(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast();
    }, 900);
  };

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar dari sesi penyelenggara?')) {
      clearAuth(); navigate('/login');
    }
  };

  return (
    <div className="aprof-wrap">

      {/* Toast */}
      <div className={`aprof-toast ${saveSuccess ? 'show' : ''}`}>
        <CheckCircle size={18} /> Perubahan berhasil disimpan!
      </div>

      {/* Header */}
      <div className="aprof-header-profile">
        <div className="aprof-header-profile-left">
          <div className="aprof-avatar-container">
            <div className="aprof-avatar-ring">
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" className="aprof-avatar-img" />
              ) : (
                <div className="aprof-avatar-initials"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                  {getInitials(profileData.name)}
                </div>
              )}
            </div>
            <label className="aprof-avatar-cam" title="Ganti Foto">
              <Camera size={15} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          </div>

          <div className="aprof-user-info">
            <h1 className="aprof-user-name">{profileData.username || profileData.name || 'Penyelenggara'}</h1>
            <div className="aprof-user-badges">
              <span className="aprof-badge"
                style={{ background: catStyle.bg, color: catStyle.color }}>
                <Building2 size={13} /> {profileData.kategori || 'Penyelenggara'}
              </span>
              <span className="aprof-badge gray">
                <Shield size={13} /> Penyelenggara
              </span>
              <span className="aprof-badge gray">
                <Mail size={13} /> {profileData.email}
              </span>
            </div>
          </div>
        </div>

        <button className="aprof-logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Logout
        </button>
      </div>

      {/* Body */}
      <div className="aprof-body">
        {/* Tabs */}
        <div className="aprof-tab-row">
          {[
            { id: 'profile',  icon: <User size={17} />, label: 'Edit Profil' },
            { id: 'password', icon: <Key  size={17} />, label: 'Keamanan'    },
          ].map(t => (
            <button key={t.id}
              className={`aprof-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Edit Profil ─────────────────────── */}
        {activeTab === 'profile' && (
          <div className="aprof-card fade-in">
            <div className="aprof-card-head">
              <div>
                <h2><Edit3 size={18} className="aprof-card-icon" /> Informasi Profil</h2>
                <p>Perbarui data diri yang tampil pada sistem dan notifikasi.</p>
              </div>
              {edited && <span className="aprof-unsaved-badge">Ada perubahan belum tersimpan</span>}
            </div>

            {profileError && (
              <div className="aprof-alert-error" style={{ margin: '0 0 16px' }}>
                <AlertCircle size={17} /> {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="aprof-form">
              <div className="aprof-form-grid">
                <div className="aprof-field">
                  <label>Nama Lengkap</label>
                  <div className="aprof-input-icon-wrap">
                    <User size={17} className="aprof-input-icon-left" />
                    <input type="text" className="aprof-input has-icon"
                      name="name" value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Nama lengkap Anda" required />
                  </div>
                </div>
                <div className="aprof-field">
                  <label>Username</label>
                  <div className="aprof-input-icon-wrap">
                    <User size={17} className="aprof-input-icon-left" />
                    <input type="text" className="aprof-input has-icon"
                      name="username" value={profileData.username}
                      onChange={handleProfileChange}
                      placeholder="Username akun (opsional)" />
                  </div>
                </div>
              </div>

              <div className="aprof-form-grid">
                <div className="aprof-field">
                  <label>Nomor Telepon</label>
                  <div className="aprof-input-icon-wrap">
                    <Phone size={17} className="aprof-input-icon-left" />
                    <input type="tel" className="aprof-input has-icon"
                      name="phone" value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="08xxxxxxxxxx" />
                  </div>
                </div>
                <div className="aprof-field">
                  <label>Alamat Email</label>
                  <div className="aprof-input-icon-wrap">
                    <Mail size={17} className="aprof-input-icon-left" />
                    <input type="email" className="aprof-input has-icon"
                      name="email" value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="email@contoh.com" required />
                  </div>
                </div>
              </div>

              <div className="aprof-field">
                <label>Kategori Penyelenggara</label>
                <div className="aprof-input-icon-wrap">
                  <Building2 size={17} className="aprof-input-icon-left" />
                  <select className="aprof-input has-icon" name="kategori"
                    value={profileData.kategori} onChange={handleProfileChange}
                    style={{ appearance: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <option value="">-- Pilih Kategori --</option>
                    <option value="Unit Kerja">Unit Kerja</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Komunitas">Komunitas</option>
                  </select>
                </div>
              </div>

              <div className="aprof-form-foot">
                <button type="submit" className="aprof-btn-primary" disabled={isSaving}>
                  {isSaving ? <span className="aprof-spinner" /> : <Save size={17} />}
                  {isSaving ? 'Menyimpan…' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab: Keamanan ────────────────────────── */}
        {activeTab === 'password' && (
          <div className="aprof-card fade-in">
            <div className="aprof-card-head">
              <div>
                <h2><Key size={18} className="aprof-card-icon" /> Ganti Password</h2>
                <p>Gunakan kombinasi huruf besar, angka, dan simbol agar lebih aman.</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="aprof-form">
              {passwordError && (
                <div className="aprof-alert-error">
                  <AlertCircle size={17} /> {passwordError}
                </div>
              )}

              <div className="aprof-field">
                <label>Password Saat Ini</label>
                <PasswordInput name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan password lama" required />
              </div>

              <div className="aprof-divider-line"><span>Password Baru</span></div>

              <div className="aprof-field">
                <label>Password Baru</label>
                <PasswordInput name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimal 6 karakter" required />
                {passwordData.newPassword && (
                  <div className="aprof-strength-wrap">
                    <div className="aprof-strength-bar-row">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="aprof-strength-seg"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <span className="aprof-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="aprof-field">
                <label>Konfirmasi Password Baru</label>
                <PasswordInput name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Ketik ulang password baru" required />
                {passwordData.confirmPassword && (
                  passwordData.newPassword === passwordData.confirmPassword
                    ? <span className="aprof-match ok"><CheckCircle size={13} /> Password cocok</span>
                    : <span className="aprof-match err"><AlertCircle size={13} /> Tidak cocok</span>
                )}
              </div>

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
