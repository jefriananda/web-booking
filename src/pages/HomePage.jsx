import { useNavigate } from "react-router-dom";
import heroImg from "/src/assets/gadebook-ikon.webp";
import { useAuth } from "../useAuth";
import { buttonBase, buttonVariant, cx } from "../styles";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const features = [
    {
      icon: "◫",
      title: "Jelajahi lapangan",
      description: "Lihat daftar lapangan, tipe, dan harga per jam yang tersedia.",
      path: "/fields",
    },
    {
      icon: "◷",
      title: "Cek jadwal kosong",
      description: "Cek slot yang sudah dipesan sebelum membuat booking.",
      path: "/bookings",
    },
    {
      icon: "◇",
      title: "Bayar dengan aman",
      description: "Lanjutkan pembayaran melalui Midtrans Snap saat booking dibuat.",
      path: "/payments",
    },
    ...(isAdmin
      ? [
        {
          icon: "◎",
          title: "Kelola pengguna",
          description: "Tambah, ubah, dan hapus akun admin atau pelanggan.",
          path: "/users",
        },
      ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-14">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-900 to-teal-700 px-8 py-12 text-white shadow-xl lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:px-14 lg:py-16">
        <div className="relative z-10">
          <h1 className="mb-4 mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            Selamat datang
            {user ? `, ${user.name}` : " di Web Booking"}
            <span className="text-teal-300">.</span>
          </h1>
          <p className="mb-7 max-w-xl leading-relaxed text-slate-300">
            Temukan lapangan favoritmu, pilih jadwal yang masih kosong, lalu selesaikan
            pembayaran dalam satu alur yang sederhana.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className={cx(buttonBase, buttonVariant.primary)} onClick={() => navigate("/fields")}>
              Lihat lapangan
            </button>
            <button
              className={cx(
                buttonBase,
                "border border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
              )}
              onClick={() => navigate(user ? "/bookings" : "/login")}
            >
              {user ? "Buat booking" : "Masuk ke akun"}
            </button>
          </div>
          {/* <div className="mt-7 text-sm">
            {checking ? (
              <span className="inline-flex items-center gap-2 text-teal-100">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-white" />
                Mengecek koneksi API...
              </span>
            ) : healthError ? (
              <span className="inline-flex flex-wrap items-center gap-2 text-red-200">
                <StatusBadge status="expired" />
                Belum terhubung ke {apiBaseUrl}. Pastikan backend berjalan.
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2 text-emerald-100">
                <StatusBadge status="confirmed" />
                {health?.message || "Backend terhubung."}
              </span>
            )}
          </div> */}
        </div>

        <div className="relative hidden justify-center lg:flex" aria-hidden="true">
          <div className="absolute h-80 w-80 rounded-full bg-teal-300/25 blur-2xl" />
          <img src={heroImg} alt="Gadebook" className="relative max-h-96 w-full max-w-sm object-contain drop-shadow-2xl opacity-20" />
        </div>
      </section>

      <section>
        <div className="max-w-2xl">
          <span className="mb-2.5 inline-block text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700">
            Alur aplikasi
          </span>
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Semua yang kamu butuhkan
          </h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <button
              key={feature.path}
              type="button"
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate(feature.path)}
            >
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-lg text-teal-800">
                {feature.icon}
              </span>
              <h3 className="mb-1.5 text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mb-4 min-h-[54px] text-sm leading-relaxed text-slate-500">{feature.description}</p>
              <span className="text-xs font-bold text-teal-700">Buka halaman →</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
