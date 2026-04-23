import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/EventsPage.css";
import "../styles/Footer.css";
import { Search, SlidersHorizontal, X, CalendarDays, MapPin, User, RefreshCw } from "lucide-react";
import { buildApiUrl, defaultHeaders } from "../utils/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80";

/** Parse date string to Date object for comparison */
function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(d);
  if (iso) {
    return new Date(d + (d.length <= 10 ? "T00:00:00" : ""));
  }
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const parts = d.split(/[\s,]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mi = months.indexOf(parts[1]);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && mi >= 0 && !isNaN(year)) {
      return new Date(year, mi, day, 0, 0, 0);
    }
  }
  return new Date(d);
}

function normalizeEvent(event) {
  return {
    id: event.id || event.id_event,
    title: event.title || event.nama_event || "Untitled Event",
    date: event.date || event.tanggal || "-",
    location: event.location || event.lokasi || "-",
    category: event.category || event.kategori?.nama_kategori || "Event",
    organizer: event.penyelenggara_name || event.organizer || "Panitia Event",
    description: event.description || event.deskripsi || "Deskripsi belum tersedia.",
    harga: event.harga ?? null,
    buttonLabel: event.buttonLabel || "Detail Event",
    foto_event_url: event.foto_event_url || (event.foto_event ? buildApiUrl(`/event/${event.foto_event}`) : FALLBACK_IMAGE),
  };
}

function formatPrice(harga) {
  const n = Number(harga);
  if (harga == null || isNaN(n) || n <= 0) return "Gratis";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("date");
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(buildApiUrl("/api/event"), { headers: defaultHeaders })
      .then((res) => res.json())
      .then((data) => {
        const list = (Array.isArray(data) ? data : data?.data || []).map(normalizeEvent);
        
        // Filter out past events
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const filtered = list.filter(ev => {
          const eventDate = parseEventDate(ev.date);
          return eventDate && eventDate >= now;
        });
        
        setEvents(filtered);
      })
      .catch(() => {
        setEvents([
          { id: 1, title: "Neon Night Music Festival Bandung", date: "22 Mar 2026", location: "Bandung, Jawa Barat", category: "Music & Festival", organizer: "Skyline Entertainment", harga: 180000, description: "Pengalaman musik terbaik tahun ini dengan artis-artis ternama.", foto_event_url: FALLBACK_IMAGE },
          { id: 2, title: "Success Free Career & Meditation Classes", date: "30 Mar 2026", location: "Online Webinar", category: "Business & Career", organizer: "Mindful Growth ID", harga: 0, description: "Kelas gratis pengembangan diri dan meditasi untuk kesuksesan karir.", foto_event_url: FALLBACK_IMAGE },
          { id: 3, title: "Digital Innovation Summit 2026", date: "05 Apr 2026", location: "Surabaya, Jawa Timur", category: "Conference", organizer: "TechVerse ID", harga: 250000, description: "Summit inovasi digital dengan pembicara-pembicara terkemuka.", foto_event_url: FALLBACK_IMAGE },
          { id: 4, title: "Creators Meetup: UI Motion Lab", date: "19 Apr 2026", location: "Yogyakarta, DIY", category: "Workshop", organizer: "MotionLab", harga: 75000, description: "Workshop teknik motion design dan UI animation.", foto_event_url: FALLBACK_IMAGE },
          { id: 5, title: "Indie Game Jam Weekend", date: "26 Apr 2026", location: "Online", category: "Game", organizer: "IndieHub", harga: 0, description: "Kompetisi game jam untuk developer indie selama 48 jam penuh.", foto_event_url: FALLBACK_IMAGE },
          { id: 6, title: "Lunar Arcade Showcase", date: "12 Apr 2026", location: "Jakarta, Indonesia", category: "Expo", organizer: "ArcadeWorks", harga: 120000, description: "Pameran arcade dan gaming terbesar dengan berbagai booth interaktif.", foto_event_url: FALLBACK_IMAGE },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));
    return ["Semua", ...uniq];
  }, [events]);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (selectedCategory !== "Semua") list = list.filter((e) => e.category === selectedCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (sortBy === "date" ? new Date(a.date) - new Date(b.date) : a.title.localeCompare(b.title)));
    return list;
  }, [events, selectedCategory, searchTerm, sortBy]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("Semua");
    setSortBy("date");
  };

  const hasActiveFilter = searchTerm || selectedCategory !== "Semua";

  return (
    <div className="ep-page page-fade-in">
      <NavbarCustom />

      <main className="ep-main">
        {/* ── Hero Banner ───────────────────────────────────── */}
        <section className="ep-hero">
          <div className="ep-hero-bg" />
          <div className="ep-hero-content container">
            <span className="ep-hero-badge">Semua Event</span>
            <h1 className="ep-hero-title">Temukan Event Impian Anda</h1>
            <p className="ep-hero-sub">
              Jelajahi ratusan event menarik dari berbagai kategori — konser, seminar, workshop, dan lebih banyak lagi.
            </p>
          </div>
        </section>

        {/* ── Filter Section ───────────────────────────────────── */}
        <section className="ep-filter-section">
          <div className="container">
            <div className="ep-filter-card">
              <div className="ep-filter-header">
                <div className="ep-filter-icon-box">
                  <Search size={24} color="white" />
                </div>
                <div className="ep-filter-title-group">
                  <h2 className="ep-filter-title">Cari & Filter Event</h2>
                  <p className="ep-filter-subtitle">Temukan event yang sesuai dengan preferensi Anda</p>
                </div>
              </div>

              <div className="ep-filter-grid">
                {/* Search */}
                <div className="ep-filter-field">
                  <label htmlFor="ep-search-input">Pencarian</label>
                  <div className="ep-input-group">
                    <Search size={18} className="ep-input-icon" />
                    <input
                      id="ep-search-input"
                      type="text"
                      placeholder="Cari event, lokasi, atau kategori..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="ep-filter-input"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="ep-filter-field">
                  <label htmlFor="ep-category-select">Kategori</label>
                  <div className="ep-input-group">
                    <select
                      id="ep-category-select"
                      className="ep-filter-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="Semua">Semua Kategori</option>
                      {categories.filter(c => c !== "Semua").map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sort */}
                <div className="ep-filter-field">
                  <label htmlFor="ep-sort-select">Urutkan</label>
                  <div className="ep-input-group">
                    <select
                      id="ep-sort-select"
                      className="ep-filter-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="date">Terdekat</option>
                      <option value="title">Judul A–Z</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ep-filter-footer">
                <div className="ep-filter-status">
                  <div className="ep-status-dot" />
                  <span>Menampilkan {filteredEvents.length} dari {events.length} event</span>
                </div>
                <button className="ep-filter-reset" onClick={handleReset}>
                  <RefreshCw size={16} />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Events Grid ───────────────────────────────────── */}
        <section className="ep-list-section">
          <div className="container">
            {loading ? (
              <div className="ep-loading">
                <div className="ep-spinner" />
                <p>Memuat event...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <>
                <p className="ep-count">{filteredEvents.length} event ditemukan</p>
                <div className="ep-grid">
                  {filteredEvents.map((event, idx) => (
                    <article
                      key={event.id}
                      className="ep-card"
                      style={{
                        "--delay": `${idx * 60}ms`,
                        animation: "epCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                        animationDelay: "var(--delay)",
                      }}
                    >
                      {/* Image */}
                      <div className="ep-card-img-wrap">
                        <img
                          src={event.foto_event_url}
                          alt={event.title}
                          className="ep-card-img"
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        />
                        <span className="ep-card-cat">{event.category}</span>
                        <span className="ep-card-price">{formatPrice(event.harga)}</span>
                      </div>

                      {/* Body */}
                      <div className="ep-card-body">
                        <h2 className="ep-card-title">{event.title}</h2>
                        <p className="ep-card-desc">{event.description}</p>

                        <div className="ep-card-meta">
                          <span className="ep-meta-item">
                            <CalendarDays size={13} className="ep-meta-icon" />
                            {event.date}
                          </span>
                          <span className="ep-meta-item">
                            <MapPin size={13} className="ep-meta-icon" />
                            {event.location}
                          </span>
                          <span className="ep-meta-item">
                            <User size={13} className="ep-meta-icon" />
                            {event.organizer}
                          </span>
                        </div>

                        <div className="ep-card-actions">
                          <button
                            type="button"
                            className="ep-btn ep-btn-share"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (navigator.share) {
                                navigator.share({ title: event.title, url: window.location.href + "/" + event.id }).catch(() => {});
                              } else {
                                alert("Link disalin ke clipboard!");
                                navigator.clipboard.writeText(window.location.href + "/" + event.id);
                              }
                            }}
                          >
                            Share
                          </button>

                          <button
                            type="button"
                            className="ep-btn ep-btn-primary"
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            Detail Event
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="ep-empty">
                <div className="ep-empty-icon">
                  <Search size={36} />
                </div>
                <h3>Tidak ada event ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau filter kategori Anda.</p>
                <button className="ep-empty-reset" onClick={handleReset}>Reset Filter</button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EventsPage;
