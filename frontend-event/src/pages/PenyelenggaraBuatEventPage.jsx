import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Calendar, MapPin, Users, Tag, FileText, Image, Clock, Plus, Trash2, GripVertical, Settings2, ListPlus, X, CheckCircle } from 'lucide-react';
import '../styles/AdminDashboard.css';
import { buildApiUrl } from '../utils/api';
import { getToken } from '../utils/auth';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s',
};

const selectStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(30,41,59,0.8)',
  color: '#f1f5f9',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.2s',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const DEFAULT_CATEGORIES = [
  { id: 1, nama: 'Webinar & Seminar' },
  { id: 2, nama: 'Kompetisi' },
  { id: 3, nama: 'Acara Kampus' },
  { id: 4, nama: 'Workshop' }
];

export default function PenyelenggaraBuatEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(false);
  const [form, setForm] = useState({
    nama: '', kategori: '', tanggal: '', waktu_mulai: '', waktu_selesai: '',
    event_type: 'offline', lokasi: '', meeting_link: '', kapasitas: '', harga: '', deskripsi: '', poster: '',
    metode_pembayaran: [{ nama: '', detail: '' }],
  });

  const [posterPreview, setPosterPreview] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // State for Custom Form Builder
  const [customFields, setCustomFields] = useState([
    { id: Date.now(), question: '', type: 'text', isRequired: false, options: [''] }
  ]);

  // Fetch categories from API (optional enhancement)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/kategori'));
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          }
        }
      } catch (error) {
        console.log('Using default categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch event for editing
  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        setLoadingData(true);
        try {
          const res = await fetch(buildApiUrl(`/api/event/${id}`));
          const data = await res.json();
          if (res.ok) {
            setForm({
              nama: data.nama_event || '',
              kategori: data.kategori_id || '',
              tanggal: data.tanggal || '',
              waktu_mulai: '',
              waktu_selesai: '',
              event_type: data.event_type || 'offline',
              lokasi: data.lokasi || '',
              meeting_link: data.meeting_link || '',
              kapasitas: data.kapasitas || 100,
              harga: data.harga || 0,
              deskripsi: data.deskripsi || '',
              poster: data.foto_event || '',
              metode_pembayaran: Array.isArray(data.metode_pembayaran) ? data.metode_pembayaran : [{ nama: '', detail: '' }],
            });
            if (data.foto_event_url) {
              setPosterPreview(data.foto_event_url);
            }
            if (data.custom_form_schema) {
              try {
                const schema = typeof data.custom_form_schema === 'string' ? JSON.parse(data.custom_form_schema) : data.custom_form_schema;
                if (Array.isArray(schema)) setCustomFields(schema);
              } catch (e) {}
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingData(false);
        }
      };
      fetchEvent();
    }
  }, [id]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Harap upload file gambar (PNG, JPG, etc)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar, maksimal 5 MB');
        return;
      }

      setPosterFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPosterPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
    setForm(p => ({ ...p, poster: '' }));
  };

  const uploadPoster = async () => {
    if (!posterFile) return null;

    setUploadingPoster(true);
    try {
      const formData = new FormData();
      formData.append('foto_event', posterFile);

      const response = await fetch(buildApiUrl('/api/upload-poster'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.filename || data.file_path || data.url;
      } else {
        console.error('Upload failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nama || !form.kategori || !form.tanggal || !form.kapasitas) {
      alert('Harap isi semua field yang wajib (*)');
      return;
    }
    if (form.event_type === 'offline' && !form.lokasi) {
      alert('Harap isi lokasi untuk event offline.');
      return;
    }
    if (form.event_type === 'online' && !form.meeting_link) {
      alert('Harap isi link meeting untuk event online.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nama_event', form.nama);
      formData.append('kategori_id', form.kategori);
      formData.append('tanggal', form.tanggal);
      formData.append('event_type', form.event_type);
      if (form.event_type === 'offline') formData.append('lokasi', form.lokasi);
      if (form.event_type === 'online') formData.append('meeting_link', form.meeting_link);
      formData.append('deskripsi', form.deskripsi);
      formData.append('harga', form.harga || 0);
      formData.append('custom_form_schema', JSON.stringify(customFields));
      formData.append('metode_pembayaran', JSON.stringify(form.metode_pembayaran));

      // Add poster file if exists
      if (posterFile) {
        formData.append('foto_event', posterFile);
      }

      if (id) {
        formData.append('_method', 'PUT');
      }

      // Get auth token from utility
      const token = getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = id ? buildApiUrl(`/api/event/${id}`) : buildApiUrl('/api/event');
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const result = await response.json();
      console.log('Response:', { status: response.status, body: result });

      if (response.ok) {
        if (!id) {
          setShowSuccessPopup(true);
          // Reset form
          setForm({
            nama: '', kategori: '', tanggal: '', waktu_mulai: '', waktu_selesai: '',
            event_type: 'offline', lokasi: '', meeting_link: '', kapasitas: '', harga: '', deskripsi: '', poster: '',
            metode_pembayaran: [{ nama: '', detail: '' }],
          });
          setPosterFile(null);
          setPosterPreview(null);
        } else {
          navigate('/penyelenggara/events');
        }
      } else {
        const errorMsg = result.message || `Error ${response.status}`;
        console.error('API Error:', errorMsg);
        alert('Gagal menyimpan event: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan: ' + (error.message || 'Silakan coba lagi'));
    }
  };

  const fieldFocus = e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.14)'; };
  const fieldBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

  // Custom Form Builder Handlers
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: Date.now(), question: '', type: 'text', isRequired: false, options: [''] }
    ]);
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const updateCustomField = (id, key, value) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const addFieldOption = (fieldId) => {
    setCustomFields(customFields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), ''] };
      }
      return f;
    }));
  };

  const updateFieldOption = (fieldId, optionIndex, value) => {
    setCustomFields(customFields.map(f => {
      if (f.id === fieldId) {
        const newOptions = [...f.options];
        newOptions[optionIndex] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const removeFieldOption = (fieldId, optionIndex) => {
    setCustomFields(customFields.map(f => {
      if (f.id === fieldId) {
        const newOptions = f.options.filter((_, idx) => idx !== optionIndex);
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const addPaymentMethod = () => {
    setForm(p => ({
      ...p,
      metode_pembayaran: [...p.metode_pembayaran, { nama: '', detail: '' }]
    }));
  };

  const removePaymentMethod = (index) => {
    setForm(p => ({
      ...p,
      metode_pembayaran: p.metode_pembayaran.filter((_, i) => i !== index)
    }));
  };

  const updatePaymentMethod = (index, field, value) => {
    setForm(p => {
      const newMethods = [...p.metode_pembayaran];
      newMethods[index] = { ...newMethods[index], [field]: value };
      return { ...p, metode_pembayaran: newMethods };
    });
  };

  return (
    <div className="adash-wrap">
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">{id ? 'Edit Event' : 'Buat Event Baru'}</h1>
          <p className="adash-page-sub">{id ? 'Perbarui informasi event yang sudah ada.' : 'Lengkapi informasi event yang akan Anda selenggarakan.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="adash-2col-form">

          {/* Main form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Informasi Dasar */}
            <div className="adash-chart-card">
              <div className="adash-chart-head" style={{ marginBottom: 20 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                  <FileText size={18} style={{ color: '#7c3aed' }} /> Informasi Dasar
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Nama Event *">
                  <input name="nama" value={form.nama} onChange={handleChange}
                    placeholder="Masukkan nama event..." required
                    style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </FormField>
                <FormField label="Kategori">
                  <select name="kategori" value={form.kategori} onChange={handleChange}
                    style={selectStyle} onFocus={fieldFocus} onBlur={fieldBlur}>
                    <option value="">Pilih kategori</option>
                    <option value="1">Webinar & Seminar</option>
                    <option value="2">Kompetisi</option>
                    <option value="3">Acara Kampus</option>
                    <option value="4">Workshop</option>
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>({categories?.length || 0} kategori tersedia)</p>
                </FormField>
                <FormField label="Deskripsi Event">
                  <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
                    placeholder="Deskripsikan event Anda secara detail..." rows={5}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={fieldFocus} onBlur={fieldBlur} />
                </FormField>
              </div>
            </div>

            {/* Waktu & Lokasi */}
            <div className="adash-chart-card">
              <div className="adash-chart-head" style={{ marginBottom: 20 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                  <Calendar size={18} style={{ color: '#0ea5e9' }} /> Waktu &amp; Lokasi
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Tanggal Event *">
                  <input name="tanggal" type="date" value={form.tanggal} onChange={handleChange}
                    required style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <FormField label="Waktu Mulai">
                    <input name="waktu_mulai" type="time" value={form.waktu_mulai} onChange={handleChange}
                      style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                  </FormField>
                  <FormField label="Waktu Selesai">
                    <input name="waktu_selesai" type="time" value={form.waktu_selesai} onChange={handleChange}
                      style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                  </FormField>
                </div>
                <FormField label="Tipe Event *">
                  <select name="event_type" value={form.event_type} onChange={handleChange}
                    style={selectStyle} onFocus={fieldFocus} onBlur={fieldBlur}>
                    <option value="offline">Offline (Di Tempat)</option>
                    <option value="online">Online (Virtual Meeting)</option>
                  </select>
                </FormField>
                {form.event_type === 'offline' && (
                  <FormField label="Lokasi / Venue *">
                    <input name="lokasi" value={form.lokasi} onChange={handleChange}
                      placeholder="Nama gedung, kota, dsb" required
                      style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                  </FormField>
                )}
                {form.event_type === 'online' && (
                  <FormField label="Link Meeting (Zoom/GMeet) *">
                    <input name="meeting_link" value={form.meeting_link} onChange={handleChange}
                      placeholder="https://zoom.us/j/123456789" required
                      style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                  </FormField>
                )}
              </div>
            </div>

            {/* Form Pendaftaran Custom */}
            <div className="adash-chart-card">
              <div className="adash-chart-head" style={{ marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                    <ListPlus size={18} style={{ color: '#f43f5e' }} /> Form Pendaftaran Custom
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 6, marginBottom: 0 }}>
                    Buat formulir pendaftaran khusus untuk peserta event (seperti Google Form).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {customFields.map((field, index) => (
                  <div key={field.id} style={{
                    background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '20px 24px', position: 'relative'
                  }}>
                    {/* Header: Drag Icon & Delete */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                        <GripVertical size={16} style={{ cursor: 'grab' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pertanyaan {index + 1}</span>
                      </div>
                      <button type="button" onClick={() => removeCustomField(field.id)} style={{
                        background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer',
                        padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'background 0.2s'
                      }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Question & Type */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, marginBottom: 16 }}>
                      <input
                        type="text"
                        value={field.question}
                        onChange={e => updateCustomField(field.id, 'question', e.target.value)}
                        placeholder="Pertanyaan (misal: Alasan mengikuti event?)"
                        style={{ ...inputStyle, background: 'rgba(30,41,59,0.5)', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px 10px 0 0' }}
                        onFocus={e => e.target.style.borderBottomColor = '#7c3aed'}
                        onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'}
                      />
                      <select
                        value={field.type}
                        onChange={e => updateCustomField(field.id, 'type', e.target.value)}
                        style={selectStyle}
                        onFocus={fieldFocus} onBlur={fieldBlur}
                      >
                        <option value="text">Teks Singkat</option>
                        <option value="textarea">Paragraf</option>
                        <option value="radio">Pilihan Ganda</option>
                        <option value="checkbox">Kotak Centang</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="file">Upload File</option>
                      </select>
                    </div>

                    {/* Options if type requires it */}
                    {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
                      <div style={{ marginLeft: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {field.options?.map((opt, oIndex) => (
                          <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {field.type === 'radio' && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #64748b' }} />}
                            {field.type === 'checkbox' && <div style={{ width: 14, height: 14, borderRadius: 3, border: '2px solid #64748b' }} />}
                            {field.type === 'dropdown' && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{oIndex + 1}.</span>}

                            <input
                              type="text"
                              value={opt}
                              onChange={e => updateFieldOption(field.id, oIndex, e.target.value)}
                              placeholder={`Opsi ${oIndex + 1}`}
                              style={{
                                flex: 1, background: 'transparent', border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0',
                                outline: 'none', padding: '4px 0', fontSize: '0.9rem'
                              }}
                              onFocus={e => e.target.style.borderBottomColor = '#7c3aed'}
                              onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'}
                            />
                            {field.options.length > 1 && (
                              <button type="button" onClick={() => removeFieldOption(field.id, oIndex)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addFieldOption(field.id)} style={{
                          alignSelf: 'flex-start', background: 'transparent', border: 'none',
                          color: '#0ea5e9', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0'
                        }}>
                          <Plus size={14} /> Tambah Opsi
                        </button>
                      </div>
                    )}

                    {/* Footer: Required Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 4 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        Wajib Diisi
                        <div style={{
                          position: 'relative', width: 36, height: 20,
                          background: field.isRequired ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                          borderRadius: 20, transition: 'background 0.3s'
                        }}>
                          <div style={{
                            position: 'absolute', top: 2, left: field.isRequired ? 18 : 2,
                            width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.3s'
                          }} />
                        </div>
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={e => updateCustomField(field.id, 'isRequired', e.target.checked)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addCustomField} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: '1px dashed rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.05)',
                  color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)' }}
                >
                  <Plus size={16} /> Tambah Pertanyaan Baru
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tiket */}
            <div className="adash-chart-card">
              <div className="adash-chart-head" style={{ marginBottom: 20 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                  <Users size={18} style={{ color: '#10b981' }} /> Tiket &amp; Kapasitas
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Kapasitas Peserta *">
                  <input name="kapasitas" type="number" min={1} value={form.kapasitas} onChange={handleChange}
                    placeholder="Maks. peserta" required
                    style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </FormField>
                <FormField label="Harga Tiket (Rp)">
                  <input name="harga" type="number" min={0} value={form.harga} onChange={handleChange}
                    placeholder="0 = Gratis"
                    style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </FormField>

                {Number(form.harga) > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={labelStyle}>Metode Pembayaran Peserta</p>
                    {form.metode_pembayaran.map((m, idx) => (
                      <div key={idx} style={{ 
                        padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 10,
                        position: 'relative'
                      }}>
                        {form.metode_pembayaran.length > 1 && (
                          <button type="button" onClick={() => removePaymentMethod(idx)} style={{
                            position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer'
                          }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                        <input 
                          placeholder="Nama Metode (Misal: Bank BCA)" 
                          value={m.nama} 
                          onChange={e => updatePaymentMethod(idx, 'nama', e.target.value)}
                          style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} 
                        />
                        <textarea 
                          placeholder="Detail (No. Rekening / Instruksi)" 
                          value={m.detail} 
                          onChange={e => updatePaymentMethod(idx, 'detail', e.target.value)}
                          style={{ ...inputStyle, resize: 'vertical' }} rows={2}
                          onFocus={fieldFocus} onBlur={fieldBlur} 
                        />
                      </div>
                    ))}
                    <button type="button" onClick={addPaymentMethod} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.2)',
                      background: 'transparent', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer'
                    }}>
                      <Plus size={14} /> Tambah Metode
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Poster */}
            <div className="adash-chart-card">
              <div className="adash-chart-head" style={{ marginBottom: 16 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                  <Image size={18} style={{ color: '#f59e0b' }} /> Poster Event
                </h2>
              </div>

              {posterPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={posterPreview} alt="Preview" style={{ width: '100%', borderRadius: 12, marginBottom: 12, maxHeight: 300, objectFit: 'cover' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 8, background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', color: '#3b82f6',
                      fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                    >
                      <span>Ubah Poster</span>
                      <input type="file" accept="image/*" onChange={handlePosterChange} style={{ display: 'none' }} />
                    </label>
                    <button type="button" onClick={removePoster} style={{
                      flex: 0.8, padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{
                  border: '2px dashed rgba(124,58,237,0.3)', borderRadius: 12,
                  padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', background: 'rgba(124,58,237,0.04)', display: 'block'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
                >
                  <Image size={32} style={{ color: '#7c3aed', marginBottom: 8 }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '4px 0' }}>Klik untuk upload poster</p>
                  <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0 }}>PNG, JPG, maks. 5 MB</p>
                  <input type="file" accept="image/*" onChange={handlePosterChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Submit */}
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(124,58,237,0.3)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124,58,237,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 15px rgba(124,58,237,0.3)'; }}
            >
              <Save size={17} /> {id ? 'Simpan Perubahan' : 'Simpan & Publikasikan'}
            </button>
          </div>
        </div>
      </form>
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="apg-success-popup">
          <div className="apg-success-content">
            <div className="apg-success-icon">
              <CheckCircle size={32} />
            </div>
            <h3>Event Berhasil Dibuat</h3>
            <p>Event Anda telah berhasil disimpan dan dipublikasikan ke publik.</p>
            <button type="button" className="apg-success-btn" onClick={() => {
              setShowSuccessPopup(false);
              navigate('/penyelenggara/events');
            }}>Lihat Daftar Event</button>
          </div>
        </div>
      )}
    </div>
  );
}
