"use client";

import React from "react";

export interface DashboardData {
  predioId: number;
  predioNombre: string;
  kpis: {
    totalAnimales: number;
    lotesActivos: number;
    totalPesajes: number;
    totalPartos: number;
    totalEcografias: number;
  };
  ultimoPesaje: { fecha: string; pesoKg: number } | null;
  actividad: { type: "pesaje" | "parto"; fecha: string; descripcion: string }[];
}

const fmt = (n: number) => n.toLocaleString("es-CL");

export function DashboardArtifact({ data }: { data: DashboardData }) {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "4px 0 24px",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        color: "var(--color-ink-body, #4B5563)",
      }}
    >
      <KpiRow kpis={data.kpis} />
      <UltimoPesaje value={data.ultimoPesaje} />
      <ActivityBlock items={data.actividad} />
    </div>
  );
}

function KpiRow({ kpis }: { kpis: DashboardData["kpis"] }) {
  const items: { label: string; value: string }[] = [
    { label: "Animales activos", value: fmt(kpis.totalAnimales) },
    { label: "Lotes activos", value: fmt(kpis.lotesActivos) },
    { label: "Pesajes", value: fmt(kpis.totalPesajes) },
    { label: "Partos", value: fmt(kpis.totalPartos) },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
        marginBottom: 18,
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            border: ".5px solid #e5e7eb",
            borderRadius: 10,
            padding: "12px 14px",
            background: "var(--color-farm-surface, #fff)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--color-ink-meta, #9CA3AF)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 4,
            }}
          >
            {it.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--color-brand-dark, #06200F)",
              lineHeight: 1.1,
            }}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function UltimoPesaje({ value }: { value: DashboardData["ultimoPesaje"] }) {
  if (!value) {
    return (
      <div
        style={{
          fontSize: 12.5,
          color: "var(--color-ink-meta, #9CA3AF)",
          marginBottom: 18,
        }}
      >
        Sin pesajes registrados.
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        fontSize: 13,
        color: "var(--color-ink-body, #4B5563)",
        marginBottom: 18,
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: "var(--color-ink-meta, #9CA3AF)",
        }}
      >
        Último pesaje
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: 12,
          color: "var(--color-ink-title, #111827)",
        }}
      >
        {value.fecha}
      </span>
      <span style={{ fontWeight: 500, color: "var(--color-ink-title, #111827)" }}>
        {Number(value.pesoKg).toFixed(1)} kg
      </span>
    </div>
  );
}

function ActivityBlock({ items }: { items: DashboardData["actividad"] }) {
  if (items.length === 0) {
    return (
      <div style={{ fontSize: 12.5, color: "var(--color-ink-meta, #9CA3AF)" }}>
        Sin actividad reciente.
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: "var(--color-ink-meta, #9CA3AF)",
          marginBottom: 6,
        }}
      >
        Actividad reciente
      </div>
      <div>
        {items.map((ev, i) => (
          <div
            key={i}
            style={{
              padding: "8px 0",
              borderBottom: i < items.length - 1 ? ".5px solid #eef0f2" : "none",
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              fontSize: 13,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: 11.5,
                color: "var(--color-ink-meta, #9CA3AF)",
                minWidth: 88,
              }}
            >
              {ev.fecha}
            </span>
            <span style={{ color: "var(--color-ink-body, #4B5563)" }}>
              {ev.descripcion}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
