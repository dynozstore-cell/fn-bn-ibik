import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser } from '../utils/auth';
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

  React.useEffect(() => {
    const authUser = getUser();
    if (!authUser || String(authUser.role).toLowerCase() !== "admin") {
      navigate("/login", { state: { from: location }, replace: true });
    }
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

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          EventHub Admin
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
              {item.label}
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
