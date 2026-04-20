"use client";

import { useEffect, useRef, useState } from "react";

interface Sugerencias {
  otros_predios: { id: number; nombre: string }[];
  ultimos_pesajes: { id: number; predioId: number; fecha: string; diio: string | null }[];
  ultimos_partos: { id: number; predioId: number; fecha: string; diio: string | null }[];
}

interface MasDropdownProps {
  onSuggestionClick: (text: string) => void;
}

export function MasDropdown({ onSuggestionClick }: MasDropdownProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Sugerencias | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || data) return;
    fetch("/api/chat/sugerencias")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {});
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items: { label: string; prompt: string }[] = [];

  if (data) {
    data.otros_predios.forEach((p) => {
      items.push({ label: `📍 ${p.nombre}`, prompt: `Muéstrame el resumen del predio ${p.nombre}` });
    });
    data.ultimos_pesajes.forEach((p) => {
      const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString("es-CL") : "";
      items.push({ label: `⚖️ Pesaje ${p.diio ?? p.id} — ${fecha}`, prompt: `Muéstrame el detalle del pesaje ${p.id}` });
    });
    data.ultimos_partos.forEach((p) => {
      const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString("es-CL") : "";
      items.push({ label: `🐄 Parto ${p.diio ?? p.id} — ${fecha}`, prompt: `Muéstrame el detalle del parto ${p.id}` });
    });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <span
        onClick={() => setOpen((o) => !o)}
        style={{ fontSize: 12, color: "var(--cw-ink3)", fontFamily: "var(--cw-mono)", padding: "4px 8px", cursor: "pointer" }}
      >
        más ▾
      </span>

      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0,
          minWidth: 240, background: "#fff",
          border: "1px solid #e4e4e4", borderRadius: 9,
          boxShadow: "0 6px 24px rgba(0,0,0,.1)",
          zIndex: 100, overflow: "hidden",
          fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
          fontSize: 13,
        }}>
          {items.length === 0 ? (
            <div style={{ padding: "10px 14px", color: "#999", fontSize: 12 }}>
              {data ? "Sin sugerencias disponibles" : "Cargando…"}
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={i}
                onClick={() => { onSuggestionClick(item.prompt); setOpen(false); }}
                style={{
                  padding: "8px 14px", cursor: "pointer", color: "#333",
                  borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#f7f7f7"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {item.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
