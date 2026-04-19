import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { CheckCircle, ArrowRight, Home } from "lucide-react";

export default function PaymentSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0f0d1a, #16131f)", color: "#f8fafc" }}>
      <NavbarCustom />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px 60px" }}>
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            background: "rgba(30,26,46,0.8)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 24,
            padding: "48px 40px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(16,185,129,0.05)",
            backdropFilter: "blur(20px)",
            textAlign: "center",
            animation: "fadeSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 0 0 12px rgba(16,185,129,0.1)",
              animation: "popIn 0.4s 0.2s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <CheckCircle size={40} color="#fff" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
            Pendaftaran Berhasil!
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 32px" }}>
            Pembayaran Anda telah berhasil dikirim dan sedang <strong style={{ color: "#6ee7b7" }}>menunggu verifikasi</strong> dari penyelenggara. Kami akan mengirimkan notifikasi setelah pembayaran dikonfirmasi.
          </p>

          {/* Info Box */}
          <div
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 32,
              textAlign: "left",
            }}
          >
            <p style={{ margin: "0 0 8px", color: "#6ee7b7", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Status Pembayaran
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>Menunggu Verifikasi Admin</span>
            </div>
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
              Proses verifikasi biasanya memakan waktu 1×24 jam kerja.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => navigate("/events")}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s", boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(16,185,129,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 15px rgba(16,185,129,0.3)"; }}
            >
              Jelajahi Event Lainnya <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                width: "100%", padding: "12px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <Home size={16} /> Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
