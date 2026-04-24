import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Calendar, Share2, User, Mail, Phone, MapPin } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <Container>
        <Row className="g-4">
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center mb-3">
              <Calendar size={32} color="white" />
              <span className="ms-2 fw-bold fs-4">KESAVENT</span>
            </div>
            <p style={{ opacity: 0.9, lineHeight: 1.7 }}>
              KESAVENT adalah platform manajemen dan pencarian event terintegrasi yang memudahkan Anda menemukan, mengikuti, dan mengelola berbagai event menarik di seluruh Indonesia. Mulai dari konser musik hingga workshop profesional, semua ada dalam satu genggaman.
            </p>
            <div className="social-icons d-flex gap-2 mt-3">
              <a href="/#" aria-label="Share"><Share2 size={18} /></a>
              <a href="/#" aria-label="Profile"><User size={18} /></a>
            </div>
          </Col>
          <Col lg={2} md={6}>
            <h5>Menu</h5>
            <ul>
              <li><a href="/">Beranda</a></li>
              <li><a href="/events">Event</a></li>
              <li><a href="/contact">Kontak</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
            <h5>Kategori Event</h5>
            <ul>
              <li><a href="/events?category=Webinar %26 Seminar">Webinar & Seminar</a></li>
              <li><a href="/events?category=Kompetisi">Kompetisi</a></li>
              <li><a href="/events?category=Acara Kampus">Acara Kampus</a></li>
              <li><a href="/events?category=Workshop">Workshop</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
            <h5>Hubungi Kami</h5>
            <ul>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} /> info@kesavent.com
              </li>
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} /> +62 251 123 4567
              </li>
              <li className="d-flex align-items-center gap-2">
                <MapPin size={16} /> Jl. Pajajaran No. 123, Bogor, Jawa Barat, Indonesia
              </li>
            </ul>
          </Col>
        </Row>
        <hr />
        <p className="text-center mb-0" style={{ opacity: 0.8 }}>
          © {new Date().getFullYear()} KESAVENT.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
