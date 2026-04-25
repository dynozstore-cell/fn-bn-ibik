import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Search, Filter, Trash2, Edit, ChevronLeft, ChevronRight,
  ShieldCheck, User, Mail, Phone, Calendar, CheckCircle, XCircle, Plus, Eye, EyeOff
} from 'lucide-react';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminPenyelenggaraPage.css';

// Kategori penyelenggara sesuai validasi backend
const KATEGORI_PENYELENGGARA = [
  'Unit Kerja',
  'Mahasiswa',
  'Komunitas',
];

// Helper: petakan data backend ke format tampilan
const mapPenyelenggara = (item) => ({
  id: item.id_user ?? item.id,
  nama_lengkap: item.nama_lengkap,
  email: item.email,
  no_hp: item.no_hp,
  kategori_pendaftar: item.kategori_pendaftar,
  // status: aktif jika email_verified_at terisi, nonaktif jika null
  status: item.email_verified_at ? 'aktif' : 'nonaktif',
  // tanggal bergabung dari created_at
  tanggal_bergabung: item.created_at
    ? item.created_at.substring(0, 10)
    : '',
});

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function AdminPenyelenggaraPage() {
  const [data, setData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // States for Modal/Form
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nama_lengkap: '', email: '', no_hp: '', kategori_pendaftar: KATEGORI_PENYELENGGARA[0], status: 'aktif', password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Filter & Pagination
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Chart year state
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  const token = getToken() || '';
  const authHeaders = { ...defaultHeaders, Authorization: token ? `Bearer ${token}` : '' };

  // Fetch data penyelenggara dari backend
  const loadPenyelenggara = async () => {
    setDataLoading(true);
    setError('');
    try {
      const res = await fetch(buildApiUrl('/api/penyelenggara'), { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal memuat data penyelenggara.');
      }
      const result = await res.json();
      const list = Array.isArray(result) ? result : result.data || [];
      setData(list.map(mapPenyelenggara));
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadPenyelenggara();
  }, []);

  // Available Years (dari data yang sudah dimuat)
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
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus penyelenggara ini?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildApiUrl(`/api/penyelenggara/${id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.message || 'Gagal menghapus penyelenggara.');
      }
      await loadPenyelenggara();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildApiUrl(`/api/penyelenggara/${id}/toggle-status`), {
        method: 'PUT',
        headers: authHeaders,
      });
      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.message || 'Gagal mengubah status.');
      }
      await loadPenyelenggara();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengubah status.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      nama_lengkap: '',
      email: '',
      no_hp: '',
      kategori_pendaftar: KATEGORI_PENYELENGGARA[0],
      status: 'aktif',
      password: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditId(item.id);
    setFormData({
      nama_lengkap: item.nama_lengkap,
      email: item.email,
      no_hp: item.no_hp,
      kategori_pendaftar: item.kategori_pendaftar,
      status: item.status,
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        nama_lengkap: formData.nama_lengkap,
        email: formData.email,
        no_hp: formData.no_hp,
        kategori_pendaftar: formData.kategori_pendaftar,
        status: formData.status,
        ...(formData.password ? { password: formData.password } : {}),
      };

      const url = editId ? buildApiUrl(`/api/penyelenggara/${editId}`) : buildApiUrl('/api/penyelenggara');
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const response = await res.json();
      if (!res.ok) {
        if (response.errors) {
          const firstError = Object.values(response.errors)[0][0];
          throw new Error(firstError);
        }
        throw new Error(response.message || 'Gagal menyimpan penyelenggara.');
      }
      await loadPenyelenggara();
      setShowModal(false);
      if (!editId) {
        setShowSuccessPopup(true);
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan penyelenggara.');
    } finally {
      setLoading(false);
    }
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
          <p className="apg-subtitle">Manajemen akun penyelenggara event</p>
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
                {KATEGORI_PENYELENGGARA.map(kat => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
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
        {error && <div className="apg-error-message">{error}</div>}
        {dataLoading ? (
          <div className="apg-summary">Memuat data penyelenggara...</div>
        ) : (
          <div className="apg-summary">
            Menampilkan <strong>{paginated.length}</strong> dari <strong>{filtered.length}</strong> penyelenggara
          </div>
        )}

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
              <div className="apg-form-group">
                <label>Password {editId ? '(biarkan kosong jika tidak diubah)' : ''}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editId}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="apg-form-group">
                <label>Kategori</label>
                <select value={formData.kategori_pendaftar} onChange={e => setFormData({...formData, kategori_pendaftar: e.target.value})}>
                  <option value="" disabled>Pilih kategori</option>
                  {KATEGORI_PENYELENGGARA.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>
              <div className="apg-modal-footer">
                <button type="button" className="apg-btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="apg-btn-submit">{editId ? 'Simpan Perubahan' : 'Tambahkan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="apg-success-popup">
          <div className="apg-success-content">
            <div className="apg-success-icon">
              <CheckCircle size={32} />
            </div>
            <h3>Akun Dibuat</h3>
            <p>Penyelenggara baru telah berhasil ditambahkan ke sistem.</p>
            <button className="apg-success-btn" onClick={() => setShowSuccessPopup(false)}>Oke</button>
          </div>
        </div>
      )}
    </div>
  );
}
