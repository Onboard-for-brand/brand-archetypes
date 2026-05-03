"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "issued" | "active" | "completed" | "revoked";

export interface AdminCode {
  code: string;
  status: Status;
  note: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  expiresAt: string | null;
  modelOverride: string | null;
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
}

interface Props {
  adminEmail: string;
  initialCodes: AdminCode[];
}

const STATUSES: Status[] = ["issued", "active", "completed", "revoked"];

const STATUS_COLOR: Record<Status, string> = {
  issued: "bg-blue-500/20 text-blue-300",
  active: "bg-green-500/20 text-green-300",
  completed: "bg-neutral-500/20 text-neutral-300",
  revoked: "bg-red-500/20 text-red-300",
};

export function AdminDashboard({ adminEmail, initialCodes }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [codes, setCodes] = useState<AdminCode[]>(initialCodes);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    note: "",
    recipientName: "",
    recipientEmail: "",
    modelOverride: "",
    expiresAt: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminCode>>({});

  async function issueCode(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const body: Record<string, string | null> = {
        note: form.note.trim() || null,
        recipientName: form.recipientName.trim() || null,
        recipientEmail: form.recipientEmail.trim() || null,
        modelOverride: form.modelOverride.trim() || null,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : null,
      };
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { code: newCode } = await res.json();
      setCodes((prev) => [
        {
          ...newCode,
          createdAt: new Date(newCode.createdAt).toISOString(),
          activatedAt: newCode.activatedAt
            ? new Date(newCode.activatedAt).toISOString()
            : null,
          completedAt: newCode.completedAt
            ? new Date(newCode.completedAt).toISOString()
            : null,
          expiresAt: newCode.expiresAt
            ? new Date(newCode.expiresAt).toISOString()
            : null,
        },
        ...prev,
      ]);
      setForm({
        note: "",
        recipientName: "",
        recipientEmail: "",
        modelOverride: "",
        expiresAt: "",
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to issue");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(row: AdminCode) {
    setEditing(row.code);
    setEditForm({
      note: row.note ?? "",
      recipientName: row.recipientName ?? "",
      recipientEmail: row.recipientEmail ?? "",
      modelOverride: row.modelOverride ?? "",
      expiresAt: row.expiresAt ? row.expiresAt.slice(0, 16) : "",
      status: row.status,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setEditForm({});
  }

  async function saveEdit(code: string) {
    const body: Record<string, string | null> = {};
    if (editForm.note !== undefined) body.note = editForm.note ?? null;
    if (editForm.recipientName !== undefined)
      body.recipientName = editForm.recipientName ?? null;
    if (editForm.recipientEmail !== undefined)
      body.recipientEmail = editForm.recipientEmail ?? null;
    if (editForm.modelOverride !== undefined)
      body.modelOverride = editForm.modelOverride ?? null;
    if (editForm.expiresAt !== undefined)
      body.expiresAt = editForm.expiresAt
        ? new Date(editForm.expiresAt).toISOString()
        : null;
    if (editForm.status !== undefined) body.status = editForm.status;

    const res = await fetch(`/api/admin/codes/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      alert(`Save failed: HTTP ${res.status}`);
      return;
    }
    const { code: updated } = await res.json();
    setCodes((prev) =>
      prev.map((r) =>
        r.code === code
          ? {
              ...updated,
              createdAt: new Date(updated.createdAt).toISOString(),
              activatedAt: updated.activatedAt
                ? new Date(updated.activatedAt).toISOString()
                : null,
              completedAt: updated.completedAt
                ? new Date(updated.completedAt).toISOString()
                : null,
              expiresAt: updated.expiresAt
                ? new Date(updated.expiresAt).toISOString()
                : null,
            }
          : r,
      ),
    );
    cancelEdit();
  }

  async function deleteCode(code: string) {
    if (!confirm(`Delete ${code}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/codes/${code}`, { method: "DELETE" });
    if (!res.ok) {
      alert(`Delete failed: HTTP ${res.status}`);
      return;
    }
    setCodes((prev) => prev.filter((r) => r.code !== code));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    startTransition(() => {
      router.push("/admin/login");
      router.refresh();
    });
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-10 text-white md:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Access Codes</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
            Onboarding for Brand · Admin
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>{adminEmail}</span>
          <button
            type="button"
            onClick={logout}
            className="border border-neutral-700 px-3 py-1 hover:border-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-8 border border-neutral-800 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest">
          Issue new code
        </h2>
        <form
          onSubmit={issueCode}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Note (free text)">
            <input
              type="text"
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="who is it for / order id"
              className={inputCls}
            />
          </Field>
          <Field label="Recipient name">
            <input
              type="text"
              value={form.recipientName}
              onChange={(e) =>
                setForm((f) => ({ ...f, recipientName: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Recipient email">
            <input
              type="email"
              value={form.recipientEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, recipientEmail: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Model override">
            <input
              type="text"
              value={form.modelOverride}
              onChange={(e) =>
                setForm((f) => ({ ...f, modelOverride: e.target.value }))
              }
              placeholder="leave empty to use default"
              className={inputCls}
            />
          </Field>
          <Field label="Expires at (optional)">
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiresAt: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="bg-white px-4 py-2 text-sm font-bold uppercase tracking-widest text-black disabled:opacity-40"
            >
              {creating ? "..." : "Issue"}
            </button>
          </div>
        </form>
        {createError ? (
          <p className="mt-3 text-xs text-red-400" role="alert">
            {createError}
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest">
            All codes ({codes.length})
          </h2>
        </div>

        {codes.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-500">No codes yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-neutral-800">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-neutral-900 text-[11px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Note</th>
                  <th className="px-3 py-2 text-left">Recipient</th>
                  <th className="px-3 py-2 text-left">Model</th>
                  <th className="px-3 py-2 text-left">Expires</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {codes.map((row) =>
                  editing === row.code ? (
                    <tr key={row.code} className="bg-neutral-900/30">
                      <td className="px-3 py-2 font-mono text-xs">
                        {row.code}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editForm.status ?? row.status}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              status: e.target.value as Status,
                            }))
                          }
                          className={selectCls}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={(editForm.note as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              note: e.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="name"
                          value={(editForm.recipientName as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              recipientName: e.target.value,
                            }))
                          }
                          className={`${inputCls} mb-1`}
                        />
                        <input
                          type="email"
                          placeholder="email"
                          value={(editForm.recipientEmail as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              recipientEmail: e.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={(editForm.modelOverride as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              modelOverride: e.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="datetime-local"
                          value={(editForm.expiresAt as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              expiresAt: e.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-500">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(row.code)}
                            className="bg-white px-2 py-1 text-[11px] font-bold uppercase text-black"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="border border-neutral-700 px-2 py-1 text-[11px] uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.code}>
                      <td className="px-3 py-2 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => copy(row.code)}
                          className="hover:text-white text-neutral-200"
                          title="Click to copy"
                        >
                          {row.code}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_COLOR[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-neutral-300">
                        {row.note || (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-neutral-300">
                        {row.recipientName ? (
                          <div>
                            <div>{row.recipientName}</div>
                            {row.recipientEmail ? (
                              <div className="text-xs text-neutral-500">
                                {row.recipientEmail}
                              </div>
                            ) : null}
                          </div>
                        ) : row.recipientEmail ? (
                          <span className="text-xs text-neutral-500">
                            {row.recipientEmail}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-neutral-400">
                        {row.modelOverride || (
                          <span className="text-neutral-600">default</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-400">
                        {row.expiresAt ? (
                          formatDate(row.expiresAt)
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-500">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="border border-neutral-700 px-2 py-1 text-[11px] uppercase hover:border-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCode(row.code)}
                            className="border border-red-900 px-2 py-1 text-[11px] uppercase text-red-400 hover:border-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const inputCls =
  "w-full border border-neutral-700 bg-transparent px-2 py-1 text-sm outline-none focus:border-white";
const selectCls =
  "w-full border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-white";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}
