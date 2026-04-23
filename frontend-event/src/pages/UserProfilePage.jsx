import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Key, LogOut, Camera, Save, CheckCircle,
  Eye, EyeOff, Lock, AlertCircle, Edit3, Info, Ticket, Calendar,
  MapPin, Tag, CreditCard, Clock, Trash2, ShieldAlert, Activity,
  ChevronRight, X, Award, Search, Download, CalendarDays
} from 'lucide-react';
import { getUser, clearAuth, setAuth, getToken, logout } from '../utils/auth';
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
  { id: 'sertifikat', icon: <Award size={15} />,     label: 'Sertifikat' },
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
  const [ticketSearch, setTicketSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [sertifikats, setSertifikats] = useState([]);
  const [loadingS, setLoadingS] = useState(false);
  const [certSearch, setCertSearch] = useState('');
  const [currentCertPage, setCurrentCertPage] = useState(1);

  const [prof, setProf] = useState({ name:'', username:'', email:'', phone:'', kategori:'', avatarUrl:'' });
  const [avatarFile, setAvatarFile] = useState(null);
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
    setProf(p => ({ ...p, name: u.nama_lengkap||'', username: u.username||'', email: u.email||'', phone: u.no_hp||'', kategori: u.kategori_pendaftar||'', avatarUrl: u.avatarUrl||'' }));
    const token = getToken();
    if (!token) return;
    fetch(buildApiUrl('/api/me'), { headers: { ...defaultHeaders, Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (!res?.data) return;
        const d = res.data;
        setProf(p => ({ ...p, name:d.nama_lengkap||p.name, username:d.username||p.username, email:d.email||p.email, phone:d.no_hp||p.phone, kategori:d.kategori_pendaftar||p.kategori, avatarUrl: d.avatarUrl || p.avatarUrl }));
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

  /* Load certificates */
  useEffect(() => {
    if (tab !== 'sertifikat') return;
    setLoadingS(true);
    const token = getToken();
    if (!token) { setLoadingS(false); return; }
    fetch(buildApiUrl('/api/sertifikat/saya'), { headers: { ...defaultHeaders, Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => {
        setSertifikats(res.data || []);
      }).catch(()=>{}).finally(() => setLoadingS(false));
  }, [tab]);

  const handleSaveProf = async e => {
    e.preventDefault(); setSaving(true); setProfErr('');
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('nama_lengkap', prof.name);
      formData.append('username', prof.username);
      formData.append('no_hp', prof.phone);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await fetch(buildApiUrl('/api/user/profile'), { 
        method:'POST', 
        headers:{ Authorization:`Bearer ${token}` }, 
        body: formData 
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message||'Gagal');
      
      setAuth(token, d.data);
      setProf(p => ({ ...p, avatarUrl: d.data.avatarUrl }));
      setAvatarFile(null);
      setEdited(false); 
      showToast('Profil berhasil diperbarui!');
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

  const filteredTickets = tickets.filter(t => {
    const name = (t.event?.nama_event || t.nama_event || '').toLowerCase();
    const query = ticketSearch.toLowerCase();
    const matchesSearch = name.includes(query);

    if (!matchesSearch) return false;

    if (filter === 'aktif')    return ['pending','Pending'].includes(t.status_pendaftaran);
    if (filter === 'selesai')  return ['berhasil','success','hadir'].includes(t.status_pendaftaran);
    if (filter === 'berbayar') return Number(t.total_harga)>0;
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const pagedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleLihatTiket = (t) => {
    const tgl = t.event?.tanggal ? new Date(t.event.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
    setTicketData({
      qrValue: t.id || t.id_pendaftaran ? `EVT-${t.id || t.id_pendaftaran}` : `EVT-${Date.now()}`,
      eventName: t.event?.nama_event || t.nama_event || 'Event Tidak Diketahui',
      userName: prof.name || 'User',
      date: tgl,
      location: t.event?.lokasi || '-',
      ticketCount: t.jumlah_tiket || 1,
      event_type: t.event?.event_type || 'offline',
      meeting_link: t.event?.meeting_link || ''
    });
    setShowTicketModal(true);
  };

  return (
    <>
      <NavbarCustom />
      <div className="up-page page-fade-in">
        <div className={`up-toast ${toast.msg?'show':''} ${toast.type}`}>
          {toast.type==='success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>} {toast.msg}
        </div>

        <div className="up-bg-elements">
          <div className="up-bg-circle up-bg-circle-1"></div>
          <div className="up-bg-circle up-bg-circle-2"></div>
          <div className="up-bg-circle up-bg-circle-3"></div>
        </div>

        <div className="up-wrap">
          <div className="up-grid">
            <div className="up-left-col">
              <div className="up-profile-card fade-up">
                <div className="up-avatar-wrap">
                  <div className="up-avatar">
                    {prof.avatarUrl ? <img src={prof.avatarUrl} alt="av"/> : <span>{getInitials(prof.name)}</span>}
                  </div>
                  <label className="up-avatar-btn" title="Ganti Foto">
                    <Camera size={13}/>
                    <input type="file" accept="image/*" hidden onChange={e=>{ 
                      const f=e.target.files[0]; 
                      if(f) {
                        setAvatarFile(f);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProf(p=>({...p,avatarUrl:reader.result}));
                          setEdited(true);
                        };
                        reader.readAsDataURL(f);
                      }
                    }}/>
                  </label>
                </div>

                <div className="up-profile-name">{prof.name||'User'}</div>
                <div className="up-profile-role"><Award size={12}/> {prof.kategori||'User'}</div>

                <div className="up-nav-tabs">
                  {TABS.map(t => (
                    <button key={t.id} className={`up-nav-btn${tab===t.id?' active':''}${t.danger?' danger':''}`} onClick={()=>setTab(t.id)}>
                      {t.icon}<span>{t.label}</span><ChevronRight size={13} className="up-nav-arrow"/>
                    </button>
                  ))}
                  <div className="up-nav-divider"/>
                  <button className="up-logout-btn" onClick={async()=>{ if(window.confirm('Yakin ingin keluar?')){ await logout(); nav('/'); }}}>
                    <LogOut size={14}/> Keluar
                  </button>
                </div>
              </div>
            </div>

            <div className="up-right-col">
              <div>
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
                        <label>Username</label>
                        <div className="up-input-wrap">
                          <Tag size={15} className="up-input-icon"/>
                          <input type="text" className="up-input has-icon" value={prof.username} onChange={e=>{ setProf(p=>({...p,username:e.target.value})); setEdited(true); setProfErr(''); }} placeholder="Username Anda" required/>
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

              {tab==='tiket' && (
                <div className="up-panel fade-up">
                  <div className="up-panel-head">
                    <div><h2><Ticket size={18}/> Tiket & Event Saya</h2><p>Semua event yang pernah Anda daftarkan beserta status pembayarannya.</p></div>
                    <span className="up-badge-info">{tickets.length} Event</span>
                  </div>
                  <div className="up-filters-row">
                    <div className="up-filters">
                      {[['semua','Semua'],['aktif','Aktif'],['selesai','Selesai'],['berbayar','Berbayar']].map(([v,l])=>(
                        <button key={v} className={`up-pill${filter===v?' active':''}`} onClick={()=>{setFilter(v); setCurrentPage(1);}}>{l}</button>
                      ))}
                    </div>
                    <div className="up-ticket-search">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari event..." 
                        value={ticketSearch}
                        onChange={e => { setTicketSearch(e.target.value); setCurrentPage(1); }}
                      />
                    </div>
                  </div>

                  {loadingT ? (
                    <div className="up-loading"><span className="up-spinner lg"/><p>Memuat tiket…</p></div>
                  ) : filteredTickets.length===0 ? (
                    <div className="up-empty">
                      <Ticket size={48}/><h4>{filter==='semua' && !ticketSearch ?'Belum Ada Tiket':'Tidak Ada Data'}</h4>
                      <p>{filter==='semua' && !ticketSearch ?'Anda belum mendaftar ke acara apapun.':'Tidak ada tiket dengan kriteria ini.'}</p>
                      {filter==='semua' && !ticketSearch && <button className="up-btn primary sm" onClick={()=>nav('/events')}>Cari Event</button>}
                    </div>
                  ) : (
                    <>
                      <div className="up-ticket-grid">
                        {pagedTickets.map(t => {
                          const rs = getRS(t.status_pendaftaran);
                          const isPaid = Number(t.total_harga)>0;
                          const tgl = t.event?.tanggal ? new Date(t.event.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
                          const imgUrl = t.event?.foto_event_url || (t.event?.foto_event ? buildApiUrl(`/event/${t.event.foto_event}`) : "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80");
                          
                          return (
                            <div key={t.id||t.id_pendaftaran} className="up-ticket-vcard">
                              <div className="up-ticket-img-wrap">
                                <img src={imgUrl} alt="poster" onError={e=>e.currentTarget.src="https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80"} />
                                <span className="up-vcard-tag">Terdaftar</span>
                              </div>
                              
                              <div className="up-vcard-body">
                                <h4 className="up-vcard-title">{t.event?.nama_event||t.nama_event}</h4>
                                
                                <div className="up-vcard-meta">
                                  <div className="up-vmeta-item">
                                    <MapPin size={13} />
                                    <span>{t.event?.lokasi||'-'}</span>
                                  </div>
                                  <div className="up-vmeta-item">
                                    <CalendarDays size={13} />
                                    <span>{tgl}</span>
                                  </div>
                                </div>

                                <div className="up-vcard-status">
                                  Status: <span style={{color:rs.color}}>{rs.label}</span>
                                </div>

                                <div className="up-vcard-foot">
                                  {(!isPaid || getLastPay(t.pembayaran) === 'terverifikasi') ? (
                                    <button onClick={() => handleLihatTiket(t)} className="up-vbtn-download">
                                      <Download size={14} /> Download Tiket
                                    </button>
                                  ) : (
                                    <button className="up-vbtn-locked" disabled>
                                      <Lock size={14} /> Tiket Terkunci
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="up-pagination">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              className={`up-dot ${currentPage === i + 1 ? 'active' : ''}`}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {tab==='sertifikat' && (
                <div className="up-panel fade-up">
                  <div className="up-panel-head">
                    <div><h2><Award size={18}/> Sertifikat Saya</h2><p>Sertifikat dari event yang telah Anda hadiri.</p></div>
                  </div>

                  {loadingS ? (
                    <div className="up-loading"><span className="up-spinner lg"/><p>Memuat sertifikat…</p></div>
                  ) : sertifikats.length===0 ? (
                    <div className="up-empty">
                      <Award size={40}/>
                      <h4>Belum ada sertifikat</h4>
                      <p>Sertifikat akan tersedia setelah event selesai dan Anda terverifikasi hadir.</p>
                    </div>
                  ) : (
                    <div className="up-ticket-grid">
                      {sertifikats.map((s) => {
                        const tgl = s.event_date ? new Date(s.event_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
                        return (
                          <div key={s.id} className="up-ticket-vcard" style={{ border: '1px solid rgba(168,85,247,0.3)' }}>
                            <div className="up-vcard-body">
                              <h4 className="up-vcard-title">{s.event_name}</h4>
                              <div className="up-vcard-meta">
                                <div className="up-vmeta-item">
                                  <CalendarDays size={13} />
                                  <span>{tgl}</span>
                                </div>
                              </div>
                              <div className="up-vcard-foot" style={{ marginTop: '10px' }}>
                                <a 
                                  href={s.sertifikat_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="up-vbtn-download" 
                                  style={{ background: 'linear-gradient(135deg,#9333ea,#7c3aed)', color: '#fff', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
                                >
                                  <Download size={14} /> Download PDF
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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

              </div>
            </div>
          </div>
        </div>
      </div>

      <TicketModal 
        isOpen={showTicketModal} 
        onClose={() => setShowTicketModal(false)} 
        ticketData={ticketData} 
      />
    </>
  );
}
