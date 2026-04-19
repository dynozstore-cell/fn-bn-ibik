import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, CheckCircle, Clock,
  Download, ArrowRight, Activity,
  BarChart2, PieChart as PieIcon, Zap,
  TrendingUp, PlusCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminDashboard.css';

/* ── Mock data ─────────────────────────────────────────── */
const PIE_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

const QUICK_LINKS = [
  { label: 'Buat Event',    to: '/penyelenggara/buat-event',  icon: <PlusCircle size={20} />,  color: '#7c3aed' },
  { label: 'Event Saya',    to: '/penyelenggara/events',      icon: <Calendar size={20} />,    color: '#0ea5e9' },
  { label: 'Kehadiran',     to: '/penyelenggara/kehadiran',   icon: <CheckCircle size={20} />, color: '#10b981' },
  { label: 'Laporan',       to: '/penyelenggara/laporan',     icon: <BarChart2 size={20} />,   color: '#f59e0b' },
];

/* ── Helpers ───────────────────────────────────────────── */
function DashTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="adash-tooltip">
      <p className="adash-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '3px 0 0', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

function Skeleton({ h = 24, r = 8 }) {
  return <div className="adash-skeleton" style={{ height: h, borderRadius: r }} />;
}

/* ── Status pill used in recent events table ─────────── */
function StatusPill({ status }) {
  const map = {
    aktif:   { label: 'Aktif',   bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    selesai: { label: 'Selesai', bg: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
    draft:   { label: 'Draft',   bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
export default function PenyelenggaraDashboardPage() {
  const [loading,   setLoading]   = useState(true);
  const [chartView, setChartView] = useState('combined');
  const [stats,     setStats]     = useState({
    total_event:   0,
    total_peserta: 0,
    event_aktif:   0,
    event_selesai: 0,
    monthly_data:  [],
    kategori_data: [],
    recent_events: [],
  });

  useEffect(() => {
    /* Try fetching from API */
    const fetchStats = async () => {
      try {
        const token = getToken() || '';
        const res = await fetch(buildApiUrl('/api/penyelenggara/dashboard-stats'), {
          headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') { setStats(data.data); }
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats().finally(() => setLoading(false));
  }, []);

  const combinedData = stats.monthly_data || [];
  const recentEvents = stats.recent_events || [];
  const kategoriData = stats.kategori_data || [];

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Event', stats.total_event],
      ['Total Peserta', stats.total_peserta],
      ['Event Aktif', stats.event_aktif],
      ['Event Selesai', stats.event_selesai],
    ];
    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = 'penyelenggara_dashboard.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const statCards = [
    {
      label: 'Total Event Dibuat', value: stats.total_event,
      icon: <Calendar size={22} />,
      gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
      glow: 'rgba(124,58,237,0.3)',
      sub: 'event sepanjang waktu',
    },
    {
      label: 'Total Peserta', value: stats.total_peserta,
      icon: <Users size={22} />,
      gradient: 'linear-gradient(135deg,#0ea5e9,#22c55e)',
      glow: 'rgba(14,165,233,0.3)',
      sub: 'tiket terjual',
    },
    {
      label: 'Event Aktif', value: stats.event_aktif,
      icon: <TrendingUp size={22} />,
      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)',
      glow: 'rgba(16,185,129,0.3)',
      sub: 'sedang berlangsung',
    },
    {
      label: 'Event Selesai', value: stats.event_selesai,
      icon: <CheckCircle size={22} />,
      gradient: 'linear-gradient(135deg,#f59e0b,#f43f5e)',
      glow: 'rgba(245,158,11,0.3)',
      sub: 'telah berakhir',
    },
  ];

  return (
    <div className="adash-wrap">

      {/* ── Page Header ── */}
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">Dashboard Penyelenggara</h1>
          <p className="adash-page-sub">Ringkasan aktivitas event dan peserta Anda.</p>
        </div>
        <button className="adash-export-btn" onClick={exportCSV}>
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="adash-stats-grid">
        {statCards.map((s, i) => (
          <div className="adash-stat-card" key={i} style={{ '--glow': s.glow }}>
            <div className="adash-stat-icon" style={{ background: s.gradient }}>
              {s.icon}
            </div>
            <div className="adash-stat-body">
              <span className="adash-stat-label">{s.label}</span>
              <span className="adash-stat-value">
                {loading ? <Skeleton h={28} r={6} /> : s.value.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="adash-section">
        <div className="adash-section-head">
          <h2><Zap size={18} className="adash-sec-icon" /> Akses Cepat</h2>
        </div>
        <div className="adash-quick-grid">
          {QUICK_LINKS.map((q, i) => (
            <Link to={q.to} key={i} className="adash-quick-card" style={{ '--accent': q.color }}>
              <div className="adash-quick-icon" style={{ background: q.color + '22', color: q.color }}>
                {q.icon}
              </div>
              <span>{q.label}</span>
              <ArrowRight size={16} className="adash-quick-arrow" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="adash-charts-row">

        {/* Area Chart */}
        <div className="adash-chart-card wide">
          <div className="adash-chart-head">
            <div>
              <h2><Activity size={18} className="adash-sec-icon" /> Tren Bulanan</h2>
              <p>Jumlah event dan peserta per bulan</p>
            </div>
            <div className="adash-chart-tabs">
              {[['combined','Gabungan'],['event','Event'],['peserta','Peserta']].map(([v, l]) => (
                <button
                  key={v}
                  className={`adash-chart-tab ${chartView === v ? 'active' : ''}`}
                  onClick={() => setChartView(v)}
                >{l}</button>
              ))}
            </div>
          </div>
          <div className="adash-chart-area">
            {loading ? (
              <div className="adash-chart-empty"><Skeleton h={200} r={10} /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="penGradEvent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="penGradPeserta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DashTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ paddingTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }} />
                  {(chartView === 'combined' || chartView === 'event') && (
                    <Area type="monotone" dataKey="event" name="Event" stroke="#7c3aed" strokeWidth={2.5} fill="url(#penGradEvent)" dot={false} activeDot={{ r: 5, fill: '#7c3aed' }} />
                  )}
                  {(chartView === 'combined' || chartView === 'peserta') && (
                    <Area type="monotone" dataKey="peserta" name="Peserta" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#penGradPeserta)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9' }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="adash-chart-card narrow">
          <div className="adash-chart-head">
            <div>
              <h2><PieIcon size={18} className="adash-sec-icon" /> Kategori Event</h2>
              <p>Sebaran event berdasarkan kategori</p>
            </div>
          </div>
          <div className="adash-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kategoriData.length > 0 ? kategoriData : [{name: 'Tidak ada data', value: 1}]}
                  cx="50%" cy="45%"
                  innerRadius="38%" outerRadius="68%"
                  paddingAngle={3} dataKey="value"
                  labelLine={false} label={kategoriData.length > 0 ? PieLabel : false}
                >
                  {(kategoriData.length > 0 ? kategoriData : [{name: 'Tidak ada data', value: 1}]).map((_, i) => (
                    <Cell key={i} fill={kategoriData.length > 0 ? PIE_COLORS[i % PIE_COLORS.length] : '#334155'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: '0.82rem', color: '#94a3b8', paddingTop: '0.5rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <div className="adash-chart-card">
        <div className="adash-chart-head">
          <div>
            <h2><BarChart2 size={18} className="adash-sec-icon" /> Peserta per Bulan</h2>
            <p>Perbandingan jumlah peserta antar bulan</p>
          </div>
        </div>
        <div className="adash-chart-area">
          {loading ? (
            <div className="adash-chart-empty"><Skeleton h={200} r={10} /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={combinedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="peserta" name="Peserta" fill="#0ea5e9" radius={[6,6,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Events Table ── */}
      <div className="adash-chart-card">
        <div className="adash-chart-head">
          <div>
            <h2><Calendar size={18} className="adash-sec-icon" /> Event Terbaru</h2>
            <p>5 event yang baru saja Anda buat atau kelola</p>
          </div>
          <Link
            to="/penyelenggara/events"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Lihat Semua <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Nama Event', 'Tanggal', 'Peserta', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentEvents.length > 0 ? recentEvents.map(ev => (
                <tr
                  key={ev.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 12px', color: '#e2e8f0', fontWeight: 500 }}>{ev.nama}</td>
                  <td style={{ padding: '12px 12px', color: '#64748b' }}>{ev.tanggal}</td>
                  <td style={{ padding: '12px 12px', color: '#94a3b8' }}>{ev.peserta.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px' }}><StatusPill status={ev.status} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada event yang dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
