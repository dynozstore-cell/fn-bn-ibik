import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavbarCustom from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { buildApiUrl } from "../utils/api";

const initialRegisterForm = {
  nama_lengkap: "",
  email: "",
  no_hp: "",
  kategori_pendaftar: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

async function parseApiResponse(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
      throw new Error("Server mengembalikan HTML, bukan JSON. Cek URL API dan pastikan backend Laravel berjalan.");
    }
    throw new Error("Response server tidak valid.");
  }
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(registerForm),
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Gagal daftar");
      }

      setSuccess("Daftar berhasil. Sekarang silakan login.");
      setRegisterForm(initialRegisterForm);
      setActiveTab("login");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat daftar.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Gagal login");
      }

      localStorage.setItem("auth_user", JSON.stringify(result.data || {}));
      localStorage.setItem("auth_token", result.token || "");
      const isAdmin = result?.data?.role === "admin";
      setSuccess(`Login berhasil. Anda akan diarahkan ke ${isAdmin ? "halaman admin" : "beranda"}.`);
      setLoginForm(initialLoginForm);

      setTimeout(() => {
        navigate(isAdmin ? "/admin/events" : "/");
      }, 800);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavbarCustom />
      <div className="container" style={{ paddingTop: "120px", paddingBottom: "60px", maxWidth: "620px" }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <h2 className="mb-3 text-center">Akun Pengguna</h2>
            <p className="text-muted text-center mb-4">Daftar dulu, lalu login untuk masuk ke platform.</p>

            <div className="d-flex gap-2 mb-4">
              <button
                type="button"
                className={`btn ${activeTab === "login" ? "btn-primary" : "btn-outline-primary"} w-50`}
                onClick={() => {
                  setActiveTab("login");
                  setError("");
                  setSuccess("");
                }}
              >
                Masuk
              </button>
              <button
                type="button"
                className={`btn ${activeTab === "register" ? "btn-primary" : "btn-outline-primary"} w-50`}
                onClick={() => {
                  setActiveTab("register");
                  setError("");
                  setSuccess("");
                }}
              >
                Daftar
              </button>
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}
            {success ? <div className="alert alert-success">{success}</div> : null}

            {activeTab === "register" ? (
              <form onSubmit={handleRegisterSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nama lengkap</label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    className="form-control"
                    value={registerForm.nama_lengkap}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nomor HP</label>
                  <input
                    type="text"
                    name="no_hp"
                    className="form-control"
                    value={registerForm.no_hp}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Kategori pendaftar</label>
                  <input
                    type="text"
                    name="kategori_pendaftar"
                    className="form-control"
                    value={registerForm.kategori_pendaftar}
                    onChange={handleRegisterChange}
                    placeholder="Contoh: mahasiswa"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Memproses..." : "Daftar Sekarang"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>
            )}

            <p className="text-center text-muted mt-4 mb-0">
              Kembali ke <Link to="/">beranda</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
