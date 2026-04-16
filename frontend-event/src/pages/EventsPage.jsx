import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/EventsPage.css";
import "../styles/Footer.css";
import { Search } from "lucide-react";
import { buildApiUrl, defaultHeaders } from "../utils/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80";

function normalizeEvent(event) {
  return {
    id: event.id || event.id_event,
    title: event.title || event.nama_event || "Untitled Event",
    date: event.date || event.tanggal || "-",
    location: event.location || event.lokasi || "-",
    category: event.category || "Event",
    organizer: event.organizer || "Panitia Event",
    description: event.description || event.deskripsi || "Deskripsi belum tersedia.",
    buttonLabel: event.buttonLabel || "Lihat Detail",
    foto_event_url: event.foto_event_url || (event.foto_event ? buildApiUrl(`/event/${event.foto_event}`) : FALLBACK_IMAGE),
  };
}

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("date");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Track window resize untuk responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch semua events
  useEffect(() => {
    setLoading(true);
    fetch(buildApiUrl("/api/event"), {
      headers: defaultHeaders
    })
      .then((res) => res.json())
      .then((data) => {
        const eventList = (Array.isArray(data) ? data : []).map(normalizeEvent);
        setEvents(eventList);
        setFilteredEvents(eventList);
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo data
        const demoEvents = [
          {
            id: 1,
            title: "Neon Night Music Festival Bandung",
            date: "22 Mar 2026",
            location: "Bandung, Jawa Barat",
            category: "Music & Festival",
            organizer: "Skyline Entertainment",
            buttonLabel: "Beli Tiket",
            description: "Pengalaman musik terbaik tahun ini dengan artis-artis ternama."
          },
          {
            id: 2,
            title: "Success Free Career & Meditation Classes",
            date: "30 Mar 2026",
            location: "Online Webinar",
            category: "Business & Career",
            organizer: "Mindful Growth ID",
            buttonLabel: "Daftar Sekarang",
            description: "Kelas gratis pengembangan diri dan meditasi untuk kesuksesan karir."
          },
          {
            id: 3,
            title: "Digital Innovation Summit 2026",
            date: "05 Apr 2026",
            location: "Surabaya, Jawa Timur",
            category: "Conference",
            organizer: "TechVerse ID",
            buttonLabel: "Beli Tiket",
            description: "Summit inovasi digital dengan pembicara-pembicara terkemuka dari industri teknologi."
          },
          {
            id: 4,
            title: "Creators Meetup: UI Motion Lab",
            date: "19 Apr 2026",
            location: "Yogyakarta, DIY",
            category: "Workshop",
            organizer: "MotionLab",
            buttonLabel: "Daftar Sekarang",
            description: "Workshop teknik motion design dan UI animation untuk creator profesional."
          },
          {
            id: 5,
            title: "Indie Game Jam Weekend",
            date: "26 Apr 2026",
            location: "Online",
            category: "Game",
            organizer: "IndieHub",
            buttonLabel: "Bergabung",
            description: "Kompetisi game jam untuk developer indie selama 48 jam penuh."
          },
          {
            id: 6,
            title: "Lunar Arcade Showcase",
            date: "12 Apr 2026",
            location: "Jakarta, Indonesia",
            category: "Expo",
            organizer: "ArcadeWorks",
            buttonLabel: "Beli Tiket",
            description: "Pameran arcade dan gaming terbesar dengan berbagai booth interaktif."
          },
          {
            id: 7,
            title: "Web Development Bootcamp",
            date: "14 Apr 2026",
            location: "Bandung, Jawa Barat",
            category: "Training",
            organizer: "CodeMaster Academy",
            buttonLabel: "Daftar Sekarang",
            description: "Bootcamp intensif 8 minggu untuk mempelajari web development modern."
          },
          {
            id: 8,
            title: "Design Thinking Workshop",
            date: "20 Apr 2026",
            location: "Jakarta, Indonesia",
            category: "Workshop",
            organizer: "Creative Studio ID",
            buttonLabel: "Daftar Sekarang",
            description: "Workshop design thinking untuk meningkatkan kreativitas dan problem solving."
          },
          {
            id: 9,
            title: "Startup Pitch Competition",
            date: "25 Apr 2026",
            location: "Jakarta, Indonesia",
            category: "Business",
            organizer: "Tech Founders Indonesia",
            buttonLabel: "Daftar Tim",
            description: "Kompetisi pitch untuk startup dengan hadiah investasi dan mentoring."
          },
        ];
        setEvents(demoEvents);
        setFilteredEvents(demoEvents);
        setLoading(false);
      });
  }, []);

  // Filter events berdasarkan search, category, dan sort
  useEffect(() => {
    let filtered = [...events];

    // Filter by category
    if (selectedCategory !== "Semua") {
      filtered = filtered.filter((event) => event.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.organizer.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query)
      );
    }

    // Sort events
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.date) - new Date(b.date);
      }
      return a.title.localeCompare(b.title);
    });

    setFilteredEvents(filtered);
  }, [searchTerm, selectedCategory, events, sortBy]);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(events.map((event) => event.category).filter(Boolean)));
    return ["Semua", ...uniq];
  }, [events]);


  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("Semua");
    setSortBy("date");
  };

  return (
    <div className="events-page">
      <NavbarCustom />

      <main className="events-main">
        {/* Hero Section */}
        <section className="events-hero" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
          <div className="container">
            <div className="events-hero-content">
              <h1 className="events-hero-title">Temukan Event Impian Anda</h1>
              <p className="events-hero-subtitle">
                Jelajahi ribuan event menarik dari berbagai kategori dan temukan yang paling sesuai dengan minat Anda
              </p>
            </div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="events-search-section" aria-label="Pencarian dan filter event">
          <div className="container">
            <div className="events-search-wrapper">
              <div className="events-search-card">
                <div className="search-card-header">
                  <h2>Cari & Filter Event</h2>
                  <p>Pilih kategori, urutkan, dan temukan event yang sesuai dengan minat Anda</p>
                </div>

                <div className="search-card-controls">
                  <div className="control-item">
                    <label htmlFor="searchInput">Pencarian</label>
                    <div className="events-search-bar">
                      <Search size={18} className="search-icon" aria-hidden="true" />
                      <input
                        id="searchInput"
                        type="text"
                        placeholder="Cari event, lokasi, atau organizer..."
                        className="events-search-input"
                        value={searchTerm}
                        onChange={handleSearch}
                        autoComplete="off"
                        inputMode="search"
                        spellCheck="false"
                        aria-label="Cari event"
                      />
                    </div>
                  </div>

                  <div className="control-item">
                    <label htmlFor="categorySelect">Kategori</label>
                    <select
                      id="categorySelect"
                      className="events-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      aria-label="Pilih kategori event"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "Semua" ? "Semua Kategori" : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="control-item">
                    <label htmlFor="sortSelect">Urutkan</label>
                    <select
                      id="sortSelect"
                      className="events-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Urutkan event"
                    >
                      <option value="date">Tanggal Terdekat</option>
                      <option value="title">Judul A-Z</option>
                    </select>
                  </div>
                </div>

                <div className="reset-wrapper">
                  <button onClick={handleReset} className="reset-button" type="button">
                    Reset Filter
                  </button>
                </div>


              </div>
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="events-list-section" aria-label="Daftar event">
          <div className="container">
            {loading ? (
              <div className="events-loading" role="status" aria-live="polite">
                <div className="spinner"></div>
                <p>Memuat event...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <>
                <div className="events-count" aria-label={`Menampilkan ${filteredEvents.length} event`}>
                  Menampilkan {filteredEvents.length} event
                </div>
                <div className="events-grid" role="list">
                  {filteredEvents.map((event, idx) => (
                    <article
                      key={event.id}
                      className="events-card"
                      role="listitem"
                      style={{
                        "--card-delay": `${100 + idx * 50}ms`,
                        animation: "cardFadeSlide 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards",
                        animationDelay: "var(--card-delay)",
                      }}
                    >
                      <div className="events-card-header">
                        <div className="events-card-image">
                          <img
                            src={event.foto_event_url}
                            alt={event.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                          <span className="events-card-badge">{event.category}</span>
                        </div>
                      </div>
                      <div className="events-card-body">
                        <h3 className="events-card-title">{event.title}</h3>
                        <p className="events-card-description">{event.description}</p>
                        
                        <div className="events-card-meta">
                          <div className="event-meta-item">
                            <span className="meta-icon">📅</span>
                            <span className="meta-text">{event.date}</span>
                          </div>
                          <div className="event-meta-item">
                            <span className="meta-icon">📍</span>
                            <span className="meta-text">{event.location}</span>
                          </div>
                          <div className="event-meta-item">
                            <span className="meta-icon">👤</span>
                            <span className="meta-text">{event.organizer}</span>
                          </div>
                        </div>

                        <div className="events-card-actions">
                          <button 
                            type="button" 
                            className="btn-event-primary"
                            onClick={() => navigate(`/events/${event.id}/ticket`)}
                            aria-label={`${event.buttonLabel || "Lihat Detail"} untuk ${event.title}`}
                          >
                            {event.buttonLabel || "Beli Tiket"}
                          </button>
                          <a 
                            href="#" 
                            className="btn-event-secondary"
                            aria-label={`Bagikan event: ${event.title}`}
                            onClick={(e) => e.preventDefault()}
                          >
                            Bagikan
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="events-empty">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>Tidak ada event ditemukan</h3>
                <p>Coba ubah filter atau kata kunci pencarian Anda</p>
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
