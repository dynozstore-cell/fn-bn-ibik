import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TicketOrderPage from './pages/TicketOrderPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import AdminEventsPage from './pages/AdminEventsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/ticket" element={<TicketOrderPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
