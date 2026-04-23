import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Mail, MailOpen, Trash2, Reply,
  ArrowLeft, Clock, InboxIcon, Copy, Check, Send, CheckCircle
} from 'lucide-react';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminPesanPage.css';

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
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const token = getToken() || '';
  const authHeaders = { ...defaultHeaders, Authorization: `Bearer ${token}` };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/kontak-event'), { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(k => ({
          id: k.id,
          pengirim: k.nama,
          email: k.email,
          subjek: k.judul_event || 'Pesan Umum',
          isi: k.pesan || '',
          tanggal: k.created_at,
          isRead: k.status !== 'pending',
          balasan: k.balasan,
          repliedAt: k.replied_at
        }));
        setMessages(mapped);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

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
  const handleSelectMessage = async (id) => {
    setSelectedId(id);
    const msg = messages.find(m => m.id === id);
    if (msg && !msg.isRead) {
      // Mark as read in backend
      try {
        await fetch(buildApiUrl(`/api/kontak-event/${id}`), {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ ...msg, status: 'read' })
        });
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      } catch (e) { console.error('Failed to mark read', e); }
    }
  };

  const handleToggleRead = async (e, id, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus ? 'pending' : 'read';
    try {
      const msg = messages.find(m => m.id === id);
      const res = await fetch(buildApiUrl(`/api/kontak-event/${id}`), {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ ...msg, status: newStatus })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !currentStatus } : m));
      }
    } catch (e) { console.error('Failed to toggle read', e); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Yakin ingin menghapus pesan ini?')) {
      try {
        const res = await fetch(buildApiUrl(`/api/kontak-event/${id}`), {
          method: 'DELETE',
          headers: authHeaders
        });
        if (res.ok) {
          setMessages(prev => prev.filter(msg => msg.id !== id));
          if (selectedId === id) setSelectedId(null);
        } else {
          alert('Gagal menghapus pesan.');
        }
      } catch (err) {
        alert('Terjadi kesalahan saat menghapus pesan.');
      }
    }
  };

  const handleCopyEmail = (e, email, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(buildApiUrl(`/api/kontak-event/${selectedId}/reply`), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ balasan: replyText })
      });
      const result = await res.json();
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === selectedId ? { 
          ...m, 
          balasan: replyText, 
          repliedAt: new Date().toISOString(),
          isRead: true 
        } : m));
        setReplyText('');
        alert('Balasan berhasil dikirim ke email pengirim!');
      } else {
        alert('Gagal mengirim balasan: ' + (result.message || 'Error'));
      }
    } catch (e) {
      console.error('Error sending reply', e);
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsSending(false);
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
            {loading ? (
              <div className="apm-empty">
                <div className="apm-empty-icon" style={{ opacity: 0.5 }}><InboxIcon size={36} /></div>
                <h3>Memuat Pesan...</h3>
              </div>
            ) : filteredMessages.length === 0 ? (
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

            {selectedMessage.balasan ? (
              <div className="apm-replied-box">
                <div className="apm-replied-head">
                  <CheckCircle size={16} /> 
                  <span>Sudah Dibalas via Email pada {formatFullDate(selectedMessage.repliedAt)}</span>
                </div>
                <div className="apm-replied-body">
                  "{selectedMessage.balasan}"
                </div>
              </div>
            ) : (
              <div className="apm-reply-section">
                <h3><Reply size={20} /> Balas Pesan ke Pengirim</h3>
                <textarea 
                  placeholder="Ketik balasan profesional Anda di sini... (Email akan otomatis dikirim saat Anda klik kirim)"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <div className="apm-reply-actions">
                  <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
                     <span style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={14} /> Terkirim dari: {token ? 'admin@ibik.ac.id' : 'System'}
                     </span>
                  </div>
                  <button 
                    className="apm-btn-send"
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                  >
                    {isSending ? <span className="apm-spinner" /> : <Send size={18} />}
                    <span>{isSending ? 'Sedang Mengirim...' : 'Kirim Balasan Sekarang'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="apm-detail-footer">
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
                Pesan ini dikirim melalui sistem otomasi email KESAVENT.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
