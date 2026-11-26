import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
/* apiBaseUrl available if needed: import { apiBaseUrl } from "./api"; */
import { useAuth } from "./useAuth";
import { Toast } from "./components";
import { buttonBase, buttonSmall, buttonVariant, cx } from "./styles";
import { SOCKET_EVENTS, socket } from "./socket";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import FieldsPage from "./pages/FieldsPage";
import BookingsPage from "./pages/BookingsPage";
import PaymentsPage from "./pages/PaymentsPage";
import UsersPage from "./pages/UsersPage";
import Logo from "/src/assets/gedebook-logo.webp";

const navLinkClass = ({ isActive }) =>
  cx(
    "rounded-full px-3.5 py-2 text-sm font-semibold transition hover:bg-slate-100 hover:text-slate-900",
    isActive ? "bg-teal-100 text-teal-800" : "text-slate-500"
  );

function ProtectedRoute({ user, notify, children }) {
  const location = useLocation();
  const notified = useRef(false);

  useEffect(() => {
    if (!user && !notified.current) {
      notify({ type: "info", message: "Masuk dulu untuk membuka halaman ini." });
      notified.current = true;
    }
  }, [user, notify]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function AdminRoute({ user, isAdmin, notify, children }) {
  const location = useLocation();
  const notified = useRef(false);

  useEffect(() => {
    if (!user && !notified.current) {
      notify({ type: "info", message: "Masuk dulu untuk membuka halaman ini." });
      notified.current = true;
    } else if (user && !isAdmin && !notified.current) {
      notify({ type: "info", message: "Halaman ini khusus admin." });
      notified.current = true;
    }
  }, [user, isAdmin, notify]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { user, loading, logout, isAdmin } = useAuth();
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const notify = useCallback((next) => {
    setToast(next);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleNotification = (payload) => {
      if (!payload?.message) return;
      notify({ type: "info", message: payload.message });
    };

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotification);
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotification);
    };
  }, [notify]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    try {
      await logout();
      notify({ type: "success", message: "Berhasil keluar dari akun." });
      navigate("/");
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  }, [logout, notify, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" aria-hidden="true" />
        <span>Menyiapkan sesi...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3.5">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-extrabold text-slate-900"
            onClick={() => setMenuOpen(false)}
          >
            <span>
              <img src={Logo} alt="Gadebook" width={144} height={144} />
            </span>
          </Link>

          <nav className="mr-auto hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            <NavLink to="/" end className={navLinkClass}>
              Beranda
            </NavLink>
            <NavLink to="/fields" className={navLinkClass}>
              Lapangan
            </NavLink>
            <NavLink to="/bookings" className={navLinkClass}>
              Booking
            </NavLink>
            <NavLink to="/payments" className={navLinkClass}>
              Pembayaran
            </NavLink>
            {isAdmin ? (
              <NavLink to="/users" className={navLinkClass}>
                Pengguna
              </NavLink>
            ) : null}
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-extrabold text-teal-800">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden flex-col leading-tight sm:flex">
                    <strong className="text-xs">{user.name}</strong>
                    <small className="text-[10px] capitalize text-slate-500">{user.role}</small>
                  </span>
                </div>
                <button className={cx(buttonBase, buttonSmall, buttonVariant.ghost)} onClick={handleLogout}>
                  Keluar
                </button>
              </>
            ) : (
              <Link to="/login" className={cx(buttonBase, buttonSmall, buttonVariant.primary)}>
                Masuk
              </Link>
            )}
          </div>

          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>

        {menuOpen ? (
          <div id="mobile-menu" className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
              <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Beranda
              </NavLink>
              <NavLink to="/fields" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Lapangan
              </NavLink>
              <NavLink to="/bookings" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Booking
              </NavLink>
              <NavLink to="/payments" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Pembayaran
              </NavLink>
              {isAdmin ? (
                <NavLink to="/users" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Pengguna
                </NavLink>
              ) : null}
            </nav>

            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              {user ? (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-extrabold text-teal-800">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <strong className="truncate text-xs">{user.name}</strong>
                      <small className="text-[10px] capitalize text-slate-500">{user.role}</small>
                    </span>
                  </div>
                  <button className={cx(buttonBase, buttonSmall, buttonVariant.ghost)} onClick={handleLogout}>
                    Keluar
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className={cx(buttonBase, buttonSmall, buttonVariant.primary, "w-full justify-center")}
                  onClick={() => setMenuOpen(false)}
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage notify={notify} />} />
          <Route path="/fields" element={<FieldsPage notify={notify} />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute user={user} notify={notify}>
                <BookingsPage notify={notify} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute user={user} notify={notify}>
                <PaymentsPage notify={notify} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute user={user} isAdmin={isAdmin} notify={notify}>
                <UsersPage notify={notify} />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-6 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
        <span>Gedebook ©2026.</span>
        <i>Kelompok 8.</i>
      </footer>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
