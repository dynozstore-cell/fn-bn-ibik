import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser } from '../utils/auth';
import {
  LayoutDashboard, CalendarDays, PlusCircle,
  ClipboardList, BarChart2, History, UserCircle,
  Menu, X, LogOut, Ticket, CreditCard,
} from 'lucide-react';
import '../styles/AdminPanel.css';

const navItems = [
  { path: '/penyelenggara/dashboard',   icon: <LayoutDashboard size={20} />, label: 'Dashboard'      },
  { path: '/penyelenggara/events',      icon: <CalendarDays size={20} />,    label: 'Event Saya'     },
  { path: '/penyelenggara/buat-event',  icon: <PlusCircle size={20} />,      label: 'Buat Event'     },
  { path: '/penyelenggara/kehadiran',   icon: <ClipboardList size={20} />,   label: 'Kehadiran'      },
  { path: '/penyelenggara/konfirmasi',  icon: <CreditCard size={20} />,      label: 'Konfirmasi Bayar' },
  { path: '/penyelenggara/laporan',     icon: <BarChart2 size={20} />,       label: 'Laporan'        },
  { path: '/penyelenggara/riwayat',     icon: <History size={20} />,         label: 'Riwayat Event'  },
  { path: '/penyelenggara/profile',     icon: <UserCircle size={20} />,      label: 'Profile'        },
];

export default function PenyelenggaraLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  React.useEffect(() => {
    const user = getUser();
    // Allow admin to preview the page; only block completely unknown roles
    if (!user) {
      navigate('/login', { state: { from: location }, replace: true });
    }
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
        <div className="admin-sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EventHub
          </span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Penyelenggara
          </span>
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
              {item.label}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        <div className="admin-content" style={{ position: 'relative', zIndex: 1 }}>
          {/* Mobile toggle */}
          <button
            className="admin-menu-toggle d-md-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: '#1e293b', padding: '0.5rem', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
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
