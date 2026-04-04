import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Calendar, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const NavbarCustom = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Navbar 
      expand="lg" 
      fixed="top" 
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      className={`navbar-custom ${scrolled ? 'scrolled' : ''}`}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <Calendar size={28} style={{ color: '#6B46C1' }} />
          <span className="ms-2" style={{ color: '#6B46C1', fontSize: '1.5rem', fontWeight: '700' }}>
            EventHub
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav">
          {expanded ? <X size={24} style={{ color: '#6B46C1' }} /> : <Menu size={24} style={{ color: '#6B46C1' }} />}
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Beranda</Nav.Link>
            <Nav.Link as={Link} to="/events" onClick={() => setExpanded(false)}>Event</Nav.Link>
            <Nav.Link as={Link} to="/contact" onClick={() => setExpanded(false)}>Kontak</Nav.Link>
          </Nav>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-purple">Masuk</button>
            <button className="btn btn-purple">Daftar</button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarCustom;
