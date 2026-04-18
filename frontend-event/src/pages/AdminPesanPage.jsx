import React, { useState, useMemo } from 'react';
import {
  Search, Mail, MailOpen, Trash2, Reply,
  ArrowLeft, Clock, InboxIcon
} from 'lucide-react';
import '../styles/AdminPesanPage.css';

/* ─── Mock Data ──────────────────────────────────────────── */
const initialData = [
  {
    id: 1, pengirim: 'Budi Santoso', email: 'budi@example.com',
    subjek: 'Pertanyaan tentang Event Startup',
    isi: 'Halo Admin,\n\nSaya ingin bertanya apakah pendaftaran untuk event Startup Digital masih dibuka? Teman saya juga ingin ikut, apakah ada diskon rombongan?\n\nTerima kasih,\nBudi',
    tanggal: '2024-04-10T10:30:00', isRead: false,
  },
  {
    id: 2, pengirim: 'Rina Melati', email: 'rina.m@example.com',
    subjek: 'Kendala Pembayaran Tiket',
    isi: 'Selamat siang,\n\nSaya mengalami kendala saat melakukan pembayaran tiket untuk Tech Conference. Transfer bank saya selalu gagal dan muncul pesan error koneksi.\n\nMohon bantuannya segera karena tiket hampir habis.',
    tanggal: '2024-04-09T14:15:00', isRead: false,
  },
  {
    id: 3, pengirim: 'PT Maju Bersama', email: 'info@majubersama.co.id',
    subjek: 'Proposal Kerja Sama Sponsorship',
    isi: 'Dengan hormat,\n\nKami dari PT Maju Bersama bermaksud mengajukan proposal kerja sama sponsorship untuk event berskala nasional yang akan Anda adakan bulan depan.\n\nMohon info kontak divisi Partnership.\n\nSalam,\nTim Marketing',
    tanggal: '2024-04-08T09:00:00', isRead: true,
  },
  {
    id: 4, pengirim: 'Ahmad Faisal', email: 'ahmad@example.com',
    subjek: 'Sertifikat Belum Diterima',
    isi: 'Min, saya belum menerima e-sertifikat untuk Workshop Fotografi yang diadakan minggu lalu. Kapan kira-kira dikirimkan ya?\n\nTerima kasih.',
    tanggal: '2024-04-05T16:45:00', isRead: true,
  },
  {
    id: 5, pengirim: 'Siti Aminah', email: 'siti.event@gmail.com',
    subjek: 'Ubah Jadwal Event',
    isi: 'Mohon info prosedur untuk mengubah jadwal event yang sudah terlanjur di-publish. Ada kendala teknis dari pihak pembicara yang mengharuskan kami memundur jadwal selama 1 minggu.\n\nTerima kasih atas responsnya.',
    tanggal: '2024-04-02T11:20:00', isRead: true,
  },
];

/* ─── Helpers ────────────────────────────────────────────── */
function getAvatarColor(name) {
  const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  if (isToday) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}



/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function AdminPesanPage() {
  const [messages, setMessages] = useState(initialData);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [selectedId, setSelectedId] = useState(null);

  /* ── Derived ────────────────────────────────────────── */
  const unreadCount = messages.filter(m => !m.isRead).length;

  const filteredMessages = useMemo(() => {
    return messages
      .filter(msg => {
        const matchSearch =
          msg.pengirim.toLowerCase().includes(search.toLowerCase()) ||
          msg.subjek.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filter === 'all' ||
          (filter === 'unread' && !msg.isRead) ||
          (filter === 'read' && msg.isRead);
        return matchSearch && matchFilter;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [messages, search, filter]);

  const selectedMessage = messages.find(m => m.id === selectedId);

  /* ── Handlers ───────────────────────────────────────── */
  const handleSelectMessage = (id) => {
    setSelectedId(id);
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
  };

  const handleToggleRead = (e, id, currentStatus) => {
    e.stopPropagation();
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: !currentStatus } : msg));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Yakin ingin menghapus pesan ini?')) {
      setMessages(prev => prev.filter(msg => msg.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  /* ── JSX ─────────────────────────────────────────────── */
  return (
    <div className="apm-wrap">

      {/* ── Page Header ──────────────────────────────── */}
      <div className="apm-page-header">
        <div>
          <h1 className="apm-page-title">Pesan Masuk</h1>
          <p className="apm-page-sub">Kelola komunikasi dengan pengguna dan penyelenggara</p>
        </div>
      </div>



      {/* ── List View ────────────────────────────────── */}
      {!selectedId && (
        <div className="apm-inbox-card">

          {/* Toolbar */}
          <div className="apm-toolbar">
            <div className="apm-search-box">
              <Search size={15} className="apm-search-icon" />
              <input
                id="apm-search"
                type="text"
                placeholder="Cari pesan atau pengirim…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="apm-filters">
              <button
                id="apm-filter-all"
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                Semua
              </button>
              <button
                id="apm-filter-unread"
                className={filter === 'unread' ? 'active' : ''}
                onClick={() => setFilter('unread')}
              >
                Belum Dibaca
                {unreadCount > 0 && (
                  <span className="apm-filter-badge">{unreadCount}</span>
                )}
              </button>
              <button
                id="apm-filter-read"
                className={filter === 'read' ? 'active' : ''}
                onClick={() => setFilter('read')}
              >
                Sudah Dibaca
              </button>
            </div>
          </div>

          {/* Message rows */}
          <div className="apm-msg-list">
            {filteredMessages.length === 0 ? (
              <div className="apm-empty">
                <div className="apm-empty-icon"><InboxIcon size={36} /></div>
                <h3>Tidak Ada Pesan</h3>
                <p>Tidak ada pesan yang sesuai dengan filter Anda.</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  id={`apm-msg-${msg.id}`}
                  className={`apm-msg-card${!msg.isRead ? ' unread' : ''}`}
                  onClick={() => handleSelectMessage(msg.id)}
                >
                  {/* Avatar */}
                  <div
                    className="apm-msg-avatar"
                    style={{ background: getAvatarColor(msg.pengirim) }}
                  >
                    {msg.pengirim.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="apm-msg-content">
                    <div className="apm-msg-top">
                      <span className="apm-msg-sender">{msg.pengirim}</span>
                      <span className="apm-msg-date">{formatDate(msg.tanggal)}</span>
                    </div>
                    <div className="apm-msg-subject">{msg.subjek}</div>
                    <div className="apm-msg-preview">
                      {msg.isi.replace(/\n/g, ' ').substring(0, 100)}…
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="apm-msg-actions">
                    {!msg.isRead && <span className="apm-unread-dot" />}
                    <button
                      className="apm-btn-icon"
                      onClick={e => handleToggleRead(e, msg.id, msg.isRead)}
                      title={msg.isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
                    >
                      {msg.isRead ? <Mail size={15} /> : <MailOpen size={15} />}
                    </button>
                    <button
                      className="apm-btn-icon danger"
                      onClick={e => handleDelete(e, msg.id)}
                      title="Hapus Pesan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Detail View ──────────────────────────────── */}
      {selectedId && selectedMessage && (
        <div className="apm-detail-view">

          {/* Top bar */}
          <div className="apm-detail-topbar">
            <button className="apm-btn-back" id="apm-back-btn" onClick={() => setSelectedId(null)}>
              <ArrowLeft size={16} /> Kembali
            </button>
            <div className="apm-detail-topbar-actions">
              <button
                className="apm-btn-action"
                onClick={e => { handleToggleRead(e, selectedMessage.id, selectedMessage.isRead); setSelectedId(null); }}
              >
                {selectedMessage.isRead ? <Mail size={16} /> : <MailOpen size={16} />}
                <span>{selectedMessage.isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}</span>
              </button>
              <button
                className="apm-btn-action danger"
                onClick={e => handleDelete(e, selectedMessage.id)}
              >
                <Trash2 size={16} />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          {/* Detail Card */}
          <div className="apm-detail-card">
            <h1 className="apm-detail-subject">{selectedMessage.subjek}</h1>

            <div className="apm-detail-sender-row">
              <div
                className="apm-avatar-lg"
                style={{ background: getAvatarColor(selectedMessage.pengirim) }}
              >
                {selectedMessage.pengirim.charAt(0).toUpperCase()}
              </div>
              <div className="apm-sender-info">
                <div className="apm-sender-name">{selectedMessage.pengirim}</div>
                <div className="apm-sender-email">{selectedMessage.email}</div>
                <div className="apm-sender-date">
                  <Clock size={13} /> {formatFullDate(selectedMessage.tanggal)}
                </div>
              </div>
            </div>

            <div className="apm-detail-body">
              {selectedMessage.isi.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className="apm-detail-footer">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subjek}`}
                className="apm-btn-reply"
                id="apm-reply-btn"
              >
                <Reply size={17} /> Balas via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
