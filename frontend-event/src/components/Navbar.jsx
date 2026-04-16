import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Calendar, Menu, X, Loader2, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';

const NavbarCustom = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = () => {
      setAuthUser(getUser());
    };
    
    // Initial fetch
    fetchUser();
    
    // Listen to our custom event and storage events to detect auth changes dynamically
    window.addEventListener('storage', fetchUser);
    window.addEventListener('auth_changed', fetchUser);
    
    return () => {
      window.removeEventListener('storage', fetchUser);
      window.removeEventListener('auth_changed', fetchUser);
    };
  }, []);

  const isAdmin = authUser?.role === "admin";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = async (e) => {
    e.preventDefault();
    setExpanded(false);
    setIsTransitioning(true);
    
    // Add fade out animation
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0.7';
    
    // Wait for animation
    setTimeout(() => {
      document.body.style.opacity = '1';
      navigate('/login');
      setIsTransitioning(false);
    }, 300);
  };

  const handleRegisterClick = async (e) => {
    e.preventDefault();
    setExpanded(false);
    setIsTransitioning(true);
    
    // Add fade out animation
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0.7';
    
    // Wait for animation
    setTimeout(() => {
      document.body.style.opacity = '1';
      navigate('/register');
      setIsTransitioning(false);
    }, 300);
  };
  
  const handleLogout = async () => {
    setExpanded(false);
    await logout();
    navigate('/');
  };

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
          <div className="d-flex gap-2 ms-lg-3 align-items-center mt-3 mt-lg-0">
            {authUser ? (
              <Dropdown align="end">
                <Dropdown.Toggle as="div" className="d-flex align-items-center gap-2 user-select-none" style={{cursor: 'pointer', color: '#6B46C1', fontWeight: '600'}}>
                  <div className="user-avatar text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: '38px', height: '38px', background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'}}>
                    <User size={20} />
                  </div>
                  <span className="d-none d-lg-block text-truncate" style={{maxWidth: '120px'}}>
                    {authUser.nama_lengkap?.split(' ')[0] || 'User'}
                  </span>
                </Dropdown.Toggle>
                
                <Dropdown.Menu 
                  className="shadow-lg border-0 rounded-4 mt-2 p-1" 
                  style={{
                    minWidth: '220px', 
                    zIndex: 1050,
                    background: 'rgba(15, 13, 26, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(168, 85, 247, 0.2)'
                  }}
                >
                  <div className="px-3 py-3 mb-2 rounded-top-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="mb-0 fw-bold text-white text-truncate">{authUser.nama_lengkap}</p>
                    <p className="mb-0 small text-truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{authUser.email}</p>
                  </div>
                  <Dropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)} className="rounded-3 mx-1 w-auto py-2 px-3 d-flex align-items-center gap-3 custom-dark-item">
                    <User size={16} color="#a855f7" /> Profil Saya
                  </Dropdown.Item>
                  <Dropdown.Divider className="mx-2 my-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <Dropdown.Item onClick={handleLogout} className="rounded-3 mx-1 w-auto py-2 px-3 d-flex align-items-center gap-3 custom-dark-item text-danger">
                    <LogOut size={16} color="#fca5a5" /> <span style={{ color: '#fca5a5' }}>Keluar</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <button 
                  onClick={handleLoginClick} 
                  className={`btn btn-outline-purple w-100 w-lg-auto ${isTransitioning ? 'loading' : ''}`}
                  disabled={isTransitioning}
                >
                  {isTransitioning ? (
                    <>
                      <Loader2 size={16} className="me-2 spinning" />
                      Memuat...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </button>
                <button 
                  onClick={handleRegisterClick} 
                  className={`btn btn-purple w-100 w-lg-auto ms-lg-2 mt-2 mt-lg-0 ${isTransitioning ? 'loading' : ''}`}
                  disabled={isTransitioning}
                >
                  {isTransitioning ? (
                    <>
                      <Loader2 size={16} className="me-2 spinning" />
                      Memuat...
                    </>
                  ) : (
                    'Daftar'
                  )}
                </button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarCustom;
