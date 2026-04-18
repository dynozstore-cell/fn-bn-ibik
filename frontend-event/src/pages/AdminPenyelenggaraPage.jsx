import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Search, Filter, Trash2, Edit, ChevronLeft, ChevronRight,
  ShieldCheck, User, Mail, Phone, Calendar, CheckCircle, XCircle, Plus
} from 'lucide-react';
import '../styles/AdminPenyelenggaraPage.css';

// --- Mock Data Awal ---
const initialData = [
  { id: 1, nama_lengkap: 'Budi Santoso', email: 'budi@eventku.com', no_hp: '081234567890', kategori_pendaftar: 'Individu', status: 'aktif', tanggal_bergabung: '2023-01-15' },
  { id: 2, nama_lengkap: 'PT Maju Bersama', email: 'info@majubersama.co.id', no_hp: '082111222333', kategori_pendaftar: 'Institusi', status: 'aktif', tanggal_bergabung: '2023-03-10' },
  { id: 3, nama_lengkap: 'Siti Aminah', email: 'siti.event@gmail.com', no_hp: '085678901234', kategori_pendaftar: 'Individu', status: 'nonaktif', tanggal_bergabung: '2023-05-22' },
  { id: 4, nama_lengkap: 'Universitas Terbuka', email: 'event@ut.ac.id', no_hp: '02198765432', kategori_pendaftar: 'Institusi', status: 'aktif', tanggal_bergabung: '2023-08-05' },
  { id: 5, nama_lengkap: 'Komunitas IT Bandung', email: 'hello@kitb.org', no_hp: '081122334455', kategori_pendaftar: 'Komunitas', status: 'aktif', tanggal_bergabung: '2024-01-12' },
  { id: 6, nama_lengkap: 'Andi Pratama', email: 'andi.p@yahoo.com', no_hp: '087766554433', kategori_pendaftar: 'Individu', status: 'aktif', tanggal_bergabung: '2024-02-18' },
  { id: 7, nama_lengkap: 'Event Organizer JKT', email: 'contact@eojkt.com', no_hp: '02133344455', kategori_pendaftar: 'Institusi', status: 'nonaktif', tanggal_bergabung: '2024-04-01' },
];

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function AdminPenyelenggaraPage() {
  const [data, setData] = useState(initialData);
  
  // States for Modal/Form
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nama_lengkap: '', email: '', no_hp: '', kategori_pendaftar: 'Individu', status: 'aktif'
  });

  // Filter & Pagination
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Chart
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  // Available Categories
  const kategoriList = useMemo(() => {
    return [...new Set(data.map(d => d.kategori_pendaftar))].sort();
  }, [data]);

  // Available Years
  const years = useMemo(() => {
    const ys = data.map(d => new Date(d.tanggal_bergabung).getFullYear()).filter(y => !isNaN(y));
    return [...new Set(ys)].sort((a, b) => b - a);
  }, [data]);

  // Filtered Data
  const filtered = useMemo(() => {
    return data.filter(item => {
      const matchSearch = !search || item.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || item.email.toLowerCase().includes(search.toLowerCase());
      const matchKat = !filterKategori || item.kategori_pendaftar === filterKategori;
      const matchStatus = !filterStatus || item.status === filterStatus;
      return matchSearch && matchKat && matchStatus;
    });
  }, [data, search, filterKategori, filterStatus]);

  // Pagination
  const totalPages = perPage === 'all' ? 1 : Math.ceil(filtered.length / Number(perPage));
  const paginated = perPage === 'all' ? filtered : filtered.slice((page - 1) * Number(perPage), page * Number(perPage));

  // Chart Data: Bar
  const barData = useMemo(() => {
    return BULAN.map((bulan, i) => {
      const total = data.filter(d => {
        const date = new Date(d.tanggal_bergabung);
        return date.getFullYear() === Number(chartYear) && date.getMonth() === i;
      }).length;
      return { bulan, total };
    });
  }, [data, chartYear]);

  // Chart Data: Pie
  const pieData = useMemo(() => {
    const map = {};
    data.forEach(d => {
      map[d.kategori_pendaftar] = (map[d.kategori_pendaftar] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Handlers
  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus penyelenggara ini?')) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'aktif' ? 'nonaktif' : 'aktif' };
      }
      return item;
    }));
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ nama_lengkap: '', email: '', no_hp: '', kategori_pendaftar: 'Individu', status: 'aktif' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditId(item.id);
    setFormData({
      nama_lengkap: item.nama_lengkap,
      email: item.email,
      no_hp: item.no_hp,
      kategori_pendaftar: item.kategori_pendaftar,
      status: item.status
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      setData(prev => prev.map(item => item.id === editId ? { ...item, ...formData } : item));
    } else {
      const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
      setData(prev => [...prev, { ...formData, id: newId, tanggal_bergabung: new Date().toISOString().split('T')[0] }]);
    }
    setShowModal(false);
  };

  // Components
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="apg-tooltip">
        <p className="apg-tooltip-label">{label}</p>
        <p className="apg-tooltip-value" style={{ color: '#3b82f6' }}>Penyelenggara Baru: {payload[0].value}</p>
      </div>
    );
    return null;
  };

  const CustomPieLegend = ({ payload }) => (
    <ul className="apg-pie-legend">
      {payload.map((entry, i) => (
        <li key={i} className="apg-pie-legend-item">
          <span className="apg-pie-dot" style={{ background: entry.color }} />
          {entry.value} ({pieData.find(p => p.name === entry.value)?.value})
        </li>
      ))}
    </ul>
  );

  return (
    <div className="apg-wrap">
      {/* Header */}
      <div className="apg-header">
        <div>
          <h1 className="apg-title">Kelola Penyelenggara</h1>
          <p className="apg-subtitle">Manajemen akun penyelenggara event (Data Mockup UI)</p>
        </div>
        <button className="apg-btn-add" onClick={openAddModal}>
          <Plus size={18} /> Tambah Penyelenggara
        </button>
      </div>

      {/* Charts Row */}
      <div className="apg-charts-row">
        {/* Bar Chart */}
        <div className="apg-chart-card">
          <div className="apg-chart-head">
            <div className="apg-chart-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#2dd4bf)' }}>
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="apg-chart-title">Penyelenggara Baru</h3>
              <p className="apg-chart-sub">Pertumbuhan bulanan</p>
            </div>
            <select
              className="apg-year-select"
              value={chartYear}
              onChange={e => setChartYear(Number(e.target.value))}
            >
              {(years.length ? years : [new Date().getFullYear()]).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="apg-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="bulan" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="total" fill="url(#barGradOrg)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradOrg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="apg-chart-card">
          <div className="apg-chart-head">
            <div className="apg-chart-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="apg-chart-title">Tipe Penyelenggara</h3>
              <p className="apg-chart-sub">Distribusi berdasarkan kategori</p>
            </div>
          </div>
          <div className="apg-chart-body apg-pie-body">
            {pieData.length === 0 ? (
              <div className="apg-chart-empty">Tidak ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="40%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Legend content={<CustomPieLegend />} layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="apg-table-card">
        {/* Toolbar */}
        <div className="apg-toolbar">
          <div className="apg-search-wrap">
            <Search size={16} className="apg-search-icon" />
            <input
              className="apg-search"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="apg-filters">
            <div className="apg-filter-wrap">
              <Filter size={14} className="apg-filter-icon" />
              <select
                className="apg-filter-select"
                value={filterKategori}
                onChange={e => { setFilterKategori(e.target.value); setPage(1); }}
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="apg-filter-wrap">
              <CheckCircle size={14} className="apg-filter-icon" />
              <select
                className="apg-filter-select"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            <select
              className="apg-filter-select"
              value={perPage}
              onChange={e => { setPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }}
              style={{ paddingLeft: '0.875rem' }}
            >
              <option value={10}>10 / halaman</option>
              <option value={50}>50 / halaman</option>
              <option value={100}>100 / halaman</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="apg-summary">
          Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> penyelenggara
        </div>

        {/* Table */}
        <div className="apg-table-wrap">
          <table className="apg-table">
            <thead>
              <tr>
                <th><span className="apg-th-inner"><User size={13} /> Penyelenggara</span></th>
                <th><span className="apg-th-inner"><Mail size={13} /> Kontak</span></th>
                <th><span className="apg-th-inner"><ShieldCheck size={13} /> Kategori</span></th>
                <th>Status</th>
                <th>Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="apg-td-center">Tidak ada data penyelenggara</td></tr>
              ) : paginated.map((item) => (
                <tr key={item.id} className="apg-tr">
                  <td>
                    <div className="apg-user-info">
                      <div className="apg-avatar">{item.nama_lengkap.charAt(0).toUpperCase()}</div>
                      <span className="apg-user-name">{item.nama_lengkap}</span>
                    </div>
                  </td>
                  <td>
                    <div className="apg-contact-info">
                      <span>{item.email}</span>
                      <span className="apg-phone">{item.no_hp}</span>
                    </div>
                  </td>
                  <td><span className="apg-kat-badge">{item.kategori_pendaftar}</span></td>
                  <td>
                    <button 
                      className={`apg-status-toggle ${item.status === 'aktif' ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(item.id)}
                      title="Klik untuk mengubah status"
                    >
                      {item.status === 'aktif' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="apg-td-date">{item.tanggal_bergabung}</td>
                  <td>
                    <div className="apg-actions">
                      <button className="apg-btn-icon edit" onClick={() => openEditModal(item)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="apg-btn-icon delete" onClick={() => handleDelete(item.id)} title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {perPage !== 'all' && totalPages > 1 && (
          <div className="apg-pagination">
            <button className="apg-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`apg-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="apg-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="apg-modal-overlay">
          <div className="apg-modal">
            <div className="apg-modal-header">
              <h3>{editId ? 'Edit Penyelenggara' : 'Tambah Penyelenggara Baru'}</h3>
              <button className="apg-modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="apg-modal-body">
              <div className="apg-form-group">
                <label>Nama Lengkap / Instansi</label>
                <input required value={formData.nama_lengkap} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})} />
              </div>
              <div className="apg-form-group">
                <label>Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="apg-form-group">
                <label>Nomor HP</label>
                <input required value={formData.no_hp} onChange={e => setFormData({...formData, no_hp: e.target.value})} />
              </div>
              <div className="apg-form-row">
                <div className="apg-form-group">
                  <label>Kategori</label>
                  <select value={formData.kategori_pendaftar} onChange={e => setFormData({...formData, kategori_pendaftar: e.target.value})}>
                    <option value="Individu">Individu</option>
                    <option value="Institusi">Institusi</option>
                    <option value="Komunitas">Komunitas</option>
                  </select>
                </div>
                <div className="apg-form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="apg-modal-footer">
                <button type="button" className="apg-btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="apg-btn-submit">{editId ? 'Simpan Perubahan' : 'Tambahkan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
