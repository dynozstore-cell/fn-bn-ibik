import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import "./styles/Footer.css";
import NavbarCustom from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { buildApiUrl } from "./utils/api";
import { CalendarDays, MapPin, User, Share2, Shield, Award, Activity, CheckCircle } from "lucide-react";

function formatPrice(harga) {
  const n = Number(harga);
  if (harga == null || isNaN(n) || n <= 0) return "Gratis";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80";

function slugHandle(text) {
  if (!text || typeof text !== "string") return "kesavent";
  const s = text.replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
  return s.slice(0, 24) || "kesavent";
}

function normalizeEvent(event) {
  const tanggal = event.tanggal || event.date || "-";
  const nama = event.nama_event || event.title || "Untitled Event";
  const orgLabel = event.organizer || event.kategori?.nama_kategori || "Panitia Event";
  return {
    ...event,
    id: event.id || event.id_event,
    nama_event: nama,
    title: nama,
    tanggal,
    date: tanggal,
    lokasi: event.lokasi || event.location || "-",
    organizer: orgLabel,
    handle: event.penyelenggara_handle || `@${slugHandle(orgLabel)}`,
    foto_event_url:
      event.foto_event_url ||
      (event.foto_event ? buildApiUrl(`/event/${event.foto_event}`) : FALLBACK_IMAGE),
  };
}

/** Parse date string "22 Mar 2026" atau "2026-03-22" ke Date (jam 09:00) */
function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(d);
  if (iso) {
    return new Date(d + (d.length <= 10 ? "T09:00:00" : ""));
  }
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const parts = d.split(/[\s,]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mi = months.indexOf(parts[1]);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && mi >= 0 && !isNaN(year)) {
      return new Date(year, mi, day, 9, 0, 0);
    }
  }
  return null;
}

function formatDateForDisplay(dateStr) {
  const d = parseEventDate(dateStr);
  if (!d) return dateStr || "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Hitung sisa waktu ke target (days, hours, minutes, seconds) */
function useCountdown(targetDate) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate || targetDate.getTime() <= Date.now()) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    const tick = () => {
      const now = Date.now();
      const end = targetDate.getTime();
      let diff = Math.max(0, Math.floor((end - now) / 1000));
      const seconds = diff % 60;
      diff = Math.floor(diff / 60);
      const minutes = diff % 60;
      diff = Math.floor(diff / 60);
      const hours = diff % 24;
      const days = Math.floor(diff / 24);
      setCountdown({ days, hours, minutes, seconds });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);

  return countdown;
}

function CountdownTimer({ targetDate }) {
  const countdown = useCountdown(targetDate);
  return (
    <div className="countdown-boxes">
      <div className="countdown-box">
        <span className="countdown-num">{String(countdown.days).padStart(2, "0")}</span>
        <span className="countdown-unit">hari</span>
      </div>
      <div className="countdown-box">
        <span className="countdown-num">{String(countdown.hours).padStart(2, "0")}</span>
        <span className="countdown-unit">jam</span>
      </div>
      <div className="countdown-box">
        <span className="countdown-num">{String(countdown.minutes).padStart(2, "0")}</span>
        <span className="countdown-unit">menit</span>
      </div>
      <div className="countdown-box">
        <span className="countdown-num">{String(countdown.seconds).padStart(2, "0")}</span>
        <span className="countdown-unit">detik</span>
      </div>
    </div>
  );
}

const HERO_CARDS_FALLBACK = [
  {
    id: "h1",
    title: "Neon Night Festival",
    price: "Rp180rb",
    handle: "@skylineent",
    gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    imageUrl: null,
  },
  {
    id: "h2",
    title: "Digital Summit 2026",
    price: "Rp250rb",
    handle: "@techverse",
    gradient: "linear-gradient(135deg, #5b21b6, #8b5cf6)",
    imageUrl: null,
  },
  {
    id: "h3",
    title: "Career & Meditation",
    price: "Gratis",
    handle: "@mindfulid",
    gradient: "linear-gradient(135deg, #6d28d9, #a78bfa)",
    imageUrl: null,
  },
];

function formatHeroPrice(harga) {
  const n = Number(harga);
  if (Number.isNaN(n) || n <= 0) return "Gratis";
  return `Rp${n.toLocaleString("id-ID")}`;
}

/**  event terbaru dari backend; slot kosong diisi fallback agar tetap 3 kartu (layout sama) */
function padHeroCardsToThree(fromApi) {
  if (fromApi.length >= 3) return fromApi.slice(0, 3);
  const out = [...fromApi];
  let fi = 0;
  while (out.length < 3) {
    const base = HERO_CARDS_FALLBACK[fi % HERO_CARDS_FALLBACK.length];
    out.push({
      ...base,
      id: `hero-fallback-${fi}-${out.length}`,
    });
    fi += 1;
  }
  return out;
}

function buildHeroCardsFromEvents(events) {
  const gradients = HERO_CARDS_FALLBACK.map((c) => c.gradient);
  if (!events.length) return HERO_CARDS_FALLBACK;

  const sorted = [...events].sort((a, b) => {
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (cb !== ca) return cb - ca;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  const fromApi = sorted.slice(0, 3).map((ev, i) => {
    const hasPhoto = Boolean(ev.foto_event && String(ev.foto_event).length > 0);
    return {
      id: `hero-${ev.id}`,
      title: ev.nama_event || ev.title || "Event",
      price: formatHeroPrice(ev.harga),
      handle: ev.handle || `@${slugHandle(ev.organizer || ev.kategori?.nama_kategori || "event")}`,
      gradient: gradients[i % gradients.length],
      imageUrl: hasPhoto ? ev.foto_event_url || null : null,
    };
  });

  return padHeroCardsToThree(fromApi);
}

const DEFAULT_NEAREST_EVENT = {
  id: 0,
  title: "Neon Night Music Festival Bandung",
  date: "22 Mar 2026",
  location: "Bandung, Jawa Barat",
  category: "Music & Festival",
  organizer: "Skyline Entertainment",
  handle: "@skylineent",
  imageGradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
};

const DEMO_LATEST_EVENTS = [
  {
    id: "demo-1",
    title: "Lunar Arcade Showcase",
    date: "12 Apr 2026",
    location: "Jakarta, Indonesia",
    category: "Expo",
    organizer: "ArcadeWorks",
    imageGradient: "linear-gradient(135deg, #06b6d4, #6366f1)",
  },
  {
    id: "demo-2",
    title: "Neon Night Music Festival",
    date: "22 Mar 2026",
    location: "Bandung, Jawa Barat",
    category: "Music & Festival",
    organizer: "Skyline Entertainment",
    imageGradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
  },
  {
    id: "demo-3",
    title: "Digital Innovation Summit 2026",
    date: "05 Apr 2026",
    location: "Surabaya, Jawa Timur",
    category: "Conference",
    organizer: "TechVerse ID",
    imageGradient: "linear-gradient(135deg, #0ea5e9, #22c55e)",
  },
  {
    id: "demo-4",
    title: "Creators Meetup: UI Motion Lab",
    date: "19 Apr 2026",
    location: "Yogyakarta, DIY",
    category: "Workshop",
    organizer: "MotionLab",
    imageGradient: "linear-gradient(135deg, #f97316, #fb7185)",
  },
  {
    id: "demo-5",
    title: "Indie Game Jam Weekend",
    date: "26 Apr 2026",
    location: "Online",
    category: "Game",
    organizer: "IndieHub",
    imageGradient: "linear-gradient(135deg, #22c55e, #a3e635)",
  },
  {
    id: "demo-6",
    title: "Career & Meditation Classes",
    date: "30 Mar 2026",
    location: "Online Webinar",
    category: "Business & Career",
    organizer: "Mindful Growth ID",
    imageGradient: "linear-gradient(135deg, #a855f7, #c084fc)",
  },
];

/** Fallback jika belum ada data dari API (isi + eventId null untuk CTA ke katalog) */
const BANNER_CAROUSEL_FALLBACK = [
  {
    id: "banner-1",
    eventId: null,
    title: "Neon Night Music Festival",
    subtitle: "Pengalaman musik terbaik tahun ini",
    date: "22 MAR 2026",
    image: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    foto_event_url: null,
  },
  {
    id: "banner-2",
    eventId: null,
    title: "Digital Innovation Summit",
    subtitle: "Networking dengan para pemimpin teknologi",
    date: "05 APR 2026",
    image: "linear-gradient(135deg, #0ea5e9, #22c55e)",
    foto_event_url: null,
  },
  {
    id: "banner-3",
    eventId: null,
    title: "Creative Workshop Intensive",
    subtitle: "Tingkatkan skill kreatif Anda bersama expert",
    date: "19 APR 2026",
    image: "linear-gradient(135deg, #f97316, #fb7185)",
    foto_event_url: null,
  },
  {
    id: "banner-4",
    eventId: null,
    title: "Gaming Festival 2026",
    subtitle: "Kompetisi game terbesar se-Indonesia",
    date: "26 APR 2026",
    image: "linear-gradient(135deg, #22c55e, #a3e635)",
    foto_event_url: null,
  },
  {
    id: "banner-5",
    eventId: null,
    title: "Business & Career Fair",
    subtitle: "Cari peluang karir impian Anda",
    date: "30 MAR 2026",
    image: "linear-gradient(135deg, #a855f7, #c084fc)",
    foto_event_url: null,
  },
  {
    id: "banner-6",
    eventId: null,
    title: "Tech Expo Indonesia",
    subtitle: "Showcase inovasi teknologi terdepan",
    date: "12 APR 2026",
    image: "linear-gradient(135deg, #06b6d4, #6366f1)",
    foto_event_url: null,
  },
];

function truncateBannerText(text, max = 130) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Slides banner dari event Laravel: terbaru = created_at / id, maksimal 8 slide */
function buildBannerSlidesFromEvents(events) {
  const gradients = BANNER_CAROUSEL_FALLBACK.map((b) => b.image);
  if (!events.length) return BANNER_CAROUSEL_FALLBACK;

  const sorted = [...events].sort((a, b) => {
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (cb !== ca) return cb - ca;
    const ida = Number(a.id) || 0;
    const idb = Number(b.id) || 0;
    return idb - ida;
  });

  return sorted.slice(0, 8).map((ev, i) => {
    const rawDesc = (ev.deskripsi || "").trim();
    const subtitle = rawDesc
      ? truncateBannerText(rawDesc)
      : ev.lokasi || ev.category || "Lihat detail dan tiket event ini.";
    const d = parseEventDate(ev.tanggal || ev.date);
    const dateBadge = d
      ? d
        .toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        .toUpperCase()
      : String(ev.tanggal || "").toUpperCase();
    return {
      id: `banner-${ev.id}`,
      eventId: ev.id,
      title: ev.nama_event || ev.title || "Event",
      subtitle,
      date: dateBadge,
      image: gradients[i % gradients.length],
      foto_event_url: ev.foto_event_url || null,
    };
  });
}

const NEWS_DATA = [
  {

    id: "news-1",
    title: "5 Tren Event Technology 2026 yang Wajib Diketahui",
    date: "31 Mar 2026",
    category: "Technology",
    source: "EventNews",
    excerpt: "Teknologi event terus berkembang dengan inovasi-inovasi terbaru. Pelajari 5 tren utama yang akan mendominasi industri event tahun ini.",
    content: "Dalam artikel mendalam ini, kami mengeksplorasi dampak AI, VR, dan blockchain dalam industri event. Dari virtual venue hingga smart ticketing, pelajari cara teknologi mengubah cara orang mengalami live events.",
    image: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    id: "news-2",
    title: "Panduan Cara Memilih Event yang Tepat untuk Anda",
    date: "30 Mar 2026",
    category: "Tips & Tricks",
    source: "KESAVENT Magazine",
    excerpt: "Memilih event yang sesuai dengan minat dan kebutuhan penting untuk pengalaman terbaik.",
    content: "Tidak semua event cocok untuk semua orang. Guide lengkap ini membantu Anda menemukan event yang sempurna, mulai dari musik, konferensi, hingga workshop networking.",
    image: "linear-gradient(135deg, #f093fb, #f5576c)",
  },
  {
    id: "news-3",
    title: "Cerita Sukses: Dari Peserta Event hingga Menjadi Entrepreneur",
    date: "29 Mar 2026",
    category: "Inspirasi",
    source: "KESAVENT Stories",
    excerpt: "Temui kisah inspiratif dari peserta event yang berhasil mengubah kehidupan mereka.",
    content: "Melalui networking dan pembelajaran di event, banyak individu yang menemukan peluang bisnis mereka. Baca cerita lengkap dari berbagai entrepreneur sukses yang dimulai dari event.",
    image: "linear-gradient(135deg, #4facfe, #00f2fe)",
  },
  {
    id: "news-4",
    title: "Event Online vs Offline: Mana yang Lebih Baik?",
    date: "28 Mar 2026",
    category: "Analysis",
    source: "Event Research",
    excerpt: "Analisis mendalam tentang kelebihan dan kekurangan event online dan offline.",
    content: "Setelah pandemi, hybrid event menjadi format populer. Bandingkan pengalaman, networking, dan ROI antara format online, offline, dan hybrid untuk memilih yang terbaik untuk kebutuhan Anda.",
    image: "linear-gradient(135deg, #fa709a, #fee140)",
  },
  {
    id: "news-5",
    title: "Sponsorship Event: Cara Efektif Mempromosikan Brand",
    date: "27 Mar 2026",
    category: "Business",
    source: "Marketing Insights",
    excerpt: "Strategi sponsorship yang tepat dapat meningkatkan visibilitas brand secara eksponensial.",
    content: "Belajar cara memilih event yang tepat untuk sponsor, mengukur ROI, dan memaksimalkan impact dari investasi sponsorship Anda.",
    image: "linear-gradient(135deg, #a8edea, #fed6e3)",
  },
  {
    id: "news-6",
    title: "Networking Tips di Event: Bangun Koneksi yang Bermakna",
    date: "26 Mar 2026",
    category: "Tips & Tricks",
    source: "Professional Tips",
    excerpt: "Networking adalah salah satu nilai terbesar dari menghadiri event. Pelajari cara membangun hubungan profesional.",
    content: "Tips praktis untuk memulai percakapan, membuat kesan pertama yang baik, dan melanjutkan hubungan setelah event berakhir.",
    image: "linear-gradient(135deg, #ff9a56, #ff6a91)",
  },
];

const GRADIENT_COLORS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a8edea, #fed6e3)",
  "linear-gradient(135deg, #ff9a56, #ff6a91)",
  "linear-gradient(135deg, #06b6d4, #6366f1)",
  "linear-gradient(135deg, #22c55e, #a3e635)",
];

/** Transform berita dari API ke format NEWS_DATA */
function transformBeritaToNews(beritaList) {
  if (!beritaList || beritaList.length === 0) return NEWS_DATA;

  return beritaList.map((berita, index) => ({
    id: `berita-${berita.id}`,
    title: berita.judul || "Berita",
    date: berita.tanggal ? new Date(berita.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
    category: berita.kategori?.nama_kategori || "General",
    source: berita.sumber || "KESAVENT",
    excerpt: berita.ringkasan || "",
    content: berita.konten || "",
    image: berita.gambar || GRADIENT_COLORS[index % GRADIENT_COLORS.length],
    link: berita.sumber || null,
  }));
}

export default function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [heroHeader, setHeroHeader] = useState({
    title: 'Temukan Event Luar Biasa & Tiket Eksklusif.',
    subtitle: 'Daftar dan beli tiket event favorit Anda — konser, seminar, workshop — dari berbagai organizer terpercaya dalam satu platform.'
  });
  const [customBanners, setCustomBanners] = useState([]);
  const [customHeroCards, setCustomHeroCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestEvents, setLatestEvents] = useState([]);
  const [activeLatestIdx, setActiveLatestIdx] = useState(0);
  const [showAllFeaturedEvents, setShowAllFeaturedEvents] = useState(false);
  const latestRowRef = useRef(null);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Banner Carousel State
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const bannerRowRef = useRef(null);
  const isBannerPausedRef = useRef(false);
  const isBannerDraggingRef = useRef(false);
  const bannerStartXRef = useRef(0);
  const bannerScrollLeftRef = useRef(0);

  // News Section State
  const [selectedNewsIdx, setSelectedNewsIdx] = useState(0);
  const [showNewsDetail, setShowNewsDetail] = useState(false);
  const newsCarouselRef = useRef(null);
  const isNewsDraggingRef = useRef(false);
  const isNewsPausedRef = useRef(false);
  const newsStartXRef = useRef(0);
  const newsScrollLeftRef = useRef(0);


  const latestList = useMemo(() => {
    const list = latestEvents.length ? latestEvents : events;
    const normalized = Array.isArray(list) ? list : [];
    return normalized.length ? normalized : DEMO_LATEST_EVENTS;
  }, [events, latestEvents]);

  const transformedNews = useMemo(() => {
    const result = transformBeritaToNews(newsData);
    console.log('transformedNews computed - newsData length:', newsData.length, 'transformedNews length:', result.length);
    return result;
  }, [newsData]);

  const newsLoopList = useMemo(() => {
    if (!transformedNews.length) return [];
    // Jika berita kurang dari 3, tidak perlu duplikasi (infinite loop tidak aktif)
    if (transformedNews.length < 3) return transformedNews;
    // Duplikasi 3x untuk kelancaran infinite scroll jika data banyak
    return [...transformedNews, ...transformedNews, ...transformedNews];
  }, [transformedNews]);

  // News Autoplay
  const ensureNewsInMiddleLoop = () => {
    const el = newsCarouselRef.current;
    if (!el || !transformedNews.length) return;
    const len = transformedNews.length;

    const first = el.querySelector(".news-preview-card");
    if (!first) return;

    const cardW = first.offsetWidth;
    const gap = 16;
    const cycle = (cardW + gap) * len;
    const x = el.scrollLeft;

    if (x < cycle * 0.5 || x > cycle * 1.5) {
      const centerX = x + el.offsetWidth / 2;
      const cardIdx = Math.round((centerX - cardW / 2) / (cardW + gap));
      const realIdx = ((cardIdx % len) + len) % len;
      const targetScroll = (realIdx + len) * (cardW + gap) - el.offsetWidth / 2 + cardW / 2;

      el.style.scrollBehavior = "auto";
      el.scrollLeft = targetScroll;
      requestAnimationFrame(() => {
        el.style.scrollBehavior = "";
      });
      setSelectedNewsIdx(realIdx + len);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isNewsPausedRef.current || isNewsDraggingRef.current || showNewsDetail || !transformedNews.length) return;

      const el = newsCarouselRef.current;
      if (!el) return;

      const len = transformedNews.length;
      if (len < 3) return; // Tidak perlu autoplay loop jika berita sedikit

      let nextIdx = selectedNewsIdx + 1;
      // Reset ke tengah jika sudah di akhir loop ketiga
      if (nextIdx >= len * 3) {
        nextIdx = len;
      }
      setSelectedNewsIdx(nextIdx);

      const cards = el.querySelectorAll(".news-preview-card");
      const card = cards[nextIdx];
      if (card) {
        el.scrollTo({
          left: card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2,
          behavior: "smooth"
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedNewsIdx, transformedNews.length, showNewsDetail]);

  const scrollNewsManual = (dir) => {
    const el = newsCarouselRef.current;
    if (!el || !transformedNews.length) return;

    isNewsPausedRef.current = true;
    const len = transformedNews.length;
    if (len < 3) {
      // Logic sederhana jika berita sedikit
      let nextIdx = selectedNewsIdx + dir;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= len) nextIdx = len - 1;
      setSelectedNewsIdx(nextIdx);
    } else {
      let nextIdx = selectedNewsIdx + dir;
      // Handle bounds untuk loop
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= len * 3) nextIdx = len * 3 - 1;
      setSelectedNewsIdx(nextIdx);
    }

    const cards = el.querySelectorAll(".news-preview-card");
    const card = cards[nextIdx];
    if (card) {
      el.scrollTo({
        left: card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2,
        behavior: "smooth"
      });
    }

    // Resume after 5 seconds
    setTimeout(() => {
      isNewsPausedRef.current = false;
    }, 5000);
  };

  // 3x loop untuk infinite scroll (6 card asli x 3 = 18 card)
  const latestLoopList = useMemo(() => {
    if (!latestList.length) return [];
    const sixCards = latestList.slice(0, 6);
    return [...sixCards, ...sixCards, ...sixCards];
  }, [latestList]);

  /** Event dengan tanggal > sekarang, urut dari yang paling dekat (nyambung ke kolom tanggal di DB) */
  const upcomingEvents = useMemo(() => {
    if (!events.length) return [];
    const now = new Date();
    return events
      .map((e) => ({ ...e, parsed: parseEventDate(e.tanggal || e.date) }))
      .filter((e) => e.parsed && e.parsed.getTime() > now.getTime())
      .sort((a, b) => a.parsed - b.parsed)
      .slice(0, 4);
  }, [events]);

  const [upcomingCarouselIdx, setUpcomingCarouselIdx] = useState(0);

  useEffect(() => {
    setUpcomingCarouselIdx(0);
  }, [upcomingEvents.map((e) => e.id).join(",")]);

  useEffect(() => {
    if (upcomingCarouselIdx >= upcomingEvents.length && upcomingEvents.length > 0) {
      setUpcomingCarouselIdx(0);
    }
  }, [upcomingEvents.length, upcomingCarouselIdx]);

  const activeUpcoming =
    upcomingEvents.length > 0
      ? upcomingEvents[Math.min(upcomingCarouselIdx, upcomingEvents.length - 1)]
      : null;

  const countdownDisplay = useMemo(() => {
    if (activeUpcoming) {
      return {
        ...activeUpcoming,
        dateLabel: formatDateForDisplay(activeUpcoming.tanggal || activeUpcoming.date),
        imageGradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
      };
    }
    if (!events.length) {
      return {
        ...DEFAULT_NEAREST_EVENT,
        tanggal: DEFAULT_NEAREST_EVENT.date,
        date: DEFAULT_NEAREST_EVENT.date,
        dateLabel: DEFAULT_NEAREST_EVENT.date,
        foto_event_url: null,
        id: null,
      };
    }
    return null;
  }, [activeUpcoming, events.length]);

  const targetDate = useMemo(
    () => (countdownDisplay ? parseEventDate(countdownDisplay.tanggal || countdownDisplay.date) : null),
    [countdownDisplay]
  );
  const countdown = useCountdown(targetDate);

  const shiftUpcoming = useCallback((dir) => {
    if (upcomingEvents.length <= 1) return;
    setUpcomingCarouselIdx((i) => (i + dir + upcomingEvents.length) % upcomingEvents.length);
  }, [upcomingEvents.length]);

  // Autoplay Upcoming Countdown
  const isUpcomingPausedRef = useRef(false);
  useEffect(() => {
    if (upcomingEvents.length <= 1) return;
    const interval = setInterval(() => {
      if (isUpcomingPausedRef.current) return;
      shiftUpcoming(1);
    }, 6000); // 6 detik per event mendatang
    return () => clearInterval(interval);
  }, [upcomingEvents.length, shiftUpcoming]);

  const bannerCarouselList = useMemo(() => {
    if (customBanners.length > 0) return customBanners;
    return buildBannerSlidesFromEvents(events);
  }, [events, customBanners]);

  const heroCards = useMemo(() => {
    if (customHeroCards.length > 0) return customHeroCards;
    return buildHeroCardsFromEvents(events);
  }, [events, customHeroCards]);

  useEffect(() => {
    Promise.all([
      fetch(buildApiUrl("/api/event"))
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((data) => {
          const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
          const mapped = list.map(normalizeEvent);
          
          // Filter out past events (show only today or future)
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const filtered = mapped.filter(ev => {
            const eventDate = parseEventDate(ev.tanggal || ev.date);
            return eventDate && eventDate >= now;
          });
          
          setEvents(filtered);
          setLatestEvents(filtered);
        })
        .catch(() => {}),

      fetch(buildApiUrl("/api/berita"))
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setNewsData(data))
        .catch(() => setNewsData([])),

      fetch(buildApiUrl("/api/settings"))
        .then((res) => (res.ok ? res.json() : {}))
        .then((data) => {
          if (data.homepage_hero_header) setHeroHeader(data.homepage_hero_header);
          if (data.homepage_banners) setCustomBanners(data.homepage_banners);
          if (data.homepage_hero_cards) setCustomHeroCards(data.homepage_hero_cards);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!latestEvents.length && events.length) setLatestEvents(events);
  }, [events, latestEvents.length]);

  // Scroll ke index tertentu (smooth)
  const scrollToIdx = (idx) => {
    const el = latestRowRef.current;
    if (!el) return;
    const cards = el.querySelectorAll(".latest-card");
    const card = cards[idx];
    if (!card) return;

    el.scrollTo({
      left: card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2,
      behavior: "smooth",
    });
  };

  // Geser ke arah tertentu
  const scrollLatest = (dir) => {
    const len = 6; // 6 card asli
    if (len === 0) return;

    let newIdx = activeLatestIdx + dir;

    // Jika mendekati ujung, jump ke tengah
    if (newIdx < len || newIdx >= len * 2) {
      const realIdx = ((newIdx % len) + len) % len;
      const jumpIdx = realIdx + len;
      const el = latestRowRef.current;
      if (el) {
        const cards = el.querySelectorAll(".latest-card");
        const card = cards[jumpIdx];
        if (card) {
          el.style.scrollBehavior = "auto";
          el.scrollLeft = card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2;
          requestAnimationFrame(() => {
            el.style.scrollBehavior = "";
            setActiveLatestIdx(jumpIdx);
          });
          return;
        }
      }
    }

    scrollToIdx(newIdx);
    setActiveLatestIdx(newIdx);
  };

  // Click pada card
  const handleCardClick = (idx) => {
    if (isDraggingRef.current) return; // Abaikan click jika sedang drag
    const len = 6;
    const realIdx = ((idx % len) + len) % len;
    const targetIdx = realIdx + len;
    scrollToIdx(targetIdx);
    setActiveLatestIdx(targetIdx);
  };

  // Ensure scroll position is in middle loop (seamless infinite)
  const ensureLatestInMiddleLoop = () => {
    const el = latestRowRef.current;
    if (!el) return;
    const len = 6;

    const first = el.querySelector(".latest-card");
    if (!first) return;

    const cardW = first.offsetWidth;
    const gap = 12;
    const cycle = (cardW + gap) * len;
    const x = el.scrollLeft;

    // Range aman: cycle * 0.5 sampai cycle * 1.5
    const minSafe = cycle * 0.5;
    const maxSafe = cycle * 1.5;

    if (x < minSafe || x > maxSafe) {
      // Hitung card mana yang paling dekat dengan center
      const centerX = x + el.offsetWidth / 2;
      const cardIdx = Math.round((centerX - cardW / 2) / (cardW + gap));
      const realIdx = ((cardIdx % len) + len) % len;

      // Jump instant ke copy tengah
      const targetScroll = (realIdx + len) * (cardW + gap) - el.offsetWidth / 2 + cardW / 2;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = targetScroll;
      requestAnimationFrame(() => {
        el.style.scrollBehavior = "";
      });
      setActiveLatestIdx(realIdx + len);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    const el = latestRowRef.current;
    if (!el) return;
    isDraggingRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    const el = latestRowRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Kecepatan drag
    if (Math.abs(walk) > 5) {
      isDraggingRef.current = true;
      isPausedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    const el = latestRowRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    el.style.userSelect = "";
    setTimeout(() => {
      isDraggingRef.current = false;
      isPausedRef.current = false;
      ensureLatestInMiddleLoop();
    }, 100);
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    if (isDraggingRef.current) {
      handleMouseUp();
    }
  };

  const handleShare = (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      navigator.share({
        title: event.nama_event,
        text: `Check out this event: ${event.nama_event}`,
        url: url,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link disalin ke clipboard!");
    }
  };

  // Initialize: set posisi awal ke copy tengah (card pertama)
  useEffect(() => {
    const el = latestRowRef.current;
    if (!el || !latestLoopList.length) return;

    const timer = setTimeout(() => {
      const len = 6;
      scrollToIdx(len); // Index 6 = card pertama di copy tengah
      setActiveLatestIdx(len);
    }, 100);

    return () => clearTimeout(timer);
  }, [latestLoopList.length]);

  // News Initialize: start in middle loop
  useEffect(() => {
    const el = newsCarouselRef.current;
    if (!el || !newsLoopList.length) return;

    const timer = setTimeout(() => {
      const len = newsData.length;
      if (len === 0) return;

      if (len < 3) {
        // Jika berita sedikit, tampilkan dari index 0
        setSelectedNewsIdx(0);
        el.style.scrollBehavior = "auto";
        el.scrollLeft = 0;
      } else {
        const cards = el.querySelectorAll(".news-preview-card");
        const card = cards[len];
        if (card) {
          el.style.scrollBehavior = "auto";
          el.scrollLeft = card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2;
          setSelectedNewsIdx(len);
        }
      }
      requestAnimationFrame(() => {
        el.style.scrollBehavior = "";
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [newsLoopList.length]);

  // Scroll event listener untuk ensureLatestInMiddleLoop & ensureNewsInMiddleLoop
  useEffect(() => {
    const elLatest = latestRowRef.current;
    const elNews = newsCarouselRef.current;

    let latestTimer = null;
    let newsTimer = null;

    const onScrollLatest = () => {
      if (latestTimer) clearTimeout(latestTimer);
      latestTimer = setTimeout(() => {
        if (!isDraggingRef.current) ensureLatestInMiddleLoop();
      }, 150);
    };

    const onScrollNews = () => {
      if (newsTimer) clearTimeout(newsTimer);
      newsTimer = setTimeout(() => {
        if (!isNewsDraggingRef.current) ensureNewsInMiddleLoop();

        // Update selectedNewsIdx based on scroll position for dots
        const el = newsCarouselRef.current;
        if (el && transformedNews.length > 0) {
          const cards = el.querySelectorAll(".news-preview-card");
          if (cards.length > 0) {
            const centerX = el.scrollLeft + el.offsetWidth / 2;
            let closestIdx = 0;
            let minDiff = Infinity;

            cards.forEach((card, idx) => {
              const cardCenter = card.offsetLeft + card.offsetWidth / 2;
              const diff = Math.abs(centerX - cardCenter);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
              }
            });

            setSelectedNewsIdx(closestIdx);
          }
        }
      }, 150);
    };

    if (elLatest) elLatest.addEventListener("scroll", onScrollLatest, { passive: true });
    if (elNews) elNews.addEventListener("scroll", onScrollNews, { passive: true });

    return () => {
      if (elLatest) elLatest.removeEventListener("scroll", onScrollLatest);
      if (elNews) elNews.removeEventListener("scroll", onScrollNews);
      if (latestTimer) clearTimeout(latestTimer);
      if (newsTimer) clearTimeout(newsTimer);
    };
  }, [newsData.length]);

  // Autoplay dengan infinite loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      scrollLatest(1);
    }, 2500);

    return () => clearInterval(interval);
  }, [activeLatestIdx, latestLoopList.length]);

  // Banner Carousel Handlers
  const scrollBannerToIdx = (idx) => {
    const el = bannerRowRef.current;
    if (!el) return;
    const banners = el.querySelectorAll(".banner-slide");
    const banner = banners[idx];
    if (!banner) return;

    el.scrollTo({
      left: banner.offsetLeft - el.offsetWidth / 2 + banner.offsetWidth / 2,
      behavior: "smooth",
    });
  };

  const scrollBanner = (dir) => {
    const len = bannerCarouselList.length;
    if (len === 0) return;

    let newIdx = activeBannerIdx + dir;

    if (newIdx < len || newIdx >= len * 2) {
      const realIdx = ((newIdx % len) + len) % len;
      const jumpIdx = realIdx + len;
      const el = bannerRowRef.current;
      if (el) {
        const banners = el.querySelectorAll(".banner-slide");
        const banner = banners[jumpIdx];
        if (banner) {
          el.style.scrollBehavior = "auto";
          el.scrollLeft = banner.offsetLeft - el.offsetWidth / 2 + banner.offsetWidth / 2;
          requestAnimationFrame(() => {
            el.style.scrollBehavior = "";
            setActiveBannerIdx(jumpIdx);
          });
          return;
        }
      }
    }

    scrollBannerToIdx(newIdx);
    setActiveBannerIdx(newIdx);
  };

  const handleBannerSlideClick = (idx) => {
    if (isBannerDraggingRef.current) return;
    const len = bannerCarouselList.length;
    const realIdx = ((idx % len) + len) % len;
    const targetIdx = realIdx + len;
    scrollBannerToIdx(targetIdx);
    setActiveBannerIdx(targetIdx);
  };

  const ensureBannerInMiddleLoop = () => {
    const el = bannerRowRef.current;
    if (!el) return;
    const len = bannerCarouselList.length;

    const first = el.querySelector(".banner-slide");
    if (!first) return;

    const slideW = first.offsetWidth;
    const gap = 16;
    const cycle = (slideW + gap) * len;
    const x = el.scrollLeft;

    const minSafe = cycle * 0.5;
    const maxSafe = cycle * 1.5;

    if (x < minSafe || x > maxSafe) {
      const centerX = x + el.offsetWidth / 2;
      const slideIdx = Math.round((centerX - slideW / 2) / (slideW + gap));
      const realIdx = ((slideIdx % len) + len) % len;

      const targetScroll = (realIdx + len) * (slideW + gap) - el.offsetWidth / 2 + slideW / 2;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = targetScroll;
      requestAnimationFrame(() => {
        el.style.scrollBehavior = "";
      });
      setActiveBannerIdx(realIdx + len);
    }
  };

  const handleBannerMouseDown = (e) => {
    const el = bannerRowRef.current;
    if (!el) return;
    isBannerDraggingRef.current = false;
    bannerStartXRef.current = e.pageX - el.offsetLeft;
    bannerScrollLeftRef.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const handleBannerMouseMove = (e) => {
    const el = bannerRowRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - bannerStartXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      isBannerDraggingRef.current = true;
      isBannerPausedRef.current = true;
    }
    el.scrollLeft = bannerScrollLeftRef.current - walk;
  };

  const handleBannerMouseUp = () => {
    const el = bannerRowRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    el.style.userSelect = "";
    setTimeout(() => {
      isBannerDraggingRef.current = false;
      isBannerPausedRef.current = false;
      ensureBannerInMiddleLoop();
    }, 100);
  };

  const handleBannerMouseLeave = () => {
    isBannerPausedRef.current = false;
    if (isBannerDraggingRef.current) {
      handleBannerMouseUp();
    }
  };

  // Banner Carousel: Initialize middle position (ulang saat daftar slide dari API berubah)
  useEffect(() => {
    const el = bannerRowRef.current;
    if (!el || !bannerCarouselList.length) return;

    const timer = setTimeout(() => {
      const len = bannerCarouselList.length;
      scrollBannerToIdx(len);
      setActiveBannerIdx(len);
    }, 100);

    return () => clearTimeout(timer);
  }, [bannerCarouselList.length, bannerCarouselList.map((b) => b.id).join(",")]);

  // Banner Carousel: Scroll event listener
  useEffect(() => {
    const el = bannerRowRef.current;
    if (!el) return;

    let scrollTimer = null;
    const onScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!isBannerDraggingRef.current) {
          ensureBannerInMiddleLoop();
        }
      }, 150);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // Banner Carousel: Autoplay
  useEffect(() => {
    if (!bannerCarouselList.length) return undefined;
    const interval = setInterval(() => {
      if (isBannerPausedRef.current) return;
      scrollBanner(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBannerIdx, bannerCarouselList.length]);

  return (
    <div className="page flacto-style page-fade-in">
      <NavbarCustom />

      <main>
        <section className="hero flacto-hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="hero-content">
              <h1 
                className="hero-title"
                dangerouslySetInnerHTML={{ __html: heroHeader.title.replace(/\n/g, '<br />') }}
              />
              <p className="hero-subtitle">
                {heroHeader.subtitle}
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-explore"
                  onClick={() => navigate("/events")}
                >
                  Jelajahi Event
                </button>
              </div>
              <div className="hero-trust-badges">
                <div className="trust-badge">
                  <Shield size={14} className="badge-icon" />
                  <span>Event Terverifikasi</span>
                </div>
                <div className="trust-badge">
                  <Award size={14} className="badge-icon" />
                  <span>Sertifikat Digital</span>
                </div>
                <div className="trust-badge">
                  <CheckCircle size={14} className="badge-icon" />
                  <span>Pembayaran Aman</span>
                </div>
              </div>
            </div>

            <div className="hero-cards">
              {heroCards.map((card, i) => (
                <div
                  key={card.id}
                  className={`hero-nft-card hero-nft-card--${i + 1}`}
                >
                  <div
                    className="hero-nft-card-image"
                    style={
                      card.imageUrl
                        ? {
                          backgroundImage: `url(${card.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                        : { background: card.gradient }
                    }
                  />
                  <div className="hero-nft-card-body">
                    <h3 className="hero-nft-card-title">{card.title}</h3>
                    <p className="hero-nft-card-price">{card.price}</p>
                    <p className="hero-nft-card-handle">{card.handle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Banner Carousel */}
        <section className="banner-carousel-section" aria-label="Banner event">
          <div className="container banner-carousel-wrapper">
            {/* Left Navigation Button */}
            <button
              type="button"
              className="banner-nav-btn-side banner-nav-btn-left"
              onClick={() => scrollBanner(-1)}
              aria-label="Slide sebelumnya"
            >
              ‹
            </button>

            <div className="banner-carousel-inner">
              <div
                className="banner-carousel"
                ref={bannerRowRef}
                role="region"
                aria-roledescription="carousel"
                style={{ cursor: "grab" }}
                onMouseDown={handleBannerMouseDown}
                onMouseMove={handleBannerMouseMove}
                onMouseUp={handleBannerMouseUp}
                onMouseLeave={handleBannerMouseLeave}
                onFocus={() => { isBannerPausedRef.current = true; }}
                onBlur={() => { isBannerPausedRef.current = false; }}
              >
                {Array.from({ length: 3 }).flatMap((_, loopIdx) =>
                  bannerCarouselList.map((banner, idx) => {
                    const loopIdx_ = activeBannerIdx % bannerCarouselList.length;
                    const isActive = idx === loopIdx_;
                    return (
                      <div
                        key={`${banner.id}-${idx}-${loopIdx}`}
                        className={`banner-slide${isActive ? " is-active" : ""}`}
                        role="group"
                        aria-roledescription="slide"
                        aria-current={isActive ? "true" : "false"}
                        tabIndex={0}
                        onClick={() => handleBannerSlideClick(idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleBannerSlideClick(idx);
                          }
                        }}
                      >
                        <div
                          className="banner-slide-bg"
                          style={
                            banner.foto_event_url
                              ? {
                                backgroundImage: `linear-gradient(135deg, rgba(15,13,26,0.2), rgba(30,26,46,0.1)), url(${banner.foto_event_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                              : { background: banner.image }
                          }
                          aria-hidden="true"
                        />
                        <div className="banner-slide-overlay" />
                        <div className="banner-slide-content">
                          <h2 className="banner-title">{banner.title}</h2>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Navigation Button */}
            <button
              type="button"
              className="banner-nav-btn-side banner-nav-btn-right"
              onClick={() => scrollBanner(1)}
              aria-label="Slide berikutnya"
            >
              ›
            </button>
          </div>

          {/* Banner Dots - Below carousel */}
          <div className="banner-dots-container" role="tablist" aria-label="Slide indicators">
            {bannerCarouselList.map((_, idx) => {
              const loopIdx = activeBannerIdx % bannerCarouselList.length;
              const isActive = idx === loopIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`banner-dot${isActive ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    const len = bannerCarouselList.length;
                    const targetIdx = idx + len;
                    scrollBannerToIdx(targetIdx);
                    setActiveBannerIdx(targetIdx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>
        </section>

        <section id="event-terbaru" className="section featured-section">
          <div className="section-inner container">
            <header className="section-header">
              <h2 className="section-title">Event Terbaru</h2>
              <p className="section-subtitle">
                Pilihan event populer minggu ini.
              </p>
            </header>
            <div className="events-grid">
              {events
                .slice(0, showAllFeaturedEvents ? events.length : 6)
                .map((event, idx) => (
                  <article
                    className="event-card"
                    key={event.id}
                    style={{
                      '--card-delay': `${200 + idx * 120}ms`,
                      animation: 'cardFadeSlide 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
                      animationDelay: `var(--card-delay)`
                    }}
                  >
                    <div className="event-card-media" style={{ padding: 0, overflow: "hidden" }}>
                      <img
                        src={event.foto_event_url}
                        alt={event.nama_event}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="event-card-tag">{event.category}</div>
                      <div className="event-card-price">{formatPrice(event.harga)}</div>
                    </div>
                    <div className="event-card-body">
                      <h3 className="event-title">{event.nama_event}</h3>
                      <p className="event-description">{(event.deskripsi || event.description || "").slice(0, 70)}...</p>
                      <div className="event-meta">
                        <span className="event-meta-item">
                          <CalendarDays size={14} className="event-meta-icon" /> {event.tanggal}
                        </span>
                        <span className="event-meta-item">
                          <MapPin size={14} className="event-meta-icon" /> {event.lokasi}
                        </span>
                        <span className="event-meta-item">
                          <User size={14} className="event-meta-icon" /> {event.organizer}
                        </span>
                      </div>
                      <div className="event-actions">
                        <button
                          type="button"
                          className="event-btn-share"
                          onClick={(e) => handleShare(e, event)}
                        >
                          <Share2 size={14} /> Share
                        </button>
                        <Link to={`/events/${event.id}`} className="event-btn">
                          Detail Event
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
            {events.length > 6 && (
              <div className="section-footer">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => navigate("/events")}
                >
                  Lihat Selengkapnya →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Countdown: event dari API yang tanggalnya masanya mendatang + urut paling dekat */}
        <section className="countdown-section">
          <div
            className="container countdown-inner"
            onMouseEnter={() => { isUpcomingPausedRef.current = true; }}
            onMouseLeave={() => { isUpcomingPausedRef.current = false; }}
          >
            <header className="countdown-header">
              <h2 className="countdown-section-title">Event yang Akan Datang</h2>
              <p className="countdown-section-subtitle">
                {upcomingEvents.length > 0
                  ? "Jangan lewatkan moment spesial ini!"
                  : events.length > 0
                    ? "Saat ini belum ada jadwal mendatang di katalog."
                    : "Jangan lewatkan moment spesial ini!"}
              </p>
            </header>

            {!countdownDisplay && events.length > 0 ? (
              <div className="countdown-empty card rounded-3 border border-secondary border-opacity-25 p-4 p-md-5 text-center bg-dark bg-opacity-25">
                <p className="mb-4 text-white-50">
                  Tambah atau perbarui event di admin dengan tanggal ke depan agar muncul di sini — atau buka katalog.
                </p>
                <button type="button" className="btn-countdown-primary" onClick={() => navigate("/events")}>
                  Lihat semua event
                </button>
              </div>
            ) : countdownDisplay ? (
              <div className="countdown-card-container">
                <div 
                  className="countdown-card" 
                  key={upcomingCarouselIdx}
                  onClick={() => navigate(`/events/${countdownDisplay.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className={`countdown-image${countdownDisplay.foto_event_url ? " countdown-image--photo" : ""}`}
                    style={
                      countdownDisplay.foto_event_url
                        ? {
                          backgroundImage: `linear-gradient(135deg, rgba(15,13,26,0.75), rgba(30,26,46,0.35)), url(${countdownDisplay.foto_event_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                        : {
                          background:
                            countdownDisplay.imageGradient || "linear-gradient(135deg, #7c3aed, #a78bfa)",
                        }
                    }
                    role="img"
                    aria-label={countdownDisplay.title}
                  />
                  <div className="countdown-info">
                    <div className="countdown-top-meta">
                      <span className="countdown-badge">{countdownDisplay.category || "Event"}</span>
                      <span className="countdown-loc">
                        <i className="bi bi-geo-alt me-1"></i> {countdownDisplay.location}
                      </span>
                    </div>
                    <h2 className="countdown-title">{countdownDisplay.title}</h2>
                    <p className="countdown-date">
                      <i className="bi bi-calendar3 me-2"></i>
                      {countdownDisplay.dateLabel}
                    </p>
                    <p className="countdown-label mt-3">Event dimulai dalam</p>
                    
                    <CountdownTimer targetDate={countdownDisplay.parsed} />

                    <div className="countdown-owner">
                      <div className="countdown-owner-avatar" />
                      <span className="countdown-owner-label">Penyelenggara</span>
                      <span className="countdown-owner-handle">
                        {countdownDisplay.handle ||
                          `@${(countdownDisplay.organizer || "").replace(/\s+/g, "").toLowerCase()}`}
                      </span>
                    </div>
                    <div className="countdown-actions">
                      <button
                        type="button"
                        className="btn-countdown-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/events");
                        }}
                      >
                        Lihat Semua Upcoming
                      </button>
                      
                      {upcomingEvents.length > 1 && (
                        <div className="countdown-nav" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="countdown-nav-btn"
                            onClick={() => shiftUpcoming(-1)}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="countdown-nav-btn"
                            onClick={() => shiftUpcoming(1)}
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* News Section */}
        <section className="news-section">
          <div className="container news-container">
            <div className="news-section-header">
              <h2 className="news-section-title">Berita Hari Ini</h2>
              <p className="news-section-subtitle">Update terbaru dari dunia event</p>
            </div>

            {/* News cards horizontal */}
            <div className="news-carousel-outer">
              <button
                className="news-nav-btn news-nav-btn--prev"
                onClick={() => scrollNewsManual(-1)}
                aria-label="Previous news"
              >
                ‹
              </button>

              <div
                className="news-preview-carousel"
                ref={newsCarouselRef}
                onMouseEnter={() => { isNewsPausedRef.current = true; }}
                onMouseLeave={() => {
                  isNewsPausedRef.current = false;
                  isNewsDraggingRef.current = false;
                }}
                onMouseDown={(e) => {
                  isNewsPausedRef.current = true;
                  isNewsDraggingRef.current = true;
                  newsStartXRef.current = e.pageX - newsCarouselRef.current.offsetLeft;
                  newsScrollLeftRef.current = newsCarouselRef.current.scrollLeft;
                }}
                onMouseUp={() => {
                  isNewsDraggingRef.current = false;
                }}
                onMouseMove={(e) => {
                  if (!isNewsDraggingRef.current) return;
                  e.preventDefault();
                  const x = e.pageX - newsCarouselRef.current.offsetLeft;
                  const walk = x - newsStartXRef.current;
                  newsCarouselRef.current.scrollLeft = newsScrollLeftRef.current - walk;
                }}
                onTouchStart={(e) => {
                  isNewsPausedRef.current = true;
                  newsStartXRef.current = e.touches[0].clientX;
                  newsScrollLeftRef.current = newsCarouselRef.current.scrollLeft;
                }}
                onTouchEnd={() => {
                  isNewsPausedRef.current = false;
                  // Re-sync dots after touch ends
                  setTimeout(() => {
                    const el = newsCarouselRef.current;
                    if (el && transformedNews.length > 0) {
                      const cards = el.querySelectorAll(".news-preview-card");
                      if (cards.length > 0) {
                        const centerX = el.scrollLeft + el.offsetWidth / 2;
                        let closestIdx = 0;
                        let minDiff = Infinity;
                        cards.forEach((card, idx) => {
                          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                          const diff = Math.abs(centerX - cardCenter);
                          if (diff < minDiff) { minDiff = diff; closestIdx = idx; }
                        });
                        setSelectedNewsIdx(closestIdx);
                      }
                    }
                  }, 100);
                }}
                onTouchMove={(e) => {
                  // Allow native scrolling, only pause autoplay
                  isNewsPausedRef.current = true;
                }}
              >
                {newsLoopList.map((news, idx) => {
                  const len = newsData.length || transformedNews.length;
                  const realIdx = len > 0 ? idx % len : 0;
                  const isActive = len > 0 ? realIdx === (selectedNewsIdx % len) : false;

                  return (
                    <article
                      key={`${news.id}-${idx}`}
                      className={`news-preview-card ${isActive ? "news-preview-card--active" : ""}`}
                      onClick={() => {
                        if (isNewsDraggingRef.current) {
                          console.log('Ignoring click - dragging in progress');
                          return;
                        }
                        console.log('News card clicked:', {
                          title: news.title,
                          idx: idx,
                          realIdx: realIdx,
                          len: len,
                          transformedNewsLength: transformedNews.length
                        });
                        setSelectedNewsIdx(realIdx);
                        setShowNewsDetail(true);
                      }}
                    >
                      <div
                        className="news-preview-image"
                        style={
                          news.image && (news.image.startsWith('http://') || news.image.startsWith('https://'))
                            ? {
                              backgroundImage: `url(${news.image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                            : { background: news.image }
                        }
                      />
                      <div className="news-preview-info">
                        <span className="news-preview-category">{news.category}</span>
                        <h3 className="news-preview-title">{news.title}</h3>
                        <p className="news-preview-date">{news.date}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <button
                className="news-nav-btn news-nav-btn--next"
                onClick={() => scrollNewsManual(1)}
                aria-label="Next news"
              >
                ›
              </button>
            </div>

            {/* News Pagination Dots (Mobile optimized) */}
            <div className="news-dots">
              {transformedNews.map((_, idx) => {
                const len = transformedNews.length;
                const activeIdx = len > 0 ? selectedNewsIdx % len : 0;
                return (
                  <button
                    key={`news-dot-${idx}`}
                    className={`news-dot ${idx === activeIdx ? "news-dot--active" : ""}`}
                    onClick={() => {
                      const el = newsCarouselRef.current;
                      if (!el) return;
                      const len = transformedNews.length;
                      const targetIdx = idx + len; // Scroll to middle loop
                      setSelectedNewsIdx(targetIdx);
                      const cards = el.querySelectorAll(".news-preview-card");
                      const card = cards[targetIdx];
                      if (card) {
                        el.scrollTo({
                          left: card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2,
                          behavior: "smooth"
                        });
                      }
                    }}
                    aria-label={`Go to news ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </section>


        {/* News Detail Modal */}
        {showNewsDetail && createPortal((() => {
          console.log('=== MODAL CONDITION MET ===');
          console.log('showNewsDetail:', showNewsDetail);
          console.log('transformedNews.length:', transformedNews.length);
          console.log('selectedNewsIdx:', selectedNewsIdx);
          
          if (transformedNews.length === 0) {
            console.warn('No news data!');
            return null;
          }
          
          const newsIndex = selectedNewsIdx % transformedNews.length;
          const currentNews = transformedNews[newsIndex];
          
          console.log('currentNews:', currentNews);
          
          if (!currentNews || !currentNews.title) {
            console.error('currentNews is invalid!', currentNews);
            return null;
          }
          
          return (
            <div 
              className="news-detail-overlay" 
              onClick={() => setShowNewsDetail(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflow: 'auto'
              }}
            >
              <div 
                className="news-detail-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#1e1b2e',
                  border: '2px solid #a855f7',
                  borderRadius: '20px',
                  maxWidth: '1000px',
                  width: '100%',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'row',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 0 100px rgba(168, 85, 247, 0.5)'
                }}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowNewsDetail(false)}
                  style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    border: '2px solid #a855f7',
                    color: '#fff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
                
                {/* Image Section */}
                <div
                  style={{
                    flex: '0 0 45%',
                    minHeight: '400px',
                    background: currentNews.image && (currentNews.image.startsWith('http://') || currentNews.image.startsWith('https://'))
                      ? `url(${currentNews.image}) center/cover no-repeat`
                      : currentNews.image || 'linear-gradient(135deg, #667eea, #764ba2)',
                    position: 'relative'
                  }}
                />
                
                {/* Content Section */}
                <div
                  style={{
                    flex: 1,
                    padding: '40px',
                    overflowY: 'auto',
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  {/* Category */}
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: '#c084fc',
                    background: 'rgba(168, 85, 247, 0.15)',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    marginBottom: '20px'
                  }}>
                    {currentNews.category}
                  </span>
                  
                  {/* Title */}
                  <h2 style={{
                    fontSize: 'clamp(26px, 5vw, 36px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: '0 0 24px 0',
                    lineHeight: 1.3,
                    display: 'block'
                  }}>
                    {currentNews.title}
                  </h2>
                  
                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '28px',
                    paddingBottom: '24px',
                    borderBottom: '2px solid rgba(168, 85, 247, 0.2)',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#c084fc',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      border: '1px solid rgba(168, 85, 247, 0.3)'
                    }}>
                      {currentNews.source}
                    </span>
                    <span style={{
                      color: '#cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}>
                      {currentNews.date}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <article style={{
                    color: '#e2e8f0',
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    display: 'block'
                  }}>
                    {currentNews.content}
                  </article>
                  
                  {/* Link */}
                  {currentNews.link && (
                    <div style={{ marginTop: '24px' }}>
                      <a
                        href={currentNews.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '10px 20px',
                          background: 'rgba(168, 85, 247, 0.2)',
                          color: '#c084fc',
                          borderRadius: '8px',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        Baca Selengkapnya di Sumber →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })(), document.body)}

      </main>

      <Footer />
    </div>
  );
}
