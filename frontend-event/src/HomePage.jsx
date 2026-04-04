import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import "./styles/Footer.css";
import NavbarCustom from "./components/Navbar.jsx";

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

const HERO_CARDS = [
  {
    id: "h1",
    title: "Neon Night Festival",
    price: "Rp180rb",
    handle: "@skylineent",
    gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
  },
  {
    id: "h2",
    title: "Digital Summit 2026",
    price: "Rp250rb",
    handle: "@techverse",
    gradient: "linear-gradient(135deg, #5b21b6, #8b5cf6)",
  },
  {
    id: "h3",
    title: "Career & Meditation",
    price: "Gratis",
    handle: "@mindfulid",
    gradient: "linear-gradient(135deg, #6d28d9, #a78bfa)",
  },
];

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

const BANNER_CAROUSEL_DATA = [
  {
    id: "banner-1",
    title: "Neon Night Music Festival",
    subtitle: "Pengalaman musik terbaik tahun ini",
    date: "22 Mar 2026",
    image: "linear-gradient(135deg, #7c3aed, #a78bfa)",
  },
  {
    id: "banner-2",
    title: "Digital Innovation Summit",
    subtitle: "Networking dengan para pemimpin teknologi",
    date: "05 Apr 2026",
    image: "linear-gradient(135deg, #0ea5e9, #22c55e)",
  },
  {
    id: "banner-3",
    title: "Creative Workshop Intensive",
    subtitle: "Tingkatkan skill kreatif Anda bersama expert",
    date: "19 Apr 2026",
    image: "linear-gradient(135deg, #f97316, #fb7185)",
  },
  {
    id: "banner-4",
    title: "Gaming Festival 2026",
    subtitle: "Kompetisi game terbesar se-Indonesia",
    date: "26 Apr 2026",
    image: "linear-gradient(135deg, #22c55e, #a3e635)",
  },
  {
    id: "banner-5",
    title: "Business & Career Fair",
    subtitle: "Cari peluang karir impian Anda",
    date: "30 Mar 2026",
    image: "linear-gradient(135deg, #a855f7, #c084fc)",
  },
  {
    id: "banner-6",
    title: "Tech Expo Indonesia",
    subtitle: "Showcase inovasi teknologi terdepan",
    date: "12 Apr 2026",
    image: "linear-gradient(135deg, #06b6d4, #6366f1)",
  },
];

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
    source: "EventPlace Magazine",
    excerpt: "Memilih event yang sesuai dengan minat dan kebutuhan penting untuk pengalaman terbaik.",
    content: "Tidak semua event cocok untuk semua orang. Guide lengkap ini membantu Anda menemukan event yang sempurna, mulai dari musik, konferensi, hingga workshop networking.",
    image: "linear-gradient(135deg, #f093fb, #f5576c)",
  },
  {
    id: "news-3",
    title: "Cerita Sukses: Dari Peserta Event hingga Menjadi Entrepreneur",
    date: "29 Mar 2026",
    category: "Inspirasi",
    source: "EventPlace Stories",
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

export default function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
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
  const newsStartXRef = useRef(0);
  const newsScrollLeftRef = useRef(0);

  const latestList = useMemo(() => {
    const list = latestEvents.length ? latestEvents : events;
    const normalized = Array.isArray(list) ? list : [];
    return normalized.length ? normalized : DEMO_LATEST_EVENTS;
  }, [events, latestEvents]);

  // 3x loop untuk infinite scroll (6 card asli x 3 = 18 card)
  const latestLoopList = useMemo(() => {
    if (!latestList.length) return [];
    const sixCards = latestList.slice(0, 6);
    return [...sixCards, ...sixCards, ...sixCards];
  }, [latestList]);

  const nearestEvent = useMemo(() => {
    if (!events.length) return DEFAULT_NEAREST_EVENT;
    const withDate = events
      .map((e) => ({ ...e, parsed: parseEventDate(e.date) }))
      .filter((e) => e.parsed && e.parsed > new Date());
    if (!withDate.length) return events[0] ? { ...events[0], ...DEFAULT_NEAREST_EVENT } : DEFAULT_NEAREST_EVENT;
    withDate.sort((a, b) => a.parsed - b.parsed);
    return { ...withDate[0], imageGradient: "linear-gradient(135deg, #7c3aed, #a78bfa)" };
  }, [events]);

  const targetDate = useMemo(() => parseEventDate(nearestEvent.date), [nearestEvent.date]);
  const countdown = useCountdown(targetDate);

  useEffect(() => {
    fetch("http://localhost:8000/api/events/featured")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => {
        setEvents([
          {
            id: 1,
            title: "Neon Night Music Festival Bandung",
            date: "22 Mar 2026",
            location: "Bandung, Jawa Barat",
            category: "Music & Festival",
            organizer: "Skyline Entertainment",
            buttonLabel: "Beli Tiket",
          },
          {
            id: 2,
            title: "Success Free Career & Meditation Classes",
            date: "30 Mar 2026",
            location: "Online Webinar",
            category: "Business & Career",
            organizer: "Mindful Growth ID",
            buttonLabel: "Daftar Sekarang",
          },
          {
            id: 3,
            title: "Digital Innovation Summit 2026",
            date: "05 Apr 2026",
            location: "Surabaya, Jawa Timur",
            category: "Conference",
            organizer: "TechVerse ID",
            buttonLabel: "Beli Tiket",
          },
          {
            id: 4,
            title: "Creators Meetup: UI Motion Lab",
            date: "19 Apr 2026",
            location: "Yogyakarta, DIY",
            category: "Workshop",
            organizer: "MotionLab",
            buttonLabel: "Daftar Sekarang",
          },
          {
            id: 5,
            title: "Indie Game Jam Weekend",
            date: "26 Apr 2026",
            location: "Online",
            category: "Game",
            organizer: "IndieHub",
            buttonLabel: "Bergabung",
          },
          {
            id: 6,
            title: "Lunar Arcade Showcase",
            date: "12 Apr 2026",
            location: "Jakarta, Indonesia",
            category: "Expo",
            organizer: "ArcadeWorks",
            buttonLabel: "Beli Tiket",
          },
          {
            id: 7,
            title: "Web Development Bootcamp",
            date: "14 Apr 2026",
            location: "Bandung, Jawa Barat",
            category: "Training",
            organizer: "CodeMaster Academy",
            buttonLabel: "Daftar Sekarang",
          },
          {
            id: 8,
            title: "Design Thinking Workshop",
            date: "20 Apr 2026",
            location: "Jakarta, Indonesia",
            category: "Workshop",
            organizer: "Creative Studio ID",
            buttonLabel: "Daftar Sekarang",
          },
          {
            id: 9,
            title: "Startup Pitch Competition",
            date: "25 Apr 2026",
            location: "Jakarta, Indonesia",
            category: "Business",
            organizer: "Tech Founders Indonesia",
            buttonLabel: "Daftar Tim",
          },
        ]);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/events/latest")
      .then((res) => res.json())
      .then((data) => setLatestEvents(Array.isArray(data) ? data : []))
      .catch(() => {
        // fallback: gunakan data featured untuk demo local
        setLatestEvents((prev) => (prev.length ? prev : []));
      });
  }, []);

  useEffect(() => {
    // jika endpoint latest belum tersedia, pakai featured sebagai fallback
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

  // Scroll event listener untuk ensureLatestInMiddleLoop
  useEffect(() => {
    const el = latestRowRef.current;
    if (!el) return;

    let scrollTimer = null;
    const onScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!isDraggingRef.current) {
          ensureLatestInMiddleLoop();
        }
      }, 150);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

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
    const len = BANNER_CAROUSEL_DATA.length;
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
    const len = BANNER_CAROUSEL_DATA.length;
    const realIdx = ((idx % len) + len) % len;
    const targetIdx = realIdx + len;
    scrollBannerToIdx(targetIdx);
    setActiveBannerIdx(targetIdx);
  };

  const ensureBannerInMiddleLoop = () => {
    const el = bannerRowRef.current;
    if (!el) return;
    const len = BANNER_CAROUSEL_DATA.length;

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

  // Banner Carousel: Initialize middle position
  useEffect(() => {
    const el = bannerRowRef.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const len = BANNER_CAROUSEL_DATA.length;
      scrollBannerToIdx(len);
      setActiveBannerIdx(len);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
    const interval = setInterval(() => {
      if (isBannerPausedRef.current) return;
      scrollBanner(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBannerIdx]);

  return (
    <div className="page flacto-style">
      <NavbarCustom />

      <main>
        <section className="hero flacto-hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="hero-content">
              <h1 className="hero-title">
                Temukan Event Luar Biasa
                <br />
                &amp; Tiket Eksklusif.
              </h1>
              <p className="hero-subtitle">
                Daftar dan beli tiket event favorit Anda — konser, seminar,
                workshop — dari berbagai organizer terpercaya dalam satu platform.
              </p>
              <div className="hero-actions">
                <button type="button" className="btn btn-explore">
                  Jelajahi Event
                </button>
                <button type="button" className="btn btn-outline-white">
                  Cara Kerja?
                </button>
              </div>
              <div className="hero-artists">
                <div className="hero-avatars">
                  <div className="hero-avatar" style={{ background: "linear-gradient(135deg,#c4b5fd,#a78bfa)" }} />
                  <div className="hero-avatar" style={{ background: "linear-gradient(135deg,#a78bfa,#8b5cf6)" }} />
                  <div className="hero-avatar" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }} />
                </div>
                <span className="hero-artists-label">+12k Peserta</span>
                <span className="hero-rating">4.9</span>
                <span className="hero-rating-dash">—</span>
              </div>
            </div>

            <div className="hero-cards">
              {HERO_CARDS.map((card, i) => (
                <div
                  key={card.id}
                  className={`hero-nft-card hero-nft-card--${i + 1}`}
                >
                  <div
                    className="hero-nft-card-image"
                    style={{ background: card.gradient }}
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
                BANNER_CAROUSEL_DATA.map((banner, idx) => {
                  const loopIdx_ = activeBannerIdx % BANNER_CAROUSEL_DATA.length;
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
                        style={{ background: banner.image }}
                        aria-hidden="true"
                      />
                      <div className="banner-slide-overlay" />
                      <div className="banner-slide-content">
                        <span className="banner-badge">{banner.date}</span>
                        <h2 className="banner-title">{banner.title}</h2>
                        <p className="banner-subtitle">{banner.subtitle}</p>
                        <button type="button" className="banner-cta">
                          Lihat Event →
                        </button>
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
            {BANNER_CAROUSEL_DATA.map((_, idx) => {
              const loopIdx = activeBannerIdx % BANNER_CAROUSEL_DATA.length;
              const isActive = idx === loopIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`banner-dot${isActive ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    const len = BANNER_CAROUSEL_DATA.length;
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

        <section className="section featured-section">
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
                  <div className="event-card-media">
                    <div className="event-card-tag">{event.category}</div>
                  </div>
                  <div className="event-card-body">
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-meta">
                      <span className="event-meta-item">📅 {event.date}</span>
                      <span className="event-meta-item">📍 {event.location}</span>
                    </div>
                    <p className="event-organizer">
                      Oleh <strong>{event.organizer}</strong>
                    </p>
                    <div className="event-actions">
                      <button type="button" className="event-btn">
                        {event.buttonLabel || "Beli Tiket"}
                      </button>
                      <a href="#" className="event-link">Detail</a>
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

        {/* Countdown Event Terdekat */}
        <section className="countdown-section">
          <div className="container countdown-inner">
            <header className="countdown-header">
              <h2 className="countdown-section-title">Event yang Akan Datang</h2>
              <p className="countdown-section-subtitle">
                Jangan lewatkan moment spesial ini!
              </p>
            </header>
            <div className="countdown-card">
              <div
                className="countdown-image"
                style={{
                  background: nearestEvent.imageGradient || "linear-gradient(135deg, #7c3aed, #a78bfa)",
                }}
              />
              <div className="countdown-info">
                <p className="countdown-date">{nearestEvent.date}</p>
                <h2 className="countdown-title">{nearestEvent.title}</h2>
                <p className="countdown-label">Event dimulai dalam</p>
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
                <div className="countdown-owner">
                  <div className="countdown-owner-avatar" />
                  <span className="countdown-owner-label">Penyelenggara</span>
                  <span className="countdown-owner-handle">
                    {nearestEvent.handle || `@${(nearestEvent.organizer || "").replace(/\s+/g, "").toLowerCase()}`}
                  </span>
                </div>
                <div className="countdown-actions">
                  <button type="button" className="btn-countdown-primary">
                    Lihat Semua Upcoming
                  </button>
                  <div className="countdown-nav">
                    <button type="button" className="countdown-nav-btn" aria-label="Sebelumnya">
                      ←
                    </button>
                    <button type="button" className="countdown-nav-btn countdown-nav-btn--active" aria-label="Selanjutnya">
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            <div
              className="news-preview-carousel"
              ref={newsCarouselRef}
              onMouseDown={(e) => {
                isNewsDraggingRef.current = true;
                newsStartXRef.current = e.pageX - newsCarouselRef.current.offsetLeft;
                newsScrollLeftRef.current = newsCarouselRef.current.scrollLeft;
              }}
              onMouseLeave={() => {
                isNewsDraggingRef.current = false;
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
                newsStartXRef.current = e.touches[0].clientX;
                newsScrollLeftRef.current = newsCarouselRef.current.scrollLeft;
              }}
              onTouchMove={(e) => {
                const x = e.touches[0].clientX;
                const walk = newsStartXRef.current - x;
                newsCarouselRef.current.scrollLeft = newsScrollLeftRef.current + walk;
              }}
            >
              {NEWS_DATA.map((news, idx) => (
                <article
                  key={news.id}
                  className={`news-preview-card ${idx === selectedNewsIdx ? "news-preview-card--active" : ""}`}
                  onClick={() => {
                    setSelectedNewsIdx(idx);
                    setShowNewsDetail(true);
                  }}
                >
                  <div
                    className="news-preview-image"
                    style={{ background: news.image }}
                  />
                  <div className="news-preview-info">
                    <h4 className="news-preview-title">{news.title}</h4>
                    <p className="news-preview-category">{news.category}</p>
                    <p className="news-preview-date">{news.date}</p>
                    <p className="news-preview-excerpt">{news.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* News Detail Modal */}
        {showNewsDetail && (
          <div className="news-detail-overlay" onClick={() => setShowNewsDetail(false)}>
            <div className="news-detail-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="news-detail-close"
                onClick={() => setShowNewsDetail(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div
                className="news-detail-image"
                style={{ background: NEWS_DATA[selectedNewsIdx].image }}
              />
              <div className="news-detail-content">
                <span className="news-detail-category">{NEWS_DATA[selectedNewsIdx].category}</span>
                <h2 className="news-detail-title">{NEWS_DATA[selectedNewsIdx].title}</h2>
                <div className="news-detail-meta">
                  <span className="news-detail-source">{NEWS_DATA[selectedNewsIdx].source}</span>
                  <span className="news-detail-date">{NEWS_DATA[selectedNewsIdx].date}</span>
                </div>
                <article className="news-detail-text">{NEWS_DATA[selectedNewsIdx].content}</article>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="footer-logo">🎯 EVENTPLACE</span>
              <p className="footer-tagline">Platform terpercaya untuk menemukan dan mendaftar berbagai event menarik. Bergabunglah dengan komunitas kami dan jangan lewatkan pengalaman tak terlupakan.</p>
            </div>
            <div className="footer-contact">
              <h4>Kontak</h4>
              <p>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{marginRight: 6, verticalAlign: 'middle'}}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Jl. Raya Tajur, Kp. Buntar RT.02/RW.08, Kel. Muara Sari, Kec. Bogor Selatan, Kota Bogor, Jawa Barat 16137
              </p>
              <p>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{marginRight: 6, verticalAlign: 'middle'}}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                eventplace@gmail.com
              </p>
              <p>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{marginRight: 6, verticalAlign: 'middle'}}>
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +62 831-6922-1045
              </p>
            </div>
            <div className="footer-follow">
              <h4>Ikuti Kami</h4>
              <p>Tetap terhubung untuk update event terbaru</p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <p className="footer-copy">© 2026 EVENTPLACE Event Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
