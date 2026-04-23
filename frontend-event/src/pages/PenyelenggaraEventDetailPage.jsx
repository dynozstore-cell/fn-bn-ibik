import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BarChart2, Users2, FileText, Download,
  CheckCircle, Clock, Calendar, MapPin, Tag, DollarSign, Ticket,
  ClipboardCheck, UserCheck, Search, RefreshCcw
} from "lucide-react";
import { buildApiUrl, defaultHeaders } from "../utils/api";
import { getToken } from "../utils/auth";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend
} from "recharts";
import "../styles/AdminDashboard.css";

/* ─── Helpers ─────────────────────────────────────────────── */
async function parseApiResponse(res) {
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { throw new Error("Response tidak valid"); }
}

function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function formatCurrency(val) {
  return `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
}

/* ─── CSV Export ───────────────────────────────────────────── */
function exportCSV(event, participants) {
  const rows = [
    ["Nama Peserta", "Email", "Jumlah Tiket", "Status", "Tanggal Daftar"]
  ];
  participants.forEach(p => {
    rows.push([
      p.nama_peserta || "-",
      p.email_peserta || "-",
      p.jumlah_tiket || 1,
      p.status_pendaftaran || "-",
      p.tanggal_daftar ? new Date(p.tanggal_daftar).toLocaleDateString("id-ID") : "-"
    ]);
  });
  const csvContent = rows.map(r =>
    r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `peserta_${(event?.nama_event || "event").replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function PenyelenggaraEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = getToken() || "";
  const authJson = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("laporan");
  const [attendanceSearch, setAttendanceSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evRes, partRes] = await Promise.all([
          fetch(buildApiUrl(`/api/event/${id}`), { headers: authJson }),
          fetch(buildApiUrl(`/api/daftar-event?event_id=${id}`), { headers: authJson }),
        ]);
        const evData = await parseApiResponse(evRes);
        const partData = await parseApiResponse(partRes);
        setEvent(evData.data || evData);
        setParticipants(Array.isArray(partData) ? partData : (partData.data || []));
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCheckIn = async (pendaftaranId) => {
    try {
      const res = await fetch(buildApiUrl(`/api/daftar-event/${pendaftaranId}`), {
        method: "PUT",
        headers: authJson,
        body: JSON.stringify({ status_pendaftaran: "hadir" }),
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => 
          (p.id === pendaftaranId || p.id_pendaftaran === pendaftaranId) 
          ? { ...p, status_pendaftaran: "hadir" } 
          : p
        ));
      }
    } catch (err) {
      console.error("Gagal check-in:", err);
    }
  };

  /* ── Derived stats ───────────────────────────────────── */
  const totalPendapatan = participants.reduce((s, p) => s + Number(p.total_harga || 0), 0);
  const kapasitas = Number(event?.kapasitas || 100);
  const terisi = Math.min(100, Math.round((participants.length / kapasitas) * 100));
  const confirmed = participants.filter(p => p.status_pendaftaran === "confirmed").length;
  const pending = participants.filter(p =>
    p.status_pendaftaran === "pending" || p.status_pendaftaran === "menunggu_verifikasi"
  ).length;

  const statCards = [
    {
      label: "Total Pendaftar", value: participants.length, unit: "orang",
      icon: <Users2 size={22} />, gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)", glow: "rgba(124,58,237,0.3)"
    },
    {
      label: "Kapasitas Terisi", value: `${terisi}%`, unit: `dari ${kapasitas} kursi`,
      icon: <Ticket size={22} />, gradient: "linear-gradient(135deg,#0ea5e9,#22c55e)", glow: "rgba(14,165,233,0.3)"
    },
    {
      label: "Confirmed", value: confirmed, unit: "peserta",
      icon: <CheckCircle size={22} />, gradient: "linear-gradient(135deg,#10b981,#06b6d4)", glow: "rgba(16,185,129,0.3)"
    },
    {
      label: "Peserta Hadir", value: participants.filter(p => p.status_pendaftaran === "hadir").length, unit: "check-in",
      icon: <UserCheck size={22} />, gradient: "linear-gradient(135deg,#6366f1,#a855f7)", glow: "rgba(99,102,241,0.3)"
    },
  ];

  const tabs = [
    { id: "laporan", label: "Laporan", icon: <BarChart2 size={16} /> },
    { id: "peserta", label: "Daftar Peserta", icon: <Users2 size={16} /> },
    { id: "kehadiran", label: "Kehadiran", icon: <ClipboardCheck size={16} /> },
    { id: "form",    label: "Jawaban Form",   icon: <FileText size={16} /> },
  ];

  if (loading) {
    return (
      <div className="adash-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7",
            animation: "adash-spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <p style={{ color: "#94a3b8" }}>Memuat detail event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adash-wrap">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="adash-page-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <button
            onClick={() => navigate("/penyelenggara/events")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8", padding: "8px 14px", borderRadius: 10, cursor: "pointer",
              fontSize: "0.875rem", fontWeight: 500, transition: "all 0.2s", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <ArrowLeft size={15} /> Kembali
          </button>
          <div>
            <h1 className="adash-page-title">{event?.nama_event || "Detail Event"}</h1>
            <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
              {event?.tanggal && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.82rem" }}>
                  <Calendar size={13} /> {formatDate(event.tanggal)}
                </span>
              )}
              {event?.event_type === 'online' ? (
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.82rem" }}>
                  <MapPin size={13} /> Event Online
                </span>
              ) : (
                event?.lokasi && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.82rem" }}>
                    <MapPin size={13} /> {event.lokasi}
                  </span>
                )
              )}
              {event?.kategori?.nama_kategori && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.82rem" }}>
                  <Tag size={13} /> {event.kategori.nama_kategori}
                </span>
              )}
              {event?.harga !== undefined && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 5, fontSize: "0.82rem", fontWeight: 600,
                  color: Number(event.harga) > 0 ? "#34d399" : "#64748b"
                }}>
                  <DollarSign size={13} /> {Number(event.harga) > 0 ? formatCurrency(event.harga) : "Gratis"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="adash-export-btn"
            style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={() => window.location.reload()}
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <button
            className="adash-export-btn"
            onClick={() => exportCSV(event, participants)}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="adash-stats-grid">
        {statCards.map((s, i) => (
          <div className="adash-stat-card" key={i} style={{ "--glow": s.glow }}>
            <div className="adash-stat-icon" style={{ background: s.gradient }}>{s.icon}</div>
            <div className="adash-stat-body">
              <span className="adash-stat-label">{s.label}</span>
              <span className="adash-stat-value">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</span>
              <span style={{ fontSize: "0.75rem", color: "#475569", marginTop: 2 }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>



      {/* ── Tabs Card ───────────────────────────────────── */}
      <div className="adash-chart-card" style={{ padding: 0, overflow: "hidden" }}>

        {/* Tab Bar */}
        <div style={{
          display: "flex", gap: 0, padding: "0 4px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(15,13,26,0.3)",
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "16px 22px", border: "none", background: "transparent",
                color: activeTab === tab.id ? "#a78bfa" : "#64748b",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                borderBottom: `2px solid ${activeTab === tab.id ? "#a78bfa" : "transparent"}`,
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ─────────────────────────────── */}
        <div style={{ padding: 24 }}>

          {/* LAPORAN TAB */}
          {activeTab === "laporan" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="adash-chart-head" style={{ padding: 0 }}>
                <div>
                  <h2 style={{ margin: 0 }}><BarChart2 size={16} className="adash-sec-icon" /> Ringkasan Event</h2>
                  <p>Detail informasi dan statistik event ini</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                {[
                  { label: "Deskripsi", value: event?.deskripsi || "-" },
                  { label: "Waktu Mulai", value: event?.waktu_mulai || "-" },
                  { label: "Waktu Selesai", value: event?.waktu_selesai || "-" },
                  { label: "Harga Tiket", value: Number(event?.harga) > 0 ? formatCurrency(event.harga) : "Gratis" },
                  { label: "Lokasi", value: event?.event_type === 'online' ? 'Event Online' : (event?.lokasi || "-") },
                  { label: "Kategori", value: event?.kategori?.nama_kategori || "-" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "rgba(255,255,255,0.02)", padding: "16px 18px",
                    borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)"
                  }}>
                    <p style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                      {item.label}
                    </p>
                    <p style={{ color: "#e2e8f0", margin: 0, lineHeight: 1.6, fontSize: "0.9rem" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {/* Registration Status Pie */}
                <div style={{
                  background: "rgba(255,255,255,0.02)", padding: "20px",
                  borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", height: 300
                }}>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 15 }}>Status Registrasi</p>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Confirmed", value: confirmed, color: "#10b981" },
                          { name: "Pending", value: pending, color: "#f59e0b" },
                          { name: "Hadir", value: participants.filter(p => p.status_pendaftaran === "hadir").length, color: "#6366f1" },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        {[
                          { name: "Confirmed", color: "#10b981" },
                          { name: "Pending", color: "#f59e0b" },
                          { name: "Hadir", color: "#6366f1" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip
                         contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                         itemStyle={{ color: '#e2e8f0', fontSize: '0.8rem' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Presence Summary */}
                <div style={{
                  background: "rgba(255,255,255,0.02)", padding: "20px",
                  borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", height: 300,
                  display: "flex", flexDirection: "column", justifyContent: "center"
                }}>
                   <p style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 20 }}>Statistik Kehadiran</p>
                   <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "3rem", fontWeight: 800, color: "#6366f1" }}>
                        {participants.filter(p => p.status_pendaftaran === "hadir").length}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: -5 }}>Peserta Hadir</div>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "20px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-around" }}>
                         <div>
                            <div style={{ color: "#e2e8f0", fontWeight: 700 }}>{confirmed + participants.filter(p => p.status_pendaftaran === "hadir").length}</div>
                            <div style={{ color: "#64748b", fontSize: "0.7rem" }}>TERKONFIRMASI</div>
                         </div>
                         <div>
                            <div style={{ color: "#e2e8f0", fontWeight: 700 }}>{pending}</div>
                            <div style={{ color: "#64748b", fontSize: "0.7rem" }}>PENDING</div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Status Summary */}
              <div style={{
                display: "flex", gap: 20, padding: "16px 20px",
                background: "rgba(255,255,255,0.02)", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap",
              }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", alignSelf: "center" }}>Ringkasan Status</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Confirmed: <strong style={{ color: "#34d399" }}>{confirmed}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Pending: <strong style={{ color: "#fbbf24" }}>{pending}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1" }} />
                  <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Hadir: <strong style={{ color: "#818cf8" }}>{participants.filter(p => p.status_pendaftaran === "hadir").length}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* PESERTA TAB */}
          {activeTab === "peserta" && (
            <div>
              <div className="adash-chart-head" style={{ padding: 0, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0 }}><Users2 size={16} className="adash-sec-icon" /> Daftar Peserta
                    <span style={{
                      marginLeft: 10, padding: "2px 10px", borderRadius: 99,
                      background: "rgba(168,85,247,0.15)", color: "#a78bfa",
                      fontSize: "0.8rem", fontWeight: 600, verticalAlign: "middle"
                    }}>{participants.length}</span>
                  </h2>
                  <p>Semua peserta yang telah mendaftar untuk event ini</p>
                </div>
                <button
                  className="adash-export-btn"
                  onClick={() => exportCSV(event, participants)}
                  style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="adash-table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      {["#", "Nama Peserta", "Email", "Tiket", "Status", "Tgl Daftar", "Aksi"].map(h => (
                        <th key={h} style={{
                          padding: "12px 16px", textAlign: h === "Aksi" ? "right" : "left",
                          color: "#64748b", fontWeight: 700, fontSize: "0.72rem",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                          whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#475569" }}>
                          <Users2 size={32} style={{ opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
                          Belum ada peserta terdaftar
                        </td>
                      </tr>
                    ) : (
                      participants.map((p, idx) => (
                        <tr
                          key={p.id || p.id_pendaftaran}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "14px 16px", color: "#475569", width: 40 }}>{idx + 1}</td>
                          <td style={{ padding: "14px 16px", color: "#f1f5f9", fontWeight: 600 }}>{p.nama_peserta || "-"}</td>
                          <td style={{ padding: "14px 16px", color: "#94a3b8" }}>{p.email_peserta || "-"}</td>
                          <td style={{ padding: "14px 16px", color: "#e2e8f0", textAlign: "center" }}>{p.jumlah_tiket || 1}</td>

                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700,
                              background: p.status_pendaftaran === "confirmed" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                              color: p.status_pendaftaran === "confirmed" ? "#34d399" : "#fbbf24",
                            }}>
                              {p.status_pendaftaran}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                            {formatDate(p.tanggal_daftar)}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            {p.status_pendaftaran === "confirmed" && (
                              <button
                                onClick={() => handleCheckIn(p.id || p.id_pendaftaran)}
                                title="Check-in Peserta"
                                style={{
                                  background: "rgba(16,185,129,0.1)", color: "#10b981",
                                  border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6,
                                  padding: "4px 8px", cursor: "pointer"
                                }}
                              >
                                <UserCheck size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KEHADIRAN TAB */}
          {activeTab === "kehadiran" && (
            <div>
              <div className="adash-chart-head" style={{ padding: 0, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0 }}><ClipboardCheck size={16} className="adash-sec-icon" /> Kehadiran Peserta</h2>
                  <p>Check-in peserta yang telah terkonfirmasi</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                   <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'0 14px' }}>
                    <Search size={14} style={{ color:'#475569' }} />
                    <input 
                      placeholder="Cari nama..." 
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      style={{ background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:'0.82rem', padding:'8px 0', width: 150 }} 
                    />
                  </div>
                </div>
              </div>

              <div className="adash-table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      {["#", "Peserta", "Tiket", "Status Pendaftaran", "Kehadiran", "Aksi"].map(h => (
                        <th key={h} style={{
                          padding: "12px 16px", textAlign: h === "Aksi" ? "right" : "left",
                          color: "#64748b", fontWeight: 700, fontSize: "0.72rem",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participants
                      .filter(p => p.status_pendaftaran === "confirmed" || p.status_pendaftaran === "hadir")
                      .filter(p => (p.nama_peserta || "").toLowerCase().includes(attendanceSearch.toLowerCase()))
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#475569" }}>
                          {attendanceSearch ? "Tidak ada peserta yang cocok dengan pencarian" : "Belum ada peserta yang terkonfirmasi pembayarannya"}
                        </td>
                      </tr>
                    ) : (
                      participants
                        .filter(p => p.status_pendaftaran === "confirmed" || p.status_pendaftaran === "hadir")
                        .filter(p => (p.nama_peserta || "").toLowerCase().includes(attendanceSearch.toLowerCase()))
                        .map((p, idx) => (
                        <tr key={p.id || p.id_pendaftaran} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "14px 16px", color: "#475569" }}>{idx + 1}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{p.nama_peserta}</div>
                            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{p.email_peserta}</div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#e2e8f0" }}>{p.jumlah_tiket} Tiket</td>
                          <td style={{ padding: "14px 16px" }}>
                             <span style={{ color: "#34d399", fontSize: "0.82rem", fontWeight: 600 }}>Confirmed</span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {p.status_pendaftaran === "hadir" ? (
                              <span style={{ color: "#34d399", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                                <CheckCircle size={14} /> HADIR
                              </span>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: "0.82rem" }}>Belum Check-in</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            {p.status_pendaftaran !== "hadir" && (
                              <button
                                onClick={() => handleCheckIn(p.id || p.id_pendaftaran)}
                                style={{
                                  background: "rgba(168,85,247,0.1)", color: "#a78bfa",
                                  border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8,
                                  padding: "6px 12px", fontSize: "0.75rem", fontWeight: 600,
                                  cursor: "pointer", transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(168,85,247,0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(168,85,247,0.1)"}
                              >
                                Check-in
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FORM TAB */}
          {activeTab === "form" && (
            <div>
              <div className="adash-chart-head" style={{ padding: 0, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0 }}><FileText size={16} className="adash-sec-icon" /> Jawaban Form Pendaftaran</h2>
                  <p>Jawaban dari setiap peserta untuk pertanyaan khusus event ini</p>
                </div>
              </div>

              {participants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 16px", color: "#475569" }}>
                  <FileText size={32} style={{ opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
                  Belum ada data pendaftaran
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {participants.map((p) => {
                    let responses = {};
                    try {
                      responses = typeof p.custom_form_responses === "string"
                        ? JSON.parse(p.custom_form_responses || "{}")
                        : (p.custom_form_responses || {});
                    } catch (e) {}
                    const hasResponses = Object.keys(responses).length > 0;

                    return (
                      <div key={p.id || p.id_pendaftaran} style={{
                        borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden"
                      }}>
                        <div style={{
                          padding: "12px 18px",
                          background: "rgba(255,255,255,0.03)",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: "linear-gradient(135deg,#7c3aed,#0ea5e9)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                            }}>
                              {(p.nama_peserta || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: "#f1f5f9", margin: 0, fontSize: "0.9rem" }}>{p.nama_peserta}</p>
                              <p style={{ color: "#64748b", fontSize: "0.78rem", margin: 0 }}>{p.email_peserta}</p>
                            </div>
                          </div>
                          <span style={{ color: "#64748b", fontSize: "0.78rem" }}>{formatDate(p.tanggal_daftar)}</span>
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                          {!hasResponses ? (
                            <span style={{ color: "#475569", fontSize: "0.85rem", fontStyle: "italic" }}>
                              Tidak ada jawaban form khusus
                            </span>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                              {Object.entries(responses).map(([key, val], i) => (
                                <div key={i} style={{
                                  background: "rgba(124,58,237,0.06)", padding: "10px 14px",
                                  borderRadius: 10, border: "1px solid rgba(124,58,237,0.12)"
                                }}>
                                  <p style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                                    Pertanyaan {i + 1}
                                  </p>
                                  <p style={{ color: "#cbd5e1", margin: 0, fontSize: "0.875rem" }}>
                                    {Array.isArray(val) ? val.join(", ") : String(val)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
