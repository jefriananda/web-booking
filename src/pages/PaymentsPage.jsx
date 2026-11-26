import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { EmptyState, Loading, Modal, PageHeader, StatusBadge } from "../components";
import { payWithSnap } from "../midtrans";
import { SOCKET_EVENTS, socket } from "../socket";
import { dateTimeLabel, rupiah } from "../format";
import {
  buttonBase,
  buttonSmall,
  buttonVariant,
  cellSubClass,
  cellTitleClass,
  cx,
  detailGridClass,
  detailItemClass,
  detailLabelClass,
  detailValueClass,
  panelClass,
  tableClass,
  tableScrollClass,
  tableTdClass,
  tableThClass,
} from "../styles";

export default function PaymentsPage({ notify }) {
  const [payments, setPayments] = useState([]);
  const [config, setConfig] = useState(null);
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);
  const detail = payments.find((payment) => payment.id === detailId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getPayments(bookingId ? { booking_id: bookingId } : undefined);
      setPayments(response?.data ?? []);
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [bookingId, notify]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    const handlePaymentChange = () => {
      load();
    };

    socket.on(SOCKET_EVENTS.PAYMENT_CREATED, handlePaymentChange);
    socket.on(SOCKET_EVENTS.PAYMENT_UPDATED, handlePaymentChange);

    return () => {
      socket.off(SOCKET_EVENTS.PAYMENT_CREATED, handlePaymentChange);
      socket.off(SOCKET_EVENTS.PAYMENT_UPDATED, handlePaymentChange);
    };
  }, [load]);

  useEffect(() => {
    let active = true;
    api
      .getPaymentConfig()
      .then((response) => {
        if (active) setConfig(response?.data ?? null);
      })
      .catch((error) => notify({ type: "error", message: error.message }));
    return () => {
      active = false;
    };
  }, [notify]);

  const handleSync = async (payment, { silent = false } = {}) => {
    try {
      const response = await api.syncPayment(payment.id);
      if (!silent) notify({ type: "success", message: response?.message || "Status pembayaran disinkronkan." });
      await load();
    } catch (error) {
      if (!silent) notify({ type: "error", message: error.message });
    }
  };

  const handleOpen = async (payment) => {
    const snapToken = payment.snapToken;
    const redirectUrl = payment.snapRedirectUrl;
    const clientKey = config?.clientKey;
    const isProduction = Boolean(config?.isProduction);

    try {
      if (snapToken && clientKey) {
        await payWithSnap({
          token: snapToken,
          clientKey,
          isProduction,
          onSuccess: () => {
            notify({ type: "success", message: "Pembayaran berhasil diproses." });
            handleSync(payment, { silent: true });
          },
          onPending: () => {
            notify({ type: "info", message: "Pembayaran sedang menunggu penyelesaian." });
            handleSync(payment, { silent: true });
          },
          onError: () => {
            notify({ type: "error", message: "Pembayaran gagal diproses." });
            load();
          },
          onClose: () => {
            handleSync(payment, { silent: true });
          },
        });
        return;
      }

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      notify({ type: "error", message: "Token pembayaran tidak tersedia." });
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  const handleCancel = async (payment) => {
    if (!window.confirm(`Batalkan transaksi untuk booking ${payment.booking?.booking_code}?`)) return;
    try {
      await api.cancelPayment(payment.id);
      notify({ type: "success", message: "Transaksi Midtrans berhasil dibatalkan." });
      if (detailId === payment.id) setDetailId(null);
      await load();
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pembayaran"
        title="Daftar transaksi"
        description="Berikut adalah riwayat transaksi Anda."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Midtrans: <strong className="text-slate-900">{config?.isProduction ? "Production" : "Sandbox"}</strong>
          </span>
        }
      />

      <section className={cx(panelClass, "overflow-hidden")}>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
          <button
            className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
            type="button"
            onClick={() => setBookingId("")}
          >
            Atur ulang
          </button>
          <button className={cx(buttonBase, buttonSmall, buttonVariant.ghost)} type="button" onClick={load}>
            Muat ulang
          </button>
        </div>

        {loading ? (
          <Loading label="Memuat pembayaran..." />
        ) : payments.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Buat booking lalu tekan tombol Bayar untuk membuat transaksi Midtrans."
          />
        ) : (
          <div className={tableScrollClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={tableThClass}>ID</th>
                  <th className={tableThClass}>Booking</th>
                  <th className={tableThClass}>Metode</th>
                  <th className={tableThClass}>Jumlah</th>
                  <th className={tableThClass}>Status</th>
                  <th className={tableThClass}>Dibuat</th>
                  <th className={tableThClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className={tableTdClass}>
                      <strong className={cellTitleClass}>#{payment.id}</strong>
                      <small className={cellSubClass}>{payment.transactionId || "-"}</small>
                    </td>
                    <td className={tableTdClass}>
                      <strong className={cellTitleClass}>
                        {payment.booking?.booking_code || `Booking #${payment.booking_id}`}
                      </strong>
                      <small className={cellSubClass}>{payment.booking?.status || "-"}</small>
                    </td>
                    <td className={tableTdClass}>{payment.payment_method}</td>
                    <td className={tableTdClass}>{rupiah(payment.amount)}</td>
                    <td className={tableTdClass}>
                      <StatusBadge status={payment.paid_at ? "paid" : "unpaid"} />
                    </td>
                    <td className={tableTdClass}>{dateTimeLabel(payment.createdAt)}</td>
                    <td className={tableTdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
                          onClick={() => setDetailId(payment.id)}
                        >
                          Detail
                        </button>
                        {!payment.paid_at ? (
                          <button
                            className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
                            onClick={() => handleSync(payment)}
                          >
                            Cek status
                          </button>
                        ) : null}
                        {!payment.paid_at && (payment.snapToken || payment.snapRedirectUrl) ? (
                          <button
                            className={cx(buttonBase, buttonSmall, buttonVariant.primary)}
                            onClick={() => handleOpen(payment)}
                          >
                            Lanjut bayar
                          </button>
                        ) : null}
                        {!payment.paid_at && payment.booking?.status === "pending" ? (
                          <button
                            className={cx(buttonBase, buttonSmall, buttonVariant.danger)}
                            onClick={() => handleCancel(payment)}
                          >
                            Batalkan
                          </button>
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

      <Modal
        open={Boolean(detail)}
        title={`Detail pembayaran #${detail?.id ?? ""}`}
        onClose={() => setDetailId(null)}
        wide
      >
        {detail ? (
          <div className={detailGridClass}>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Status</span>
              <StatusBadge status={detail.paid_at ? "paid" : "unpaid"} />
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Booking</span>
              <strong className={detailValueClass}>{detail.booking?.booking_code || `#${detail.booking_id}`}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Jumlah</span>
              <strong className={detailValueClass}>{rupiah(detail.amount)}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Metode</span>
              <strong className={detailValueClass}>{detail.payment_method}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Transaction ID</span>
              <strong className={detailValueClass}>{detail.transactionId || "-"}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Dibayar</span>
              <strong className={detailValueClass}>{dateTimeLabel(detail.paid_at)}</strong>
            </div>
            <div className={detailItemClass}>
              <span className={detailLabelClass}>Kedaluwarsa</span>
              <strong className={detailValueClass}>{dateTimeLabel(detail.expires_at)}</strong>
            </div>
            <div className={cx(detailItemClass, "sm:col-span-2")}>
              <span className={detailLabelClass}>Snap token</span>
              <code className="block max-h-40 overflow-auto break-all rounded-lg bg-slate-900 px-3 py-2.5 font-mono text-xs text-teal-200">
                {detail.snapToken || "-"}
              </code>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
