import React, { useRef, useState } from 'react';
import { X, Download, MapPin, CalendarDays, Ticket, User, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

export default function TicketModal({ isOpen, onClose, ticketData }) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !ticketData) return null;

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null // Transparent background for the canvas
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Tiket_${ticketData.eventName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'EventHub'}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download ticket', err);
      alert('Gagal mengunduh tiket. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,13,26,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '600px', position: 'relative',
        animation: 'fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'all 0.3s', backdropFilter: 'blur(5px)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.8)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* TICKET WRAPPER (To be captured by html2canvas) */}
        <div ref={ticketRef} style={{ 
          background: 'transparent',
          filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))',
          display: 'flex', flexDirection: 'row',
          position: 'relative'
        }}>
          
          {/* TICKET LEFT HALF (QR Code) */}
          <div style={{ 
            background: '#ffffff', borderRadius: '20px 0 0 20px', padding: '24px',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minWidth: '220px'
          }}>
            {/* Subtle watermark */}
            <Ticket size={110} color="rgba(168,85,247,0.04)" style={{ position: 'absolute', top: '-15px', left: '-15px', transform: 'rotate(-15deg)' }} />
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(168,85,247,0.1)', color: '#9333ea', padding: '4px 10px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <Ticket size={12} /> E-Tiket Resmi
            </div>

            {/* QR Code */}
            <div style={{
              background: '#fff', padding: '8px', borderRadius: '16px', border: '2px solid rgba(168,85,247,0.1)',
              position: 'relative', zIndex: 1
            }}>
              <QRCodeSVG 
                value={String(ticketData.qrValue || 'EVENTHUB-TICKET')} 
                size={130} 
                level="H" 
                bgColor="#ffffff"
                fgColor="#0f0d1a"
                includeMargin={false}
              />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '2px', fontFamily: 'monospace', position: 'relative', zIndex: 1 }}>
              {ticketData.qrValue || '---'}
            </p>
          </div>

          {/* VERTICAL TEAR LINE WITH CUTOUTS */}
          <div style={{ 
            width: '32px', background: '#ffffff', position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            {/* Top Cutout */}
            <div style={{ 
              width: '32px', height: '16px', background: '#16131f', 
              borderRadius: '0 0 16px 16px', position: 'absolute', top: 0,
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)'
            }}></div>
            
            {/* Dashed Line */}
            <div style={{ flex: 1, borderLeft: '2px dashed #cbd5e1', margin: '20px 0' }}></div>
            
            {/* Bottom Cutout */}
            <div style={{ 
              width: '32px', height: '16px', background: '#16131f', 
              borderRadius: '16px 16px 0 0', position: 'absolute', bottom: 0,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}></div>
          </div>

          {/* TICKET RIGHT HALF (Details) */}
          <div style={{ 
            background: '#ffffff', borderRadius: '0 20px 20px 0', padding: '24px 24px 24px 12px',
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f0d1a', margin: '0 0 16px', lineHeight: 1.2 }}>
              {ticketData.eventName || 'EventHub Event'}
            </h2>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', gridColumn: '1 / -1' }}>
                  <div style={{ background: 'rgba(168,85,247,0.1)', padding: '8px', borderRadius: '10px', color: '#9333ea' }}>
                    <User size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Nama Peserta</div>
                    <div style={{ color: '#0f0d1a', fontWeight: 800, fontSize: '0.9rem' }}>{ticketData.userName || 'Guest User'}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ background: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
                    <CalendarDays size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Tanggal & Waktu</div>
                    <div style={{ color: '#0f0d1a', fontWeight: 800, fontSize: '0.85rem' }}>{ticketData.date || '-'}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '10px', color: '#059669' }}>
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Lokasi</div>
                    <div style={{ color: '#0f0d1a', fontWeight: 800, fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ticketData.location || '-'}</div>
                  </div>
                </div>

              </div>

              {ticketData.ticketCount && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jumlah Tiket</span>
                  <span style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)', color: '#fff', padding: '6px 16px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: 800, boxShadow: '0 6px 12px rgba(147,51,234,0.3)' }}>
                    {ticketData.ticketCount}x
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
              <Info size={12} color="#a855f7" /> Tunjukkan e-tiket ini kepada panitia saat acara.
            </div>
          </div>

        </div>

        {/* Action Buttons (Not captured in image) */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
              border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(16,185,129,0.4)',
              transform: downloading ? 'scale(0.98)' : 'scale(1)'
            }}
            onMouseEnter={e => { if(!downloading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if(!downloading) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Download size={18} /> {downloading ? 'Memproses...' : 'Unduh Tiket'}
          </button>
        </div>

      </div>
    </div>
  );
}
