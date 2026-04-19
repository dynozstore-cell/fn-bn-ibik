import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, CheckCircle, XCircle, Clock, Eye, ChevronLeft, ChevronRight,
  CreditCard, AlertCircle, RefreshCw, FileImage, Calendar, User, DollarSign
} from "lucide-react";
import { buildApiUrl, defaultHeaders } from "../utils/api";
import { getToken } from "../utils/auth";
import "../styles/AdminEventsPage.css";

const PER_PAGE = 10;

function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRupiah(n) {
  const num = Number(n);
  if (!num || isNaN(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

function StatusBadge({ status }) {
  const map = {
    pending:          { label: "Menunggu",   cls: "aep-badge-upcoming" },
    menunggu_verifikasi: { label: "Perlu Verifikasi", cls: "aep-badge-upcoming" },
    terverifikasi:    { label: "Terverifikasi", cls: "aep-badge-done" },
    ditolak:          { label: "Ditolak",     cls: "aep-badge-unknown" },
    success:          { label: "Sukses",      cls: "aep-badge-done" },
  };
  const s = map[status] || { label: status || "-", cls: "aep-badge-unknown" };
  return <span className={`aep-badge ${s.cls}`}>{s.label}</span>;
}

/* ── Image Preview Modal ─────────────────────────────────── */
function ImageModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: -40, right: 0,
            background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: "0.9rem"
          }}
        >
          ✕ Tutup
        </button>
        <img
          src={url}
          alt="Bukti Pembayaran"
          style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </div>
    </div>
  );
}

/* ── Verify Modal ─────────────────────────────────────────── */
function VerifyModal({ item, onClose, onConfirm, loading }) {
  if (!item) return null;
  const buktiUrl = item.bukti_pembayaran_url || null;

  return (
    <div className="aep-modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', zIndex: 1050 }}>
      <div 
        className="aep-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 550, 
          padding: 0, 
          overflow: 'hidden', 
          background: '#1e293b', 
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header Area */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(14,165,233,0.1))', 
          padding: '24px 30px', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 12, 
            background: 'rgba(16,185,129,0.2)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Detail Verifikasi</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Periksa bukti bayar sebelum melakukan konfirmasi.</p>
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          {/* Main Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: 'rgba(15,23,42,0.4)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Peserta</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem' }}>{item.nama_peserta || "-"}</span>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.4)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Nominal Bayar</span>
              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>{formatRupiah(item.jumlah_bayar)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: 'rgba(15,23,42,0.2)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Jumlah Tiket</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.jumlah_tiket || 1} Tiket</span>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.2)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Tgl Daftar</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatDate(item.tanggal_daftar)}</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>Nama Event</span>
            <div style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 500 }}>{item.nama_event || "-"}</div>
          </div>

          {/* Custom Form Responses Section */}
          {item.custom_form_responses && (
            <div style={{ marginBottom: 24, padding: 16, background: 'rgba(30,41,59,0.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Informasi Tambahan (Form)</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(typeof item.custom_form_responses === 'string' ? JSON.parse(item.custom_form_responses) : item.custom_form_responses).map(([key, val], idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8' }}>{key}:</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Bukti Pembayaran</span>
            {buktiUrl ? (
              <div style={{ 
                width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(15,23,42,0.8)', position: 'relative', cursor: 'pointer'
              }} onClick={() => window.open(buktiUrl, '_blank')}>
                <img src={buktiUrl} alt="Bukti" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
                <div style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' 
                }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <Eye size={24} color="#fff" />
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, color: '#64748b' }}>
                <FileImage size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Bukti pembayaran tidak tersedia</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
            <button
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', 
                border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, 
                fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 15px rgba(16,185,129,0.2)'
              }}
              disabled={loading}
              onClick={() => onConfirm(item.id, "terverifikasi")}
            >
              <CheckCircle size={18} /> {loading ? "Memproses..." : "Setujui Pembayaran"}
            </button>
            <button
              style={{ 
                background: 'rgba(239,68,68,0.1)', color: '#ef4444', 
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px', 
                fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
              disabled={loading}
              onClick={() => onConfirm(item.id, "ditolak")}
            >
              <XCircle size={18} /> Tolak
            </button>
          </div>
          <button 
            style={{ 
              width: '100%', marginTop: 12, background: 'transparent', border: 'none',
              color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', padding: '8px'
            }} 
            onClick={onClose}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function PenyelenggaraKonfirmasiPage() {
  const token = getToken() || "";
  const authHeaders = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");

  // Filters
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage]               = useState(1);

  // Modals
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [verifyItem, setVerifyItem]   = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  /* ── Fetch Payments ──────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildApiUrl("/api/pembayaran"), { headers: authHeaders });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setPayments(list);
    } catch (err) {
      setError("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Filter & Paginate ───────────────────────────────── */
  const filtered = useMemo(() => {
    return payments.filter(p => {
      const matchSearch =
        !search ||
        (p.nama_peserta || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.nama_event || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.email_peserta || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        !filterStatus ||
        (p.status_pembayaran || "") === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [payments, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  /* ── Stats ───────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:     payments.length,
    pending:   payments.filter(p => p.status_pembayaran === "pending" || p.status_pembayaran === "menunggu_verifikasi").length,
    verified:  payments.filter(p => p.status_pembayaran === "terverifikasi" || p.status_pembayaran === "success").length,
    rejected:  payments.filter(p => p.status_pembayaran === "ditolak").length,
  }), [payments]);

  /* ── Verify Action ───────────────────────────────────── */
  const handleVerify = async (id, status) => {
    setVerifyLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/api/pembayaran/${id}/verifikasi`), {
        method:  "PUT",
        headers: authHeaders,
        body:    JSON.stringify({ status_pembayaran: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui status.");
      setMessage(
        status === "terverifikasi"
          ? "✓ Pembayaran berhasil disetujui."
          : "✗ Pembayaran ditolak."
      );
      setVerifyItem(null);
      await load();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setVerifyLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="aep-wrap">

      {/* Modals */}
      <ImageModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      <VerifyModal
        item={verifyItem}
        onClose={() => setVerifyItem(null)}
        onConfirm={handleVerify}
        loading={verifyLoading}
      />

      {/* Page Header */}
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">Konfirmasi Pembayaran</h1>
          <p className="adash-page-sub">Verifikasi bukti pembayaran dari peserta event Anda.</p>
        </div>
        <button
          className="adash-export-btn"
          onClick={load}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="aep-alert aep-alert-error">
          <AlertCircle size={16} style={{ marginRight: 8 }} />
          {error}
        </div>
      )}
      {message && (
        <div className="aep-alert aep-alert-success">
          <CheckCircle size={16} style={{ marginRight: 8 }} />
          {message}
        </div>
      )}

      {/* Stats Row */}
      <div className="adash-stats-grid">
        {[
          { icon: <DollarSign size={22} />, label: "Total Pembayaran", value: stats.total, gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)", glow: "rgba(124,58,237,0.3)" },
          { icon: <Clock size={22} />,     label: "Menunggu Verifikasi", value: stats.pending, gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.3)" },
          { icon: <CheckCircle size={22} />, label: "Terverifikasi", value: stats.verified, gradient: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.3)" },
          { icon: <XCircle size={22} />,   label: "Ditolak",         value: stats.rejected, gradient: "linear-gradient(135deg,#ef4444,#f87171)", glow: "rgba(239,68,68,0.3)" },
        ].map((s, i) => (
          <div className="aep-stat-card" key={i} style={{ "--glow": s.glow }}>
            <div className="aep-stat-icon" style={{ background: s.gradient }}>{s.icon}</div>
            <div className="aep-stat-body">
              <span className="aep-stat-label">{s.label}</span>
              <span className="aep-stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="aep-table-card">

        {/* Toolbar */}
        <div className="aep-toolbar">
          <div className="aep-search-wrap">
            <Search size={15} className="aep-search-icon" />
            <input
              className="aep-search"
              placeholder="Cari nama peserta, event…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="aep-filter-wrap">
            <Filter size={14} className="aep-filter-icon" />
            <select
              className="aep-filter-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="menunggu_verifikasi">Perlu Verifikasi</option>
              <option value="terverifikasi">Terverifikasi</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="aep-summary">
          Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> pembayaran
        </div>

        {/* Table */}
        <div className="aep-table-wrap">
          <table className="aep-table">
            <thead>
              <tr>
                <th><span className="aep-th-inner">#</span></th>
                <th><span className="aep-th-inner"><User size={13} /> Peserta</span></th>
                <th><span className="aep-th-inner"><Calendar size={13} /> Event</span></th>
                <th><span className="aep-th-inner"><CreditCard size={13} /> Metode</span></th>
                <th><span className="aep-th-inner">Jumlah</span></th>
                <th><span className="aep-th-inner">Status</span></th>
                <th><span className="aep-th-inner">Bukti</span></th>
                <th style={{ textAlign: "right" }}><span className="aep-th-inner" style={{ justifyContent: "flex-end" }}>Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="aep-td-center">
                    <div className="aep-loading">
                      <span className="aep-spinner" /> Memuat data pembayaran…
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="aep-td-center">
                    <div className="aep-empty">
                      <CreditCard size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                      <br />Tidak ada data pembayaran ditemukan
                    </div>
                  </td>
                </tr>
              ) : paginated.map((p, idx) => {
                const rowNum = (safePage - 1) * PER_PAGE + idx + 1;
                const buktiUrl = p.bukti_pembayaran_url || null;

                return (
                  <tr key={p.id} className="aep-tr">
                    <td className="aep-td-num">{rowNum}</td>
                    <td>
                      <div style={{ lineHeight: 1.4 }}>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>{p.nama_peserta || "-"}</div>
                        <div style={{ color: "#64748b", fontSize: "0.78rem" }}>{p.email_peserta || "-"}</div>
                      </div>
                    </td>
                    <td className="aep-td-judul" title={p.nama_event}>{p.nama_event || "-"}</td>
                    <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{p.nama_metode || "-"}</td>
                    <td style={{ color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>{formatRupiah(p.jumlah_bayar)}</td>
                    <td><StatusBadge status={p.status_pembayaran} /></td>
                    <td>
                      {buktiUrl ? (
                        <button
                          title="Lihat Bukti"
                          onClick={() => setPreviewUrl(buktiUrl)}
                          style={{
                            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)",
                            color: "#0ea5e9", borderRadius: 8, padding: "5px 10px",
                            cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          <FileImage size={13} /> Lihat
                        </button>
                      ) : (
                        <span style={{ color: "#475569", fontSize: "0.78rem" }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {(p.status_pembayaran === "pending" || p.status_pembayaran === "menunggu_verifikasi") && (
                          <button
                            title="Verifikasi"
                            onClick={() => setVerifyItem(p)}
                            style={{
                              background: "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.15))",
                              border: "1px solid rgba(16,185,129,0.3)", color: "#10b981",
                              borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                              fontWeight: 600, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 5,
                              transition: "all 0.2s",
                            }}
                          >
                            <Eye size={14} /> Verifikasi
                          </button>
                        )}
                        {p.status_pembayaran === "terverifikasi" && (
                          <span style={{ color: "#10b981", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle size={14} /> Disetujui
                          </span>
                        )}
                        {p.status_pembayaran === "ditolak" && (
                          <span style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <XCircle size={14} /> Ditolak
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="aep-pagination">
            <button className="aep-page-btn" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`aep-page-btn ${safePage === p ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="aep-page-btn" disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
