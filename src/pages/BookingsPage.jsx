import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../useAuth";
import { payWithSnap } from "../midtrans";
import { SOCKET_EVENTS, socket } from "../socket";
import { EmptyState, FormField, Loading, Modal, PageHeader, StatusBadge } from "../components";
import { dateLabel, dateTimeLabel, rupiah, timeLabel, timeSlots, todayInputValue } from "../format";
import {
  buttonBase,
  buttonBlock,
  buttonSmall,
  buttonVariant,
  cellSubClass,
  cellTitleClass,
  compactControlClass,
  cx,
  detailGridClass,
  detailItemClass,
  detailLabelClass,
  detailValueClass,
  filterControlClass,
  panelClass,
  tableClass,
  tableScrollClass,
  tableTdClass,
  tableThClass,
} from "../styles";

const EMPTY_BOOKING = {
  field_id: "",
  booking_date: todayInputValue(),
  start_time: "09:00",
  end_time: "10:00",
};

const EMPTY_FILTERS = { status: "", field_id: "", booking_date: "" };

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "expired"];

const NEXT_STATUSES = {
  pending: ["confirmed", "cancelled", "expired"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
  expired: [],
};

export default function BookingsPage({ notify }) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const initialFieldId = location.state?.fieldId;
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState(EMPTY_BOOKING);
  const [availability, setAvailability] = useState([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingFields, setLoadingFields] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const detail = bookings.find((booking) => booking.id === detailId) ?? null;

  const joinedFieldRef = useRef(null);

  useEffect(() => {
    if (initialFieldId) {
      queueMicrotask(() => {
        setForm((current) => ({ ...current, field_id: String(initialFieldId) }));
      });
    }
  }, [initialFieldId]);

  useEffect(() => {
    const fieldId = Number(form.field_id);
    const previousFieldId = joinedFieldRef.current;

    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      if (previousFieldId) {
        socket.emit(SOCKET_EVENTS.FIELD_LEAVE, { fieldId: previousFieldId });
        joinedFieldRef.current = null;
      }
      return undefined;
    }

    if (previousFieldId !== fieldId) {
      if (previousFieldId) {
        socket.emit(SOCKET_EVENTS.FIELD_LEAVE, { fieldId: previousFieldId });
      }
      socket.emit(SOCKET_EVENTS.FIELD_JOIN, { fieldId });
      joinedFieldRef.current = fieldId;
    }

    return () => {
      if (joinedFieldRef.current === fieldId) {
        socket.emit(SOCKET_EVENTS.FIELD_LEAVE, { fieldId });
        joinedFieldRef.current = null;
      }
    };
  }, [form.field_id]);

  const loadFields = useCallback(async () => {
    setLoadingFields(true);
    try {
      const response = await api.getFields();
      setFields((response?.data ?? []).filter((field) => field.active));
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setLoadingFields(false);
    }
  }, [notify]);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const response = await api.getBookings(filters);
      setBookings(response?.data ?? []);
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setLoadingBookings(false);
    }
  }, [filters, notify]);

  useEffect(() => {
    queueMicrotask(loadFields);
  }, [loadFields]);

  useEffect(() => {
    let active = true;
    api
      .getPaymentConfig()
      .then((response) => {
        if (active) setPaymentConfig(response?.data ?? null);
      })
      .catch((error) => notify({ type: "error", message: error.message }));
    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    queueMicrotask(loadBookings);
  }, [loadBookings]);

  useEffect(() => {
    const handleBookingChange = () => {
      loadBookings();
    };

    const handleAvailabilityChange = (payload) => {
      if (
        String(payload?.field_id) === String(form.field_id) &&
        payload?.booking_date === form.booking_date
      ) {
        api
          .getAvailability({ field_id: form.field_id, booking_date: form.booking_date })
          .then((response) => {
            setAvailability(response?.data?.booked_slots ?? []);
            setAvailabilityChecked(true);
          })
          .catch(() => { });
      }
    };

    socket.on(SOCKET_EVENTS.BOOKING_CREATED, handleBookingChange);
    socket.on(SOCKET_EVENTS.BOOKING_UPDATED, handleBookingChange);
    socket.on(SOCKET_EVENTS.PAYMENT_CREATED, handleBookingChange);
    socket.on(SOCKET_EVENTS.PAYMENT_UPDATED, handleBookingChange);
    socket.on(SOCKET_EVENTS.FIELD_AVAILABILITY, handleAvailabilityChange);

    return () => {
      socket.off(SOCKET_EVENTS.BOOKING_CREATED, handleBookingChange);
      socket.off(SOCKET_EVENTS.BOOKING_UPDATED, handleBookingChange);
      socket.off(SOCKET_EVENTS.PAYMENT_CREATED, handleBookingChange);
      socket.off(SOCKET_EVENTS.PAYMENT_UPDATED, handleBookingChange);
      socket.off(SOCKET_EVENTS.FIELD_AVAILABILITY, handleAvailabilityChange);
    };
  }, [loadBookings, form.field_id, form.booking_date]);

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "start_time" && value >= current.end_time) {
        const index = timeSlots.indexOf(value);
        next.end_time = timeSlots[index + 1] || value;
      }
      return next;
    });
    if (key === "field_id" || key === "booking_date") {
      setAvailability([]);
      setAvailabilityChecked(false);
    }
  };

  const updateFilter = (key) => (event) => {
    setFilters((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleAvailability = async () => {
    if (!form.field_id || !form.booking_date) {
      notify({ type: "error", message: "Pilih lapangan dan tanggal terlebih dahulu." });
      return;
    }
    setCheckingAvailability(true);
    try {
      const response = await api.getAvailability({
        field_id: form.field_id,
        booking_date: form.booking_date,
      });
      setAvailability(response?.data?.booked_slots ?? []);
      setAvailabilityChecked(true);
      notify({ type: "success", message: "Jadwal berhasil dicek." });
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createBooking({
        field_id: Number(form.field_id),
        booking_date: form.booking_date,
        start_time: selectedStartTime,
        end_time: selectedEndTime,
      });
      notify({ type: "success", message: "Booking dibuat. Selesaikan pembayaran sebelum batas waktu." });
      setAvailability([]);
      setAvailabilityChecked(false);
      await loadBookings();
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm(`Batalkan booking ${booking.booking_code}?`)) return;
    try {
      await api.cancelBooking(booking.id);
      notify({ type: "success", message: "Booking berhasil dibatalkan." });
      if (detailId === booking.id) setDetailId(null);
      await loadBookings();
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  const handleStatus = async (booking, status) => {
    try {
      await api.updateBookingStatus(booking.id, status);
      notify({ type: "success", message: "Status booking berhasil diperbarui." });
      if (detailId === booking.id) setDetailId(booking.id);
      await loadBookings();
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  const handlePay = async (booking) => {
    if (!window.confirm(`Buat transaksi Midtrans untuk booking ${booking.booking_code}?`)) return;
    try {
      const response = await api.createPayment(booking.id);
      await loadBookings();

      const payment = response?.data?.payment;
      const snapToken = response?.data?.snapToken || payment?.snapToken;
      const redirectUrl = response?.data?.redirectUrl || payment?.snapRedirectUrl;
      const clientKey = paymentConfig?.clientKey;
      const isProduction = Boolean(paymentConfig?.isProduction);
      const syncAfterPay = async () => {
        if (!payment?.id) {
          await loadBookings();
          return;
        }
        try {
          await api.syncPayment(payment.id);
        } catch {
          // Sync gagal tidak memblokir UI; webhook/socket bisa memperbarui nanti.
        }
        await loadBookings();
      };

      if (snapToken && clientKey) {
        await payWithSnap({
          token: snapToken,
          clientKey,
          isProduction,
          onSuccess: () => {
            notify({ type: "success", message: "Pembayaran berhasil diproses." });
            syncAfterPay();
          },
          onPending: () => {
            notify({ type: "info", message: "Pembayaran sedang menunggu penyelesaian." });
            syncAfterPay();
          },
          onError: () => {
            notify({ type: "error", message: "Pembayaran gagal diproses." });
            loadBookings();
          },
          onClose: () => {
            syncAfterPay();
          },
        });
        return;
      }

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      notify({
        type: "info",
        message: "Buka halaman Pembayaran untuk melihat detail transaksi.",
      });
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  const isToday = form.booking_date === todayInputValue();
  const currentTime = new Date().toTimeString().slice(0, 5);
  const availableStartTimes = timeSlots
    .slice(0, -1)
    .filter((time) => !isToday || time > currentTime);
  const selectedStartTime = availableStartTimes.includes(form.start_time)
    ? form.start_time
    : availableStartTimes[0] || "";
  const endTimes = timeSlots.filter((time) => time > selectedStartTime);
  const selectedEndTime = endTimes.includes(form.end_time) ? form.end_time : endTimes[0] || "";

  return (
    <div>
      <PageHeader
        eyebrow="Transaksi"
        title="Booking lapangan"
        description="Cek ketersedian jadwal dahulu sebelum membuat booking."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <section className={cx(panelClass, "overflow-hidden")}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Buat booking baru</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih lapangan, tanggal, dan rentang waktu.</p>
          </div>
          <form className="flex flex-col gap-5 p-5" onSubmit={handleCreate}>
            {loadingFields ? (
              <Loading label="Memuat lapangan..." />
            ) : fields.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                Belum ada lapangan aktif yang bisa dibooking.
              </p>
            ) : null}
            <FormField label="Lapangan" required>
              <select value={form.field_id} onChange={updateForm("field_id")} required>
                <option value="">-- Pilih lapangan --</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} — {rupiah(field.price_per_hour)}/jam
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tanggal booking" required>
                <input
                  type="date"
                  min={todayInputValue()}
                  value={form.booking_date}
                  onChange={updateForm("booking_date")}
                  required
                />
              </FormField>
              <FormField label="Jam mulai" required>
                <select value={selectedStartTime} onChange={updateForm("start_time")} required>
                  {availableStartTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Jam selesai" required>
                <select value={selectedEndTime} onChange={updateForm("end_time")} required>
                  {endTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <button
                type="button"
                className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
                onClick={handleAvailability}
                disabled={checkingAvailability}
              >
                {checkingAvailability ? "Mengecek..." : "Cek jadwal kosong"}
              </button>
              {availability.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <span>Sudah dipesan:</span>
                  {availability.map((slot) => (
                    <span
                      className="inline-flex rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"
                      key={slot.id}
                    >
                      {timeLabel(slot.start_time)}–{timeLabel(slot.end_time)}
                    </span>
                  ))}
                </div>
              ) : availabilityChecked ? (
                <span className="mt-2.5 block text-xs font-semibold text-emerald-700">
                  Semua jadwal tersedia.
                </span>
              ) : (
                <span className="mt-2.5 block text-xs text-slate-500">Belum ada pengecekan jadwal.</span>
              )}
            </div>

            <button className={cx(buttonBase, buttonVariant.primary, buttonBlock)} type="submit" disabled={saving}>
              {saving ? "Membuat booking..." : "Buat booking"}
            </button>
          </form>
        </section>

        <section className={cx(panelClass, "overflow-hidden")}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Daftar booking</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Admin melihat semua booking; pelanggan hanya booking milik sendiri."
                : "Berikut adalah riwayat booking Anda."
            }

            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
            <select
              className={filterControlClass}
              value={filters.status}
              onChange={updateFilter("status")}
              aria-label="Filter status"
            >
              <option value="">Semua status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              className={filterControlClass}
              value={filters.field_id}
              onChange={updateFilter("field_id")}
              aria-label="Filter lapangan"
            >
              <option value="">Semua lapangan</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
            <input
              className={filterControlClass}
              type="date"
              value={filters.booking_date}
              onChange={updateFilter("booking_date")}
              aria-label="Filter tanggal"
            />
            <button
              className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Atur ulang
            </button>
          </div>

          {loadingBookings ? (
            <Loading label="Memuat booking..." />
          ) : bookings.length === 0 ? (
            <EmptyState title="Belum ada booking" description="Booking yang dibuat akan tampil di sini." />
          ) : (
            <div className={tableScrollClass}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={tableThClass}>Kode</th>
                    <th className={tableThClass}>Lapangan</th>
                    <th className={tableThClass}>Jadwal</th>
                    <th className={tableThClass}>Total</th>
                    <th className={tableThClass}>Status</th>
                    <th className={tableThClass}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className={tableTdClass}>
                        <strong className={cellTitleClass}>{booking.booking_code}</strong>
                        <small className={cellSubClass}>{dateTimeLabel(booking.createdAt)}</small>
                      </td>
                      <td className={tableTdClass}>{booking.field?.name || `Field #${booking.field_id}`}</td>
                      <td className={tableTdClass}>
                        <strong className={cellTitleClass}>{dateLabel(booking.booking_date)}</strong>
                        <small className={cellSubClass}>
                          {timeLabel(booking.start_time)}–{timeLabel(booking.end_time)}
                        </small>
                      </td>
                      <td className={tableTdClass}>{rupiah(booking.total_price)}</td>
                      <td className={tableTdClass}>
                        <StatusBadge status={booking.status} />
                        {isAdmin && NEXT_STATUSES[booking.status]?.length > 0 ? (
                          <select
                            className={cx(compactControlClass, "mt-2 block")}
                            value={booking.status}
                            onChange={(event) => handleStatus(booking, event.target.value)}
                            aria-label={`Ubah status ${booking.booking_code}`}
                          >
                            <option value={booking.status}>{booking.status}</option>
                            {NEXT_STATUSES[booking.status].map((status) => (
                              <option key={status} value={status}>
                                → {status}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </td>
                      <td className={tableTdClass}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
                            onClick={() => setDetailId(booking.id)}
                          >
                            Detail
                          </button>
                          {booking.status === "pending" ? (
                            <>
                              <button
                                className={cx(buttonBase, buttonSmall, buttonVariant.primary)}
                                onClick={() => handlePay(booking)}
                              >
                                Bayar
                              </button>
                              <button
                                className={cx(buttonBase, buttonSmall, buttonVariant.danger)}
                                onClick={() => handleCancel(booking)}
                              >
                                Batal
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(detail)}
        title={`Detail ${detail?.booking_code || "booking"}`}
        onClose={() => setDetailId(null)}
        wide
      >
        {detail ? (
          <div className={detailGridClass}>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Status</span>
              <StatusBadge status={detail.status} />
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Lapangan</span>
              <strong className={detailValueClass}>{detail.field?.name || `Field #${detail.field_id}`}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Pelanggan</span>
              <strong className={detailValueClass}>{detail.user?.name || "-"}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Tanggal</span>
              <strong className={detailValueClass}>{dateLabel(detail.booking_date)}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Waktu</span>
              <strong className={detailValueClass}>
                {timeLabel(detail.start_time)}–{timeLabel(detail.end_time)}
              </strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Total</span>
              <strong className={detailValueClass}>{rupiah(detail.total_price)}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Berlaku sampai</span>
              <strong className={detailValueClass}>{dateTimeLabel(detail.expires_at)}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Dibuat</span>
              <strong className={detailValueClass}>{dateTimeLabel(detail.createdAt)}</strong>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
