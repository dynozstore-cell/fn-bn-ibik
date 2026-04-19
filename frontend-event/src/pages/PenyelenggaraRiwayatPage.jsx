import React, { useState, useEffect, useMemo } from 'react';
import {
  History, Calendar, Users, CheckCircle, TrendingDown,
  Search, Filter, ChevronLeft, ChevronRight, Eye,
  BarChart2, Award, Clock, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, RadialBarChart,
  RadialBar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminEventsPage.css';

const PER_PAGE_OPTIONS = [10, 50, 100, "Semua"];
const PIE_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 8 }}>
      <p style={{ color: '#94a3b8', margin: '0 0 6px', fontSize: '0.8rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#f1f5f9', margin: '2px 0', fontWeight: 600, fontSize: '0.9rem' }}>
          {p.name}: <span style={{ color: '#f8fafc' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

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

export default function PenyelenggaraRiwayatPage() {
  const navigate = useNavigate();
  const token = getToken() || '';
  const authHeaders = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/admin/laporan'), { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            const now = new Date();
            // Hanya ambil event yang SUDAH SELESAI (tanggal < sekarang)
            const past = data.data
              .filter(e => new Date(e.tanggal) < now)
              .map(e => ({
                id: e.id,
                nama: e.nama_event,
                tanggal: e.tanggal,
                totalPeserta: e.pendaftar ?? 0,
                hadir: e.hadir ?? 0,
                kapasitas: e.kapasitas ?? 100,
                kategori: e.kategori || 'Umum',
              }));
            setAllEvents(past);
          }
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  /* ─── Summary Stats ──────────────────────────────────── */
  const totalPeserta = allEvents.reduce((s, e) => s + e.totalPeserta, 0);
  const totalHadir   = allEvents.reduce((s, e) => s + e.hadir, 0);
  const avgKehadiran = allEvents.length > 0
    ? ((totalHadir / Math.max(totalPeserta, 1)) * 100).toFixed(1)
    : 0;

  /* ─── Chart: Bar per event ───────────────────────────── */
  const barChartData = allEvents.slice(0, 8).map(e => ({
    name: e.nama.length > 14 ? e.nama.slice(0, 13) + '…' : e.nama,
    Pendaftar: e.totalPeserta,
    Hadir: e.hadir,
  }));

  /* ─── Chart: Area trend bulan ────────────────────────── */
  const areaChartData = useMemo(() => {
    const monthly = {};
    allEvents.forEach(e => {
      const d = new Date(e.tanggal);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { bulan: key, event: 0, peserta: 0 };
      monthly[key].event   += 1;
      monthly[key].peserta += e.totalPeserta;
    });
    return Object.values(monthly).slice(-7);
  }, [allEvents]);

  /* ─── Chart: Pie kategori ────────────────────────────── */
  const pieChartData = useMemo(() => {
    const cat = {};
    allEvents.forEach(e => {
      cat[e.kategori] = (cat[e.kategori] || 0) + 1;
    });
    return Object.entries(cat).map(([name, value]) => ({ name, value }));
  }, [allEvents]);

  /* ─── Filter & Pagination ────────────────────────────── */
  const filtered = useMemo(() => {
    return allEvents.filter(e =>
      !search || e.nama.toLowerCase().includes(search.toLowerCase())
    );
  }, [allEvents, search]);

  const totalPages = perPage === "Semua" ? 1 : Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = useMemo(() => {
    if (perPage === "Semua") return filtered;
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, perPage, safePage]);

  const handleExportCSV = () => {
    if (!allEvents.length) return;
    const headers = ['No', 'Nama Event', 'Tanggal', 'Total Pendaftar', 'Hadir', 'Kehadiran (%)'];
    const rows = allEvents.map((ev, idx) => {
      const pct = ev.totalPeserta > 0 ? ((ev.hadir / ev.totalPeserta) * 100).toFixed(1) : 0;
      return [
        idx + 1,
        `"${ev.nama}"`,
        `"${formatDate(ev.tanggal)}"`,
        ev.totalPeserta,
        ev.hadir,
        `"${pct}%"`
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Riwayat_Event.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="aep-wrap">

      {/* HEADER */}
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={26} style={{ color: '#a78bfa' }} /> Riwayat Event
          </h1>
          <p className="adash-page-sub">Semua event yang telah selesai diselenggarakan oleh Anda.</p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.1)', color: '#10b981',
            border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem 1.5rem',
            borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
        >
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        {[
          {
            label: 'Total Event Selesai', value: allEvents.length,
            icon: <CheckCircle size={22} />,
            gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)', glow: 'rgba(124,58,237,0.3)'
          },
          {
            label: 'Total Pendaftar', value: totalPeserta,
            icon: <Users size={22} />,
            gradient: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', glow: 'rgba(14,165,233,0.3)'
          },
          {
            label: 'Total Hadir', value: totalHadir,
            icon: <Award size={22} />,
            gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.3)'
          },
          {
            label: 'Rata-rata Kehadiran', value: `${avgKehadiran}%`,
            icon: <TrendingDown size={22} />,
            gradient: 'linear-gradient(135deg,#f59e0b,#f43f5e)', glow: 'rgba(245,158,11,0.3)'
          },
        ].map((s, i) => (
          <div key={i} className="adash-stat-card" style={{
            '--glow': s.glow,
            background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: s.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
            }}>{s.icon}</div>
            <div>
              <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</span>
              <span style={{ display: 'block', color: '#f8fafc', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>
                {loading ? '…' : s.value.toLocaleString ? s.value.toLocaleString() : s.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Area Chart – Tren Bulanan */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} style={{ color: '#0ea5e9' }} /> Tren Event per Bulan
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 20px' }}>Jumlah event dan peserta yang diselesaikan setiap bulan.</p>
          <div style={{ height: 220 }}>
            {areaChartData.length === 0 && !loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.9rem' }}>
                Belum ada data tren.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rwGradEvent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rwGradPeserta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="bulan" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem', color: '#94a3b8', paddingTop: 8 }} />
                  <Area type="monotone" dataKey="event" name="Event" stroke="#7c3aed" strokeWidth={2.5} fill="url(#rwGradEvent)" dot={false} activeDot={{ r: 4, fill: '#7c3aed' }} />
                  <Area type="monotone" dataKey="peserta" name="Peserta" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#rwGradPeserta)" dot={false} activeDot={{ r: 4, fill: '#0ea5e9' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart – Kategori */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: '#a78bfa' }} /> Sebaran Kategori
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 12px' }}>Distribusi event berdasarkan kategori.</p>
          <div style={{ height: 220 }}>
            {pieChartData.length === 0 && !loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.9rem' }}>
                Belum ada data kategori.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData.length > 0 ? pieChartData : [{ name: 'Tidak ada data', value: 1 }]}
                    cx="50%" cy="45%" innerRadius="35%" outerRadius="65%"
                    paddingAngle={3} dataKey="value" stroke="none"
                  >
                    {(pieChartData.length > 0 ? pieChartData : [{}]).map((_, i) => (
                      <Cell key={i} fill={pieChartData.length > 0 ? PIE_COLORS[i % PIE_COLORS.length] : '#334155'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 – Bar per Event */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} style={{ color: '#10b981' }} /> Perbandingan Peserta per Event
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 20px' }}>Pendaftar vs. peserta yang hadir pada setiap event (8 terbaru).</p>
        <div style={{ height: 240 }}>
          {barChartData.length === 0 && !loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.9rem' }}>
              Belum ada data event selesai.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', color: '#94a3b8', paddingTop: 8 }} />
                <Bar dataKey="Pendaftar" fill="#334155" radius={[5, 5, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Hadir" fill="url(#rwGradBar)" radius={[5, 5, 0, 0]} maxBarSize={36} />
                <defs>
                  <linearGradient id="rwGradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABLE EVENT LAMA */}
      <div className="aep-table-card">
        <div className="aep-toolbar">
          <div className="aep-search-wrap">
            <Search size={15} className="aep-search-icon" />
            <input
              className="aep-search"
              placeholder="Cari nama event lama..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
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
          Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> event selesai
        </div>

        <div className="aep-table-wrap">
          <table className="aep-table">
            <thead>
              <tr>
                <th><span className="aep-th-inner">#</span></th>
                <th><span className="aep-th-inner"><Calendar size={13} /> Nama Event</span></th>
                <th><span className="aep-th-inner">Tanggal</span></th>
                <th><span className="aep-th-inner">Pendaftar</span></th>
                <th><span className="aep-th-inner">Kehadiran</span></th>
                <th><span className="aep-th-inner">Status</span></th>
                <th style={{ textAlign: "right" }}><span className="aep-th-inner" style={{ justifyContent: "flex-end" }}>Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="aep-td-center">
                    <div className="aep-loading"><span className="aep-spinner" /> Memuat riwayat event…</div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="aep-td-center">
                    <div className="aep-empty">
                      <History size={32} style={{ marginBottom: 8, opacity: 0.3 }} /><br />
                      Belum ada event yang selesai.
                    </div>
                  </td>
                </tr>
              ) : paginated.map((ev, idx) => {
                const rowNum = perPage === "Semua" ? idx + 1 : (safePage - 1) * perPage + idx + 1;
                const pct    = ev.totalPeserta > 0 ? ((ev.hadir / ev.totalPeserta) * 100).toFixed(0) : 0;

                return (
                  <tr key={ev.id} className="aep-tr">
                    <td className="aep-td-num">{rowNum}</td>
                    <td className="aep-td-judul" title={ev.nama}>{ev.nama}</td>
                    <td className="aep-td-date">{formatDate(ev.tanggal)}</td>
                    <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{ev.totalPeserta}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, minWidth: 60 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#0ea5e9)', borderRadius: 2 }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: 'rgba(100,116,139,0.15)', color: '#94a3b8',
                        padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600
                      }}>Selesai</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          title="Lihat Laporan"
                          onClick={() => navigate('/penyelenggara/laporan')}
                          style={{
                            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
                            color: '#0ea5e9', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.1)'}
                        >
                          <Eye size={14} /> Laporan
                        </button>
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
