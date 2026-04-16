import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { buildApiUrl, defaultHeaders } from "../utils/api";

export default function TicketOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [metodeList, setMetodeList] = useState([]);
  const [form, setForm] = useState({
    jumlah_tiket: 1,
    harga_satuan: 0,
    metode_pembayaran_id: "",
    bukti_pembayaran: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userId = authUser?.id_user || authUser?.id || null;
  const displayName = authUser?.nama_lengkap || authUser?.name || authUser?.email || "User";
  const totalBayar = Number(form.jumlah_tiket || 0) * Number(form.harga_satuan || 0);
  const isGratis = Number(form.harga_satuan || 0) <= 0;
  const selectedMetode = metodeList.find((m) => String(m.id || m.id_metode_pembayaran) === String(form.metode_pembayaran_id));

  useEffect(() => {
    Promise.all([
      fetch(buildApiUrl(`/api/event/${id}`), { headers: defaultHeaders }).then((res) => res.json()),
      fetch(buildApiUrl("/api/metode-pembayaran"), { headers: defaultHeaders }).then((res) => res.json()),
    ])
      .then(([eventData, metodeData]) => {
        setEvent(eventData);
        setMetodeList(Array.isArray(metodeData) ? metodeData : []);
        setForm((prev) => ({
          ...prev,
          harga_satuan: Number(eventData?.harga || 0),
        }));
      })
      .catch(() => setError("Gagal memuat data pemesanan."))
      .finally(() => setLoading(false));
  }, [id]);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "bukti_pembayaran") {
      setForm((prev) => ({ ...prev, bukti_pembayaran: files?.[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrder = async () => {
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Silakan login dulu sebelum membeli tiket.");
      return;
    }
    if (!isGratis && !form.metode_pembayaran_id) {
      setError("Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    if (!isGratis && totalBayar <= 0) {
      setError("Harga total tidak valid.");
      return;
    }

    try {
      setSubmitting(true);
      const daftarResponse = await fetch(buildApiUrl("/api/daftar-event"), {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          user_id: userId,
          event_id: Number(id),
        }),
      });

      const daftarResult = await daftarResponse.json();
      if (!daftarResponse.ok) {
        throw new Error(daftarResult.message || "Gagal memesan tiket.");
      }

      const pendaftaranId =
        daftarResult?.data?.id ||
        daftarResult?.data?.id_pendaftaran_event ||
        daftarResult?.data?.id_pendaftaran;

      if (!pendaftaranId) {
        throw new Error("Pendaftaran berhasil, tetapi ID pendaftaran tidak ditemukan.");
      }

      if (isGratis) {
        setSuccess("Pendaftaran event gratis berhasil dibuat.");
      } else {
        const pembayaranPayload = new FormData();
        pembayaranPayload.append("pendaftaran_id", String(pendaftaranId));
        pembayaranPayload.append("jumlah_bayar", String(totalBayar));
        pembayaranPayload.append("metode_pembayaran_id", String(form.metode_pembayaran_id));
        if (form.bukti_pembayaran) {
          pembayaranPayload.append("bukti_pembayaran", form.bukti_pembayaran);
        }

        const pembayaranResponse = await fetch(buildApiUrl("/api/pembayaran"), {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: pembayaranPayload,
        });

        const pembayaranResult = await pembayaranResponse.json();
        if (!pembayaranResponse.ok) {
          throw new Error(pembayaranResult.message || "Pendaftaran berhasil, tetapi pembayaran gagal dibuat.");
        }

        setSuccess("Pendaftaran dan pembayaran berhasil dibuat. Status pembayaran Anda: pending.");
      }
      setTimeout(() => navigate("/events"), 1200);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memesan tiket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <NavbarCustom />
      <main className="container" style={{ paddingTop: "120px", paddingBottom: "48px", maxWidth: "760px" }}>
        {loading ? <p>Memuat data pemesanan...</p> : null}
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        {!loading && event ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h3 className="mb-3">Konfirmasi Beli Tiket</h3>
              <p className="mb-1"><strong>Event:</strong> {event.nama_event || event.title}</p>
              <p className="mb-1"><strong>Tanggal:</strong> {event.tanggal || event.date || "-"}</p>
              <p className="mb-3"><strong>Lokasi:</strong> {event.lokasi || event.location || "-"}</p>

              {!userId ? (
                <div className="alert alert-warning">
                  Anda belum login. <Link to="/auth">Login di sini</Link> untuk lanjut pembelian.
                </div>
              ) : (
                <p className="text-muted">Pesanan akan dibuat atas nama: {displayName}</p>
              )}

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label">Jumlah Tiket</label>
                  <input
                    type="number"
                    name="jumlah_tiket"
                    min="1"
                    className="form-control"
                    value={form.jumlah_tiket}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Harga per Tiket (Rp)</label>
                  <input
                    type="number"
                    name="harga_satuan"
                    min="0"
                    className="form-control"
                    value={form.harga_satuan}
                    readOnly
                  />
                </div>
                {!isGratis ? (
                  <>
                    <div className="col-12">
                      <label className="form-label">Metode Pembayaran</label>
                      <select
                        name="metode_pembayaran_id"
                        className="form-select"
                        value={form.metode_pembayaran_id}
                        onChange={onChange}
                      >
                        <option value="">Pilih metode pembayaran</option>
                        {metodeList.map((metode) => (
                          <option key={metode.id || metode.id_metode_pembayaran} value={metode.id || metode.id_metode_pembayaran}>
                            {metode.nama_metode}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedMetode ? (
                      <div className="col-12">
                        <div className="alert alert-secondary py-2 mb-0">
                          Transfer ke <strong>{selectedMetode.nama_metode}</strong> - {selectedMetode.nomor_tujuan} a.n. {selectedMetode.atas_nama}
                        </div>
                      </div>
                    ) : null}
                    <div className="col-12">
                      <label className="form-label">Upload Bukti Pembayaran (opsional)</label>
                      <input type="file" name="bukti_pembayaran" className="form-control" accept="image/*" onChange={onChange} />
                    </div>
                  </>
                ) : (
                  <div className="col-12">
                    <div className="alert alert-info py-2 mb-0">
                      Event ini gratis. Anda bisa langsung daftar tanpa pembayaran.
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h5 className="mb-0">
                  Total Bayar: {isGratis ? "Gratis" : `Rp ${Number(totalBayar).toLocaleString("id-ID")}`}
                </h5>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="button" className="btn btn-primary" disabled={submitting || !userId} onClick={handleOrder}>
                  {submitting ? "Memproses..." : "Konfirmasi Beli Tiket"}
                </button>
                <Link to={`/events/${id}`} className="btn btn-outline-secondary">Kembali</Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
