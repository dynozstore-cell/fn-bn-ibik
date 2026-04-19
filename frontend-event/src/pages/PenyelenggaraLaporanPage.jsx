import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, Download, CheckCircle, Users, TrendingUp, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Calendar, Search, Filter, ArrowLeft, ClipboardList, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminEventsPage.css';

const PER_PAGE_OPTIONS = [10, 50, 100, "Semua"];

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
        <p style={{ color: payload[0].payload.fill, fontWeight: 600, margin: '0 0 4px' }}>{payload[0].name}</p>
        <p style={{ color: '#f1f5f9', margin: 0, fontWeight: 500 }}>
          {payload[0].value} Orang ({(payload[0].percent * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
}

function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusBadge(tanggal) {
  if (!tanggal) return { label: "Tidak diketahui", cls: "aep-badge-unknown" };
  const now = new Date();
  const date = new Date(tanggal);
  if (date > now) return { label: "Akan Datang", cls: "aep-badge-upcoming" };
  return { label: "Selesai", cls: "aep-badge-done" };
}

export default function PenyelenggaraLaporanPage() {
  const navigate = useNavigate();
  const token = getToken() || '';
  const authHeaders = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Pagination & Filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail View
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedResponses, setSelectedResponses] = useState(null);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/admin/laporan'), { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            const mapped = data.data.map(e => {
              const evDate = new Date(e.tanggal);
              const status = evDate >= new Date() ? 'aktif' : 'selesai';
              return {
                id: e.id,
                nama: e.nama_event,
                tanggal: e.tanggal,
                totalPeserta: e.pendaftar,
                hadir: e.hadir,
                tidakHadir: e.pendaftar - e.hadir,
                statusVal: status,
                kapasitas: e.harga > 0 ? 100 : 50
              };
            });
            setEventsList(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to fetch laporan', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const fetchParticipants = async () => {
        setLoadingParticipants(true);
        try {
          const res = await fetch(buildApiUrl(`/api/daftar-event?event_id=${selectedEventId}`), { headers: authHeaders });
          if (res.ok) {
            const data = await res.json();
            setParticipants(data);
          }
        } catch (err) {
          console.error('Failed to fetch participants', err);
        } finally {
          setLoadingParticipants(false);
        }
      };
      fetchParticipants();
    }
  }, [selectedEventId]);

  /* ─── LIST VIEW LOGIC ─────────────────────────────────────────── */
  const filteredEvents = useMemo(() => {
    return eventsList.filter(e => {
      const matchSearch = !search || e.nama.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || e.statusVal === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [eventsList, search, filterStatus]);

  const totalPages = perPage === "Semua" ? 1 : Math.max(1, Math.ceil(filteredEvents.length / perPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    if (perPage === "Semua") return filteredEvents;
    const start = (safePage - 1) * perPage;
    return filteredEvents.slice(start, start + perPage);
  }, [filteredEvents, perPage, safePage]);

  function getPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const left = Math.max(1, cur - 2);
    const right = Math.min(total, cur + 2);
    const pages = [];
    if (left > 1) { pages.push(1); if (left > 2) pages.push("…"); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total) { if (right < total - 1) pages.push("…"); pages.push(total); }
    return pages;
  }

  /* ─── VIEW 1: LIST EVENT ─────────────────────────────────────────── */
  if (!selectedEventId) {
    return (
      <div className="aep-wrap">
        <div className="adash-page-header">
          <div>
            <h1 className="adash-page-title">Laporan Event</h1>
            <p className="adash-page-sub">Pilih event untuk melihat detail laporan, daftar peserta, dan jawaban form.</p>
          </div>
        </div>

        <div className="aep-table-card">
          <div className="aep-toolbar">
            <div className="aep-search-wrap">
              <Search size={15} className="aep-search-icon" />
              <input
                className="aep-search"
                placeholder="Cari nama event..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="aep-filter-wrap">
              <Filter size={14} className="aep-filter-icon" />
              <select
                className="aep-filter-select"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Status</option>
                <option value="aktif">Akan Datang</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>

            <select
              className="aep-filter-select"
              value={perPage}
              onChange={e => {
                const v = e.target.value;
                setPerPage(v === "Semua" ? "Semua" : Number(v));
                setCurrentPage(1);
              }}
              style={{ marginLeft: "auto" }}
            >
              {PER_PAGE_OPTIONS.map(o => (
                <option key={o} value={o}>{o === "Semua" ? "Semua" : `${o} / halaman`}</option>
              ))}
            </select>
          </div>

          <div className="aep-summary">
            Menampilkan <strong>{paginatedEvents.length}</strong> dari <strong>{filteredEvents.length}</strong> event
          </div>

          <div className="aep-table-wrap">
            <table className="aep-table">
              <thead>
                <tr>
                  <th><span className="aep-th-inner">#</span></th>
                  <th><span className="aep-th-inner"><Calendar size={13} /> Judul Event</span></th>
                  <th><span className="aep-th-inner">Tanggal</span></th>
                  <th><span className="aep-th-inner">Peserta / Kapasitas</span></th>
                  <th><span className="aep-th-inner">Status</span></th>
                  <th style={{ textAlign: "right" }}><span className="aep-th-inner" style={{ justifyContent: "flex-end" }}>Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="aep-td-center">
                      <div className="aep-loading"><span className="aep-spinner" /> Memuat data event…</div>
                    </td>
                  </tr>
                ) : paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="aep-td-center">
                      <div className="aep-empty">
                        <Calendar size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                        <br />Tidak ada event yang ditemukan
                      </div>
                    </td>
                  </tr>
                ) : paginatedEvents.map((ev, idx) => {
                  const rowNum = perPage === "Semua" ? idx + 1 : (safePage - 1) * perPage + idx + 1;
                  const status = getStatusBadge(ev.tanggal);
                  const percent = Math.min(100, Math.round((ev.totalPeserta / ev.kapasitas) * 100));

                  return (
                    <tr key={ev.id} className="aep-tr" onClick={() => setSelectedEventId(ev.id)} style={{ cursor: 'pointer' }}>
                      <td className="aep-td-num">{rowNum}</td>
                      <td className="aep-td-judul" title={ev.nama}>{ev.nama}</td>
                      <td className="aep-td-date">{formatDate(ev.tanggal)}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ color:'#e2e8f0', fontWeight:600, fontSize: "0.85rem" }}>{ev.totalPeserta}</span>
                          <span style={{ color:'#475569', fontSize: "0.85rem" }}>/</span>
                          <span style={{ color:'#64748b', fontSize: "0.85rem" }}>{ev.kapasitas}</span>
                          <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, minWidth:60, marginLeft: 8 }}>
                            <div style={{ width:`${percent}%`, height:'100%', background:'linear-gradient(90deg,#7c3aed,#0ea5e9)', borderRadius:2 }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`aep-badge ${status.cls}`}>{status.label}</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:8, justifyContent: "flex-end" }}>
                          <button title="Lihat Laporan" onClick={(e) => { e.stopPropagation(); setSelectedEventId(ev.id); }} style={{ background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)', color:'#0ea5e9', borderRadius:8, padding:'6px 8px', cursor:'pointer', transition: "all 0.2s" }}><Eye size={14} /></button>
                          <button title="Edit" onClick={(e) => { e.stopPropagation(); navigate('/penyelenggara/edit-event/' + ev.id); }} style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa', borderRadius:8, padding:'6px 8px', cursor:'pointer', transition: "all 0.2s" }}><Edit2 size={14} /></button>
                          <button title="Hapus" onClick={(e) => { e.stopPropagation(); alert('Hapus event melalui menu Event Saya'); }} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:8, padding:'6px 8px', cursor:'pointer', transition: "all 0.2s" }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {perPage !== "Semua" && totalPages > 1 && (
            <div className="aep-pagination">
              <button className="aep-page-btn" disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={16} />
              </button>
              {getPageRange(safePage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`ell-${i}`} className="aep-page-ellipsis">…</span>
                ) : (
                  <button key={p} className={`aep-page-btn ${safePage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>
                    {p}
                  </button>
                )
              )}
              <button className="aep-page-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── VIEW 2: DETAIL LAPORAN EVENT ─────────────────────────────────────────── */
  const selectedEvent = eventsList.find(e => e.id === selectedEventId) || {};
  const persentaseHadir = selectedEvent.totalPeserta > 0 ? ((selectedEvent.hadir / selectedEvent.totalPeserta) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Hadir', value: selectedEvent.hadir || 0, fill: '#10b981' },
    { name: 'Tidak Hadir', value: selectedEvent.tidakHadir || 0, fill: '#ef4444' }
  ];

  const barData = [
    { name: 'VIP', hadir: Math.floor((selectedEvent.hadir||0) * 0.3), total: Math.floor((selectedEvent.totalPeserta||0) * 0.3) },
    { name: 'Reguler', hadir: Math.floor((selectedEvent.hadir||0) * 0.5), total: Math.floor((selectedEvent.totalPeserta||0) * 0.5) },
    { name: 'Pelajar', hadir: Math.floor((selectedEvent.hadir||0) * 0.2), total: Math.floor((selectedEvent.totalPeserta||0) * 0.2) },
  ];

  const handleExportCSV = () => {
    if (!participants || participants.length === 0) return;
    
    const headers = ["No", "Nama Peserta", "Email", "Kehadiran", "Tanggal Daftar", "Jawaban Form"];
    
    const csvRows = participants.map((p, idx) => {
      const isHadir = p.status_pendaftaran === 'success' || p.status_pendaftaran === 'hadir';
      const kehadiran = isHadir ? "Hadir" : "Tidak Hadir";
      
      let customFormStr = "";
      if (p.custom_form_responses) {
        customFormStr = Object.entries(p.custom_form_responses)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
          .replace(/"/g, '""'); 
      }
      
      return [
        idx + 1,
        `"${p.nama_peserta || ''}"`,
        `"${p.email_peserta || ''}"`,
        `"${kehadiran}"`,
        `"${formatDate(p.tanggal_daftar)}"`,
        `"${customFormStr}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const safeName = selectedEvent.nama ? selectedEvent.nama.replace(/\s+/g, '_') : 'Event';
    link.setAttribute("download", `Data_Peserta_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="aep-wrap">
      {/* HEADER DETAIL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setSelectedEventId(null)}
            style={{ 
              width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="adash-page-title" style={{ fontSize: '1.4rem' }}>Laporan: {selectedEvent.nama}</h1>
            <p className="adash-page-sub">{formatDate(selectedEvent.tanggal)}</p>
          </div>
        </div>
        <button 
          onClick={handleExportCSV}
          style={{
            display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,0.1)',
            color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', padding:'0.75rem 1.5rem',
            borderRadius:10, fontWeight:600, fontSize:'0.9rem', cursor:'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.1)'}
        >
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: '20px' }}>
        <div className="adash-stat-card" style={{ '--glow': 'rgba(14,165,233,0.3)', background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Pendaftar</span>
            <span style={{ display: 'block', color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800 }}>{selectedEvent.totalPeserta}</span>
          </div>
        </div>
        <div className="adash-stat-card" style={{ '--glow': 'rgba(16,185,129,0.3)', background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Jumlah Hadir</span>
            <span style={{ display: 'block', color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800 }}>{selectedEvent.hadir}</span>
          </div>
        </div>
        <div className="adash-stat-card" style={{ '--glow': 'rgba(167,139,250,0.3)', background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Kehadiran</span>
            <span style={{ display: 'block', color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800 }}>{persentaseHadir}%</span>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20, marginBottom: '20px' }}>
        <div className="adash-chart-card" style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={18} style={{ color: '#10b981' }} /> Rasio Kehadiran
          </h2>
          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{persentaseHadir}%</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Hadir</span>
            </div>
          </div>
        </div>

        <div className="adash-chart-card" style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} style={{ color: '#0ea5e9' }} /> Distribusi Kategori Tiket
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>Perbandingan peserta terdaftar dengan yang hadir per kategori tiket.</p>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.85rem', color: '#94a3b8', paddingTop: 10 }} />
                <Bar dataKey="total" name="Total Terdaftar" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="hadir" name="Berhasil Hadir" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DAFTAR PESERTA TABLE */}
      <div className="aep-table-card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: '#a78bfa' }} /> Daftar Peserta Terdaftar
          </h2>
        </div>
        <div className="aep-table-wrap">
          <table className="aep-table">
            <thead>
              <tr>
                <th><span className="aep-th-inner">#</span></th>
                <th><span className="aep-th-inner">Nama Peserta</span></th>
                <th><span className="aep-th-inner">Email</span></th>
                <th><span className="aep-th-inner">Kehadiran</span></th>
                <th style={{ textAlign: 'right' }}><span className="aep-th-inner" style={{ justifyContent: 'flex-end' }}>Jawaban Form</span></th>
              </tr>
            </thead>
            <tbody>
              {loadingParticipants ? (
                <tr><td colSpan={5} className="aep-td-center"><div className="aep-loading"><span className="aep-spinner"/> Memuat daftar peserta...</div></td></tr>
              ) : participants.length === 0 ? (
                <tr><td colSpan={5} className="aep-td-center"><div className="aep-empty">Tidak ada peserta untuk event ini.</div></td></tr>
              ) : (
                participants.map((p, idx) => {
                  const isHadir = p.status_pendaftaran === 'success' || p.status_pendaftaran === 'hadir';
                  return (
                    <tr key={p.id} className="aep-tr">
                      <td className="aep-td-num">{idx + 1}</td>
                      <td style={{ color: '#f8fafc', fontWeight: 500 }}>{p.nama_peserta || '-'}</td>
                      <td style={{ color: '#94a3b8' }}>{p.email_peserta || '-'}</td>
                      <td>
                        {isHadir ? (
                          <span style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>Hadir</span>
                        ) : (
                          <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>Tidak Hadir</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => setSelectedResponses(p.custom_form_responses || {})}
                          style={{
                            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa',
                            padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                        >
                          <ClipboardList size={14} /> Lihat Form
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL JAWABAN FORM */}
      {selectedResponses && (
        <div className="aep-modal-overlay" onClick={() => setSelectedResponses(null)}>
          <div className="aep-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={20} style={{ color: '#a78bfa' }} /> Jawaban Custom Form
              </h3>
              <button onClick={() => setSelectedResponses(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto' }}>
              {Object.keys(selectedResponses).length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>Peserta ini tidak mengisi custom form.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(selectedResponses).map(([key, value]) => (
                    <div key={key}>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{key}</span>
                      <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 8, color: '#e2e8f0', fontSize: '0.9rem' }}>
                        {Array.isArray(value) ? value.join(', ') : (value || '-')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedResponses(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#f8fafc', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
