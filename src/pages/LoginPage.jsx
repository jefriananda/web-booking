import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../useAuth";
import { FormField } from "../components";
import { buttonBase, buttonBlock, buttonVariant, cx } from "../styles";

const BENEFITS = [
  "Lihat dan kelola lapangan",
  "Booking dengan pengecekan bentrok jadwal",
  "Pembayaran Midtrans Snap",
  "Kelola user untuk admin",
];

export default function LoginPage({ notify }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = typeof location.state?.from === "string" && location.state.from.startsWith("/")
    ? location.state.from
    : "/";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email: form.email.trim(), password: form.password });
        notify({ type: "success", message: "Berhasil masuk." });
        navigate(from, { replace: true });
      } else {
        await api.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: "customer",
        });
        notify({ type: "success", message: "Akun pelanggan berhasil dibuat. Silakan masuk." });
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
      }
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <span className="mb-2.5 inline-block text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700">
          {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
        </span>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {mode === "login" ? "Masuk ke Web Booking" : "Daftar sebagai pelanggan"}
        </h1>
        <p className="text-sm leading-relaxed text-slate-500">
          {mode === "login"
            ? "Gunakan akun yang sudah terdaftar untuk mengelola booking dan pembayaran."
            : "Endpoint pendaftaran memakai POST /api/users dengan role customer."}
        </p>

        <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <FormField label="Nama lengkap" required>
              <input
                value={form.name}
                onChange={setField("name")}
                placeholder="Nama kamu"
                autoComplete="name"
                required
              />
            </FormField>
          ) : null}

          <FormField label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="nama@email.com"
              autoComplete="email"
              required
            />
          </FormField>

          <FormField
            label="Password"
            required
            hint={mode === "register" ? "Minimal 6 karakter disarankan." : undefined}
          >
            <input
              type="password"
              value={form.password}
              onChange={setField("password")}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </FormField>

          <button className={cx(buttonBase, buttonVariant.primary, buttonBlock)} type="submit" disabled={busy}>
            {busy ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <span>
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              className="font-bold text-teal-700 hover:text-teal-900 hover:underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Daftar sekarang" : "Masuk"}
            </button>
          </span>
          <button
            type="button"
            className="text-left font-bold text-teal-700 hover:text-teal-900 hover:underline"
            onClick={() => navigate("/fields")}
          >
            Lihat lapangan dulu
          </button>
        </div>
      </div>

      <aside className="rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 p-8 text-white shadow-xl sm:p-10">
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-teal-50">
          Session cookie
        </span>
        <h2 className="mb-3 mt-5 text-2xl font-extrabold leading-snug">
          Login sekali, langsung pakai semua fitur.
        </h2>
        <p className="text-sm leading-relaxed text-teal-100">
          Session disimpan browser dan dikirim otomatis ke backend pada setiap permintaan,
          termasuk saat mengecek ketersediaan dan membuat pembayaran.
        </p>
        <ul className="mt-6 flex flex-col gap-3 text-sm">
          {BENEFITS.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-400/25 text-xs text-teal-100">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
