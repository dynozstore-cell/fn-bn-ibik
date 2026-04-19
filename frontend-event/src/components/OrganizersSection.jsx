import React, { useEffect, useState } from 'react';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { ShieldCheck, Users } from 'lucide-react';

const OrganizersSection = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrganizers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(buildApiUrl('/api/penyelenggara'), {
          headers: defaultHeaders,
        });
        if (!res.ok) {
          throw new Error('Gagal memuat penyelenggara');
        }
        const result = await res.json();
        const list = Array.isArray(result) ? result : result.data || [];
        const normalized = list.map(item => ({
          id: item.id || item.id_user,
          nama_lengkap: item.nama_lengkap || item.name || 'Tidak diketahui',
          kategori_pendaftar: item.kategori_pendaftar || 'Lainnya',
          status: item.email_verified_at ? 'aktif' : 'nonaktif',
        }));
        setOrganizers(normalized.filter(o => o.status === 'aktif'));
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan saat memuat penyelenggara.');
      } finally {
        setLoading(false);
      }
    };

    loadOrganizers();
  }, []);

  return (
    <section className="organizers-section py-5">
      <div className="container">
        <div className="section-title mb-4">
          <h2>Penyelenggara Terpercaya</h2>
          <p>Temukan penyelenggara event aktif dan terpercaya di platform kami.</p>
        </div>

        {loading && <p className="text-center">Memuat penyelenggara...</p>}
        {error && <p className="text-center text-danger">{error}</p>}

        {!loading && !error && (
          <div className="row gx-4 gy-4">
            {organizers.length === 0 ? (
              <div className="col-12">
                <div className="card p-4 text-center">Belum ada penyelenggara yang terdaftar.</div>
              </div>
            ) : (
              organizers.slice(0, 6).map((organizer) => (
                <div key={organizer.id} className="col-lg-4 col-md-6">
                  <div className="card organizer-card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                          <ShieldCheck size={20} />
                        </div>
                        <div className="ms-3">
                          <h5 className="mb-0">{organizer.nama_lengkap}</h5>
                          <small className="text-muted">{organizer.kategori_pendaftar}</small>
                        </div>
                      </div>

                      <p className="mb-3">Status: <strong>{organizer.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</strong></p>
                      <div className="d-flex align-items-center gap-2 text-secondary">
                        <Users size={16} />
                        <span>Penyelenggara resmi</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default OrganizersSection;
