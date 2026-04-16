import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TicketOrderPage from './pages/TicketOrderPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminEventsPage from './pages/AdminEventsPage';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/"                    element={<HomePage />} />
        <Route path="/events"              element={<EventsPage />} />
        <Route path="/events/:id"          element={<EventDetailPage />} />
        <Route path="/events/:id/ticket"   element={<TicketOrderPage />} />
        <Route path="/contact"             element={<ContactPage />} />
        <Route path="/auth"                element={<AuthPage />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register"            element={<RegisterPage />} />
        <Route path="/verify-otp"          element={<VerifyOTPPage />} />
        <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
        <Route path="/reset-password"      element={<ResetPasswordPage />} />
        <Route path="/admin/events"        element={<AdminEventsPage />} />
        <Route path="*"                    element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
