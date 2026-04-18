import React, { useState, useMemo } from 'react';
import { Search, Trash2, Download, User, Mail, Phone, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/AdminPenggunaPage.css';

// --- Mock Data Awal ---
const initialData = [
  { id: 1, nama_lengkap: 'Ahmad Faisal', email: 'ahmad@example.com', no_hp: '08123450001', role: 'peserta', tanggal_daftar: '2023-02-15' },
  { id: 2, nama_lengkap: 'Budi Santoso', email: 'budi@eventku.com', no_hp: '081234567890', role: 'penyelenggara', tanggal_daftar: '2023-01-15' },
  { id: 3, nama_lengkap: 'Rina Melati', email: 'rina.m@example.com', no_hp: '08567890002', role: 'peserta', tanggal_daftar: '2023-06-20' },
  { id: 4, nama_lengkap: 'Siti Aminah', email: 'siti.event@gmail.com', no_hp: '085678901234', role: 'penyelenggara', tanggal_daftar: '2023-05-22' },
  { id: 5, nama_lengkap: 'Dewi Lestari', email: 'dewi.l@example.com', no_hp: '08112230003', role: 'peserta', tanggal_daftar: '2023-11-05' },
  { id: 6, nama_lengkap: 'Komunitas IT Bandung', email: 'hello@kitb.org', no_hp: '081122334455', role: 'penyelenggara', tanggal_daftar: '2024-01-12' },
  { id: 7, nama_lengkap: 'Admin Sistem', email: 'admin@eventhub.com', no_hp: '080000000000', role: 'admin', tanggal_daftar: '2022-12-01' },
];

export default function AdminPenggunaPage() {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Filtered Data
  const filtered = useMemo(() => {
    return data.filter(item => {
      return !search || 
             item.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || 
             item.email.toLowerCase().includes(search.toLowerCase());
    });
  }, [data, search]);

  // Pagination Logic
  const totalPages = perPage === 'all' ? 1 : Math.ceil(filtered.length / Number(perPage));
  const paginated = perPage === 'all' ? filtered : filtered.slice((page - 1) * Number(perPage), page * Number(perPage));


  // Handlers
  const handleDelete = (id, role) => {
    if (role === 'admin') {
      alert('Aksi ditolak: Anda tidak dapat menghapus akun admin!');
      return;
    }
    if (window.confirm('Yakin ingin menghapus pengguna ini secara permanen?')) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const exportToCSV = () => {
    const rows = [
      ["ID", "Nama Lengkap", "Email", "No HP", "Role", "Tanggal Daftar"],
      ...filtered.map(item => [
        item.id,
        item.nama_lengkap,
        item.email,
        item.no_hp,
        item.role,
        item.tanggal_daftar
      ]),
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(rowArray => {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_pengguna_eventhub.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="aup-badge aup-badge-admin">Admin</span>;
      case 'penyelenggara':
        return <span className="aup-badge aup-badge-org">Penyelenggara</span>;
      default:
        return <span className="aup-badge aup-badge-user">Peserta</span>;
    }
  };

  return (
    <div className="aup-wrap">
      {/* Header */}
      <div className="aup-header">
        <div>
          <h1 className="aup-title">Kelola Pengguna</h1>
          <p className="aup-subtitle">Manajemen data seluruh pengguna aplikasi (Data Mockup UI)</p>
        </div>
        <button className="aup-btn-export" onClick={exportToCSV}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Table Card */}
      <div className="aup-card">
        {/* Toolbar */}
        <div className="aup-toolbar">
          <div className="aup-search-wrap">
            <Search size={16} className="aup-search-icon" />
            <input
              className="aup-search"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="aup-filters">
            <select
              className="aup-filter-select"
              value={perPage}
              onChange={e => { setPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>10 / halaman</option>
              <option value={50}>50 / halaman</option>
              <option value={100}>100 / halaman</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>


        <div className="aup-summary">
          Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> pengguna
          {search && ' (terfilter)'}
        </div>


        {/* Table */}
        <div className="aup-table-wrap">
          <table className="aup-table">
            <thead>
              <tr>
                <th><span className="aup-th-inner"><User size={13} /> Pengguna</span></th>
                <th><span className="aup-th-inner"><Mail size={13} /> Email</span></th>
                <th><span className="aup-th-inner"><Phone size={13} /> No HP</span></th>
                <th><span className="aup-th-inner"><Shield size={13} /> Role</span></th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="aup-td-center">Tidak ada pengguna ditemukan</td></tr>
              ) : paginated.map((item) => (
                <tr key={item.id} className="aup-tr">
                  <td>
                    <div className="aup-user-info">
                      <div className="aup-avatar">{item.nama_lengkap.charAt(0).toUpperCase()}</div>
                      <span className="aup-user-name">{item.nama_lengkap}</span>
                    </div>
                  </td>
                  <td>{item.email}</td>
                  <td>{item.no_hp}</td>
                  <td>{getRoleBadge(item.role)}</td>
                  <td className="aup-td-date">{item.tanggal_daftar}</td>
                  <td>
                    <button 
                      className={`aup-btn-delete ${item.role === 'admin' ? 'disabled' : ''}`}
                      onClick={() => handleDelete(item.id, item.role)}
                      title={item.role === 'admin' ? "Admin tidak dapat dihapus" : "Hapus Pengguna"}
                    >
                      <Trash2 size={15} />
                      <span>Hapus</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {perPage !== 'all' && totalPages > 1 && (
          <div className="aup-pagination">
            <button className="aup-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`aup-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="aup-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
