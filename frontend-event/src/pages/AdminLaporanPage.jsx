import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';
import { Download, Calendar, Filter, FileText, CheckCircle, Users } from 'lucide-react';
import { buildApiUrl, defaultHeaders } from '../utils/api';
import { getToken } from '../utils/auth';
import '../styles/AdminLaporanPage.css';

const BULAN = ['Semua Bulan', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function AdminLaporanPage() {
  const [tab, setTab] = useState('event'); // 'event' | 'penyelenggara'
  const [filterTahun, setFilterTahun] = useState('2024');
  const [filterBulan, setFilterBulan] = useState('0'); // 0 = Semua
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const token = getToken();
        const res = await fetch(buildApiUrl('/api/admin/laporan'), {
          headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setReports(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch laporan', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  // Filter Data Berdasarkan Waktu
  const filteredEvents = useMemo(() => {
    return reports.filter(ev => {
      const date = new Date(ev.tanggal);
      const yearMatch = filterTahun === 'semua' || date.getFullYear().toString() === filterTahun;
      const monthMatch = filterBulan === '0' || (date.getMonth() + 1).toString() === filterBulan;
      return yearMatch && monthMatch;
    });
  }, [filterTahun, filterBulan]);

  // Aggregate Data untuk Penyelenggara
  const organizerReports = useMemo(() => {
    const map = {};
    filteredEvents.forEach(ev => {
      if (!map[ev.penyelenggara]) {
        map[ev.penyelenggara] = { nama: ev.penyelenggara, total_event: 0, total_pendaftar: 0, total_hadir: 0 };
      }
      map[ev.penyelenggara].total_event += 1;
      map[ev.penyelenggara].total_pendaftar += ev.pendaftar;
      map[ev.penyelenggara].total_hadir += ev.hadir;
    });
    return Object.values(map).sort((a, b) => b.total_pendaftar - a.total_pendaftar);
  }, [filteredEvents]);

  // Chart Data: Bar Chart (Event Attendance)
  const eventChartData = useMemo(() => {
    return filteredEvents.map(ev => ({
      name: ev.nama_event.length > 15 ? ev.nama_event.substring(0, 15) + '...' : ev.nama_event,
      fullName: ev.nama_event,
      Pendaftar: ev.pendaftar,
      Hadir: ev.hadir
    }));
  }, [filteredEvents]);

  // Chart Data: Line Chart (Organizer Performance)
  const organizerChartData = useMemo(() => {
    return organizerReports.map(org => ({
      name: org.nama.length > 12 ? org.nama.substring(0, 12) + '...' : org.nama,
      fullName: org.nama,
      Pendaftar: org.total_pendaftar,
      Hadir: org.total_hadir
    }));
  }, [organizerReports]);

  // Export to CSV
  const exportToCSV = () => {
    let rows = [];
    let filename = '';

    if (tab === 'event') {
      filename = `laporan_event_${filterTahun}_${filterBulan}.csv`;
      rows = [
        ["Nama Event", "Penyelenggara", "Tanggal", "Pendaftar", "Kehadiran", "Persentase (%)"],
        ...filteredEvents.map(item => [
          item.nama_event,
          item.penyelenggara,
          item.tanggal,
          item.pendaftar,
          item.hadir,
          item.pendaftar > 0 ? Math.round((item.hadir / item.pendaftar) * 100) : 0
        ])
      ];
    } else {
      filename = `laporan_penyelenggara_${filterTahun}_${filterBulan}.csv`;
      rows = [
        ["Nama Penyelenggara", "Total Event Dibuat", "Total Pendaftar", "Total Kehadiran", "Persentase Keseluruhan (%)"],
        ...organizerReports.map(item => [
          item.nama,
          item.total_event,
          item.total_pendaftar,
          item.total_hadir,
          item.total_pendaftar > 0 ? Math.round((item.total_hadir / item.total_pendaftar) * 100) : 0
        ])
      ];
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(rowArray => {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="alp-tooltip">
          <p className="alp-tooltip-title">{payload[0].payload.fullName}</p>
          {payload.map((entry, index) => (
            <p key={index} className="alp-tooltip-item" style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="alp-wrap">
      {/* Header */}
      <div className="alp-header">
        <div>
          <h1 className="alp-title">Laporan & Statistik</h1>
          <p className="alp-subtitle">Analisis data performa event dan penyelenggara</p>
        </div>
        <div className="alp-header-actions">
          <div className="alp-filter-group">
            <Filter size={16} color="#94a3b8" />
            <select className="alp-select" value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
              <option value="semua">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
            <select className="alp-select" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}>
              {BULAN.map((bln, idx) => (
                <option key={idx} value={idx.toString()}>{bln}</option>
              ))}
            </select>
          </div>
          <button className="alp-btn-export" onClick={exportToCSV}>
            <Download size={18} /> Export Laporan
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="alp-charts-grid">
        <div className="alp-chart-card">
          <div className="alp-chart-header">
            <h3>Tingkat Kehadiran per Event</h3>
          </div>
          <div className="alp-chart-body">
            {eventChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Pendaftar" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : loading ? (
              <div className="alp-empty-chart">Memuat data...</div>
            ) : (
              <div className="alp-empty-chart">Tidak ada data di periode ini</div>
            )}
          </div>
        </div>

        <div className="alp-chart-card">
          <div className="alp-chart-header">
            <h3>Performa Penyelenggara</h3>
          </div>
          <div className="alp-chart-body">
            {organizerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={organizerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Pendaftar" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Hadir" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : loading ? (
              <div className="alp-empty-chart">Memuat data...</div>
            ) : (
              <div className="alp-empty-chart">Tidak ada data di periode ini</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs and Data Table */}
      <div className="alp-table-card">
        <div className="alp-tabs">
          <button className={`alp-tab ${tab === 'event' ? 'active' : ''}`} onClick={() => setTab('event')}>
            <Calendar size={16} /> Laporan per Event
          </button>
          <button className={`alp-tab ${tab === 'penyelenggara' ? 'active' : ''}`} onClick={() => setTab('penyelenggara')}>
            <Users size={16} /> Laporan per Penyelenggara
          </button>
        </div>

        <div className="alp-table-wrap">
          <table className="alp-table">
            {tab === 'event' ? (
              <>
                <thead>
                  <tr>
                    <th>Nama Event</th>
                    <th>Penyelenggara</th>
                    <th>Tanggal</th>
                    <th className="text-right">Pendaftar</th>
                    <th className="text-right">Kehadiran</th>
                    <th className="text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-4 text-muted">Memuat data...</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4 text-muted">Tidak ada data</td></tr>
                  ) : filteredEvents.map(item => {
                    const pct = item.pendaftar > 0 ? Math.round((item.hadir / item.pendaftar) * 100) : 0;
                    return (
                      <tr key={item.id}>
                        <td className="font-medium text-white">{item.nama_event}</td>
                        <td>{item.penyelenggara}</td>
                        <td>{item.tanggal}</td>
                        <td className="text-right">{item.pendaftar} org</td>
                        <td className="text-right text-emerald">{item.hadir} org</td>
                        <td className="text-center">
                          <span className={`alp-pct-badge ${pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th>Nama Penyelenggara</th>
                    <th className="text-center">Total Event</th>
                    <th className="text-right">Total Pendaftar</th>
                    <th className="text-right">Total Kehadiran</th>
                    <th className="text-center">Avg Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-4 text-muted">Memuat data...</td></tr>
                  ) : organizerReports.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-4 text-muted">Tidak ada data</td></tr>
                  ) : organizerReports.map((item, idx) => {
                    const pct = item.total_pendaftar > 0 ? Math.round((item.total_hadir / item.total_pendaftar) * 100) : 0;
                    return (
                      <tr key={idx}>
                        <td className="font-medium text-white">
                          <div className="d-flex align-items-center gap-2">
                            <div className="alp-avatar-sm">{item.nama.charAt(0).toUpperCase()}</div>
                            {item.nama}
                          </div>
                        </td>
                        <td className="text-center">{item.total_event}</td>
                        <td className="text-right">{item.total_pendaftar} org</td>
                        <td className="text-right text-emerald">{item.total_hadir} org</td>
                        <td className="text-center">
                          <span className={`alp-pct-badge ${pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
