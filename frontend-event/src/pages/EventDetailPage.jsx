import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { buildApiUrl, defaultHeaders } from "../utils/api";
import {
  CalendarDays, MapPin, Clock, Tag, Share2,
  ArrowLeft, CheckCircle2, AlertCircle, Map, Info, User
} from "lucide-react";
import "../styles/EventDetailPage.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80";

const fallbackEvents = [
  {
    id: 1, title: "Neon Night Music Festival Bandung", date: "22 Mar 2026",
    time: "18:00 - Selesai", location: "Bandung, Jawa Barat", category: "Music & Festival",
    organizer: "Skyline Entertainment", harga: 180000,
    description: "Pengalaman musik terbaik tahun ini dengan artis-artis ternama. Bersiaplah untuk malam yang tak terlupakan dengan tata cahaya spektakuler dan sound system kelas dunia.",
    foto_event_url: FALLBACK_IMAGE,
  },
  {
    id: 2, title: "Success Free Career & Meditation Classes", date: "30 Mar 2026",
    time: "09:00 - 12:00", location: "Online Webinar", category: "Business & Career",
    organizer: "Mindful Growth ID", harga: 0,
    description: "Kelas gratis pengembangan diri dan meditasi untuk kesuksesan karir.",
    foto_event_url: FALLBACK_IMAGE,
  },
];

function normalizeDetail(event, fallbackId) {
  if (!event) {
    return fallbackEvents.find(e => String(e.id) === String(fallbackId)) || fallbackEvents[0];
  }
  return {
    id: event.id || event.id_event,
    title: event.title || event.nama_event || "Untitled Event",
    date: event.date || event.tanggal || "-",
    time: event.waktu || "09:00 - Selesai",
    location: event.location || event.lokasi || "-",
    category: event.category || event.kategori?.nama_kategori || "Event Umum",
    organizer: event.penyelenggara_name || event.organizer || "Panitia Event",
    description: event.description || event.deskripsi || "Deskripsi event belum tersedia.",
    harga: event.harga ?? null,
    foto_event_url:
      event.foto_event_url ||
      (event.foto_event ? buildApiUrl(`/event/${event.foto_event}`) : FALLBACK_IMAGE),
  };
}

function formatPrice(harga) {
  const n = Number(harga);
  if (harga == null || isNaN(n) || n <= 0) return "Gratis";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    fetch(buildApiUrl(`/api/event/${id}`), { headers: defaultHeaders })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((data) => {
        const payload = data.data || data;
        setEvent(normalizeDetail(payload, id));
      })
      .catch(() => {
        setEvent(normalizeDetail(null, id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && event) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, event]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event?.title, url: window.location.href }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link disalin ke clipboard!");
    }
  };

  if (loading || !event) {
    return (
      <div className="edp-page page-fade-in">
        <NavbarCustom />
        <main className="edp-loading">
          <div className="edp-spinner" />
          Memuat detail event...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="edp-page page-fade-in">
      <NavbarCustom />

      <main key="loaded" className="edp-main page-animate-enter">

        {/* ── Hero ── */}
        <section className="edp-hero">
          <div
            className="edp-hero-bg"
            style={{ backgroundImage: `url(${event.foto_event_url})` }}
          />
          <div className="edp-hero-gradient" />

          <div className="container edp-hero-content">
            <button className="edp-back-btn" onClick={() => navigate("/events")}>
              <ArrowLeft size={16} /> Kembali ke Events
            </button>

            <h1 className="edp-hero-title">{event.title}</h1>

            <div className="edp-hero-badges">
              <span className="edp-badge-cat">
                <Tag size={13} /> {event.category}
              </span>
              <span className="edp-badge-org">
                <User size={15} style={{ color: "#c084fc" }} />
                Diselenggarakan oleh <strong>{event.organizer}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* ── Content ── */}
        <div className="container edp-grid">

          {/* Left column */}
          <div className="edp-left">
            {/* ... Poster, etc ... */}
            <div className="edp-photo-wrap">
              <img
                src={event.foto_event_url}
                alt={event.title}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
            </div>

            <div className="edp-panel">
              <div className="edp-highlights">
                <div className="edp-highlight-item">
                  <div className="edp-highlight-icon green">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="edp-highlight-label">Sertifikat</p>
                    <p className="edp-highlight-value">E-Certificate</p>
                  </div>
                </div>
                <div className="edp-highlight-item">
                  <div className="edp-highlight-icon blue">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="edp-highlight-label">Durasi Acara</p>
                    <p className="edp-highlight-value">± 4 Jam</p>
                  </div>
                </div>
                <div className="edp-highlight-item">
                  <div className="edp-highlight-icon amber">
                    <Info size={20} />
                  </div>
                  <div>
                    <p className="edp-highlight-label">Peserta</p>
                    <p className="edp-highlight-value">Umum</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="edp-section-title">
                  <Info size={18} /> Tentang Event
                </h3>
                <p className="edp-description">{event.description}</p>
              </div>

              <div className="edp-terms">
                <h3 className="edp-terms-title">
                  <AlertCircle size={16} /> Syarat &amp; Ketentuan
                </h3>
                <ul>
                  <li>Tiket yang sudah dibeli tidak dapat dikembalikan atau diuangkan (non-refundable).</li>
                  <li>E-Ticket dikirimkan melalui email dan tersedia di dashboard akun Anda.</li>
                  <li>Tunjukkan QR Code pada E-Ticket saat registrasi ulang di lokasi acara.</li>
                  <li>Penyelenggara berhak menolak masuk jika tiket terbukti palsu atau digandakan.</li>
                </ul>
              </div>

              <div>
                <h3 className="edp-section-title">
                  <Map size={18} /> Peta Lokasi
                </h3>
                <div className="edp-map-wrap">
                  <iframe
                    title="Peta Lokasi"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15823.450051264697!2d106.8060874!3d-6.5409214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69cbd29a065995%3A0x58135f8ecf78b1d8!2sTajur%2C%20Kabupaten%20Bogor%2C%20Jawa%20Barat%2C%20Indonesia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                    allowFullScreen=""
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="edp-sidebar">
            <div className="edp-ticket-card">
              <span className="edp-price-label">Harga Tiket Mulai</span>
              <div className="edp-price">{formatPrice(event.harga)}</div>

              <div className="edp-divider" />

              <div className="edp-info-rows">
                <div className="edp-info-row">
                  <div className="edp-info-icon">
                    <CalendarDays size={17} />
                  </div>
                  <div>
                    <p className="edp-info-label">Tanggal</p>
                    <p className="edp-info-value">{event.date}</p>
                  </div>
                </div>
                <div className="edp-info-row">
                  <div className="edp-info-icon">
                    <Clock size={17} />
                  </div>
                  <div>
                    <p className="edp-info-label">Waktu</p>
                    <p className="edp-info-value">{event.time}</p>
                  </div>
                </div>
                <div className="edp-info-row">
                  <div className="edp-info-icon">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <p className="edp-info-label">Lokasi</p>
                    <p className="edp-info-value">{event.location}</p>
                  </div>
                </div>
              </div>

              <button
                className="edp-cta-btn"
                onClick={() => navigate(`/events/${event.id}/ticket`)}
              >
                Daftar Sekarang
              </button>
            </div>

            <button className="edp-share-btn" onClick={handleShare}>
              <Share2 size={18} /> Bagikan Event Ini
            </button>
          </aside>
        </div>

      </main>

      <Footer />
    </div>
  );
}
