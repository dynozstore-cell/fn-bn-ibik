import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, Upload, Trash2, CheckCircle, Search, Filter, Calendar, Settings, X, Play
} from 'lucide-react';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminEventsPage.css';

const PER_PAGE_OPTIONS = [10, 50, 100, "Semua"];

function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PenyelenggaraSertifikatPage() {
  const token = getToken() || '';
  const authHeaders = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // Default semua event
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Setting Sertifikat
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [fileTemplate, setFileTemplate] = useState(null);
  const [previewTemplateUrl, setPreviewTemplateUrl] = useState(null);
  const [config, setConfig] = useState({
    x: '50%',
    y: '50%',
    fontSize: '30px',
    color: '#000000',
    align: 'center'
  });
  const [uploading, setUploading] = useState(false);

  // Status Generate
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Ambil dari laporan saja karena butuh info partisipan
      const res = await fetch(buildApiUrl('/api/admin/laporan'), { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
            // Need to fetch original events to get sertifikat config.
            // But since admin/laporan doesn't have sertifikat info, we might need another endpoint or just fetch /api/penyelenggara 
            // Wait, `/api/penyelenggara` gets the user's events? Actually `/api/event` gets all public events.
            // Let's fetch the events from `/api/penyelenggara` or `/api/event`?
            // `PenyelenggaraEventsPage.jsx` fetches from `/api/admin/laporan` or `/api/event`?
            // Actually let's fetch from `/api/admin/laporan` and then fetch event details for selected.
            // But wait, the laporan endpoint only gives id, nama, tanggal.
            
            // Let's fetch all events for this organizer
            const evRes = await fetch(buildApiUrl('/api/event'), { headers: authHeaders });
            let allEv = [];
            if(evRes.ok) {
                allEv = await evRes.json();
            }

            // Gabungkan
            const myEvents = data.data.map(l => {
                const evDetail = allEv.find(e => e.id === l.id) || {};
                const evDate = new Date(l.tanggal);
                const isSelesai = evDate < new Date();
                return {
                    id: l.id,
                    nama: l.nama_event,
                    tanggal: l.tanggal,
                    totalPeserta: l.pendaftar,
                    hadir: l.hadir,
                    statusVal: isSelesai ? 'selesai' : 'aktif',
                    isSelesai: isSelesai,
                    sertifikat_template: evDetail.sertifikat_template,
                    sertifikat_config: evDetail.sertifikat_config
                };
            });
            setEventsList(myEvents);
        }
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /* ─── LIST VIEW LOGIC ─────────────────────────────────────────── */
  const filteredEvents = useMemo(() => {
    return eventsList.filter(e => {
      const matchSearch = !search || e.nama.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || e.statusVal === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [eventsList, search, filterStatus]);

  const totalPages = perPage === "Semua" ? 1 : Math.max(1, Math.ceil(filteredEvents.length / perPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    if (perPage === "Semua") return filteredEvents;
    const start = (safePage - 1) * perPage;
    return filteredEvents.slice(start, start + perPage);
  }, [filteredEvents, perPage, safePage]);

  function getPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const left = Math.max(1, cur - 2);
    const right = Math.min(total, cur + 2);
    const pages = [];
    if (left > 1) { pages.push(1); if (left > 2) pages.push("…"); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total) { if (right < total - 1) pages.push("…"); pages.push(total); }
    return pages;
  }

  /* ─── HANDLERS ─────────────────────────────────────────── */
  const openSetting = (ev) => {
    setSelectedEvent(ev);
    setPreviewTemplateUrl(ev.sertifikat_template ? buildApiUrl(ev.sertifikat_template) : null);
    if (ev.sertifikat_config) {
        setConfig(ev.sertifikat_config);
    } else {
        setConfig({ x: '50%', y: '50%', fontSize: '30px', color: '#000000', align: 'center' });
    }
    setFileTemplate(null);
    setIsSettingModalOpen(true);
    setGenerateResult(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileTemplate(file);
      setPreviewTemplateUrl(URL.createObjectURL(file));
    }
  };

  const saveSettings = async () => {
    setUploading(true);
    const formData = new FormData();
    if (fileTemplate) {
      formData.append('template', fileTemplate);
    }
    formData.append('config', JSON.stringify(config));

    try {
      const res = await fetch(buildApiUrl(`/api/sertifikat/template/${selectedEvent.id}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert('Pengaturan sertifikat berhasil disimpan');
        fetchEvents(); // reload list
        setIsSettingModalOpen(false);
      } else {
        const d = await res.json();
        alert('Gagal: ' + (d.message || 'Error'));
      }
    } catch (e) {
      alert('Error koneksi');
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = async () => {
    if(!window.confirm("Yakin ingin menghapus template ini?")) return;
    try {
        const res = await fetch(buildApiUrl(`/api/sertifikat/template/${selectedEvent.id}`), {
            method: 'DELETE',
            headers: authHeaders
        });
        if(res.ok) {
            setPreviewTemplateUrl(null);
            setFileTemplate(null);
            fetchEvents();
        }
    } catch(e) {
        console.error(e);
    }
  };

  const generateSertifikat = async (ev) => {
    if(!window.confirm(`Mulai proses pembuatan sertifikat untuk ${ev.nama}?`)) return;
    setGenerating(true);
    try {
      const res = await fetch(buildApiUrl(`/api/sertifikat/generate/${ev.id}`), {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setGenerateResult(`Berhasil: ${data.summary.berhasil}, Gagal: ${data.summary.gagal}.`);
        alert(`Selesai! Berhasil: ${data.summary.berhasil}, Gagal: ${data.summary.gagal}.`);
      } else {
        alert('Gagal: ' + data.message);
      }
    } catch (e) {
      alert('Error koneksi');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="aep-wrap">
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">Sertifikat Event</h1>
          <p className="adash-page-sub">Kelola template dan bagikan sertifikat otomatis ke peserta yang hadir.</p>
        </div>
      </div>

      <div className="aep-table-card">
        <div className="aep-toolbar">
          <div className="aep-search-wrap">
            <Search size={15} className="aep-search-icon" />
            <input
              className="aep-search"
              placeholder="Cari nama event..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="aep-filter-wrap">
            <Filter size={14} className="aep-filter-icon" />
            <select
              className="aep-filter-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Semua Status Event</option>
              <option value="selesai">Selesai (Siap Sertifikat)</option>
              <option value="aktif">Akan Datang (Belum Selesai)</option>
            </select>
          </div>
        </div>

        <div className="aep-table-wrap adash-table-responsive">
          <table className="aep-table">
            <thead>
              <tr>
                <th><span className="aep-th-inner">#</span></th>
                <th><span className="aep-th-inner"><Calendar size={13} /> Event</span></th>
                <th><span className="aep-th-inner">Hadir / Pendaftar</span></th>
                <th><span className="aep-th-inner">Status Event</span></th>
                <th><span className="aep-th-inner">Template</span></th>
                <th style={{ textAlign: "right" }}><span className="aep-th-inner" style={{ justifyContent: "flex-end" }}>Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="aep-td-center">
                    <div className="aep-loading"><span className="aep-spinner" /> Memuat data…</div>
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="aep-td-center">
                    <div className="aep-empty">
                      <Award size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                      <br />Tidak ada event yang ditemukan
                    </div>
                  </td>
                </tr>
              ) : paginatedEvents.map((ev, idx) => {
                const rowNum = perPage === "Semua" ? idx + 1 : (safePage - 1) * perPage + idx + 1;
                return (
                  <tr key={ev.id} className="aep-tr">
                    <td className="aep-td-num">{rowNum}</td>
                    <td className="aep-td-judul" title={ev.nama}>{ev.nama}<br/><small style={{color:'#64748b', fontWeight:'normal'}}>{formatDate(ev.tanggal)}</small></td>
                    <td><strong style={{color:'#10b981'}}>{ev.hadir}</strong> <span style={{color:'#475569'}}>/ {ev.totalPeserta}</span></td>
                    <td>
                      <span className={`aep-badge ${ev.isSelesai ? 'aep-badge-done' : 'aep-badge-upcoming'}`}>
                        {ev.isSelesai ? 'Selesai' : 'Akan Datang'}
                      </span>
                    </td>
                    <td>
                        {ev.sertifikat_template ? (
                            <span style={{ color:'#a855f7', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={14}/> Terpasang</span>
                        ) : (
                            <span style={{ color:'#64748b', fontSize:'0.8rem' }}>Belum ada</span>
                        )}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:8, justifyContent: "flex-end" }}>
                        <button 
                            title="Pengaturan Template" 
                            onClick={() => openSetting(ev)} 
                            style={{ background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)', color:'#0ea5e9', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}
                        >
                            <Settings size={14} /> Atur
                        </button>
                        {ev.isSelesai && ev.sertifikat_template && (
                            <button 
                                title="Generate PDF" 
                                onClick={() => generateSertifikat(ev)} 
                                disabled={generating}
                                style={{ background:'linear-gradient(135deg,#9333ea,#7c3aed)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor: generating ? 'not-allowed' : 'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:5, opacity: generating? 0.5:1 }}
                            >
                                <Play size={14} fill="currentColor" /> {generating ? 'Proses...' : 'Generate'}
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PENGATURAN TEMPLATE */}
      {isSettingModalOpen && (
        <div className="aep-modal-overlay" onClick={() => setIsSettingModalOpen(false)}>
          <div className="aep-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>
                 Template Sertifikat: {selectedEvent?.nama}
              </h3>
              <button onClick={() => setIsSettingModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="adash-2col-sertif" style={{ padding: 24 }}>
                {/* PREVIEW AREA */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#e2e8f0' }}>Preview Template</div>
                    <div style={{ 
                        width:'100%', aspectRatio:'1.414', background:'#0f172a', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:8, 
                        position:'relative', overflow:'hidden', backgroundImage: previewTemplateUrl ? `url(${previewTemplateUrl})` : 'none',
                        backgroundSize:'cover', backgroundPosition:'center'
                    }}>
                        {!previewTemplateUrl && (
                            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                                <Upload size={32} style={{ marginBottom:10, opacity:0.5 }}/>
                                <span>Belum ada background</span>
                            </div>
                        )}
                        {/* Overlay text mockup */}
                        {previewTemplateUrl && (
                            <div style={{
                                position: 'absolute',
                                left: config.x,
                                top: config.y,
                                transform: 'translate(-50%, -50%)',
                                color: config.color,
                                fontSize: config.fontSize,
                                textAlign: config.align,
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                textShadow: '0px 0px 2px rgba(255,255,255,0.5)' // just for visibility
                            }}>
                                Nama Peserta Disini
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display:'flex', gap:10, marginTop:10 }}>
                        <input type="file" id="tpl-upload" accept="image/png, image/jpeg" style={{display:'none'}} onChange={handleFileChange} />
                        <label htmlFor="tpl-upload" style={{
                            flex:1, textAlign:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', 
                            color:'#f8fafc', padding:'8px', borderRadius:8, cursor:'pointer', fontSize:'0.9rem', fontWeight:600
                        }}>
                            Pilih File Gambar (PNG/JPG)
                        </label>
                        {previewTemplateUrl && (
                            <button onClick={deleteTemplate} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', padding:'8px 12px', borderRadius:8, cursor:'pointer' }}>
                                <Trash2 size={18}/>
                            </button>
                        )}
                    </div>
                </div>

                {/* CONFIG AREA */}
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#e2e8f0' }}>Posisi Teks Nama</div>
                    
                    <div>
                        <label style={{ display:'block', fontSize:'0.8rem', color:'#94a3b8', marginBottom:4 }}>Posisi X (Kiri-Kanan)</label>
                        <input type="text" value={config.x} onChange={e => setConfig({...config, x: e.target.value})} style={{ width:'100%', background:'rgba(15,23,42,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'8px 12px', borderRadius:6 }} placeholder="e.g. 50%" />
                    </div>
                    
                    <div>
                        <label style={{ display:'block', fontSize:'0.8rem', color:'#94a3b8', marginBottom:4 }}>Posisi Y (Atas-Bawah)</label>
                        <input type="text" value={config.y} onChange={e => setConfig({...config, y: e.target.value})} style={{ width:'100%', background:'rgba(15,23,42,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'8px 12px', borderRadius:6 }} placeholder="e.g. 50%" />
                    </div>

                    <div>
                        <label style={{ display:'block', fontSize:'0.8rem', color:'#94a3b8', marginBottom:4 }}>Ukuran Font</label>
                        <input type="text" value={config.fontSize} onChange={e => setConfig({...config, fontSize: e.target.value})} style={{ width:'100%', background:'rgba(15,23,42,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'8px 12px', borderRadius:6 }} placeholder="e.g. 30px" />
                    </div>

                    <div>
                        <label style={{ display:'block', fontSize:'0.8rem', color:'#94a3b8', marginBottom:4 }}>Warna Teks</label>
                        <div style={{ display:'flex', gap:8 }}>
                            <input type="color" value={config.color} onChange={e => setConfig({...config, color: e.target.value})} style={{ width:40, height:36, padding:0, border:'none', background:'none', cursor:'pointer' }} />
                            <input type="text" value={config.color} onChange={e => setConfig({...config, color: e.target.value})} style={{ flex:1, background:'rgba(15,23,42,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'8px 12px', borderRadius:6 }} />
                        </div>
                    </div>

                </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap:10 }}>
              <button onClick={() => setIsSettingModalOpen(false)} style={{ background: 'transparent', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</button>
              <button onClick={saveSettings} disabled={uploading} style={{ background: 'linear-gradient(135deg,#9333ea,#7c3aed)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: uploading?'not-allowed':'pointer', fontWeight: 600 }}>
                  {uploading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
