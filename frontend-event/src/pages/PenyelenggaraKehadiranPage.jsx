import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, ArrowLeft, CheckCircle, XCircle, AlertTriangle, UserCheck, Search, Camera, Calendar, RefreshCcw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import '../styles/AdminDashboard.css';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';



// Helper untuk suara scan
const playScanSound = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Audio feedback failed:", e);
  }
};

export default function PenyelenggaraKehadiranPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const token = getToken() || "";
        const authJson = { ...defaultHeaders, Authorization: `Bearer ${token}` };
        const res = await fetch(buildApiUrl("/api/event"), { headers: authJson });
        const raw = await res.text();
        const result = JSON.parse(raw);
        const list = Array.isArray(result) ? result : result.data || [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mapped = list.map(ev => {
          const evDate = new Date(ev.tanggal);
          const status = evDate >= today ? 'aktif' : 'selesai';
          return {
            ...ev,
            id: ev.id || ev.id_event,
            nama: ev.nama_event || 'Untitled',
            lokasi: ev.lokasi || '-',
            tanggal_display: isNaN(evDate) ? ev.tanggal : evDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
            peserta: 0,
            kapasitas: ev.harga > 0 ? 100 : 50,
            statusVal: status
          };
        });
        
        const activeEvents = mapped.filter(e => e.statusVal === 'aktif');
        // Deduplikasi berdasarkan nama event agar tidak muncul double card
        const uniqueEvents = activeEvents.filter((ev, index, self) =>
          index === self.findIndex((t) => t.nama === ev.nama)
        );
        
        setEvents(uniqueEvents);
      } catch (err) {
        console.error("Gagal memuat event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Scanner state
  const [scannedLogs, setScannedLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [scanEffect, setScanEffect] = useState(null); // 'success', 'error', 'warning'
  const [successPopup, setSuccessPopup] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "user" or "environment"
  
  const html5QrCodeRef = useRef(null);
  const lastScanRef = useRef({ code: null, time: 0 });

  // Helper untuk reset scanner effect
  useEffect(() => {
    if (scanEffect) {
      const timer = setTimeout(() => setScanEffect(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [scanEffect]);

  // Handle Scan Real dari Kamera
  const handleScan = useCallback(async (qrCode) => {
    if (!isScanning) return;
    
    // Mencegah scan QR yang sama berulang kali dalam waktu 3 detik (throttling UI)
    const now = Date.now();
    if (lastScanRef.current.code === qrCode && (now - lastScanRef.current.time) < 3000) {
      return; 
    }
    lastScanRef.current = { code: qrCode, time: now };

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (!qrCode.startsWith('EVT-')) {
      setScanEffect('error');
      playScanSound('error');
      setScannedLogs(prev => [{
        id: Date.now(), code: qrCode, name: 'Format Tidak Dikenal', 
        time: timeStr, status: 'invalid', message: 'Format QR tidak valid'
      }, ...prev]);
      return;
    }

    const ticketId = qrCode.replace('EVT-', '');

    try {
      const token = getToken();
      const headers = { ...defaultHeaders, Authorization: `Bearer ${token}` };
      
      const res = await fetch(buildApiUrl(`/api/daftar-event/${ticketId}`), { headers });
      
      if (!res.ok) {
        setScanEffect('error');
        playScanSound('error');
        setScannedLogs(prev => [{
          id: Date.now(), code: qrCode, name: 'Tidak Ditemukan', 
          time: timeStr, status: 'invalid', message: 'QR Code tidak terdaftar'
        }, ...prev]);
        return;
      }

      const ticketData = await res.json();

      // Check event match
      if (ticketData.event_id != selectedEvent?.id && ticketData.event_id != selectedEvent?.id_event) {
        setScanEffect('error');
        playScanSound('error');
        setScannedLogs(prev => [{
          id: Date.now(), code: qrCode, name: ticketData.nama_peserta || 'Peserta', 
          time: timeStr, status: 'invalid', message: 'Tiket untuk event lain'
        }, ...prev]);
        return;
      }

      // Check double scan
      if (ticketData.status_pendaftaran === 'hadir') {
        setScanEffect('warning');
        playScanSound('error');
        setScannedLogs(prev => [{
          id: Date.now(), code: qrCode, name: ticketData.nama_peserta || 'Peserta', 
          time: timeStr, status: 'double', message: 'Tiket sudah digunakan sebelumnya!'
        }, ...prev]);
        return;
      }

      // Mark as present
      const updateRes = await fetch(buildApiUrl(`/api/daftar-event/${ticketId}`), {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ status_pendaftaran: 'hadir' })
      });

      if (updateRes.ok) {
        setScanEffect('success');
        playScanSound('success');
        const newLog = {
          id: Date.now(), code: qrCode, name: ticketData.nama_peserta || 'Peserta', ticket: `${ticketData.jumlah_tiket} Tiket`,
          time: timeStr, status: 'success', message: 'Validasi Berhasil'
        };
        setScannedLogs(prev => [newLog, ...prev]);
        setSuccessPopup(newLog);
        setTimeout(() => setSuccessPopup(null), 3000);
      } else {
        throw new Error('Gagal update status');
      }

    } catch (err) {
      console.error("Error validasi tiket:", err);
      setScanEffect('error');
      playScanSound('error');
      setScannedLogs(prev => [{
        id: Date.now(), code: qrCode, name: 'Error Sistem', 
        time: timeStr, status: 'invalid', message: 'Gagal memvalidasi tiket'
      }, ...prev]);
    }
  }, [isScanning, selectedEvent]);

  // Setup Kamera
  useEffect(() => {
    if (selectedEvent && isScanning) {
      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;
      
      scanner.start(
        { facingMode: facingMode }, // Use current facing mode
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Ignore background scanning errors
        }
      ).catch((err) => {
        console.log("Error starting scanner", err);
      });

      return () => {
        if (scanner.isScanning) {
          scanner.stop().catch(console.error);
        }
      };
    }
  }, [selectedEvent, isScanning, handleScan]);


  /* ── VIEW 1: PILIH EVENT ── */
  if (!selectedEvent) {
    const filteredEvents = events.filter(e => e.nama.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="adash-wrap">
        <div className="adash-page-header">
          <div>
            <h1 className="adash-page-title">Kehadiran Peserta</h1>
            <p className="adash-page-sub">Pilih event yang sedang berlangsung untuk mulai memindai tiket.</p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1e293b', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'0 14px', width: '100%', maxWidth: 400, marginBottom: 20 }}>
          <Search size={16} style={{ color:'#475569' }} />
          <input 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari event aktif..." 
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:'0.9rem', padding:'11px 0' }} 
          />
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat event...</div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada event aktif yang ditemukan.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filteredEvents.map(ev => (
              <div 
                key={ev.id} 
                className="adash-chart-card"
                onClick={() => setSelectedEvent(ev)}
                style={{ 
                  cursor: 'pointer', transition: 'all 0.2s', padding: 24,
                  border: '1px solid rgba(16,185,129,0.2)', background: 'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={24} />
                  </div>
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>
                    Aktif
                  </span>
                </div>
                <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', margin: '0 0 8px', fontWeight: 600 }}>{ev.nama}</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} /> {ev.tanggal_display} • {ev.lokasi}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                    <UserCheck size={16} style={{ color: '#0ea5e9' }} /> {ev.peserta} Peserta
                  </div>
                  <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Mulai Scan &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── VIEW 2: SCANNER ── */
  const successCount = scannedLogs.filter(l => l.status === 'success').length;

  return (
    <div className="adash-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => { setSelectedEvent(null); setScannedLogs([]); }}
            style={{ 
              width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="adash-page-title" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', margin: 0 }}>Scanner: {selectedEvent.nama}</h1>
            <p className="adash-page-sub" style={{ fontSize: '0.8rem' }}>Arahkan kamera ke QR Code tiket peserta.</p>
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, width: 'fit-content' }}>
          <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Berhasil Hadir</span>
          <span style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 800 }}>{successCount}</span>
          <span style={{ color: '#475569', fontSize: '0.9rem' }}>/ {selectedEvent.peserta}</span>
        </div>
      </div>

      <div className="adash-2col-form">
        
        {/* Kiri: Scanner Area */}
        <div className="adash-chart-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={18} style={{ color: '#0ea5e9' }} /> Kamera Pemindai
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                onClick={() => setIsScanning(!isScanning)}
                style={{
                  background: isScanning ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  color: isScanning ? '#ef4444' : '#10b981',
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {isScanning ? 'Jeda' : 'Lanjutkan'}
              </button>
              <button 
                onClick={() => {
                  setFacingMode(prev => prev === "environment" ? "user" : "environment");
                }}
                style={{
                  background: 'rgba(14,165,233,0.1)',
                  color: '#0ea5e9',
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
                title="Ganti Kamera"
              >
                <RefreshCcw size={14} /> Ganti
              </button>
            </div>
          </div>

          {/* Kamera Viewport */}
          <div style={{ 
            position: 'relative', width: '100%', maxWidth: 400, aspectRatio: '1/1', 
            background: '#000', borderRadius: 24, overflow: 'hidden', border: '4px solid #1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: scanEffect === 'success' ? '0 0 0 4px rgba(16,185,129,0.5)' : 
                       scanEffect === 'warning' ? '0 0 0 4px rgba(245,158,11,0.5)' : 
                       scanEffect === 'error' ? '0 0 0 4px rgba(239,68,68,0.5)' : 'none',
            transition: 'box-shadow 0.3s'
          }}>
            {!isScanning && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: '#fff', fontWeight: 600 }}>
                Kamera Dijeda
              </div>
            )}
            
            {/* Element ini yang akan dipakai oleh html5-qrcode */}
            <div id="qr-reader" className="qr-viewport" style={{ width: '100%', height: '100%', display: isScanning ? 'block' : 'none' }}></div>
            
            {/* Fallback frame jika kamera belum muncul */}
            {!isScanning && <QrCode size={60} style={{ color: 'rgba(255,255,255,0.2)', position: 'absolute' }} />}
          </div>

          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 24, textAlign: 'center' }}>
            Arahkan QR code ke dalam area kotak.<br/>Proses scan akan berjalan menggunakan kamera perangkat Anda.
          </p>
          
          <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: 8, textAlign: 'center' }}>
            Beri izin (allow) akses kamera di browser jika diminta.
          </p>

        </div>

        {/* Kanan: Hasil Scan */}
        <div className="adash-chart-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 450 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.4)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Riwayat Scan Terakhir</h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scannedLogs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', gap: 12 }}>
                <Search size={32} />
                <p style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>Belum ada data tiket yang discan.<br/>Hasil scan kamera akan muncul di sini.</p>
              </div>
            ) : (
              scannedLogs.map((log) => (
                <div key={log.id} style={{ 
                  background: log.status === 'success' ? 'rgba(16,185,129,0.05)' : log.status === 'double' ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${log.status === 'success' ? 'rgba(16,185,129,0.2)' : log.status === 'double' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start',
                  animation: 'adash-in 0.3s ease both'
                }}>
                  {log.status === 'success' ? <CheckCircle size={24} style={{ color: '#10b981', flexShrink: 0 }} /> : 
                   log.status === 'double'  ? <AlertTriangle size={24} style={{ color: '#f59e0b', flexShrink: 0 }} /> :
                                              <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600 }}>{log.name}</h4>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{log.time}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, color: log.status === 'success' ? '#34d399' : log.status === 'double' ? '#fbbf24' : '#f87171', fontSize: '0.85rem', fontWeight: 500 }}>
                        {log.message}
                      </p>
                      {log.ticket && (
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                          {log.ticket}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SUCCESS POPUP MODAL */}
      {successPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fade-in 0.3s'
        }}>
          <div className="adash-chart-card" style={{
            width: '90%', maxWidth: 400, padding: 32, textAlign: 'center', position: 'relative',
            border: '2px solid #10b981', boxShadow: '0 20px 50px rgba(16,185,129,0.3)',
            animation: 'scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', animation: 'ping-once 1s'
            }}>
              <CheckCircle size={48} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', margin: '0 0 8px' }}>Valid!</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 24px' }}>Peserta berhasil dikonfirmasi.</p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Peserta</span>
                <p style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>{successPopup.name}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Jumlah Tiket</span>
                  <p style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 600 }}>{successPopup.ticket}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Waktu</span>
                  <p style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 600 }}>{successPopup.time}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSuccessPopup(null)}
              style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Lanjutkan Scan
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes ping-once { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
        
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 20px;
        }
        #qr-reader {
          border: none !important;
        }
        /* Menyembunyikan elemen UI default dari html5-qrcode jika ada */
        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
