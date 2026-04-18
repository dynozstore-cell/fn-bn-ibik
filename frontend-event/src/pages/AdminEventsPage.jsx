import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Trash2, Search, Filter, ChevronLeft, ChevronRight,
  BarChart2, PieChart as PieIcon, Activity, TrendingUp,
  Tag, Users2, AlertCircle, CheckCircle2, Clock, Download
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { buildApiUrl, defaultHeaders } from "../utils/api";
import { getToken } from "../utils/auth";
import "../styles/AdminEventsPage.css";

/* ─── Constants ─────────────────────────────────────────── */
const PIE_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];
const PER_PAGE_OPTIONS = [10, 50, 100, "Semua"];

/* ─── Helpers ───────────────────────────────────────────── */
async function parseApiResponse(res) {
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { throw new Error("Response tidak valid"); }
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

/* ─── Sub-components ────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="aep-tooltip">
      <p className="aep-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "3px 0 0", fontWeight: 600, fontSize: "0.875rem" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

function StatCard({ icon, label, value, gradient, glow }) {
  return (
    <div className="aep-stat-card" style={{ "--glow": glow }}>
      <div className="aep-stat-icon" style={{ background: gradient }}>{icon}</div>
      <div className="aep-stat-body">
        <span className="aep-stat-label">{label}</span>
        <span className="aep-stat-value">{value}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function AdminEventsPage() {
  const navigate = useNavigate();
  const token = getToken() || "";
  const authJson = { ...defaultHeaders, Authorization: `Bearer ${token}` };
  const authMulti = { Accept: "application/json", Authorization: `Bearer ${token}` };

  /* ── State ───────────────────────────────────────────── */
  const [events, setEvents] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [penyelenggaraList, setPenyelenggaraList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("");
  const [filterOrg, setFilterOrg] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  /* ── Data loading ────────────────────────────────────── */
  const loadEvents = async () => {
    const res = await fetch(buildApiUrl("/api/event"), { headers: authJson });
    const result = await parseApiResponse(res);
    const list = Array.isArray(result) ? result : result.data || [];
    setEvents(list);

    // Extract unique penyelenggara (organizers)
    const orgs = [...new Set(list.map(e => e.penyelenggara || e.nama_penyelenggara).filter(Boolean))];
    setPenyelenggaraList(orgs);
  };

  const loadKategori = async () => {
    const res = await fetch(buildApiUrl("/api/kategori"), { headers: authJson });
    const result = await parseApiResponse(res);
    setKategoriList(Array.isArray(result) ? result : result.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadEvents(), loadKategori()]);
      } catch (err) {
        setError(err.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Delete ──────────────────────────────────────────── */
  const confirmDelete = (id) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);

  const doDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(buildApiUrl(`/api/event/${deleteId}`), {
        method: "DELETE",
        headers: authJson,
      });
      const result = await parseApiResponse(res);
      if (!res.ok) throw new Error(result.message || "Gagal menghapus event.");
      setMessage("Event berhasil dihapus.");
      setDeleteId(null);
      await loadEvents();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Export CSV ──────────────────────────────────────── */
  const exportToCSV = () => {
    if (events.length === 0) return;
    const rows = [
      ["ID", "Nama Event", "Kategori", "Penyelenggara", "Tanggal", "Lokasi", "Harga", "Status"],
    ];
    
    events.forEach(ev => {
      const id = ev.id || ev.id_event || "";
      const nama = ev.nama_event || "";
      const kat = ev.nama_kategori || ev.category || "";
      const org = ev.penyelenggara || ev.nama_penyelenggara || "";
      const tgl = ev.tanggal || "";
      const lok = ev.lokasi || "";
      const hrg = ev.harga || "0";
      const status = getStatusBadge(tgl).label;
      
      // Escape commas and quotes for CSV
      rows.push([
        id, 
        `"${nama.replace(/"/g, '""')}"`, 
        `"${kat}"`, 
        `"${org}"`, 
        `"${tgl}"`, 
        `"${lok.replace(/"/g, '""')}"`, 
        hrg, 
        `"${status}"`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\r\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_event.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Derived: filtered events ────────────────────────── */
  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch =
        !search ||
        (e.nama_event || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.penyelenggara || e.nama_penyelenggara || "").toLowerCase().includes(search.toLowerCase());
      const matchKat =
        !filterKat ||
        String(e.kategori_id) === filterKat ||
        (e.nama_kategori || e.category || "") === filterKat;
      const matchOrg =
        !filterOrg ||
        (e.penyelenggara || e.nama_penyelenggara || "") === filterOrg;
      return matchSearch && matchKat && matchOrg;
    });
  }, [events, search, filterKat, filterOrg]);

  const totalPages = perPage === "Semua" ? 1 : Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    if (perPage === "Semua") return filtered;
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, perPage, safePage]);

  const resetPage = () => setCurrentPage(1);

  /* ── Chart data ──────────────────────────────────────── */
  const categoryChartData = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const kat = e.nama_kategori || e.category || "Lainnya";
      map[kat] = (map[kat] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const monthlyChartData = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!e.tanggal) return;
      const d = new Date(e.tanggal);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.entries(map)
      .sort((a, b) => {
        const parse = s => { const [m, y] = s.split(" "); return new Date(`${m} 20${y}`); };
        return parse(a[0]) - parse(b[0]);
      })
      .slice(-12);
    return sorted.map(([name, total]) => ({ name, total }));
  }, [events]);

  // Stats
  const totalEvent = events.length;
  const upcoming = events.filter(e => e.tanggal && new Date(e.tanggal) > new Date()).length;
  const selesai = totalEvent - upcoming;
  const totalKat = categoryChartData.length;

  /* ── Pagination range ────────────────────────────────── */
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

  /* ── JSX ─────────────────────────────────────────────── */
  return (
    <div className="aep-wrap">

      {/* ── Delete Modal ─────────────────────────────── */}
      {deleteId && (
        <div className="aep-modal-overlay" onClick={cancelDelete}>
          <div className="aep-modal" onClick={e => e.stopPropagation()}>
            <div className="aep-modal-icon">
              <Trash2 size={28} />
            </div>
            <h3 className="aep-modal-title">Hapus Event?</h3>
            <p className="aep-modal-desc">Tindakan ini tidak bisa dibatalkan. Event akan dihapus secara permanen.</p>
            <div className="aep-modal-actions">
              <button className="aep-modal-cancel" onClick={cancelDelete}>Batal</button>
              <button className="aep-modal-confirm" onClick={doDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────── */}
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">Manajemen Event</h1>
          <p className="adash-page-sub">Kelola seluruh event yang terdaftar di platform</p>
        </div>
        <button className="adash-export-btn" onClick={exportToCSV}>
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* ── Alerts ───────────────────────────────────── */}
      {error && (
        <div className="aep-alert aep-alert-error">
          <AlertCircle size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          {error}
        </div>
      )}
      {message && (
        <div className="aep-alert aep-alert-success">
          <CheckCircle2 size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          {message}
        </div>
      )}

      {/* ── Stat Cards ───────────────────────────────── */}
      <div className="adash-stats-grid">
        <StatCard
          icon={<Calendar size={22} />}
          label="Total Event"
          value={totalEvent.toLocaleString()}
          gradient="linear-gradient(135deg,#7c3aed,#a78bfa)"
          glow="rgba(124,58,237,0.3)"
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Akan Datang"
          value={upcoming.toLocaleString()}
          gradient="linear-gradient(135deg,#0ea5e9,#22c55e)"
          glow="rgba(14,165,233,0.3)"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Selesai"
          value={selesai.toLocaleString()}
          gradient="linear-gradient(135deg,#f97316,#fb7185)"
          glow="rgba(249,115,22,0.3)"
        />
        <StatCard
          icon={<Tag size={22} />}
          label="Kategori"
          value={totalKat.toLocaleString()}
          gradient="linear-gradient(135deg,#06b6d4,#6366f1)"
          glow="rgba(6,182,212,0.3)"
        />
      </div>

      {/* ── Charts Row ───────────────────────────────── */}
      <div className="aep-charts-row">

        {/* Bar Chart – Event per Bulan */}
        <div className="adash-chart-card">
          <div className="adash-chart-head">
            <div>
              <h2><Activity size={18} className="adash-sec-icon" /> Tren Event per Bulan</h2>
              <p>Jumlah event yang diselenggarakan setiap bulan</p>
            </div>
          </div>
          <div className="adash-chart-area">
            {loading ? (
              <div className="aep-chart-empty">Memuat grafik…</div>
            ) : monthlyChartData.length === 0 ? (
              <div className="aep-chart-empty">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="total" name="Event" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart – Distribusi Kategori */}
        <div className="adash-chart-card">
          <div className="adash-chart-head">
            <div>
              <h2><PieIcon size={18} className="adash-sec-icon" /> Distribusi Kategori</h2>
              <p>Sebaran event berdasarkan kategori</p>
            </div>
          </div>
          <div className="adash-chart-area">
            {loading ? (
              <div className="aep-chart-empty">Memuat grafik…</div>
            ) : categoryChartData.length === 0 ? (
              <div className="aep-chart-empty">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%" cy="45%"
                    innerRadius="38%" outerRadius="68%"
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    itemStyle={{ color: "#e2e8f0" }}
                    labelStyle={{ color: "#f8fafc", fontWeight: 700 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ fontSize: "0.82rem", color: "#94a3b8", paddingTop: "0.5rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Table Card ─────────────────────────── */}
      <div className="aep-table-card">

        {/* Toolbar */}
        <div className="aep-toolbar">
          {/* Search */}
          <div className="aep-search-wrap">
            <Search size={15} className="aep-search-icon" />
            <input
              id="aep-search"
              className="aep-search"
              placeholder="Cari nama event atau penyelenggara…"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
          </div>

          {/* Filter Kategori */}
          <div className="aep-filter-wrap">
            <Tag size={14} className="aep-filter-icon" />
            <select
              id="aep-filter-kategori"
              className="aep-filter-select"
              value={filterKat}
              onChange={e => { setFilterKat(e.target.value); resetPage(); }}
            >
              <option value="">Semua Kategori</option>
              {kategoriList.map(k => {
                const id = String(k.id || k.id_kategori);
                const name = k.nama_kategori || k.nama || `Kategori ${id}`;
                return <option key={id} value={id}>{name}</option>;
              })}
            </select>
          </div>

          {/* Filter Penyelenggara */}
          <div className="aep-filter-wrap">
            <Users2 size={14} className="aep-filter-icon" />
            <select
              id="aep-filter-organizer"
              className="aep-filter-select"
              value={filterOrg}
              onChange={e => { setFilterOrg(e.target.value); resetPage(); }}
            >
              <option value="">Semua Penyelenggara</option>
              {penyelenggaraList.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          {/* Per-page */}
          <select
            id="aep-per-page"
            className="aep-filter-select"
            value={perPage}
            onChange={e => {
              const v = e.target.value;
              setPerPage(v === "Semua" ? "Semua" : Number(v));
              resetPage();
            }}
          >
            {PER_PAGE_OPTIONS.map(o => (
              <option key={o} value={o}>{o === "Semua" ? "Semua" : `${o} / halaman`}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="aep-summary">
          Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> event
          {(search || filterKat || filterOrg) && " (difilter)"}
        </div>

        {/* Table */}
        <div className="aep-table-wrap">
          <table className="aep-table">
            <thead>
              <tr>
                <th><span className="aep-th-inner">#</span></th>
                <th><span className="aep-th-inner"><Calendar size={13} /> Judul Event</span></th>
                <th><span className="aep-th-inner">Tanggal</span></th>
                <th><span className="aep-th-inner"><Users2 size={13} /> Penyelenggara</span></th>
                <th><span className="aep-th-inner"><Tag size={13} /> Kategori</span></th>
                <th><span className="aep-th-inner">Status</span></th>
                <th><span className="aep-th-inner">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="aep-td-center">
                    <div className="aep-loading">
                      <span className="aep-spinner" />
                      Memuat data event…
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="aep-td-center">
                    <div className="aep-empty">
                      <Calendar size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                      <br />Tidak ada event yang ditemukan
                    </div>
                  </td>
                </tr>
              ) : paginated.map((ev, idx) => {
                const id = ev.id || ev.id_event;
                const rowNum = perPage === "Semua" ? idx + 1 : (safePage - 1) * perPage + idx + 1;
                const status = getStatusBadge(ev.tanggal);
                const organizer = ev.penyelenggara || ev.nama_penyelenggara || "-";
                const kategori = ev.nama_kategori || ev.category || "-";

                return (
                  <tr key={id} className="aep-tr">
                    <td className="aep-td-num">{rowNum}</td>
                    <td className="aep-td-judul" title={ev.nama_event}>{ev.nama_event}</td>
                    <td className="aep-td-date">{formatDate(ev.tanggal)}</td>
                    <td>{organizer}</td>
                    <td><span className="aep-kat-badge">{kategori}</span></td>
                    <td>
                      <span className={`aep-badge ${status.cls}`}>{status.label}</span>
                    </td>
                    <td>
                      <button
                        id={`aep-delete-${id}`}
                        className="aep-btn-delete"
                        onClick={() => confirmDelete(id)}
                        title="Hapus event"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {perPage !== "Semua" && totalPages > 1 && (
          <div className="aep-pagination">
            <button
              className="aep-page-btn"
              disabled={safePage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              id="aep-prev-page"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageRange(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ell-${i}`} className="aep-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  id={`aep-page-${p}`}
                  className={`aep-page-btn ${safePage === p ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              )
            )}

            <button
              className="aep-page-btn"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              id="aep-next-page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
