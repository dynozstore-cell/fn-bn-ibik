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

const INIT_HERO_CARDS = [
  { id: 'h1', title: 'Neon Night Festival', price: 'Rp180rb', handle: '@skylineent', imageUrl: '' },
  { id: 'h2', title: 'Digital Summit 2026', price: 'Rp250rb', handle: '@techverse', imageUrl: '' },
  { id: 'h3', title: 'Career & Meditation', price: 'Gratis', handle: '@mindfulid', imageUrl: '' },
];

// Removed static INIT_NEWS

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
  const [bannerSlides, setBannerSlides] = useState(INIT_BANNER);
  const [heroCards, setHeroCards] = useState(INIT_HERO_CARDS);
  const [newsItems, setNewsItems] = useState([]);
  const [kategoriBerita, setKategoriBerita] = useState([]);
  const [deletedNewsIds, setDeletedNewsIds] = useState([]);

  // Editing state
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [editingNews, setEditingNews] = useState(null); // null or newsItem

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/berita'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNewsItems(data.map(d => ({
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
      } catch (err) { console.error('Fetch berita error:', err); }
    };
    const fetchKategori = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/kategori-berita'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setKategoriBerita(data);
        }
      } catch (err) { console.error('Fetch kategori error:', err); }
    };
    fetchBerita();
    fetchKategori();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = getToken();
      // Proses hapus berita
      for (const id of deletedNewsIds) {
        if (!String(id).startsWith('n')) {
          await fetch(buildApiUrl(`/api/berita/${id}`), {
            method: 'DELETE',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
          });
        }
      }

      // Proses simpan berita (POST/PUT)
      for (const item of newsItems) {
        const payload = {
          judul: item.title || 'Judul Baru',
          kategori_id: item.kategori_id || (kategoriBerita[0]?.id || 1),
          sumber: item.source || 'https://event.com',
          ringkasan: item.excerpt || 'Ringkasan berita',
          konten: item.excerpt || 'Konten berita',
          gambar: item.imageUrl || null,
          tanggal: item.date || new Date().toISOString().split('T')[0]
        };

        if (String(item.id).startsWith('n')) {
          // Berita baru
          await fetch(buildApiUrl('/api/berita'), {
            method: 'POST',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        } else {
          // Update berita
          await fetch(buildApiUrl(`/api/berita/${item.id}`), {
            method: 'PUT',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        }
      }

      setDeletedNewsIds([]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Error saving settings', err);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e, setter, idx, key) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setter(prev => prev.map((item, i) => i === idx ? { ...item, [key]: url } : item));
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
      source: 'https://eventhub.com', 
      excerpt: 'Tulis ringkasan berita di sini...', 
      imageUrl: '' 
    };
    setNewsItems(prev => [...prev, newItem]);
    setEditingNews(newItem);
  };

  const handleNewsImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !editingNews) return;
    const url = URL.createObjectURL(file);
    updateNews(editingNews.id, 'imageUrl', url);
    setEditingNews(prev => ({ ...prev, imageUrl: url }));
  };

  const tabs = [
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
                    <span className="aps-thumb-date">{slide.date}</span>
                  </div>
                  <button className="aps-thumb-del" onClick={(e) => { e.stopPropagation(); deleteBanner(idx); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Slide Editor */}
            {activeBanner && (
              <div className="aps-slide-editor">
                {/* Live Preview */}
                <div
                  className="aps-banner-preview"
                  style={{ background: activeBanner.foto_event_url ? '#0f172a' : 'linear-gradient(135deg,#1e293b,#0f172a)' }}
                >
                  {activeBanner.foto_event_url && (
                    <img src={activeBanner.foto_event_url} alt="Banner" className="aps-banner-bg-img" />
                  )}
                  {!activeBanner.foto_event_url && (
                    <div className="aps-banner-no-img"><ImageIcon size={36} /> Belum ada gambar</div>
                  )}
                  <div className="aps-banner-overlay">
                    <span className="aps-banner-date-badge">{activeBanner.date}</span>
                    <h3 className="aps-banner-preview-title">{activeBanner.title}</h3>
                    <p className="aps-banner-preview-sub">{activeBanner.subtitle}</p>
                  </div>
                  <div className="aps-preview-label"><Eye size={14} /> Preview Live</div>
                </div>

                {/* Form */}
                <div className="aps-editor-fields">
                  <div className="aps-field">
                    <label><Calendar size={14} /> Tanggal Ditampilkan</label>
                    <input className="aps-input" value={activeBanner.date} onChange={e => updateBanner(activeBannerIdx, 'date', e.target.value)} placeholder="contoh: 22 MAR 2026" />
                  </div>
                  <div className="aps-field">
                    <label><Edit3 size={14} /> Judul Slide</label>
                    <input className="aps-input" value={activeBanner.title} onChange={e => updateBanner(activeBannerIdx, 'title', e.target.value)} />
                  </div>
                  <div className="aps-field">
                    <label><FileText size={14} /> Deskripsi Singkat</label>
                    <textarea className="aps-input" rows="2" value={activeBanner.subtitle} onChange={e => updateBanner(activeBannerIdx, 'subtitle', e.target.value)} />
                  </div>
                  <UploadImageField
                    label="Foto Banner"
                    value={activeBanner.foto_event_url}
                    onUpload={e => handleImageUpload(e, setBannerSlides, activeBannerIdx, 'foto_event_url')}
                    onRemove={() => updateBanner(activeBannerIdx, 'foto_event_url', '')}
                  />
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
                  <label>Sumber / Penulis</label>
                  <input className="aps-input" value={editingNews.source} onChange={e => { setEditingNews({...editingNews, source: e.target.value}); updateNews(editingNews.id, 'source', e.target.value); }} />
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
