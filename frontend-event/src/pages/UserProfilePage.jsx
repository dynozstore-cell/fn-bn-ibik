import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Key, LogOut, Camera, Save, CheckCircle,
  Eye, EyeOff, Lock, AlertCircle, Edit3, Info, Ticket, Calendar,
  MapPin, Tag, CreditCard, Clock, Trash2, ShieldAlert, Activity,
  ChevronRight, X, Award
} from 'lucide-react';
import { getUser, clearAuth, setAuth, getToken } from '../utils/auth';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import NavbarCustom from '../components/Navbar.jsx';
import TicketModal from '../components/TicketModal.jsx';

import '../styles/UserProfilePage.css';

/* ── Helpers ─────────────────────────────────────────── */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++; if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: 'Lemah', color: '#ef4444' };
  if (s <= 3) return { score: s, label: 'Cukup', color: '#f59e0b' };
  return { score: s, label: 'Kuat', color: '#10b981' };
}
function getInitials(n) { return (n||'U').split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase(); }

function PasswordInput({ name, value, onChange, placeholder, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="up-input-wrap">
      <Lock size={15} className="up-input-icon" />
      <input type={show ? 'text' : 'password'} className="up-input has-icon" name={name} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" {...rest} />
      <button type="button" className="up-pw-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

const TABS = [
  { id: 'profil',   icon: <User size={15} />,      label: 'Edit Profil' },
  { id: 'tiket',    icon: <Ticket size={15} />,     label: 'Tiket & Event' },
  { id: 'keamanan', icon: <Key size={15} />,        label: 'Keamanan' },
  { id: 'hapus',    icon: <Trash2 size={15} />,     label: 'Hapus Akun', danger: true },
];

const REG_STATUS = {
  pending:  { label:'Pending',  color:'#f59e0b', bg:'rgba(245,158,11,.15)' },
  Pending:  { label:'Pending',  color:'#f59e0b', bg:'rgba(245,158,11,.15)' },
  berhasil: { label:'Berhasil', color:'#10b981', bg:'rgba(16,185,129,.15)' },
  success:  { label:'Berhasil', color:'#10b981', bg:'rgba(16,185,129,.15)' },
  hadir:    { label:'Hadir',    color:'#3b82f6', bg:'rgba(59,130,246,.15)' },
  gagal:    { label:'Gagal',    color:'#ef4444', bg:'rgba(239,68,68,.15)'  },
};
const PAY_STATUS = {
  terverifikasi: { label:'Lunas',    color:'#10b981', bg:'rgba(16,185,129,.12)' },
  pending:       { label:'Menunggu', color:'#f59e0b', bg:'rgba(245,158,11,.12)' },
  ditolak:       { label:'Ditolak',  color:'#ef4444', bg:'rgba(239,68,68,.12)'  },
};
const getRS  = s => REG_STATUS[s]  || { label:s||'-',  color:'#94a3b8', bg:'rgba(148,163,184,.15)' };
const getPS  = s => PAY_STATUS[s]  || { label:s||'-',  color:'#94a3b8', bg:'rgba(148,163,184,.12)' };
const getLastPay = (arr=[]) => arr.length ? arr[arr.length-1]?.status_pembayaran : null;

export default function UserProfilePage() {
  const nav = useNavigate();
  const [tab, setTab]       = useState('profil');
  const [tickets, setTickets] = useState([]);
  const [loadingT, setLoadingT] = useState(false);
  const [filter, setFilter]   = useState('semua');

  const [prof, setProf] = useState({ name:'', email:'', phone:'', kategori:'', avatarUrl:'' });
  const [pw,   setPw]   = useState({ cur:'', nw:'', cf:'' });
  const [delPw, setDelPw] = useState('');

  const [saving, setSaving]     = useState(false);
  const [toast,  setToast]      = useState({ msg:'', type:'success' });
  const [profErr, setProfErr]   = useState('');
  const [pwErr,   setPwErr]     = useState('');
  const [delErr,  setDelErr]    = useState('');
  const [edited,  setEdited]    = useState(false);
  const [delStep, setDelStep]   = useState(false);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  const strength = getPasswordStrength(pw.nw);
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(t=>({...t,msg:''})), 3500); };

  /* Load user */
  useEffect(() => {
    const u = getUser();
    if (!u) { nav('/login'); return; }
    setProf(p => ({ ...p, name: u.nama_lengkap||'', email: u.email||'', phone: u.no_hp||'', kategori: u.kategori_pendaftar||'' }));
    const token = getToken();
    if (!token) return;
    fetch(buildApiUrl('/api/me'), { headers: { ...defaultHeaders, Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (!res?.data) return;
        const d = res.data;
        setProf(p => ({ ...p, name:d.nama_lengkap||p.name, email:d.email||p.email, phone:d.no_hp||p.phone, kategori:d.kategori_pendaftar||p.kategori }));
        setAuth(token, d);
      }).catch(()=>{});
  }, [nav]);

  /* Load tickets */
  useEffect(() => {
    if (tab !== 'tiket') return;
    setLoadingT(true);
    const u = getUser(); if (!u) return;
    fetch(buildApiUrl('/api/daftar-event'))
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const mine = (Array.isArray(data)?data:[])
          .filter(t => t.user_id === u.id_user || t.user_id === u.id)
          .sort((a,b) => new Date(b.tanggal_daftar)-new Date(a.tanggal_daftar));
        setTickets(mine);
      }).catch(()=>{}).finally(() => setLoadingT(false));
  }, [tab]);

  const handleSaveProf = async e => {
    e.preventDefault(); setSaving(true); setProfErr('');
    try {
      const token = getToken();
      const res = await fetch(buildApiUrl('/api/user/profile'), { method:'PUT', headers:{...defaultHeaders, Authorization:`Bearer ${token}`}, body:JSON.stringify({ nama_lengkap:prof.name, no_hp:prof.phone }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message||'Gagal');
      const u = getUser(); setAuth(token, {...u, nama_lengkap:prof.name, no_hp:prof.phone});
      setEdited(false); showToast('Profil berhasil diperbarui!');
    } catch(err) { setProfErr(err.message); } finally { setSaving(false); }
  };

  const handleSavePw = async e => {
    e.preventDefault(); setPwErr('');
    if (pw.nw !== pw.cf) return setPwErr('Konfirmasi password tidak cocok.');
    if (pw.nw.length < 8) return setPwErr('Password minimal 8 karakter.');
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(buildApiUrl('/api/user/password'), { method:'PUT', headers:{...defaultHeaders, Authorization:`Bearer ${token}`}, body:JSON.stringify({ current_password:pw.cur, new_password:pw.nw, new_password_confirmation:pw.cf }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.errors ? Object.values(d.errors)[0][0] : d.message);
      setPw({cur:'',nw:'',cf:''}); showToast('Password berhasil diperbarui!');
    } catch(err) { setPwErr(err.message); } finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!delPw) return setDelErr('Masukkan password untuk konfirmasi.');
    setSaving(true); setDelErr('');
    try {
      const token = getToken();
      const res = await fetch(buildApiUrl('/api/user/account'), { method:'DELETE', headers:{...defaultHeaders, Authorization:`Bearer ${token}`}, body:JSON.stringify({ password:delPw }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message||'Gagal');
      clearAuth(); nav('/');
    } catch(err) { setDelErr(err.message); } finally { setSaving(false); }
  };

  const visibleTickets = tickets.filter(t => {
    if (filter==='aktif')    return ['pending','Pending'].includes(t.status_pendaftaran);
    if (filter==='selesai')  return ['berhasil','success','hadir'].includes(t.status_pendaftaran);
    if (filter==='berbayar') return Number(t.total_harga)>0;
    return true;
  });

  const handleLihatTiket = (t) => {
    const tgl = t.event?.tanggal ? new Date(t.event.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
    setTicketData({
      qrValue: t.id || t.id_pendaftaran ? `EVT-${t.id || t.id_pendaftaran}` : `EVT-${Date.now()}`,
      eventName: t.event?.nama_event || t.nama_event || 'Event Tidak Diketahui',
      userName: prof.name || 'User',
      date: tgl,
      location: t.event?.lokasi || '-',
      ticketCount: t.jumlah_tiket || 1
    });
    setShowTicketModal(true);
  };

  const u = getUser();

  return (
    <>
      <NavbarCustom />
      <div className="up-page">
        {/* Toast */}
        <div className={`up-toast ${toast.msg?'show':''} ${toast.type}`}>
          {toast.type==='success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>} {toast.msg}
        </div>

        {/* Dynamic Background Elements */}
        <div className="up-bg-elements">
          <div className="up-bg-circle up-bg-circle-1"></div>
          <div className="up-bg-circle up-bg-circle-2"></div>
          <div className="up-bg-circle up-bg-circle-3"></div>
        </div>

        <div className="up-wrap">
          {/* MAIN GRID */}
          <div className="up-grid">
            {/* LEFT SIDEBAR */}
            <div className="up-left-col">
              <div className="up-profile-card fade-up">
                {/* Avatar */}
                <div className="up-avatar-wrap">
                  <div className="up-avatar">
                    {prof.avatarUrl ? <img src={prof.avatarUrl} alt="av"/> : <span>{getInitials(prof.name)}</span>}
                  </div>
                  <label className="up-avatar-btn" title="Ganti Foto">
                    <Camera size={13}/>
                    <input type="file" accept="image/*" hidden onChange={e=>{ const f=e.target.files[0]; if(f) setProf(p=>({...p,avatarUrl:URL.createObjectURL(f)})); }}/>
                  </label>
                </div>

                <div className="up-profile-name">{prof.name||'User'}</div>
                <div className="up-profile-role"><Award size={12}/> {prof.kategori||'User'}</div>

                {/* Nav */}
                <div className="up-nav-tabs">
                  {TABS.map(t => (
                    <button key={t.id} className={`up-nav-btn${tab===t.id?' active':''}${t.danger?' danger':''}`} onClick={()=>setTab(t.id)}>
                      {t.icon}<span>{t.label}</span><ChevronRight size={13} className="up-nav-arrow"/>
                    </button>
                  ))}
                  <div className="up-nav-divider"/>
                  <button className="up-logout-btn" onClick={async()=>{ if(window.confirm('Yakin ingin keluar?')){ await clearAuth(); nav('/'); }}}>
                    <LogOut size={14}/> Keluar
                  </button>
                </div>
              </div>
            </div>{/* end up-left-col */}

            {/* RIGHT COLUMN — stats + content stacked */}
            <div className="up-right-col">
              <div className="up-stats-row fade-up">
                <div className="up-stat-card">
                  <div className="up-stat-icon purple"><Ticket size={20}/></div>
                  <div><div className="up-stat-num">{tickets.length}</div><div className="up-stat-label">Total Event</div></div>
                </div>
                <div className="up-stat-card">
                  <div className="up-stat-icon blue"><Activity size={20}/></div>
                  <div><div className="up-stat-num">{tickets.filter(t=>['pending','Pending'].includes(t.status_pendaftaran)).length}</div><div className="up-stat-label">Tiket Aktif</div></div>
                </div>
                <div className="up-stat-card">
                  <div className="up-stat-icon green"><CheckCircle size={20}/></div>
                  <div><div className="up-stat-num">{tickets.filter(t=>['berhasil','success','hadir'].includes(t.status_pendaftaran)).length}</div><div className="up-stat-label">Selesai</div></div>
                </div>
              </div>

              {/* CONTENT */}
              <div>

              {/* ═══ PROFIL ═══ */}
              {tab==='profil' && (
                <div className="up-panel fade-up">
                  <div className="up-panel-head">
                    <div><h2><Edit3 size={18}/> Informasi Profil</h2><p>Perbarui data diri Anda yang terdaftar pada sistem.</p></div>
                    {edited && <span className="up-badge-warn">Belum disimpan</span>}
                  </div>
                  {profErr && <div className="up-alert err"><AlertCircle size={14}/> {profErr}</div>}
                  <form onSubmit={handleSaveProf} className="up-form">
                    <div className="up-grid-2">
                      <div className="up-field">
                        <label>Nama Lengkap</label>
                        <div className="up-input-wrap">
                          <User size={15} className="up-input-icon"/>
                          <input type="text" className="up-input has-icon" value={prof.name} onChange={e=>{ setProf(p=>({...p,name:e.target.value})); setEdited(true); setProfErr(''); }} placeholder="Nama lengkap Anda" required/>
                        </div>
                      </div>
                      <div className="up-field">
                        <label>Nomor Telepon</label>
                        <div className="up-input-wrap">
                          <Phone size={15} className="up-input-icon"/>
                          <input type="tel" className="up-input has-icon" value={prof.phone} onChange={e=>{ setProf(p=>({...p,phone:e.target.value})); setEdited(true); }} placeholder="08xxxxxxxxxx"/>
                        </div>
                      </div>
                    </div>
                    <div className="up-field">
                      <label>Alamat Email <span className="up-locked-tag">🔒 Tidak dapat diubah</span></label>
                      <div className="up-input-wrap">
                        <Mail size={15} className="up-input-icon"/>
                        <input type="email" className="up-input has-icon locked" value={prof.email} readOnly/>
                      </div>
                      <span className="up-hint"><Info size={11}/> Email tidak dapat diubah setelah registrasi untuk alasan keamanan.</span>
                    </div>
                    <div className="up-field">
                      <label>Kategori Pendaftar</label>
                      <div className="up-input-wrap">
                        <Award size={15} className="up-input-icon"/>
                        <input type="text" className="up-input has-icon locked" value={prof.kategori||'-'} readOnly/>
                      </div>
                    </div>
                    <div className="up-form-foot">
                      <button className="up-btn primary" disabled={saving||!edited}>
                        {saving?<span className="up-spinner"/>:<Save size={15}/>} {saving?'Menyimpan…':'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ═══ TIKET & EVENT ═══ */}
              {tab==='tiket' && (
                <div className="up-panel fade-up">
                  <div className="up-panel-head">
                    <div><h2><Ticket size={18}/> Tiket & Event Saya</h2><p>Semua event yang pernah Anda daftarkan beserta status pembayarannya.</p></div>
                    <span className="up-badge-info">{tickets.length} Event</span>
                  </div>
                  <div className="up-filters">
                    {[['semua','Semua'],['aktif','Aktif'],['selesai','Selesai'],['berbayar','Berbayar']].map(([v,l])=>(
                      <button key={v} className={`up-pill${filter===v?' active':''}`} onClick={()=>setFilter(v)}>{l}</button>
                    ))}
                  </div>

                  {loadingT ? (
                    <div className="up-loading"><span className="up-spinner lg"/><p>Memuat tiket…</p></div>
                  ) : visibleTickets.length===0 ? (
                    <div className="up-empty">
                      <Ticket size={48}/><h4>{filter==='semua'?'Belum Ada Tiket':'Tidak Ada Data'}</h4>
                      <p>{filter==='semua'?'Anda belum mendaftar ke acara apapun.':'Tidak ada tiket dengan filter ini.'}</p>
                      {filter==='semua' && <button className="up-btn primary sm" onClick={()=>nav('/events')}>Cari Event</button>}
                    </div>
                  ) : (
                    <div className="up-ticket-list">
                      {visibleTickets.map(t => {
                        const rs = getRS(t.status_pendaftaran);
                        const ps = getPS(getLastPay(t.pembayaran));
                        const isPaid = Number(t.total_harga)>0;
                        const tgl = t.event?.tanggal ? new Date(t.event.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
                        return (
                          <div key={t.id||t.id_pendaftaran} className="up-ticket-card">
                            <div className="up-ticket-left"><Activity size={18} color="#a855f7"/></div>
                            <div className="up-ticket-body">
                              <div className="up-ticket-top">
                                <h4>{t.event?.nama_event||t.nama_event||'Event Tidak Diketahui'}</h4>
                                <div className="up-ticket-badges">
                                  <span className="up-status-badge" style={{color:rs.color,background:rs.bg}}>{rs.label}</span>
                                  {isPaid && <span className="up-status-badge" style={{color:ps.color,background:ps.bg}}><CreditCard size={10}/> {ps.label}</span>}
                                </div>
                              </div>
                              <div className="up-ticket-meta">
                                <span><Calendar size={12}/> {tgl}</span>
                                <span><MapPin size={12}/> {t.event?.lokasi||'-'}</span>
                                <span><Tag size={12}/> {t.jumlah_tiket||1} Tiket</span>
                              </div>
                              <div className="up-ticket-foot">
                                <div className="up-ticket-price">
                                  {isPaid ? <><CreditCard size={12}/><strong>Rp {Number(t.total_harga).toLocaleString('id-ID')}</strong></> : <><CheckCircle size={12} color="#10b981"/><span style={{color:'#10b981'}}>Gratis</span></>}
                                  <span className="up-ticket-date" style={{marginLeft: '10px'}}><Clock size={11}/> {new Date(t.tanggal_daftar).toLocaleDateString('id-ID')}</span>
                                </div>
                                <button 
                                  onClick={() => handleLihatTiket(t)}
                                  className="up-btn primary sm" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                                >
                                  <Ticket size={12}/> Lihat Tiket
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ KEAMANAN ═══ */}
              {tab==='keamanan' && (
                <div className="up-panel fade-up">
                  <div className="up-panel-head"><div><h2><Key size={18}/> Keamanan Akun</h2><p>Ganti password untuk menjaga keamanan akun Anda.</p></div></div>
                  {pwErr && <div className="up-alert err"><AlertCircle size={14}/> {pwErr}</div>}
                  <form onSubmit={handleSavePw} className="up-form">
                    <div className="up-field">
                      <label>Password Saat Ini</label>
                      <PasswordInput value={pw.cur} onChange={e=>setPw(p=>({...p,cur:e.target.value}))} placeholder="Masukkan password saat ini" required/>
                    </div>
                    <div className="up-divider"><span>Password Baru</span></div>
                    <div className="up-field">
                      <label>Password Baru</label>
                      <PasswordInput value={pw.nw} onChange={e=>setPw(p=>({...p,nw:e.target.value}))} placeholder="Min. 8 karakter, huruf besar, angka, simbol" required/>
                      {pw.nw && <div className="up-strength"><div className="up-strength-bars">{[1,2,3,4,5].map(i=><div key={i} className="up-bar" style={{background:i<=strength.score?strength.color:'rgba(255,255,255,.08)'}}/>)}</div><span style={{color:strength.color,fontSize:'.75rem',fontWeight:600}}>{strength.label}</span></div>}
                    </div>
                    <div className="up-field">
                      <label>Konfirmasi Password Baru</label>
                      <PasswordInput value={pw.cf} onChange={e=>setPw(p=>({...p,cf:e.target.value}))} placeholder="Ketik ulang password baru" required/>
                      {pw.cf && (pw.nw===pw.cf ? <span className="up-match ok"><CheckCircle size={12}/> Password cocok</span> : <span className="up-match err"><AlertCircle size={12}/> Tidak cocok</span>)}
                    </div>
                    <div className="up-form-foot">
                      <button className="up-btn primary" disabled={saving||!pw.cur}>
                        {saving?<span className="up-spinner"/>:<Key size={15}/>} {saving?'Memperbarui…':'Perbarui Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ═══ HAPUS AKUN ═══ */}
              {tab==='hapus' && (
                <div className="up-panel fade-up">
                  <div className="up-panel-head"><div><h2 style={{color:'#f87171'}}><ShieldAlert size={18}/> Hapus Akun</h2><p>Tindakan ini bersifat permanen dan tidak dapat dibatalkan.</p></div></div>
                  <div className="up-danger-warn">
                    <AlertCircle size={20} color="#f87171" style={{flexShrink:0,marginTop:2}}/>
                    <div>
                      <strong>Perhatian!</strong>
                      <p>Menghapus akun akan menghapus seluruh data Anda secara permanen termasuk riwayat tiket, data profil, dan semua informasi yang tersimpan. Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                  </div>
                  {!delStep ? (
                    <button className="up-btn danger" onClick={()=>setDelStep(true)}><Trash2 size={15}/> Saya Ingin Menghapus Akun</button>
                  ) : (
                    <div>
                      <p className="up-confirm-label">Masukkan password Anda untuk konfirmasi:</p>
                      {delErr && <div className="up-alert err"><AlertCircle size={14}/> {delErr}</div>}
                      <PasswordInput value={delPw} onChange={e=>{setDelPw(e.target.value);setDelErr('');}} placeholder="Masukkan password Anda"/>
                      <div className="up-confirm-actions">
                        <button className="up-btn ghost" onClick={()=>{setDelStep(false);setDelPw('');setDelErr('');}}><X size={14}/> Batal</button>
                        <button className="up-btn danger" disabled={saving} onClick={handleDeleteAccount}>
                          {saving?<span className="up-spinner"/>:<Trash2 size={14}/>} {saving?'Menghapus…':'Ya, Hapus Akun Saya'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              </div>{/* end content div */}
            </div>{/* end up-right-col */}
          </div>{/* end up-grid */}
        </div>
      </div>

      {/* TICKET POPUP */}
      <TicketModal 
        isOpen={showTicketModal} 
        onClose={() => setShowTicketModal(false)} 
        ticketData={ticketData} 
      />
    </>
  );
}
