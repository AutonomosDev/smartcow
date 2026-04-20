"use client";

import { useState, useEffect } from "react";

interface NuevaTareaModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserOption {
  id: number;
  nombre: string;
  email: string;
}

export function NuevaTareaModal({ open, onClose }: NuevaTareaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [asignadoA, setAsignadoA] = useState<number | "">("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/org/users")
      .then((r) => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => {});
  }, [open]);

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, asignado_a: asignadoA || null }),
      });
      setTitulo("");
      setAsignadoA("");
      onClose();
    } catch {}
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,.18)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, padding: "24px 24px 20px",
        width: 380, boxShadow: "0 8px 40px rgba(0,0,0,.12)",
        fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
          Nueva tarea
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#777", display: "block", marginBottom: 4 }}>Título</label>
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
              placeholder="Ej. Revisar pesajes de mayo"
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1px solid #e0e0e0", borderRadius: 7,
                padding: "8px 10px", fontSize: 13, outline: "none",
                fontFamily: "inherit", color: "#1a1a1a",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#777", display: "block", marginBottom: 4 }}>Asignar a (opcional)</label>
            <select
              value={asignadoA}
              onChange={(e) => setAsignadoA(e.target.value ? Number(e.target.value) : "")}
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1px solid #e0e0e0", borderRadius: 7,
                padding: "8px 10px", fontSize: 13, outline: "none",
                fontFamily: "inherit", color: "#1a1a1a", background: "#fff",
              }}
            >
              <option value="">Sin asignar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px", borderRadius: 7, border: "1px solid #e0e0e0",
              background: "#fff", fontSize: 13, cursor: "pointer", color: "#555",
              fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!titulo.trim() || saving}
            style={{
              padding: "7px 16px", borderRadius: 7, border: "none",
              background: titulo.trim() ? "#1a4d2e" : "#e0e0e0",
              color: titulo.trim() ? "#fff" : "#aaa",
              fontSize: 13, cursor: titulo.trim() ? "pointer" : "default",
              fontFamily: "inherit", fontWeight: 500,
            }}
          >
            {saving ? "Guardando…" : "Crear tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}
