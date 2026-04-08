import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { buildApiUrl } from "../utils/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1200&q=80";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(buildApiUrl(`/api/event/${id}`))
      .then((res) => res.json())
      .then((data) => {
        setEvent(data);
      })
      .catch(() => setError("Gagal memuat detail event."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <NavbarCustom />
      <main className="container" style={{ paddingTop: "120px", paddingBottom: "48px" }}>
        {loading ? <p>Memuat detail event...</p> : null}
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {!loading && !error && event ? (
          <div className="card border-0 shadow-sm">
            <img
              src={event.foto_event_url || (event.foto_event ? buildApiUrl(`/event/${event.foto_event}`) : FALLBACK_IMAGE)}
              alt={event.nama_event || event.title}
              style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div className="card-body">
              <h2 className="mb-2">{event.nama_event || event.title}</h2>
              <p className="text-muted mb-3">{event.category || "Tanpa Kategori"}</p>
              <p><strong>Tanggal:</strong> {event.tanggal || event.date || "-"}</p>
              <p><strong>Lokasi:</strong> {event.lokasi || event.location || "-"}</p>
              <p><strong>Deskripsi:</strong> {event.deskripsi || event.description || "-"}</p>
              <div className="d-flex gap-2 mt-2">
                <Link to={`/events/${id}/ticket`} className="btn btn-primary">Beli Tiket</Link>
                <Link to="/events" className="btn btn-outline-secondary">Kembali ke daftar event</Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
