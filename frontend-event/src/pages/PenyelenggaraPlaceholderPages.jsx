import React from 'react';
import '../styles/AdminDashboard.css';

function PlaceholderPage({ title, subtitle, icon }) {
  return (
    <div className="adash-wrap">
      <div className="adash-page-header">
        <div>
          <h1 className="adash-page-title">{title}</h1>
          <p className="adash-page-sub">{subtitle}</p>
        </div>
      </div>
      <div className="adash-chart-card" style={{ textAlign: 'center', padding: '64px 32px' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>{icon}</div>
        <h3 style={{ color: '#e2e8f0', marginBottom: 8, fontSize: '1.2rem' }}>Halaman Dalam Pengembangan</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
          Fitur ini sedang dalam tahap pembangunan. Nantikan pembaruan selanjutnya.
        </p>
      </div>
    </div>
  );
}

export function PenyelenggaraKehadiranPage() {
  return <PlaceholderPage title="Kehadiran Peserta" subtitle="Pantau dan verifikasi kehadiran peserta event Anda." icon="✅" />;
}

export function PenyelenggaraLaporanPage() {
  return <PlaceholderPage title="Laporan" subtitle="Analisis performa dan statistik event Anda." icon="📊" />;
}

export function PenyelenggaraRiwayatPage() {
  return <PlaceholderPage title="Riwayat Event" subtitle="Lihat semua event yang pernah Anda selenggarakan." icon="🗂️" />;
}

export function PenyelenggaraProfilePage() {
  return <PlaceholderPage title="Profile Penyelenggara" subtitle="Kelola informasi akun dan profil penyelenggara Anda." icon="👤" />;
}
