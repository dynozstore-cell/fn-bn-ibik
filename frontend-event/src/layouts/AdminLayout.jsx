import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser, getToken } from '../utils/auth';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import LOGO_IBIK from '../assets/LOGO_IBIK.png';
import { LayoutDashboard, CalendarDays, Users, ShieldCheck, FileText, MessageSquare, Settings, UserCircle, Menu, X, LogOut } from 'lucide-react';
import '../styles/AdminPanel.css';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const location = useLocation();

  const [pendingMessageCount, setPendingMessageCount] = useState(0);

  useEffect(() => {
    const authUser = getUser();
    if (!authUser || String(authUser.role).toLowerCase() !== "admin") {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(buildApiUrl('/api/kontak-event'), {
          headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Status 'pending' are those that haven't been replied/read
          const pending = Array.isArray(data) ? data.filter(m => m.status === 'pending') : [];
          setPendingMessageCount(pending.length);
        }
      } catch (err) {
        console.error("Failed to fetch pending messages:", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [navigate, location]);

  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/events', icon: <CalendarDays size={20} />, label: 'Event' },
    { path: '/admin/penyelenggara', icon: <ShieldCheck size={20} />, label: 'Penyelenggara' },
    { path: '/admin/pengguna', icon: <Users size={20} />, label: 'Pengguna' },
    { path: '/admin/laporan', icon: <FileText size={20} />, label: 'Laporan' },
    { path: '/admin/pesan', icon: <MessageSquare size={20} />, label: 'Pesan' },
    { path: '/admin/pengaturan', icon: <Settings size={20} />, label: 'Pengaturan' },
    { path: '/admin/profile', icon: <UserCircle size={20} />, label: 'Profile' },
  ];

  return (
    <div className="admin-layout">
      {/* Animated Background Elements */}
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>
      <div className="bg-circle bg-circle-3"></div>

      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={LOGO_IBIK} alt="Logo" style={{ height: '35px', width: 'auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
              KESAVENT
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>
              Admin
            </span>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.path === '/admin/pesan' && pendingMessageCount > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                  minWidth: '20px', height: '20px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px', marginLeft: '8px', boxShadow: '0 0 10px rgba(239,68,68,0.3)'
                }}>
                  {pendingMessageCount > 99 ? '99+' : pendingMessageCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Removed Topbar based on request */}

        {/* Dynamic Content */}
        <div className="admin-content" style={{ zIndex: 1, position: 'relative' }}>
          {/* Mobile menu toggle floating button */}
          <button 
            className="admin-menu-toggle d-md-none" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ 
              position: 'absolute', 
              top: '1.5rem', 
              right: '1.5rem', 
              background: '#1e293b', 
              padding: '0.5rem', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1035 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
