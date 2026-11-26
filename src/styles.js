export const cx = (...parts) => parts.filter(Boolean).join(" ");

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0";

export const buttonVariant = {
  primary: "bg-teal-700 text-white shadow-sm hover:bg-teal-800",
  ghost: "border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
  danger: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
};

export const buttonSmall = "rounded-md px-3 py-1.5 text-xs";
export const buttonBlock = "w-full";

const controlBase =
  "rounded-lg border border-slate-300 bg-white text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 file:mr-3 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-teal-800 file:hover:bg-teal-100";

export const inputClass = `w-full px-3 py-2.5 text-sm ${controlBase}`;
export const filterControlClass = `px-3 py-2 text-sm ${controlBase}`;
export const compactControlClass = `px-2.5 py-1.5 text-xs ${controlBase}`;

export const panelClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
export const tableClass = "w-full border-collapse text-left";
export const tableScrollClass = "overflow-x-auto";
export const cellTitleClass = "block text-sm font-bold text-slate-900";
export const cellSubClass = "mt-0.5 block text-xs text-slate-500";

export const detailGridClass = "grid gap-x-6 gap-y-4 sm:grid-cols-2";
export const detailItemClass = "flex flex-col gap-1";
export const detailLabelClass = "text-xs font-bold uppercase tracking-wide text-slate-500";
export const detailValueClass = "text-sm text-slate-900";
export const modalActionsClass =
  "mt-6 flex flex-wrap justify-end gap-2.5 border-t border-slate-100 pt-5";

export const badgeVariant = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  paid: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  inactive: "bg-red-100 text-red-800",
  expired: "bg-red-100 text-red-800",
  unpaid: "bg-indigo-100 text-indigo-800",
  admin: "bg-violet-100 text-violet-800",
  customer: "bg-sky-100 text-sky-800",
  default: "bg-slate-100 text-slate-600",
};

export const badgeClass =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize whitespace-nowrap";

export const chipClass =
  "inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600";

export const labelClass = "text-xs font-bold text-slate-700";

export const fieldHintClass = "text-xs leading-relaxed text-slate-500";

export const tableThClass =
  "border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500";

export const tableTdClass = "border-b border-slate-100 px-3 py-3 align-top text-sm";

export const modalPanelClass =
  "max-h-[calc(100vh-40px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl";

export const modalPanelWideClass = "max-w-3xl";
