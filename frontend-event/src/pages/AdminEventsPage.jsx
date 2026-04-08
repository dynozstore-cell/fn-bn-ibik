import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../utils/api";

const emptyEventForm = {
  nama_event: "",
  kategori_id: "",
  deskripsi: "",
  tanggal: "",
  lokasi: "",
  harga: "",
  foto_event: null,
};

const emptyMetodeForm = {
  nama_metode: "",
  nomor_tujuan: "",
  atas_nama: "",
};

async function parseApiResponse(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
      throw new Error("Server mengembalikan HTML, bukan JSON.");
    }
    throw new Error("Response server tidak valid.");
  }
}

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("event");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [events, setEvents] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);

  const [kontakList, setKontakList] = useState([]);
  const [pendaftaranList, setPendaftaranList] = useState([]);
  const [pembayaranList, setPembayaranList] = useState([]);
  const loadPendaftaran = async () => {
    const response = await fetch(buildApiUrl("/api/daftar-event"), { headers: { Accept: "application/json" } });
    const result = await parseApiResponse(response);
    setPendaftaranList(Array.isArray(result) ? result : result.data || []);
  };

  const [metodeList, setMetodeList] = useState([]);
  const [metodeForm, setMetodeForm] = useState(emptyMetodeForm);

  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const token = localStorage.getItem("auth_token") || "";
  const authHeaders = { Accept: "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (authUser?.role !== "admin") navigate("/auth");
  }, [authUser, navigate]);

  const loadEvents = async () => {
    const response = await fetch(buildApiUrl("/api/event"), { headers: { Accept: "application/json" } });
    const result = await parseApiResponse(response);
    setEvents(Array.isArray(result) ? result : result.data || []);
  };

  const loadKategori = async () => {
    const response = await fetch(buildApiUrl("/api/kategori"), { headers: { Accept: "application/json" } });
    const result = await parseApiResponse(response);
    setKategoriList(Array.isArray(result) ? result : result.data || []);
  };

  const loadKontak = async () => {
    const response = await fetch(buildApiUrl("/api/kontak-event"), { headers: { Accept: "application/json" } });
    const result = await parseApiResponse(response);
    setKontakList(Array.isArray(result) ? result : result.data || []);
  };

  const loadPembayaran = async () => {
    const response = await fetch(buildApiUrl("/api/pembayaran"), { headers: { Accept: "application/json" } });
    const result = await parseApiResponse(response);
    setPembayaranList(Array.isArray(result) ? result : result.data || []);
  };

  const loadMetode = async () => {
    const response = await fetch(buildApiUrl("/api/metode-pembayaran"), { headers: { Accept: "application/json" } });
    const result = await parseApiResponse(response);
    setMetodeList(Array.isArray(result) ? result : result.data || []);
  };

  const loadCurrentTab = async () => {
    try {
      setLoading(true);
      setError("");
      if (tab === "event") await loadEvents();
      if (tab === "event") await loadKategori();
      if (tab === "pendaftaran") await loadPendaftaran();
      if (tab === "kontak") await loadKontak();
      if (tab === "pembayaran") await loadPembayaran();
      if (tab === "metode") await loadMetode();
  const updatePendaftaranStatus = async (id, status) => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/daftar-event/${id}`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status_pendaftaran: status }),
      });
      const result = await parseApiResponse(response);
      if (!response.ok) throw new Error(result.message || "Gagal update pendaftaran.");
      setMessage("Status pendaftaran berhasil diperbarui.");
      await loadPendaftaran();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

    } catch (err) {
      setError(err.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentTab();
  }, [tab]);

  const submitEvent = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      setLoading(true);
      const url = editingEventId ? buildApiUrl(`/api/event/${editingEventId}`) : buildApiUrl("/api/event");
      const payload = new FormData();
      payload.append("nama_event", eventForm.nama_event);
      payload.append("kategori_id", eventForm.kategori_id);
      payload.append("deskripsi", eventForm.deskripsi);
      payload.append("tanggal", eventForm.tanggal);
      payload.append("lokasi", eventForm.lokasi);
      payload.append("harga", eventForm.harga || 0);
      if (eventForm.foto_event) payload.append("foto_event", eventForm.foto_event);
      if (editingEventId) payload.append("_method", "PUT");

      const response = await fetch(url, { method: "POST", headers: authHeaders, body: payload });
      const result = await parseApiResponse(response);
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan event.");

      setMessage(editingEventId ? "Event berhasil diperbarui." : "Event berhasil ditambahkan.");
      setEventForm(emptyEventForm);
      setEditingEventId(null);
      await loadEvents();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Hapus event ini?")) return;
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/event/${id}`), { method: "DELETE", headers: authHeaders });
      const result = await parseApiResponse(response);
      if (!response.ok) throw new Error(result.message || "Gagal hapus event.");
      setMessage("Event berhasil dihapus.");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const updateKontakStatus = async (row, status) => {
    try {
      setLoading(true);
      const id = row.id || row.id_kontak_event;
      const response = await fetch(buildApiUrl(`/api/kontak-event/${id}`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, status }),
      });
      const result = await parseApiResponse(response);
      if (!response.ok) throw new Error(result.message || "Gagal update status.");
      setMessage("Status kontak berhasil diperbarui.");
      await loadKontak();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const updatePembayaranStatus = async (id, status) => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/pembayaran/${id}/verifikasi`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status_pembayaran: status }),
      });
      const result = await parseApiResponse(response);
      if (!response.ok) throw new Error(result.message || "Gagal update pembayaran.");
      setMessage("Status pembayaran berhasil diperbarui.");
      await loadPembayaran();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const submitMetode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/metode-pembayaran"), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(metodeForm),
      });
      const result = await parseApiResponse(response);
      if (!response.ok) throw new Error(result.message || "Gagal tambah metode.");
      setMessage("Metode pembayaran berhasil ditambahkan.");
      setMetodeForm(emptyMetodeForm);
      await loadMetode();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Admin Dashboard</h2>
        <button type="button" className="btn btn-outline-secondary" onClick={() => { localStorage.clear(); navigate("/auth"); }}>
          Logout
        </button>
      </div>

      <div className="btn-group mb-4">
        <button type="button" className={`btn ${tab === "event" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("event")}>Event</button>
        <button type="button" className={`btn ${tab === "pendaftaran" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("pendaftaran")}>Pendaftaran</button>
        <button type="button" className={`btn ${tab === "kontak" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("kontak")}>Kontak Event</button>
        <button type="button" className={`btn ${tab === "pembayaran" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("pembayaran")}>Pembayaran</button>
        <button type="button" className={`btn ${tab === "metode" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("metode")}>Metode Pembayaran</button>
      </div>
      {tab === "pendaftaran" ? (
        <div className="card"><div className="card-body table-responsive">
          <table className="table table-striped">
            <thead><tr><th>ID</th><th>Peserta</th><th>Email</th><th>Event</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{pendaftaranList.map((row) => {
              const id = row.id || row.id_pendaftaran_event;
              return <tr key={id}>
                <td>{id}</td>
                <td>{row.nama_peserta || "-"}</td>
                <td>{row.email_peserta || "-"}</td>
                <td>{row.nama_event || "-"}</td>
                <td>{row.tanggal_daftar || "-"}</td>
                <td>{row.status_pendaftaran || "-"}</td>
                <td className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-success" onClick={() => updatePendaftaranStatus(id, "approved")}>Approve</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => updatePendaftaranStatus(id, "rejected")}>Reject</button>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div></div>
      ) : null}


      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}
      {loading ? <p>Memuat...</p> : null}

      {tab === "event" ? (
        <>
          <div className="card mb-4"><div className="card-body">
            <h5>{editingEventId ? "Edit Event" : "Tambah Event"}</h5>
            <form onSubmit={submitEvent} className="row g-3">
              <div className="col-md-6"><input className="form-control" placeholder="Nama Event" value={eventForm.nama_event} onChange={(e) => setEventForm((p) => ({ ...p, nama_event: e.target.value }))} required /></div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={eventForm.kategori_id}
                  onChange={(e) => setEventForm((p) => ({ ...p, kategori_id: e.target.value }))}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {kategoriList.map((kategori) => (
                    <option key={kategori.id || kategori.id_kategori} value={kategori.id || kategori.id_kategori}>
                      {kategori.nama_kategori || kategori.nama || `Kategori ${kategori.id || kategori.id_kategori}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6"><input type="date" className="form-control" value={eventForm.tanggal} onChange={(e) => setEventForm((p) => ({ ...p, tanggal: e.target.value }))} required /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Lokasi" value={eventForm.lokasi} onChange={(e) => setEventForm((p) => ({ ...p, lokasi: e.target.value }))} required /></div>
              <div className="col-md-6"><input type="number" min="0" className="form-control" placeholder="Harga Tiket (kosongkan jika gratis)" value={eventForm.harga} onChange={(e) => setEventForm((p) => ({ ...p, harga: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows="3" placeholder="Deskripsi" value={eventForm.deskripsi} onChange={(e) => setEventForm((p) => ({ ...p, deskripsi: e.target.value }))} required /></div>
              <div className="col-12"><input type="file" className="form-control" accept="image/*" onChange={(e) => setEventForm((p) => ({ ...p, foto_event: e.target.files?.[0] || null }))} /></div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary">{editingEventId ? "Update" : "Tambah"}</button>
                {editingEventId ? <button type="button" className="btn btn-secondary" onClick={() => { setEditingEventId(null); setEventForm(emptyEventForm); }}>Batal</button> : null}
              </div>
            </form>
          </div></div>
          <div className="card"><div className="card-body table-responsive">
            <table className="table table-striped">
              <thead><tr><th>Nama</th><th>Kategori</th><th>Tanggal</th><th>Lokasi</th><th>Harga</th><th>Foto</th><th>Aksi</th></tr></thead>
              <tbody>
                {events.map((row) => {
                  const id = row.id || row.id_event;
                  return <tr key={id}>
                    <td>{row.nama_event}</td><td>{row.category || row.nama_kategori || "-"}</td><td>{row.tanggal}</td><td>{row.lokasi}</td><td>Rp {Number(row.harga || 0).toLocaleString("id-ID")}</td><td>{row.foto_event || "-"}</td>
                    <td className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-warning" onClick={() => { setEditingEventId(id); setEventForm({ nama_event: row.nama_event || "", kategori_id: String(row.kategori_id || ""), deskripsi: row.deskripsi || "", tanggal: row.tanggal || "", lokasi: row.lokasi || "", harga: String(row.harga || ""), foto_event: null }); }}>Edit</button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteEvent(id)}>Hapus</button>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div></div>
        </>
      ) : null}

      {tab === "kontak" ? (
        <div className="card"><div className="card-body table-responsive">
          <table className="table table-striped">
            <thead><tr><th>Nama</th><th>Email</th><th>Judul Event</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{kontakList.map((row) => {
              const id = row.id || row.id_kontak_event;
              return <tr key={id}>
                <td>{row.nama}</td><td>{row.email}</td><td>{row.judul_event}</td><td>{row.status}</td>
                <td className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-success" onClick={() => updateKontakStatus(row, "approved")}>Approve</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => updateKontakStatus(row, "rejected")}>Reject</button>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div></div>
      ) : null}

      {tab === "pembayaran" ? (
        <div className="card"><div className="card-body table-responsive">
          <table className="table table-striped">
            <thead><tr><th>ID</th><th>Peserta</th><th>Event</th><th>Jumlah</th><th>Metode</th><th>Bukti</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{pembayaranList.map((row) => {
              const id = row.id || row.id_pembayaran;
              return <tr key={id}>
                <td>{id}</td>
                <td>{row.nama_peserta || "-"}</td>
                <td>{row.nama_event || "-"}</td>
                <td>Rp {Number(row.jumlah_bayar || 0).toLocaleString("id-ID")}</td>
                <td>{typeof row.metode_pembayaran === "string" ? row.metode_pembayaran : (row.metode_pembayaran?.nama_metode || "-")}</td>
                <td>
                  {row.bukti_pembayaran_url ? (
                    <a href={row.bukti_pembayaran_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                      Lihat Bukti
                    </a>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>{row.status_pembayaran}</td>
                <td className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-success" onClick={() => updatePembayaranStatus(id, "verified")}>Verifikasi</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => updatePembayaranStatus(id, "rejected")}>Tolak</button>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div></div>
      ) : null}

      {tab === "metode" ? (
        <>
          <div className="card mb-4"><div className="card-body">
            <h5>Tambah Metode Pembayaran</h5>
            <form onSubmit={submitMetode} className="row g-3">
              <div className="col-md-4"><input className="form-control" placeholder="Nama Metode" value={metodeForm.nama_metode} onChange={(e) => setMetodeForm((p) => ({ ...p, nama_metode: e.target.value }))} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Nomor Tujuan" value={metodeForm.nomor_tujuan} onChange={(e) => setMetodeForm((p) => ({ ...p, nomor_tujuan: e.target.value }))} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Atas Nama" value={metodeForm.atas_nama} onChange={(e) => setMetodeForm((p) => ({ ...p, atas_nama: e.target.value }))} required /></div>
              <div className="col-12"><button type="submit" className="btn btn-primary">Tambah Metode</button></div>
            </form>
          </div></div>
          <div className="card"><div className="card-body table-responsive">
            <table className="table table-striped">
              <thead><tr><th>Nama Metode</th><th>Nomor Tujuan</th><th>Atas Nama</th></tr></thead>
              <tbody>{metodeList.map((row) => <tr key={row.id || row.id_metode_pembayaran}><td>{row.nama_metode}</td><td>{row.nomor_tujuan}</td><td>{row.atas_nama}</td></tr>)}</tbody>
            </table>
          </div></div>
        </>
      ) : null}

    </div>
  );
}
