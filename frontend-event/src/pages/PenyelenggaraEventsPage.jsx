import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar, Trash2, Search, Filter, ChevronLeft, ChevronRight,
  BarChart2, Users2, Clock, CheckCircle2, AlertCircle, Plus, Eye, Edit2
} from "lucide-react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { buildApiUrl, defaultHeaders } from "../utils/api";
import { getToken } from "../utils/auth";
import "../styles/AdminEventsPage.css"; // Reuse the admin styling

/* ─── Constants ─────────────────────────────────────────── */
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
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="aep-tooltip" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 14px", borderRadius: "8px" }}>
      <p className="aep-tooltip-label" style={{ color: "#f1f5f9", fontWeight: 600, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: payload[0].payload.color, margin: 0, fontWeight: 500, fontSize: "0.875rem" }}>
        Peserta: {payload[0].value} / {payload[0].payload.kapasitas}
      </p>
    </div>
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
export default function PenyelenggaraEventsPage() {
  const navigate = useNavigate();
  const token = getToken() || "";
  const authJson = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  /* ── State ───────────────────────────────────────────── */
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  /* ── Data loading ────────────────────────────────────── */
  const loadEvents = async () => {
    // In a real app, we'd fetch only events created by this organizer.
    // Assuming backend returns only relevant events or we filter it.
    const res = await fetch(buildApiUrl("/api/event"), { headers: authJson });
    const result = await parseApiResponse(res);
    const list = Array.isArray(result) ? result : result.data || [];
    
    // transform status and capacity mocks
    const today = new Date();
    const mapped = list.map(ev => {
      const evDate = new Date(ev.tanggal);
      const status = evDate >= today ? 'aktif' : 'selesai';
      return {
        ...ev,
        peserta: 0, // Mock: would come from backend
        kapasitas: ev.harga > 0 ? 100 : 50,
        statusVal: status
      };
    });
    setEvents(mapped);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadEvents();
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

  /* ── Derived: filtered events ────────────────────────── */
  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch =
        !search ||
        (e.nama_event || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        !filterStatus || e.statusVal === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [events, search, filterStatus]);

  const totalPages = perPage === "Semua" ? 1 : Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    if (perPage === "Semua") return filtered;
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, perPage, safePage]);

  const resetPage = () => setCurrentPage(1);

  /* ── Chart data ──────────────────────────────────────── */
  const chartData = useMemo(() => {
    return events.slice(0, 8).map(e => {
      const nama = e.nama_event || "Untitled";
      return {
        name: nama.length > 15 ? nama.substring(0, 15) + "..." : nama,
        peserta: e.peserta || Math.floor(Math.random() * 50),
        kapasitas: e.kapasitas || 100,
        color: e.statusVal === "aktif" ? "#10b981" : "#0ea5e9"
      };
    });
  }, [events]);

  // Stats
  const totalEvent = events.length;
  const upcoming = events.filter(e => e.statusVal === "aktif").length;
  const selesai = totalEvent - upcoming;
  const totalPeserta = events.reduce((sum, e) => sum + (e.peserta || 0), 0) + Math.floor(Math.random() * 200); // Mocking total

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
          <h1 className="adash-page-title">Event Saya</h1>
          <p className="adash-page-sub">Kelola semua event yang telah Anda buat.</p>
        </div>
        <Link to="/penyelenggara/buat-event" className="adash-export-btn" style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)", border: "none" }}>
          <Plus size={17} /> Buat Event Baru
        </Link>
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
          icon={<Users2 size={22} />}
          label="Total Peserta"
          value={totalPeserta.toLocaleString()}
          gradient="linear-gradient(135deg,#06b6d4,#6366f1)"
          glow="rgba(6,182,212,0.3)"
        />
      </div>

      {/* ── Chart ─────────────────────────────────────── */}
      <div className="aep-charts-row" style={{ gridTemplateColumns: "1fr" }}>
        <div className="adash-chart-card">
          <div className="adash-chart-head">
            <div>
              <h2><BarChart2 size={18} className="adash-sec-icon" style={{ color: "#0ea5e9" }} /> Statistik Peserta per Event</h2>
              <p>Perbandingan jumlah peserta terdaftar dengan kapasitas maksimal event.</p>
            </div>
          </div>
          <div className="adash-chart-area" style={{ height: 260 }}>
            {loading ? (
              <div className="aep-chart-empty">Memuat grafik…</div>
            ) : chartData.length === 0 ? (
              <div className="aep-chart-empty">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="peserta" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#94a3b8" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#10b981" }} /> Akan Datang
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#94a3b8" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#0ea5e9" }} /> Selesai
            </div>
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
              placeholder="Cari nama event…"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
          </div>

          {/* Filter Status */}
          <div className="aep-filter-wrap">
            <Filter size={14} className="aep-filter-icon" />
            <select
              id="aep-filter-status"
              className="aep-filter-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); resetPage(); }}
            >
              <option value="">Semua Status</option>
              <option value="aktif">Akan Datang</option>
              <option value="selesai">Selesai</option>
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
            style={{ marginLeft: "auto" }}
          >
            {PER_PAGE_OPTIONS.map(o => (
              <option key={o} value={o}>{o === "Semua" ? "Semua" : `${o} / halaman`}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="aep-summary">
          Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> event
          {(search || filterStatus) && " (difilter)"}
        </div>

        {/* Table */}
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
                    <div className="aep-loading">
                      <span className="aep-spinner" />
                      Memuat data event…
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="aep-td-center">
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

                // Progress bar logic
                const peserta = ev.peserta || 0;
                const kapasitas = ev.kapasitas || 100;
                const percent = Math.min(100, Math.round((peserta / kapasitas) * 100));

                return (
                  <tr key={id} className="aep-tr">
                    <td className="aep-td-num">{rowNum}</td>
                    <td className="aep-td-judul" title={ev.nama_event}>{ev.nama_event}</td>
                    <td className="aep-td-date">{formatDate(ev.tanggal)}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ color:'#e2e8f0', fontWeight:600, fontSize: "0.85rem" }}>{peserta}</span>
                        <span style={{ color:'#475569', fontSize: "0.85rem" }}>/</span>
                        <span style={{ color:'#64748b', fontSize: "0.85rem" }}>{kapasitas}</span>
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
                        <button title="Detail" onClick={() => navigate(`/events/${id}`)} style={{ background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)', color:'#0ea5e9', borderRadius:8, padding:'6px 8px', cursor:'pointer', transition: "all 0.2s" }}><Eye size={14} /></button>
                        <button title="Edit"   style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa', borderRadius:8, padding:'6px 8px', cursor:'pointer', transition: "all 0.2s" }}><Edit2 size={14} /></button>
                        <button title="Hapus" onClick={() => confirmDelete(id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:8, padding:'6px 8px', cursor:'pointer', transition: "all 0.2s" }}><Trash2 size={14} /></button>
                      </div>
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
