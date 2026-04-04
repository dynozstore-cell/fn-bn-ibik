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
              <span className="ms-2 fw-bold fs-4">EventHub</span>
            </div>
            <p style={{ opacity: 0.9, lineHeight: 1.7 }}>
              Platform event terpercaya untuk menemukan dan mengikuti berbagai event menarik di Indonesia. 
              Temukan pengalaman baru dan kembangkan jaringan Anda bersama kami.
            </p>
            <div className="social-icons d-flex gap-2 mt-3">
              <a href="/#" aria-label="Share"><Share2 size={18} /></a>
              <a href="/#" aria-label="Profile"><User size={18} /></a>
            </div>
          </Col>
          <Col lg={2} md={6}>
            <h5>Menu</h5>
            <ul>
              <li><a href="#home">Beranda</a></li>
              <li><a href="#events">Event</a></li>
              <li><a href="#about">Tentang Kami</a></li>
              <li><a href="#contact">Kontak</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
            <h5>Kategori Event</h5>
            <ul>
              <li><a href="/#teknologi">Teknologi</a></li>
              <li><a href="/#musik">Musik & Seni</a></li>
              <li><a href="/#bisnis">Bisnis & Startup</a></li>
              <li><a href="/#olahraga">Olahraga</a></li>
              <li><a href="/#kuliner">Kuliner</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
            <h5>Hubungi Kami</h5>
            <ul>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} /> info@eventhub.id
              </li>
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} /> +62 21 1234 5678
              </li>
              <li className="d-flex align-items-center gap-2">
                <MapPin size={16} /> Jakarta, Indonesia
              </li>
            </ul>
          </Col>
        </Row>
        <hr />
        <p className="text-center mb-0" style={{ opacity: 0.8 }}>
          © 2026 EventHub. All rights reserved. Made with ❤️ in Indonesia
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
