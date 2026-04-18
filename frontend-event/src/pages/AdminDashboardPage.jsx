import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, ShieldCheck, UserCheck, Download,
  ArrowRight, Activity,
  BarChart2, PieChart as PieIcon, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import '../styles/AdminDashboard.css';

/* ── Mock fallback data (shown when API returns empty) ── */
const MOCK_MONTHLY = [
  { name: 'Jan', event: 3, peserta: 42 },
  { name: 'Feb', event: 5, peserta: 78 },
  { name: 'Mar', event: 4, peserta: 61 },
  { name: 'Apr', event: 8, peserta: 130 },
  { name: 'Mei', event: 6, peserta: 95 },
  { name: 'Jun', event: 11, peserta: 174 },
  { name: 'Jul', event: 9, peserta: 142 },
  { name: 'Agu', event: 13, peserta: 198 },
  { name: 'Sep', event: 10, peserta: 161 },
  { name: 'Okt', event: 15, peserta: 230 },
  { name: 'Nov', event: 12, peserta: 187 },
  { name: 'Des', event: 18, peserta: 274 },
];

const MOCK_CATEGORY = [
  { name: 'Musik', value: 35 },
  { name: 'Teknologi', value: 28 },
  { name: 'Workshop', value: 20 },
  { name: 'Bisnis', value: 12 },
  { name: 'Olahraga', value: 5 },
];

const PIE_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

const QUICK_LINKS = [
  { label: 'Kelola Event', to: '/admin/events', icon: <Calendar size={20} />, color: '#7c3aed' },
  { label: 'Pengguna', to: '/admin/pengguna', icon: <Users size={20} />, color: '#0ea5e9' },
  { label: 'Penyelenggara', to: '/admin/penyelenggara', icon: <ShieldCheck size={20} />, color: '#10b981' },
  { label: 'Laporan', to: '/admin/laporan', icon: <BarChart2 size={20} />, color: '#f59e0b' },
];

/* ── Custom Tooltip ────────────────────────────────────── */
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

/* ── Custom Pie Label ──────────────────────────────────── */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

/* ── Skeleton loader ───────────────────────────────────── */
function Skeleton({ h = 24, r = 8 }) {
  return <div className="adash-skeleton" style={{ height: h, borderRadius: r }} />;
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total_event: 0,
    total_user: 0,
    total_penyelenggara: 0,
    total_peserta: 0,
    events_per_month: [],
    participants_per_month: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('combined'); // 'combined' | 'event' | 'peserta'

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/admin/dashboard-stats'), {
        headers: { ...defaultHeaders, Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.status === 'success') setStats(data.data);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoading(false);
    }
  };

  /* Merge event + participant data into one array for combined chart */
  const combinedData = (() => {
    const base = stats.events_per_month.length > 0 ? stats.events_per_month : MOCK_MONTHLY;
    const partMap = {};
    const partSrc = stats.participants_per_month.length > 0 ? stats.participants_per_month : MOCK_MONTHLY;
    partSrc.forEach(p => { partMap[p.name] = p.total ?? p.peserta ?? 0; });
    return base.map(e => ({
      name: e.name,
      event: e.total ?? e.event ?? 0,
      peserta: partMap[e.name] ?? 0,
    }));
  })();

  const categoryData = MOCK_CATEGORY;

  const exportToCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Event', stats.total_event],
      ['Total Pengguna', stats.total_user],
      ['Total Penyelenggara', stats.total_penyelenggara],
      ['Total Peserta', stats.total_peserta],
      [], ['Bulan', 'Event', 'Peserta'],
      ...combinedData.map(d => [d.name, d.event, d.peserta]),
    ];
    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'dashboard_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Stat card data ──────────────────────────────────── */
  const statCards = [
    { label: 'Total Event',      value: stats.total_event,          icon: <Calendar size={22} />,   gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)', glow: 'rgba(124,58,237,0.3)' },
    { label: 'Total Pengguna',   value: stats.total_user,           icon: <Users size={22} />,      gradient: 'linear-gradient(135deg,#0ea5e9,#22c55e)', glow: 'rgba(14,165,233,0.3)' },
    { label: 'Penyelenggara',    value: stats.total_penyelenggara,  icon: <ShieldCheck size={22} />,gradient: 'linear-gradient(135deg,#f97316,#fb7185)', glow: 'rgba(249,115,22,0.3)' },
    { label: 'Total Peserta',    value: stats.total_peserta,        icon: <UserCheck size={22} />,  gradient: 'linear-gradient(135deg,#06b6d4,#6366f1)', glow: 'rgba(6,182,212,0.3)' },
  ];

  return (
    <div className="adash-wrap">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">Dashboard Overview</h1>
          <p className="adash-page-sub">Ringkasan aktivitas platform secara keseluruhan.</p>
        </div>
        <button className="adash-export-btn" onClick={exportToCSV}>
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────── */}
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
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ───────────────────────────── */}
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

      {/* ── Charts Row ──────────────────────────────── */}
      <div className="adash-charts-row">

        {/* Area/Bar Combined Chart */}
        <div className="adash-chart-card wide">
          <div className="adash-chart-head">
            <div>
              <h2><Activity size={18} className="adash-sec-icon" /> Tren Aktivitas Bulanan</h2>
              <p>Perbandingan jumlah event dan peserta sepanjang tahun</p>
            </div>
            <div className="adash-chart-tabs">
              {[['combined', 'Gabungan'], ['event', 'Event'], ['peserta', 'Peserta']].map(([v, l]) => (
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
                    <linearGradient id="gradEvent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPeserta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DashTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ paddingTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }} />
                  {(chartView === 'combined' || chartView === 'event') && (
                    <Area type="monotone" dataKey="event" name="Event" stroke="#7c3aed" strokeWidth={2.5} fill="url(#gradEvent)" dot={false} activeDot={{ r: 5, fill: '#7c3aed' }} />
                  )}
                  {(chartView === 'combined' || chartView === 'peserta') && (
                    <Area type="monotone" dataKey="peserta" name="Peserta" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gradPeserta)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9' }} />
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
              <h2><PieIcon size={18} className="adash-sec-icon" /> Distribusi Kategori</h2>
              <p>Sebaran event berdasarkan kategori</p>
            </div>
          </div>
          <div className="adash-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="45%"
                  innerRadius="40%" outerRadius="70%"
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  wrapperStyle={{ fontSize: '0.82rem', color: '#94a3b8', paddingTop: '0.5rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Bottom: Bar Chart ───────────────────────── */}
      <div className="adash-chart-card">
        <div className="adash-chart-head">
          <div>
            <h2><BarChart2 size={18} className="adash-sec-icon" /> Jumlah Peserta per Bulan</h2>
            <p>Visualisasi batang untuk memudahkan perbandingan antar bulan</p>
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
                <Bar dataKey="peserta" name="Peserta" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
