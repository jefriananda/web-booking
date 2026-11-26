import { cloneElement, isValidElement, useEffect } from "react";
import {
  badgeClass,
  badgeVariant,
  cx,
  fieldHintClass,
  inputClass,
  labelClass,
  modalPanelClass,
  modalPanelWideClass,
} from "./styles";

const STATUS_LABELS = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  paid: "Lunas",
  unpaid: "Belum bayar",
  active: "Aktif",
  inactive: "Nonaktif",
  admin: "Admin",
  customer: "Pelanggan",
};

export function Loading({ label = "Memuat data..." }) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-5 py-10 text-sm text-slate-500" role="status">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-xl text-teal-700">
        ◇
      </div>
      <h3 className="mb-1.5 text-base font-bold text-slate-900">{title}</h3>
      {description ? <p className="mb-4 text-sm text-slate-500">{description}</p> : null}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const value = String(status ?? "-").toLowerCase();
  const color = badgeVariant[value] || badgeVariant.default;
  return <span className={`${badgeClass} ${color}`}>{STATUS_LABELS[value] || String(status ?? "-")}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow ? (
          <span className="mb-2.5 inline-block text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function FormField({ label, hint, required, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>
        {label}
        {required ? <em className="ml-0.5 not-italic text-red-600">*</em> : null}
      </span>
      {isValidElement(children)
        ? cloneElement(children, {
            className: cx(inputClass, children.props.className),
          })
        : children}
      {hint ? <span className={fieldHintClass}>{hint}</span> : null}
    </label>
  );
}

export function Modal({ open, title, description, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`${modalPanelClass}${wide ? ` ${modalPanelWideClass}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="mb-1 text-lg font-bold text-slate-900">{title}</h2>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xl leading-none text-slate-500 hover:bg-slate-200"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const dotColor =
    toast.type === "error" ? "bg-red-600" : toast.type === "info" ? "bg-blue-600" : "bg-teal-700";

  return (
    <div className="fixed right-6 top-20 z-[60] flex max-w-sm items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-xl" role="status">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{toast.message}</span>
      <button
        type="button"
        className="ml-auto text-lg leading-none text-slate-500 hover:text-slate-900"
        onClick={onClose}
        aria-label="Tutup notifikasi"
      >
        ×
      </button>
    </div>
  );
}
