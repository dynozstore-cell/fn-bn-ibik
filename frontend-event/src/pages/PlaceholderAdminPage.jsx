import React from 'react';

export default function PlaceholderAdminPage({ title }) {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <h2 className="mb-3" style={{ color: '#fff' }}>{title}</h2>
        <p style={{ color: '#94a3b8' }}>Halaman ini sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
