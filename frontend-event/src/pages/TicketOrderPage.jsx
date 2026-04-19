import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { buildApiUrl, defaultHeaders } from "../utils/api";
import { getUser } from "../utils/auth";
import { Ticket, CreditCard, UploadCloud, CheckCircle, ArrowLeft, Info, CalendarDays, MapPin, User, ChevronRight } from "lucide-react";
import TicketModal from "../components/TicketModal.jsx";
import "../HomePage.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80";

const fallbackEvents = [
  { id: 1, title: "Neon Night Music Festival Bandung", date: "22 Mar 2026", location: "Bandung, Jawa Barat", category: "Music & Festival", organizer: "Skyline Entertainment", harga: 180000, description: "Pengalaman musik terbaik tahun ini dengan artis-artis ternama.", foto_event_url: FALLBACK_IMAGE, custom_form_schema: [] },
];

function normalizeDetail(event, fallbackId) {
  if (!event) {
    return fallbackEvents.find(e => String(e.id) === String(fallbackId)) || fallbackEvents[0];
  }
  let parsedSchema = [];
  try {
    parsedSchema = event.custom_form_schema ? (typeof event.custom_form_schema === 'string' ? JSON.parse(event.custom_form_schema) : event.custom_form_schema) : [];
  } catch (e) { }

  return {
    id: event.id || event.id_event,
    title: event.title || event.nama_event || "Untitled Event",
    date: event.date || event.tanggal || "-",
    location: event.location || event.lokasi || "-",
    category: event.category || event.kategori?.nama_kategori || "Event Umum",
    harga: event.harga ?? null,
    foto_event_url: event.foto_event_url || (event.foto_event ? buildApiUrl(`/event/${event.foto_event}`) : FALLBACK_IMAGE),
    custom_form_schema: parsedSchema,
  };
}

export default function TicketOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [metodeList, setMetodeList] = useState([]);

  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({});

  const [form, setForm] = useState({
    jumlah_tiket: 1,
    harga_satuan: 0,
    metode_pembayaran_id: "",
    bukti_pembayaran: null,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [buktiPreview, setBuktiPreview] = useState(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  const authUser = useMemo(() => {
    try {
      return getUser() || {};
    } catch {
      return {};
    }
  }, []);

  const mockMetode = [
    { id: 1, nama_metode: 'BCA Virtual Account', nomor_tujuan: '8801 2345 6789', atas_nama: 'EventHub Official' },
    { id: 2, nama_metode: 'GoPay / QRIS', nomor_tujuan: '0812 3456 7890', atas_nama: 'EventHub' },
    { id: 3, nama_metode: 'Mandiri Virtual Account', nomor_tujuan: '8902 3456 7890', atas_nama: 'EventHub Official' },
  ];

  const userId = authUser?.id_user || authUser?.id || null;
  const totalBayar = Number(form.jumlah_tiket || 0) * Number(form.harga_satuan || 0);
  const isGratis = Number(form.harga_satuan || 0) <= 0;
  const selectedMetode = metodeList.find((m) => String(m.id || m.id_metode_pembayaran) === String(form.metode_pembayaran_id));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    Promise.all([
      fetch(buildApiUrl(`/api/event/${id}`), { headers: defaultHeaders }).then(res => res.ok ? res.json() : null),
      fetch(buildApiUrl("/api/metode-pembayaran"), { headers: defaultHeaders }).then(res => res.ok ? res.json() : null),
    ])
      .then(([eventData, metodeData]) => {
        const ev = normalizeDetail(eventData?.data || eventData, id);
        setEvent(ev);

        const mList = Array.isArray(metodeData?.data || metodeData) ? (metodeData?.data || metodeData) : mockMetode;
        setMetodeList(mList);

        setForm(prev => ({ ...prev, harga_satuan: Number(ev.harga || 0) }));
      })
      .catch(() => {
        const ev = normalizeDetail(null, id);
        setEvent(ev);
        setMetodeList(mockMetode);
        setForm(prev => ({ ...prev, harga_satuan: Number(ev.harga || 0) }));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && event) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, event]);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "bukti_pembayaran") {
      const file = files?.[0] || null;
      setForm((prev) => ({ ...prev, bukti_pembayaran: file }));
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setBuktiPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setBuktiPreview(null);
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponseChange = (fieldId, value) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleNextStep = () => {
    setError("");
    if (!userId) {
      setError("Silakan login dulu sebelum mendaftar event.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Validate required fields
    if (event?.custom_form_schema?.length > 0) {
      for (const field of event.custom_form_schema) {
        if (field.isRequired && !responses[field.id]) {
          setError(`Pertanyaan "${field.question}" wajib diisi.`);
          return;
        }
      }
    }

    setStep(2);
  };

  const handleOrder = async () => {
    setError("");
    setSuccess("");

    // ── Validasi ──────────────────────────────────────────
    if (Number(form.jumlah_tiket) < 1) {
      setError("Jumlah tiket minimal 1.");
      return;
    }

    if (!isGratis) {
      if (!form.metode_pembayaran_id) {
        setError("Silakan pilih metode pembayaran terlebih dahulu.");
        return;
      }
      if (!form.bukti_pembayaran) {
        setError("Bukti pembayaran wajib diupload untuk event berbayar.");
        return;
      }
      // Validasi tipe file
      const allowed = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowed.includes(form.bukti_pembayaran.type)) {
        setError("File bukti pembayaran harus berupa gambar (JPG, JPEG, PNG).");
        return;
      }
      // Validasi ukuran file (maks 2MB)
      if (form.bukti_pembayaran.size > 2 * 1024 * 1024) {
        setError("Ukuran file bukti pembayaran maksimal 2 MB.");
        return;
      }
    }

    if (!userId) {
      setError("Silakan login dulu sebelum mendaftar event.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      setSubmitting(true);

      // ── Step 1: Daftar event (buat pendaftaran) ──────────
      const daftarBody = JSON.stringify({
        user_id:              userId,
        event_id:             Number(id),
        jumlah_tiket:         Number(form.jumlah_tiket),
        total_harga:          totalBayar,
        custom_form_responses: responses,
        status_pendaftaran:   isGratis ? "confirmed" : "menunggu_verifikasi",
      });

      const daftarRes = await fetch(buildApiUrl("/api/daftar-event"), {
        method:  "POST",
        headers: defaultHeaders,
        body:    daftarBody,
      });

      let pendaftaranId = null;
      if (daftarRes.ok) {
        const daftarData = await daftarRes.json();
        pendaftaranId = daftarData?.data?.id || daftarData?.id || null;
      } else {
        const errData = await daftarRes.json().catch(() => ({}));
        // Jika sudah terdaftar, lanjutkan saja; jika error lain, hentikan
        if (daftarRes.status !== 409) {
          throw new Error(errData.message || `Gagal mendaftar event (${daftarRes.status}).`);
        }
      }

      // ── Step 2: Upload bukti pembayaran (event berbayar) ─
      if (!isGratis && pendaftaranId) {
        const payFormData = new FormData();
        payFormData.append("pendaftaran_id",     pendaftaranId);
        payFormData.append("jumlah_bayar",        totalBayar);
        payFormData.append("metode_pembayaran_id", form.metode_pembayaran_id);
        payFormData.append("bukti_pembayaran",    form.bukti_pembayaran);
        payFormData.append("status_pembayaran",   "pending");

        const token = localStorage.getItem("token") || "";
        const payRes = await fetch(buildApiUrl("/api/pembayaran"), {
          method:  "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body:    payFormData,
        });

        if (!payRes.ok) {
          const payErr = await payRes.json().catch(() => ({}));
          throw new Error(payErr.message || "Gagal mengupload bukti pembayaran.");
        }
      }

      // ── Step 3: Sukses ─────────────────────────────────────
      setSuccess(
        isGratis
          ? "Pendaftaran berhasil! Selamat, Anda terdaftar di event ini."
          : "Pembayaran berhasil dikirim, menunggu verifikasi admin."
      );

      // Siapkan data tiket untuk modal
      setTicketData({
        qrValue: pendaftaranId ? `EVT-${pendaftaranId}` : `EVT-${id}-${Date.now()}`,
        eventName: event?.title,
        userName: authUser?.name || 'Guest',
        date: event?.date,
        location: event?.location,
        ticketCount: form.jumlah_tiket
      });
      // Tampilkan popup tiket
      setShowTicketModal(true);

    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi saat memesan tiket.");
    } finally {
      setSubmitting(false);
    }
  };


  const renderCustomField = (field) => {
    const value = responses[field.id] || "";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value} onChange={(e) => handleResponseChange(field.id, e.target.value)}
            style={{ width: '100%', background: 'rgba(15,13,26,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical', minHeight: '100px' }}
            onFocus={e => { e.target.style.borderColor = '#a855f7'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        );
      case 'dropdown':
        return (
          <select
            value={value} onChange={(e) => handleResponseChange(field.id, e.target.value)}
            style={{ width: '100%', background: 'rgba(15,13,26,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: value ? '#fff' : '#64748b', fontSize: '1rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = '#a855f7'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <option value="">Pilih Opsi</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {field.options?.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="radio"
                  name={`field_${field.id}`}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleResponseChange(field.id, e.target.value)}
                  style={{ accentColor: '#a855f7', width: '18px', height: '18px' }}
                />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        const checkedValues = Array.isArray(value) ? value : [];
        const handleCheckbox = (opt) => {
          const newValues = checkedValues.includes(opt) ? checkedValues.filter(v => v !== opt) : [...checkedValues, opt];
          handleResponseChange(field.id, newValues);
        };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {field.options?.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={checkedValues.includes(opt)}
                  onChange={() => handleCheckbox(opt)}
                  style={{ accentColor: '#a855f7', width: '18px', height: '18px' }}
                />
                {opt}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value} onChange={(e) => handleResponseChange(field.id, e.target.value)}
            style={{ width: '100%', background: 'rgba(15,13,26,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = '#a855f7'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        );
    }
  };

  if (loading || !event) {
    return (
      <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0f0d1a, #16131f)' }}>
        <NavbarCustom />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ep-spinner"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0f0d1a, #16131f)', color: '#f8fafc' }}>
      <NavbarCustom />

      <main key="loaded" className="page-animate-enter" style={{ flex: 1, paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '850px' }}>

          <button
            onClick={() => step === 2 ? setStep(1) : navigate(`/events/${event.id}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#c084fc', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: 0, marginBottom: '24px' }}
          >
            <ArrowLeft size={16} /> {step === 2 ? "Kembali ke Form" : "Batal & Kembali ke Detail"}
          </button>

          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? '#a855f7' : '#64748b', fontWeight: 600 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= 1 ? '#a855f7' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>1</div>
              <span>Detail Peserta</span>
            </div>
            <div style={{ height: 2, width: 40, background: step >= 2 ? '#a855f7' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? '#a855f7' : '#64748b', fontWeight: 600 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= 2 ? '#a855f7' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>2</div>
              <span>Pembayaran</span>
            </div>
          </div>

          <div style={{ background: 'rgba(30,26,46,0.7)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>

            {/* Header Form */}
            <div style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.1), rgba(59,130,246,0.1))', padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={event.foto_event_url} alt={event.title} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} />
              <div style={{ flex: 1, minWidth: '250px' }}>
                <span style={{ display: 'inline-block', background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px' }}>{step === 1 ? 'FORMULIR PENDAFTARAN' : 'PEMBAYARAN TIKET'}</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 12px', color: '#fff', lineHeight: 1.3 }}>{event.title}</h1>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={14} /> {event.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {event.location}</span>
                </div>
              </div>
            </div>

            {/* Body Form */}
            <div style={{ padding: '32px' }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Info size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{success}</span>
                </div>
              )}

              {step === 1 ? (
                // --- STEP 1: CUSTOM FORM ---
                <div>
                  {event.custom_form_schema && event.custom_form_schema.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                      {event.custom_form_schema.map((field) => (
                        <div key={field.id}>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                            {field.question} {field.isRequired && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {renderCustomField(field)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '32px', color: '#94a3b8', textAlign: 'center' }}>
                      Penyelenggara tidak menambahkan form khusus untuk event ini. Silakan lanjut ke pembayaran.
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                    <button
                      onClick={handleNextStep}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '16px 32px', background: 'linear-gradient(135deg, #9333ea, #a855f7)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 25px rgba(147,51,234,0.3)', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(147,51,234,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 10px 25px rgba(147,51,234,0.3)'; }}
                    >
                      Lanjut ke Pembayaran <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                // --- STEP 2: PAYMENT & TICKET ---
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Jumlah Tiket</label>
                      <div style={{ position: 'relative' }}>
                        <Ticket size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                          type="number" name="jumlah_tiket" min="1" max="10"
                          value={form.jumlah_tiket} onChange={onChange}
                          style={{ width: '100%', background: 'rgba(15,13,26,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px 14px 44px', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }}
                          onFocus={e => { e.target.style.borderColor = '#a855f7'; e.target.style.background = 'rgba(15,13,26,0.8)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(15,13,26,0.6)'; }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Harga Satuan</label>
                      <input
                        type="text" value={isGratis ? "Gratis" : `Rp ${Number(form.harga_satuan).toLocaleString('id-ID')}`} readOnly
                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px', borderRadius: '12px', color: '#cbd5e1', fontSize: '1rem', outline: 'none', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {!isGratis && (
                    <>
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Metode Pembayaran</label>
                        <div style={{ position: 'relative' }}>
                          <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                          <select
                            name="metode_pembayaran_id" value={form.metode_pembayaran_id} onChange={onChange}
                            style={{ width: '100%', background: 'rgba(15,13,26,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px 14px 44px', borderRadius: '12px', color: form.metode_pembayaran_id ? '#fff' : '#64748b', fontSize: '1rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                            onFocus={e => { e.target.style.borderColor = '#a855f7'; e.target.style.background = 'rgba(15,13,26,0.8)'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(15,13,26,0.6)'; }}
                          >
                            <option value="">Pilih metode pembayaran (Transfer / E-Wallet)</option>
                            {metodeList.map((m) => (
                              <option key={m.id || m.id_metode_pembayaran} value={m.id || m.id_metode_pembayaran}>
                                {m.nama_metode}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selectedMetode && (
                        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.3)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#93c5fd' }}>Silakan transfer sesuai nominal ke rekening berikut:</p>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#fff' }}>{selectedMetode.nama_metode} - {selectedMetode.nomor_tujuan}</h3>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>A.N. {selectedMetode.atas_nama}</p>
                        </div>
                      )}

                      <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Upload Bukti Pembayaran <span style={{ color: '#ef4444' }}>*</span></label>
                        
                        {/* Preview */}
                        {buktiPreview && (
                          <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.3)', position: 'relative' }}>
                            <img
                              src={buktiPreview}
                              alt="Preview Bukti"
                              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                            />
                            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(16,185,129,0.9)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                              ✓ Siap Upload
                            </div>
                          </div>
                        )}

                        <div style={{ position: 'relative', width: '100%', border: `1px dashed ${buktiPreview ? 'rgba(16,185,129,0.5)' : 'rgba(168,85,247,0.4)'}`, borderRadius: '12px', background: buktiPreview ? 'rgba(16,185,129,0.05)' : 'rgba(15,13,26,0.5)', transition: 'all 0.2s', overflow: 'hidden' }}>
                          <input
                            type="file" name="bukti_pembayaran" accept="image/jpeg,image/jpg,image/png" onChange={onChange}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                          />
                          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', pointerEvents: 'none' }}>
                            <UploadCloud size={26} style={{ color: buktiPreview ? '#10b981' : '#c084fc' }} />
                            <span style={{ fontSize: '0.88rem', color: buktiPreview ? '#6ee7b7' : '#94a3b8', fontWeight: buktiPreview ? 600 : 400 }}>
                              {form.bukti_pembayaran ? `✓ ${form.bukti_pembayaran.name}` : "Klik atau seret gambar bukti transfer (JPG/PNG, maks 2 MB)"}
                            </span>
                            {buktiPreview && (
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Klik untuk ganti gambar</span>
                            )}
                          </div>
                        </div>
                      </div>

                    </>
                  )}

                  {/* Total & Submit */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Pembayaran</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {isGratis ? "Gratis" : `Rp ${totalBayar.toLocaleString("id-ID")}`}
                      </div>
                    </div>

                    <button
                      onClick={handleOrder}
                      disabled={submitting}
                      style={{
                        padding: '16px 32px', background: 'linear-gradient(135deg, #9333ea, #a855f7)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 10px 25px rgba(147,51,234,0.3)', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(147,51,234,0.4)'; } }}
                      onMouseLeave={e => { if (!submitting) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 10px 25px rgba(147,51,234,0.3)'; } }}
                    >
                      {submitting ? 'Memproses Pesanan...' : (isGratis ? 'Daftar Sekarang' : 'Konfirmasi & Bayar')}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* TICKET POPUP */}
      <TicketModal 
        isOpen={showTicketModal} 
        onClose={() => {
          setShowTicketModal(false);
          // Setelah popup ditutup, navigasi ke halaman success
          navigate(`/events/${id}/success`);
        }} 
        ticketData={ticketData} 
      />
    </div>
  );
}
