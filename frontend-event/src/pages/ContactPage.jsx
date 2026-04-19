import React, { useState } from 'react';
import NavbarCustom from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { Phone, Mail, AtSign, MapPin, Send, MessageSquare } from 'lucide-react';
import { buildApiUrl } from '../utils/api.js';
import '../HomePage.css';

const initialForm = {
  nama: '',
  email: '',
  no_hp: '',
  judul_event: '',
  deskripsi_event: '',
  pesan: '',
};

export default function ContactPage() {
  const [form, setForm]           = useState(initialForm);
  const [status, setStatus]       = useState('');
  const [statusType, setStatusType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(buildApiUrl('/api/kontak-event'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok) {
        setStatusType('success');
        setStatus('✓ Pesan Anda berhasil dikirim. Kami akan segera merespons!');
        setForm(initialForm);
      } else {
        setStatusType('error');
        setStatus(data.message || 'Gagal mengirim pesan. Silakan coba lagi.');
      }
    } catch {
      setStatusType('error');
      setStatus('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 6000);
    }
  };

  return (
    <div className="page contact-page">
      <NavbarCustom />

      <main style={{ paddingTop: '70px' }}>

        {/* ── Hero ── */}
        <section className="contact-hero">
          <div className="container">
            <div className="contact-hero-badge">
              <span className="dot" />
              Pusat Bantuan &amp; Kontak
            </div>
            <h1>
              Hubungi <span className="grad">Tim Kami</span>
            </h1>
            <p className="contact-hero-sub">
              Kami siap membantu Anda kapan saja. Pilih cara paling nyaman
              untuk terhubung dengan tim EventHub.
            </p>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="contact-divider" />

        {/* ── Content ── */}
        <section className="contact-panel container">
          <div className="contact-grid">

            {/* ── Left: Info + Map ── */}
            <aside className="contact-aside">

              {/* Kontak langsung */}
              <div className="contact-card">
                <h3>Hubungi Langsung</h3>
                <p className="contact-card-desc">
                  Tim kami merespons dalam kurang dari 24 jam di hari kerja.
                </p>

                <div className="contact-info-grid">
                  <div className="contact-info-item">
                    <div className="icon-wrap"><Phone size={15} strokeWidth={2} /></div>
                    <strong>Telepon</strong>
                    <p>+62 831-6922-1045</p>
                  </div>

                  <div className="contact-info-item">
                    <div className="icon-wrap"><Mail size={15} strokeWidth={2} /></div>
                    <strong>Email</strong>
                    <p>dynotix@gmail.com</p>
                  </div>

                  <div className="contact-info-item">
                    <div className="icon-wrap"><AtSign size={15} strokeWidth={2} /></div>
                    <strong>Instagram</strong>
                    <p>@dynotixevent</p>
                  </div>

                  <div className="contact-info-item">
                    <div className="icon-wrap"><MapPin size={15} strokeWidth={2} /></div>
                    <strong>Alamat</strong>
                    <p>Tajur, Bogor</p>
                  </div>
                </div>
              </div>

              {/* Peta */}
              <div className="contact-card map-card">
                <h3>Lokasi Kami</h3>
                <iframe
                  title="Lokasi EventHub"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15823.450051264697!2d106.8060874!3d-6.5409214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69cbd29a065995%3A0x58135f8ecf78b1d8!2sTajur%2C%20Kabupaten%20Bogor%2C%20Jawa%20Barat%2C%20Indonesia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%"
                  height="210"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
            </aside>

            {/* ── Right: Form ── */}
            <div className="contact-form-card">
              <div className="contact-card">

                {/* Header tengah */}
                <div className="contact-form-header">
                  <h3>
                    <MessageSquare size={16} strokeWidth={2} style={{ color: 'var(--purple-400)' }} />
                    Kirim Pesan
                  </h3>
                  <p>Isi formulir berikut dan kami akan segera merespons.</p>
                </div>

                <form onSubmit={handleSubmit}>

                  {/* Baris 1 */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nama">Nama Lengkap</label>
                      <input
                        id="nama" name="nama"
                        value={form.nama} onChange={handleChange}
                        placeholder="Nama Anda" required autoComplete="name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Alamat Email</label>
                      <input
                        id="email" name="email" type="email"
                        value={form.email} onChange={handleChange}
                        placeholder="email@contoh.com" required autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Baris 2 */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="no_hp">Nomor Telepon</label>
                      <input
                        id="no_hp" name="no_hp" type="tel"
                        value={form.no_hp} onChange={handleChange}
                        placeholder="+62 xxx xxxx xxxx" autoComplete="tel"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="judul_event">Subjek</label>
                      <input
                        id="judul_event" name="judul_event"
                        value={form.judul_event} onChange={handleChange}
                        placeholder="Topik pesan Anda" required
                      />
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="form-group">
                    <label htmlFor="deskripsi_event">Deskripsi</label>
                    <input
                      id="deskripsi_event" name="deskripsi_event"
                      value={form.deskripsi_event} onChange={handleChange}
                      placeholder="Gambaran singkat keperluan Anda..."
                    />
                  </div>

                  {/* Pesan */}
                  <div className="form-group">
                    <label htmlFor="pesan">Pesan</label>
                    <textarea
                      id="pesan" name="pesan"
                      value={form.pesan} onChange={handleChange}
                      placeholder="Tulis pesan lengkap Anda di sini..."
                      rows="5" required
                    />
                  </div>

                  <button
                    id="contact-submit-btn"
                    type="submit"
                    className="btn-event-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Mengirim...'
                    ) : (
                      <>
                        <Send size={14} strokeWidth={2.2} />
                        Kirim Pesan
                      </>
                    )}
                  </button>

                  {status && (
                    <p className={`submit-status${statusType === 'error' ? ' error' : ''}`}>
                      {status}
                    </p>
                  )}
                </form>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
