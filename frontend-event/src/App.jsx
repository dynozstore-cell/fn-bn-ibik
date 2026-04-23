import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TicketOrderPage from './pages/TicketOrderPage';
import ContactPage from './pages/ContactPage';
import UserProfilePage from './pages/UserProfilePage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

/* Admin */
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminPenyelenggaraPage from './pages/AdminPenyelenggaraPage';
import AdminPenggunaPage from './pages/AdminPenggunaPage';
import AdminLaporanPage from './pages/AdminLaporanPage';
import AdminPesanPage from './pages/AdminPesanPage';
import AdminPengaturanPage from './pages/AdminPengaturanPage';
import AdminProfilePage from './pages/AdminProfilePage';

/* Penyelenggara */
import PenyelenggaraLayout from './layouts/PenyelenggaraLayout';
import PenyelenggaraDashboardPage from './pages/PenyelenggaraDashboardPage';
import PenyelenggaraEventsPage from './pages/PenyelenggaraEventsPage';
import PenyelenggaraBuatEventPage from './pages/PenyelenggaraBuatEventPage';
import PenyelenggaraKehadiranPage from './pages/PenyelenggaraKehadiranPage';
import PenyelenggaraLaporanPage from './pages/PenyelenggaraLaporanPage';
import PenyelenggaraRiwayatPage from './pages/PenyelenggaraRiwayatPage';
import PenyelenggaraProfilePage from './pages/PenyelenggaraProfilePage';
import PenyelenggaraKonfirmasiPage from './pages/PenyelenggaraKonfirmasiPage';
import PenyelenggaraEventDetailPage from './pages/PenyelenggaraEventDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PenyelenggaraSertifikatPage from './pages/PenyelenggaraSertifikatPage';

import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/"                    element={<HomePage />} />
        <Route path="/events"              element={<EventsPage />} />
        <Route path="/events/:id"          element={<EventDetailPage />} />
        <Route path="/events/:id/ticket"   element={<TicketOrderPage />} />
        <Route path="/events/:id/success"  element={<PaymentSuccessPage />} />
        <Route path="/contact"             element={<ContactPage />} />
        <Route path="/profile"             element={<UserProfilePage />} />

        {/* Auth */}
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register"            element={<RegisterPage />} />
        <Route path="/verify-otp"          element={<VerifyOTPPage />} />
        <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
        <Route path="/reset-password"      element={<ResetPasswordPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard"    element={<AdminDashboardPage />} />
          <Route path="events"       element={<AdminEventsPage />} />
          <Route path="penyelenggara" element={<AdminPenyelenggaraPage />} />
          <Route path="pengguna"     element={<AdminPenggunaPage />} />
          <Route path="laporan"      element={<AdminLaporanPage />} />
          <Route path="pesan"        element={<AdminPesanPage />} />
          <Route path="pengaturan"   element={<AdminPengaturanPage />} />
          <Route path="profile"      element={<AdminProfilePage />} />
        </Route>

        <Route path="/penyelenggara" element={<PenyelenggaraLayout />}>
          <Route path="dashboard"   element={<PenyelenggaraDashboardPage />} />
          <Route path="events"      element={<PenyelenggaraEventsPage />} />
          <Route path="events/:id"  element={<PenyelenggaraEventDetailPage />} />
          <Route path="buat-event"  element={<PenyelenggaraBuatEventPage />} />
          <Route path="edit-event/:id"  element={<PenyelenggaraBuatEventPage />} />
          <Route path="kehadiran"   element={<PenyelenggaraKehadiranPage />} />
          <Route path="laporan"      element={<PenyelenggaraLaporanPage />} />
          <Route path="sertifikat"   element={<PenyelenggaraSertifikatPage />} />
          <Route path="riwayat"      element={<PenyelenggaraRiwayatPage />} />
          <Route path="konfirmasi"   element={<PenyelenggaraKonfirmasiPage />} />
          <Route path="profile"      element={<PenyelenggaraProfilePage />} />
        </Route>

        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
