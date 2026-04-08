import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Calendar, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const NavbarCustom = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  } catch {
    authUser = {};
  }
  const isAdmin = authUser?.role === "admin";

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
            {isAdmin ? <Nav.Link as={Link} to="/admin/events" onClick={() => setExpanded(false)}>Admin</Nav.Link> : null}
          </Nav>
          <div className="d-flex gap-2">
            <Link to="/auth" className="btn btn-outline-purple" onClick={() => setExpanded(false)}>Masuk</Link>
            <Link to="/auth" className="btn btn-purple" onClick={() => setExpanded(false)}>Daftar</Link>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarCustom;
