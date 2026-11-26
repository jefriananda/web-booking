import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, assetUrl } from "../api";
import { useAuth } from "../useAuth";
import { EmptyState, FormField, Loading, Modal, PageHeader, StatusBadge } from "../components";
import { rupiah } from "../format";
import {
  buttonBase,
  buttonSmall,
  buttonVariant,
  chipClass,
  cx,
  modalActionsClass,
  panelClass,
} from "../styles";

const EMPTY_FORM = {
  name: "",
  type: "",
  price_per_hour: "",
  description: "",
  active: "true",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
const IMAGE_TYPE_ERROR = "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.";
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif";

const validateImage = (file) => {
  if (!file) return "";
  if (file.size > MAX_IMAGE_SIZE) return "Ukuran gambar maksimal 2 MB.";
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return IMAGE_TYPE_ERROR;
  }
  return "";
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "L";

export default function FieldsPage({ notify }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getFields();
      setFields(response?.data ?? []);
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const resetImage = (existingImage = "") => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setImageFile(null);
    setImageError("");
    setPreviewUrl(existingImage ? assetUrl(existingImage) : "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    resetImage();
    setModalOpen(true);
  };

  const openEdit = (field) => {
    setEditing(field);
    setForm({
      name: field.name ?? "",
      type: field.type ?? "",
      price_per_hour: String(field.price_per_hour ?? ""),
      description: field.description ?? "",
      active: String(Boolean(field.active)),
    });
    resetImage(field.image);
    setModalOpen(true);
  };

  const setFieldValue = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    const error = validateImage(file);

    if (error || !file) {
      resetImage(editing?.image);
      if (error) setImageError(error);
      event.target.value = "";
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setImageFile(file);
    setImageError("");
    setPreviewUrl(objectUrlRef.current);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateImage(imageFile);
    if (error) {
      setImageError(error);
      notify({ type: "error", message: error });
      return;
    }

    setSaving(true);
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("type", form.type.trim());
    payload.append("price_per_hour", String(Number(form.price_per_hour)));
    payload.append("description", form.description.trim());
    payload.append("active", form.active);
    if (imageFile) payload.append("image", imageFile);

    try {
      if (editing) {
        await api.updateField(editing.id, payload);
        notify({ type: "success", message: "Lapangan dan gambar berhasil diperbarui." });
      } else {
        await api.createField(payload);
        notify({ type: "success", message: "Lapangan berhasil ditambahkan." });
      }
      setModalOpen(false);
      resetImage();
      await load();
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (field) => {
    if (!window.confirm(`Hapus lapangan "${field.name}"?`)) return;
    try {
      await api.deleteField(field.id);
      notify({ type: "success", message: "Lapangan berhasil dihapus." });
      await load();
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Katalog"
        title="Daftar lapangan"
        description={isAdmin ? "Hanya admin yang dapata mengelola lapangan." : "Daftar lapangan yang bisa kamu sewa."}
        actions={
          isAdmin ? (
            <button className={cx(buttonBase, buttonVariant.primary)} onClick={openCreate}>
              + Tambah lapangan
            </button>
          ) : null
        }
      />

      {loading ? (
        <Loading label="Memuat lapangan..." />
      ) : fields.length === 0 ? (
        <EmptyState
          title="Belum ada lapangan"
          description="Tambahkan lapangan melalui tombol di atas jika kamu admin."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => {
            const image = assetUrl(field.image);
            return (
              <article
                className={cx(
                  panelClass,
                  "flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                )}
                key={field.id}
              >
                <div className="relative h-44 shrink-0 bg-gradient-to-br from-teal-100 to-sky-100">
                  {image ? (
                    <img className="h-full w-full object-cover" src={image} alt={field.name} />
                  ) : (
                    <div className="grid h-full place-items-center text-2xl font-extrabold text-teal-800">
                      {initials(field.name)}
                    </div>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-900/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {rupiah(field.price_per_hour)}/jam
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-bold leading-snug text-slate-900">{field.name}</h2>
                    <StatusBadge status={field.active ? "active" : "inactive"} />
                  </div>
                  <span className={chipClass}>{field.type}</span>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {field.description || "Belum ada deskripsi untuk lapangan ini."}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    {!isAdmin &&
                      <button
                        className={cx(buttonBase, buttonSmall, buttonVariant.primary)}
                        onClick={() => navigate("/bookings", { state: { fieldId: field.id } })}
                        disabled={!field.active}
                        title={user ? "" : "Masuk untuk membuat booking"}
                      >
                        {field.active ? "Booking lapangan" : "Tidak aktif"}
                      </button>
                    }
                    {isAdmin ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
                          onClick={() => openEdit(field)}
                        >
                          Ubah
                        </button>
                        <button
                          className={cx(buttonBase, buttonSmall, buttonVariant.danger)}
                          onClick={() => handleDelete(field)}
                        >
                          Hapus
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Ubah lapangan" : "Tambah lapangan"}
        description="Data dikirim sebagai multipart/form-data ke /api/fields."
        onClose={() => setModalOpen(false)}
      >
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama lapangan" required>
              <input value={form.name} onChange={setFieldValue("name")} required />
            </FormField>
            <FormField label="Tipe" required hint="Contoh: Futsal, Badminton, Tenis">
              <input value={form.type} onChange={setFieldValue("type")} required />
            </FormField>
            <FormField label="Harga per jam" required>
              <input
                type="number"
                min="0"
                value={form.price_per_hour}
                onChange={setFieldValue("price_per_hour")}
                required
              />
            </FormField>
            <FormField label="Status">
              <select value={form.active} onChange={setFieldValue("active")}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </FormField>
          </div>

          <FormField label="Deskripsi">
            <textarea
              rows="3"
              value={form.description}
              onChange={setFieldValue("description")}
              placeholder="Informasi singkat tentang lapangan"
            />
          </FormField>

          <div
            className={cx(
              "grid gap-4 rounded-xl border border-dashed p-4 sm:grid-cols-[132px_minmax(0,1fr)]",
              imageError ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50"
            )}
          >
            <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-teal-100 to-sky-100 p-2 text-center text-xs text-slate-500 sm:h-[108px] sm:w-[132px]">
              {previewUrl ? (
                <img className="h-full w-full rounded-md object-cover" src={previewUrl} alt="Pratinjau gambar lapangan" />
              ) : (
                <span>Belum ada gambar</span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <FormField
                label="Gambar lapangan"
                hint="JPG, PNG, WebP, atau AVIF · maksimal 2 MB · otomatis dikonversi ke WebP"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={handleImageChange}
                />
              </FormField>
              <p className="m-0 text-xs leading-relaxed text-slate-500">
                {editing
                  ? "Gambar lama tetap dipakai jika tidak memilih file baru."
                  : "Gambar opsional; lapangan tetap bisa disimpan tanpa gambar."}
              </p>
              {imageError ? <p className="m-0 text-xs font-bold text-red-600">{imageError}</p> : null}
            </div>
          </div>

          <div className={modalActionsClass}>
            <button type="button" className={cx(buttonBase, buttonVariant.ghost)} onClick={() => setModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className={cx(buttonBase, buttonVariant.primary)} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
