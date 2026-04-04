import React, { useState } from 'react';
import NavbarCustom from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { Phone, Mail, AtSign, MapPin } from 'lucide-react';
import '../HomePage.css';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus('Terima kasih! Pesan Anda berhasil dikirim.');
    setForm(initialForm);
    setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div className="page contact-page">
      <NavbarCustom />

      <main className="contact-main" style={{ paddingTop: '90px' }}>
        <section className="contact-hero">
          <div className="container">
            <h1>Kontak Kami</h1>
            <p>Silakan hubungi kami kapan saja. Tim EventHub siap membantu dan menjawab semua pertanyaan Anda.</p>
          </div>
        </section>

        <section className="contact-panel container">
          <div className="contact-grid">
            <aside className="contact-aside">
              <div className="contact-card">
                <h3>Hubungi Langsung</h3>
                <p className="contact-card-desc">
                  Kami selalu siap menerima pertanyaan dan dukungan Anda. Pilih media berikut untuk menghubungi kami secara cepat.
                </p>
                <div className="contact-info-grid">
                  <div className="contact-info-item">
                    <div className="icon-wrap"><Phone size={18} /></div>
                    <div>
                      <strong>Telepon</strong>
                      <p>+62 831-6922-1045</p>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="icon-wrap"><Mail size={18} /></div>
                    <div>
                      <strong>Email</strong>
                      <p>dynotix@gmail.com</p>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="icon-wrap"><AtSign size={18} /></div>
                    <div>
                      <strong>Instagram</strong>
                      <p>@dynotixevent</p>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="icon-wrap"><MapPin size={18} /></div>
                    <div>
                      <strong>Alamat</strong>
                      <p>Tajur Bogor</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="contact-card map-card">
                <h3>Lokasi Kami</h3>
                <iframe
                  title="Alamat EventHub"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15823.450051264697!2d106.8060874!3d-6.5409214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69cbd29a065995%3A0x58135f8ecf78b1d8!2sTajur%2C%20Kabupaten%20Bogor%2C%20Jawa%20Barat%2C%20Indonesia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%"
                  height="230"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
            </aside>

            <section className="contact-form-card">
              <div className="contact-card">
                <h3>Kirim Pesan</h3>
                <p>Isi data lengkap agar kami dapat merespons dengan cepat.</p>
                <form onSubmit={handleSubmit}>
                  <label htmlFor="name">Nama</label>
                  <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Nama Anda" required />

                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email.anda@contoh.com" required />

                  <label htmlFor="phone">Telepon</label>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+62 xxx xxxx xxxx" />

                  <label htmlFor="subject">Subjek</label>
                  <input id="subject" name="subject" value={form.subject} onChange={handleChange} placeholder="Tentang apa pesan Anda?" required />

                  <label htmlFor="message">Pesan</label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tulis pesan Anda di sini..."
                    rows="5"
                    required
                  />

                  <button type="submit" className="btn-event-primary">Kirim Pesan</button>
                  {status && <p className="submit-status">{status}</p>}
                </form>
              </div>
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
