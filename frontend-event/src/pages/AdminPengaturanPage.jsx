import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon, Upload, FileText, Save, CheckCircle,
  LayoutTemplate, Plus, Trash2, Edit3, Eye, Calendar, Tag, Newspaper, Ticket, X
} from 'lucide-react';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminPengaturanPage.css';

/* ================================================================
   DATA INITIAL — Banner dan Hero (Berita sekarang dari API)
================================================================ */
const INIT_BANNER = [
  { id: 'b1', title: 'Neon Night Music Festival', subtitle: 'Pengalaman musik terbaik tahun ini', date: '22 MAR 2026', foto_event_url: '' },
  { id: 'b2', title: 'Digital Innovation Summit', subtitle: 'Networking dengan para pemimpin teknologi', date: '05 APR 2026', foto_event_url: '' },
  { id: 'b3', title: 'Creative Workshop Intensive', subtitle: 'Tingkatkan skill kreatif Anda bersama expert', date: '19 APR 2026', foto_event_url: '' },
  { id: 'b4', title: 'Gaming Festival 2026', subtitle: 'Kompetisi game terbesar se-Indonesia', date: '26 APR 2026', foto_event_url: '' },
];

const INIT_HERO_HEADER = {
  title: 'Temukan Event Luar Biasa & Tiket Eksklusif.',
  subtitle: 'Daftar dan beli tiket event favorit Anda — konser, seminar, workshop — dari berbagai organizer terpercaya dalam satu platform.'
};

const INIT_HERO_CARDS = [
  { id: 'h1', title: 'Neon Night Festival', price: 'Rp180rb', handle: '@skylineent', imageUrl: '' },
  { id: 'h2', title: 'Digital Summit 2026', price: 'Rp250rb', handle: '@techverse', imageUrl: '' },
  { id: 'h3', title: 'Career & Meditation', price: 'Gratis', handle: '@mindfulid', imageUrl: '' },
];

// Helper to match HomePage logic for Hero Cards fallback
const buildHeroCardsFromEvents = (events) => {
  if (!events || events.length === 0) return INIT_HERO_CARDS;
  const sorted = [...events].sort((a, b) => (new Date(b.created_at || 0)) - (new Date(a.created_at || 0)));
  return sorted.slice(0, 3).map((ev, i) => ({
    id: `hero-${ev.id}`,
    title: ev.nama_event || ev.title,
    price: ev.harga > 0 ? `Rp${Number(ev.harga).toLocaleString('id-ID')}` : 'Gratis',
    handle: `@${(ev.organizer || 'panitia').replace(/\s+/g, '').toLowerCase()}`,
    imageUrl: ev.foto_event_url || ''
  }));
};

// Helper to match HomePage logic for Banners fallback
const buildBannerSlidesFromEvents = (events) => {
  if (!events || events.length === 0) return INIT_BANNER;
  const sorted = [...events].sort((a, b) => (new Date(b.created_at || 0)) - (new Date(a.created_at || 0)));
  return sorted.slice(0, 5).map((ev) => ({
    id: `banner-${ev.id}`,
    title: ev.nama_event || ev.title,
    subtitle: (ev.deskripsi || '').slice(0, 100) + '...',
    date: ev.tanggal ? new Date(ev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : 'SOON',
    foto_event_url: ev.foto_event_url || ''
  }));
};

/* ================================================================
   MINI COMPONENTS
================================================================ */
function UploadImageField({ label, value, name, onUpload, onRemove }) {
  return (
    <div className="aps-field">
      {label && <label><ImageIcon size={14} /> {label}</label>}
      {value ? (
        <div className="aps-img-preview-wrap">
          <img src={value} alt="Preview" className="aps-img-preview" />
          <button type="button" className="aps-img-remove-btn" onClick={onRemove}>
            <X size={16} /> Hapus Gambar
          </button>
        </div>
      ) : (
        <label className="aps-upload-zone">
          <Upload size={22} />
          <span>Klik atau seret gambar ke sini</span>
          <small>JPG, PNG, WEBP — maks 5 MB</small>
          <input type="file" accept="image/*" onChange={onUpload} hidden />
        </label>
      )}
    </div>
  );
}

function SaveToast({ visible }) {
  return (
    <div className={`aps-toast ${visible ? 'show' : ''}`}>
      <CheckCircle size={18} /> Perubahan berhasil disimpan!
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
export default function AdminPengaturanPage() {
  const [activeTab, setActiveTab] = useState('banner');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Data states
  const [heroHeader, setHeroHeader] = useState(INIT_HERO_HEADER);
  const [bannerSlides, setBannerSlides] = useState(INIT_BANNER);
  const [heroCards, setHeroCards] = useState(INIT_HERO_CARDS);
  const [newsItems, setNewsItems] = useState([]);
  const [kategoriBerita, setKategoriBerita] = useState([]);
  const [deletedNewsIds, setDeletedNewsIds] = useState([]);

  // Editing state
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [editingNews, setEditingNews] = useState(null); // null or newsItem

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Events for fallback
        const eventRes = await fetch(buildApiUrl('/api/event'));
        let events = [];
        if (eventRes.ok) {
          const eData = await eventRes.json();
          events = Array.isArray(eData?.data) ? eData.data : (Array.isArray(eData) ? eData : []);
        }

        // 2. Fetch Settings
        const settingsRes = await fetch(buildApiUrl('/api/settings'));
        let settings = {};
        if (settingsRes.ok) {
          settings = await settingsRes.json();
        }

        // 3. Fetch Berita
        const newsRes = await fetch(buildApiUrl('/api/berita'));
        if (newsRes.ok) {
          const nData = await newsRes.json();
          if (Array.isArray(nData)) {
            setNewsItems(nData.map(d => ({
              id: d.id,
              title: d.judul,
              date: d.tanggal,
              kategori_id: d.kategori_id,
              category: d.kategori?.nama_kategori || '',
              source: d.sumber,
              excerpt: d.ringkasan,
              imageUrl: d.gambar || ''
            })));
          }
        }

        // 4. Fetch Kategori Berita
        const catRes = await fetch(buildApiUrl('/api/kategori-berita'));
        if (catRes.ok) {
          const cData = await catRes.json();
          if (Array.isArray(cData)) setKategoriBerita(cData);
        }

        // Apply Settings or Fallback
        if (settings.homepage_hero_header) {
          setHeroHeader(settings.homepage_hero_header);
        }

        if (settings.homepage_banners) {
          setBannerSlides(settings.homepage_banners);
        } else if (events.length > 0) {
          setBannerSlides(buildBannerSlidesFromEvents(events));
        }

        if (settings.homepage_hero_cards) {
          setHeroCards(settings.homepage_hero_cards);
        } else if (events.length > 0) {
          setHeroCards(buildHeroCardsFromEvents(events));
        }

      } catch (err) {
        console.error('Fetch data error:', err);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const token = getToken();
    
    // 1. Proses Hapus Berita
    try {
      for (const id of deletedNewsIds) {
        if (!String(id).startsWith('n')) {
          await fetch(buildApiUrl(`/api/berita/${id}`), {
            method: 'DELETE',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
          });
        }
      }
      setDeletedNewsIds([]);
    } catch (e) { console.error("Gagal hapus berita:", e); }

    // 2. Proses Simpan/Update Berita
    try {
      for (const item of newsItems) {
        const payload = {
          judul: item.title || 'Judul Baru',
          kategori_id: item.kategori_id || (kategoriBerita[0]?.id || 1),
          sumber: item.source || 'https://kesavent.com',
          ringkasan: item.excerpt || 'Ringkasan berita',
          konten: item.excerpt || 'Konten berita',
          gambar: item.imageUrl || null,
          tanggal: item.date ? (String(item.date).split('T')[0]) : new Date().toISOString().split('T')[0]
        };

        if (String(item.id).startsWith('n')) {
          // POST baru
          await fetch(buildApiUrl('/api/berita'), {
            method: 'POST',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        } else {
          // PUT update
          await fetch(buildApiUrl(`/api/berita/${item.id}`), {
            method: 'PUT',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        }
      }
    } catch (e) { console.error("Gagal simpan berita:", e); }

    // 3. Simpan Pengaturan Lainnya (Header, Banner, Cards)
    const settingsToSave = [
      { key: 'homepage_hero_header', value: heroHeader },
      { key: 'homepage_banners', value: bannerSlides },
      { key: 'homepage_hero_cards', value: heroCards }
    ];

    for (const setting of settingsToSave) {
      try {
        await fetch(buildApiUrl('/api/settings'), {
          method: 'POST',
          headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
          body: JSON.stringify(setting)
        });
      } catch (e) { console.error(`Gagal simpan setting ${setting.key}:`, e); }
    }

    // Refresh news items
    try {
      const newsRes = await fetch(buildApiUrl('/api/berita'));
      if (newsRes.ok) {
        const nData = await newsRes.json();
        setNewsItems(nData.map(d => ({
          id: d.id,
          title: d.judul,
          date: d.tanggal,
          kategori_id: d.kategori_id,
          category: d.kategori?.nama_kategori || '',
          source: d.sumber,
          excerpt: d.ringkasan,
          imageUrl: d.gambar || ''
        })));
      }
    } catch (e) {}

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setIsSaving(false);
  };

  const handleImageUpload = async (e, setter, idx, key) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('foto_event', file);

    try {
      const res = await fetch(buildApiUrl('/api/upload-poster'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const permanentUrl = data.url;
        setter(prev => prev.map((item, i) => i === idx ? { ...item, [key]: permanentUrl } : item));
      } else {
        alert('Gagal mengupload gambar.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Terjadi kesalahan saat upload.');
    }
  };

  /* ---- BANNER HANDLERS ---- */
  const updateBanner = (idx, field, value) => {
    setBannerSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const deleteBanner = (idx) => {
    if (bannerSlides.length <= 1) return alert('Minimal 1 slide harus ada.');
    const newSlides = bannerSlides.filter((_, i) => i !== idx);
    setBannerSlides(newSlides);
    setActiveBannerIdx(Math.min(activeBannerIdx, newSlides.length - 1));
  };
  const addBanner = () => {
    const newSlide = { id: `b${Date.now()}`, title: 'Judul Banner Baru', subtitle: 'Deskripsi singkat event ini', date: '01 JAN 2027', foto_event_url: '' };
    setBannerSlides(prev => [...prev, newSlide]);
    setActiveBannerIdx(bannerSlides.length);
  };

  /* ---- HERO CARD HANDLERS ---- */
  const updateHeroCard = (idx, field, value) => {
    setHeroCards(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  /* ---- NEWS HANDLERS ---- */
  const updateNews = (id, field, value) => {
    setNewsItems(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
    if (editingNews?.id === id) setEditingNews(prev => ({ ...prev, [field]: value }));
  };
  const deleteNews = (id) => {
    setDeletedNewsIds(prev => [...prev, id]);
    setNewsItems(prev => prev.filter(n => n.id !== id));
    if (editingNews?.id === id) setEditingNews(null);
  };
  const addNews = () => {
    const defaultKategoriId = kategoriBerita.length > 0 ? kategoriBerita[0].id : '';
    const defaultKategoriName = kategoriBerita.length > 0 ? kategoriBerita[0].nama_kategori : 'Umum';
    const newItem = { 
      id: `n${Date.now()}`, 
      title: 'Judul Berita Baru', 
      date: new Date().toISOString().split('T')[0], 
      kategori_id: defaultKategoriId,
      category: defaultKategoriName, 
      source: 'https://kesavent.com', 
      excerpt: 'Tulis ringkasan berita di sini...', 
      imageUrl: '' 
    };
    setNewsItems(prev => [...prev, newItem]);
    setEditingNews(newItem);
  };

  const handleNewsImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingNews) return;

    const formData = new FormData();
    formData.append('foto_event', file);

    try {
      const res = await fetch(buildApiUrl('/api/upload-poster'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const permanentUrl = data.url;
        updateNews(editingNews.id, 'imageUrl', permanentUrl);
        setEditingNews(prev => ({ ...prev, imageUrl: permanentUrl }));
      } else {
        alert('Gagal mengupload gambar berita.');
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const tabs = [
    { id: 'header', icon: <FileText size={18} />, label: 'Header Utama' },
    { id: 'banner', icon: <LayoutTemplate size={18} />, label: 'Banner Carousel' },
    { id: 'heroCards', icon: <Ticket size={18} />, label: 'Hero Event Cards' },
    { id: 'berita', icon: <Newspaper size={18} />, label: 'Berita Homepage' },
  ];

  const activeBanner = bannerSlides[activeBannerIdx] || bannerSlides[0];

  return (
    <div className="aps-wrap">
      <SaveToast visible={showToast} />

      {/* ---- PAGE HEADER ---- */}
      <div className="aps-page-header">
        <div>
          <h1 className="aps-title">Pengaturan Tampilan</h1>
          <p className="aps-subtitle">Kustomisasi konten yang tampil di halaman publik (Homepage)</p>
        </div>
        <button className="aps-btn-save" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <span className="aps-spinner" /> : <Save size={18} />}
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* ---- TAB NAV ---- */}
      <div className="aps-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`aps-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB: HEADER UTAMA
      ============================================================ */}
      {activeTab === 'header' && (
        <div className="aps-section fade-in">
          <div className="aps-section-header">
            <div>
              <h2>Kelola Header Utama Beranda</h2>
              <p>Ubah teks judul dan subjudul besar yang tampil di bagian kiri halaman utama.</p>
            </div>
          </div>
          
          <div className="aps-editor-card" style={{ maxWidth: '800px' }}>
            <div className="aps-field">
              <label><Edit3 size={14} /> Judul Utama (Hero Title)</label>
              <textarea 
                className="aps-input" 
                rows="2"
                style={{ fontSize: '1.2rem', fontWeight: '700' }}
                value={heroHeader.title} 
                onChange={e => setHeroHeader({...heroHeader, title: e.target.value})} 
              />
              <small style={{ color: '#64748b' }}>Gunakan &lt;br /&gt; untuk membuat baris baru.</small>
            </div>
            <div className="aps-field">
              <label><FileText size={14} /> Subjudul (Hero Subtitle)</label>
              <textarea 
                className="aps-input" 
                rows="4"
                value={heroHeader.subtitle} 
                onChange={e => setHeroHeader({...heroHeader, subtitle: e.target.value})} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: BANNER CAROUSEL
      ============================================================ */}
      {activeTab === 'banner' && (
        <div className="aps-section fade-in">
          <div className="aps-section-header">
            <div>
              <h2>Kelola Slide Banner Carousel</h2>
              <p>Edit gambar, judul, dan deskripsi setiap slide yang tampil di bagian atas Homepage.</p>
            </div>
            <button className="aps-btn-add" onClick={addBanner}><Plus size={16} /> Tambah Slide</button>
          </div>

          <div className="aps-banner-layout">
            {/* Slide Thumbnails */}
            <div className="aps-slide-list">
              {bannerSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`aps-slide-thumb ${idx === activeBannerIdx ? 'active' : ''}`}
                  onClick={() => setActiveBannerIdx(idx)}
                >
                  <div className="aps-thumb-preview" style={{ background: slide.foto_event_url ? 'none' : '#1e293b' }}>
                    {slide.foto_event_url
                      ? <img src={slide.foto_event_url} alt="" />
                      : <ImageIcon size={16} color="#64748b" />}
                    <span className="aps-thumb-num">{idx + 1}</span>
                  </div>
                  <div className="aps-thumb-info">
                    <span className="aps-thumb-title">{slide.title || '(Tanpa Judul)'}</span>
                  </div>
                  <button className="aps-thumb-del" onClick={(e) => { e.stopPropagation(); deleteBanner(idx); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>            {/* Slide Editor & Preview */}
            {activeBanner && (
              <div className="aps-editor-preview-grid">
                {/* Editor Card */}
                <div className="aps-editor-card">
                  <h3 className="aps-editor-title">Detail Slide</h3>
                  <div className="aps-editor-fields">
                    <div className="aps-field">
                      <label><Edit3 size={14} /> Judul Slide</label>
                      <input className="aps-input" value={activeBanner.title} onChange={e => updateBanner(activeBannerIdx, 'title', e.target.value)} />
                    </div>
                    <UploadImageField
                      label="Foto Banner"
                      value={activeBanner.foto_event_url}
                      onUpload={e => handleImageUpload(e, setBannerSlides, activeBannerIdx, 'foto_event_url')}
                      onRemove={() => updateBanner(activeBannerIdx, 'foto_event_url', '')}
                    />
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: HERO EVENT CARDS
      ============================================================ */}
      {activeTab === 'heroCards' && (
        <div className="aps-section fade-in">
          <div className="aps-section-header">
            <div>
              <h2>Kelola Hero Event Cards</h2>
              <p>Edit 3 kartu event yang tampil menonjol di bagian atas halaman beranda (tampilan Desktop).</p>
            </div>
          </div>

          {/* Preview Card Row */}
          <div className="aps-hero-preview-row">
            {heroCards.map((card, idx) => (
              <div className="aps-hero-preview-card" key={card.id} style={{ background: card.imageUrl ? 'none' : '#1e293b' }}>
                {card.imageUrl
                  ? <img src={card.imageUrl} alt="" className="aps-hero-card-bg" />
                  : <div className="aps-hero-card-placeholder"><ImageIcon size={28} color="#475569" /></div>}
                <div className="aps-hero-card-overlay">
                  <span className="aps-hero-card-handle">{card.handle}</span>
                  <h4>{card.title}</h4>
                  <span className="aps-hero-card-price">{card.price}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="aps-hero-cards-grid">
            {heroCards.map((card, idx) => (
              <div className="aps-hero-card-editor" key={card.id}>
                <div className="aps-hero-card-label">Kartu #{idx + 1}</div>
                <div className="aps-field">
                  <label>Nama Event</label>
                  <input className="aps-input" value={card.title} onChange={e => updateHeroCard(idx, 'title', e.target.value)} />
                </div>
                <div className="aps-field">
                  <label>Handle / Penyelenggara</label>
                  <input className="aps-input" value={card.handle} onChange={e => updateHeroCard(idx, 'handle', e.target.value)} placeholder="contoh: @namaorg" />
                </div>
                <div className="aps-field">
                  <label>Harga Tiket</label>
                  <input className="aps-input" value={card.price} onChange={e => updateHeroCard(idx, 'price', e.target.value)} placeholder="contoh: Rp150rb atau Gratis" />
                </div>
                <UploadImageField
                  label="Foto Kartu"
                  value={card.imageUrl}
                  onUpload={e => handleImageUpload(e, setHeroCards, idx, 'imageUrl')}
                  onRemove={() => updateHeroCard(idx, 'imageUrl', '')}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: BERITA / NEWS
      ============================================================ */}
      {activeTab === 'berita' && (
        <div className="aps-section fade-in">
          <div className="aps-section-header">
            <div>
              <h2>Kelola Berita Homepage</h2>
              <p>Tambah, edit, atau hapus artikel berita yang tampil di bagian bawah Homepage.</p>
            </div>
            <button className="aps-btn-add" onClick={addNews}><Plus size={16} /> Tambah Berita</button>
          </div>

          <div className="aps-news-layout">
            {/* News List */}
            <div className="aps-news-list">
              {newsItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`aps-news-row ${editingNews?.id === item.id ? 'active' : ''}`}
                  onClick={() => setEditingNews({ ...item })}
                >
                  <div className="aps-news-row-thumb">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt="" />
                      : <Newspaper size={18} color="#475569" />}
                  </div>
                  <div className="aps-news-row-info">
                    <span className="aps-news-row-title">{item.title}</span>
                    <div className="aps-news-row-meta">
                      <span className="aps-cat-badge">{item.category}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="aps-news-row-actions">
                    <button className="aps-icon-btn edit" onClick={(e) => { e.stopPropagation(); setEditingNews({ ...item }); }} title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button className="aps-icon-btn del" onClick={(e) => { e.stopPropagation(); deleteNews(item.id); }} title="Hapus">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* News Editor Panel */}
            {editingNews ? (
              <div className="aps-news-editor">
                <h3 className="aps-editor-subtitle">Edit Artikel</h3>
                <div className="aps-field">
                  <label>Judul Berita</label>
                  <input className="aps-input" value={editingNews.title} onChange={e => { setEditingNews({...editingNews, title: e.target.value}); updateNews(editingNews.id, 'title', e.target.value); }} />
                </div>
                <div className="aps-field-row">
                  <div className="aps-field">
                    <label><Tag size={13} /> Kategori</label>
                    <select 
                      className="aps-input" 
                      value={editingNews.kategori_id || ''} 
                      onChange={e => {
                        const selId = Number(e.target.value);
                        const selCat = kategoriBerita.find(k => k.id === selId);
                        setEditingNews({...editingNews, kategori_id: selId, category: selCat?.nama_kategori || ''}); 
                        updateNews(editingNews.id, 'kategori_id', selId); 
                        updateNews(editingNews.id, 'category', selCat?.nama_kategori || ''); 
                      }}
                    >
                      <option value="" disabled>Pilih Kategori</option>
                      {kategoriBerita.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                      ))}
                    </select>
                  </div>
                  <div className="aps-field">
                    <label><Calendar size={13} /> Tanggal</label>
                    <input type="date" className="aps-input" value={editingNews.date} onChange={e => { setEditingNews({...editingNews, date: e.target.value}); updateNews(editingNews.id, 'date', e.target.value); }} />
                  </div>
                </div>

                <div className="aps-field">
                  <label>Ringkasan (Excerpt)</label>
                  <textarea className="aps-input" rows="4" value={editingNews.excerpt} onChange={e => { setEditingNews({...editingNews, excerpt: e.target.value}); updateNews(editingNews.id, 'excerpt', e.target.value); }} />
                </div>
                <UploadImageField
                  label="Gambar Thumbnail Berita"
                  value={editingNews.imageUrl}
                  onUpload={handleNewsImageUpload}
                  onRemove={() => { updateNews(editingNews.id, 'imageUrl', ''); setEditingNews(prev => ({...prev, imageUrl: ''})); }}
                />
                <button className="aps-btn-done" onClick={() => setEditingNews(null)}>
                  <CheckCircle size={16} /> Selesai Edit
                </button>
              </div>
            ) : (
              <div className="aps-news-editor-empty">
                <Newspaper size={48} />
                <p>Pilih berita di sebelah kiri untuk mulai mengedit</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
