import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser, getToken } from '../utils/auth';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import LOGO_IBIK from '../assets/LOGO_IBIK.png';
import {
  LayoutDashboard, CalendarDays, PlusCircle,
  ClipboardList, BarChart2, History, UserCircle,
  Menu, X, LogOut, Ticket, CreditCard, Award
} from 'lucide-react';
import '../styles/AdminPanel.css';

const navItems = [
  { path: '/penyelenggara/dashboard',   icon: <LayoutDashboard size={20} />, label: 'Dashboard'      },
  { path: '/penyelenggara/events',      icon: <CalendarDays size={20} />,    label: 'Event Saya'     },
  { path: '/penyelenggara/buat-event',  icon: <PlusCircle size={20} />,      label: 'Buat Event'     },
  { path: '/penyelenggara/kehadiran',   icon: <ClipboardList size={20} />,   label: 'Kehadiran'      },
  { path: '/penyelenggara/konfirmasi',  icon: <CreditCard size={20} />,      label: 'Konfirmasi Bayar' },
  { path: '/penyelenggara/sertifikat',  icon: <Award size={20} />,           label: 'Sertifikat'     },
  { path: '/penyelenggara/riwayat',     icon: <History size={20} />,         label: 'Riwayat Event'  },
  { path: '/penyelenggara/profile',     icon: <UserCircle size={20} />,      label: 'Profile'        },
];

export default function PenyelenggaraLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const user = getUser();
    // Allow admin to preview the page; only block completely unknown roles
    if (!user) {
      navigate('/login', { state: { from: location }, replace: true });
    }

    const fetchPendingCount = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(buildApiUrl('/api/pembayaran'), {
          headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pending = data.filter(p => p.status_pembayaran === 'pending' || p.status_pembayaran === 'Pending');
          setPendingCount(pending.length);
        }
      } catch (err) {
        console.error("Failed to fetch pending payments:", err);
      }
    };

    fetchPendingCount();
    // Update count periodically
    const interval = setInterval(fetchPendingCount, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Animated bg orbs (reuse admin CSS) */}
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />
      <div className="bg-circle bg-circle-3" />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={LOGO_IBIK} alt="Logo" style={{ height: '35px', width: 'auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
              KESAVENT
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>
              Penyelenggara
            </span>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.path === '/penyelenggara/konfirmasi' && pendingCount > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                  minWidth: '20px', height: '20px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px', marginLeft: '8px', boxShadow: '0 0 10px rgba(239,68,68,0.3)'
                }}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        <div className="admin-content" style={{ position: 'relative', zIndex: 1 }}>
          {/* Mobile toggle */}
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: '#1e293b', padding: '0.5rem', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)', zIndex: 10
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1035 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
