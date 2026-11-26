import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { EmptyState, FormField, Loading, Modal, PageHeader, StatusBadge } from "../components";
import { dateTimeLabel } from "../format";
import {
  buttonBase,
  buttonSmall,
  buttonVariant,
  cellSubClass,
  cellTitleClass,
  cx,
  modalActionsClass,
  panelClass,
  tableClass,
  tableScrollClass,
  tableTdClass,
  tableThClass,
} from "../styles";

const EMPTY_FORM = { name: "", email: "", password: "", role: "customer" };

export default function UsersPage({ notify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getUsers();
      setUsers(response?.data ?? []);
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setModalOpen(true);
  };

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    };
    if (!editing) payload.password = form.password;
    try {
      if (editing) {
        await api.updateUser(editing.uuid, payload);
        notify({ type: "success", message: "User berhasil diperbarui." });
      } else {
        await api.createUser(payload);
        notify({ type: "success", message: "User berhasil ditambahkan." });
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      notify({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Hapus user "${user.name}"?`)) return;
    try {
      await api.deleteUser(user.uuid);
      notify({ type: "success", message: "User berhasil dihapus." });
      await load();
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administrasi"
        title="Kelola pengguna"
        description="Daftar akun pengguna aktif."
        actions={
          <button className={cx(buttonBase, buttonVariant.primary)} onClick={openCreate}>
            + Tambah user
          </button>
        }
      />

      <section className={cx(panelClass, "overflow-hidden")}>
        {loading ? (
          <Loading label="Memuat pengguna..." />
        ) : users.length === 0 ? (
          <EmptyState title="Belum ada user" description="Tambahkan user baru melalui tombol di atas." />
        ) : (
          <div className={tableScrollClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={tableThClass}>Nama</th>
                  <th className={tableThClass}>Email</th>
                  <th className={tableThClass}>Role</th>
                  <th className={tableThClass}>Dibuat</th>
                  <th className={tableThClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uuid}>
                    <td className={tableTdClass}>
                      <strong className={cellTitleClass}>{user.name}</strong>
                      <small className={cellSubClass}>{user.uuid.slice(0, 8)}…</small>
                    </td>
                    <td className={tableTdClass}>{user.email}</td>
                    <td className={tableTdClass}>
                      <StatusBadge status={user.role} />
                    </td>
                    <td className={tableTdClass}>{dateTimeLabel(user.createdAt)}</td>
                    <td className={tableTdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={cx(buttonBase, buttonSmall, buttonVariant.ghost)}
                          onClick={() => openEdit(user)}
                        >
                          Ubah
                        </button>
                        <button
                          className={cx(buttonBase, buttonSmall, buttonVariant.danger)}
                          onClick={() => handleDelete(user)}
                        >
                          Hapus
                        </button>
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
        open={modalOpen}
        title={editing ? "Ubah user" : "Tambah user"}
        description="Password dikosongkan saat mengubah user agar kata sandi lama tetap dipakai."
        onClose={() => setModalOpen(false)}
      >
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FormField label="Nama" required>
            <input value={form.name} onChange={setField("name")} required />
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={form.email} onChange={setField("email")} required />
          </FormField>
          <FormField label="Password" required={!editing} hint={editing ? "Kosongkan jika tidak diubah." : undefined}>
            <input
              type="password"
              value={form.password}
              onChange={setField("password")}
              required={!editing}
            />
          </FormField>
          <FormField label="Role">
            <select value={form.role} onChange={setField("role")}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
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
