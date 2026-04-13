"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { PredioConAnimales, CategoriaConAnimales } from "@/src/lib/queries/predio";

const ESTADOS_HEMBRA = [
  { value: "", label: "Todos" },
  { value: "Preñada", label: "Preñada" },
  { value: "Vacía", label: "Vacía" },
  { value: "Parida", label: "Parida" },
  { value: "Inseminada", label: "Inseminada" },
  { value: "Preencaste", label: "Preencaste" },
];

interface SearchPillProps {
  predios: PredioConAnimales[];
  categorias: CategoriaConAnimales[];
  currentPredioId: number;
  currentCategoriaId: string;
  currentEstado: string;
}

export function SearchPill({
  predios,
  categorias,
  currentPredioId,
  currentCategoriaId,
  currentEstado,
}: SearchPillProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [predioId, setPredioId] = useState(String(currentPredioId));
  const [categoriaId, setCategoriaId] = useState(currentCategoriaId);
  const [estado, setEstado] = useState(currentEstado);

  const currentCategoria = categorias.find((c) => String(c.id) === categoriaId);
  const esMacho = currentCategoria?.esMacho ?? false;

  function handlePredioChange(newPredioId: string) {
    setPredioId(newPredioId);
    setCategoriaId("");
    setEstado("");
  }

  function handleCategoriaChange(newCategoriaId: string) {
    setCategoriaId(newCategoriaId);
    const cat = categorias.find((c) => String(c.id) === newCategoriaId);
    if (cat?.esMacho) setEstado("");
  }

  function handleFiltrar() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("predioId", predioId);
    if (categoriaId) params.set("categoriaId", categoriaId);
    else params.delete("categoriaId");
    if (estado && !esMacho) params.set("estado", estado);
    else params.delete("estado");

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  const predioActual = predios.find((p) => String(p.id) === predioId);
  const categoriaActual = categorias.find((c) => String(c.id) === categoriaId);

  return (
    <div className="w-full max-w-5xl mx-auto -mt-10 relative z-30 px-6">
      <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center gap-2 shadow-2xl shadow-brand-dark/10 border border-white/50">

        {/* PREDIO */}
        <div className="flex-1 flex w-full md:border-r border-gray-100/50 py-3 md:py-1 px-6 justify-between items-center relative group">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-[10px] text-brand-dark font-bold uppercase tracking-widest mb-1.5 opacity-60">
              Predio Activo
            </p>
            <select
              value={predioId}
              onChange={(e) => handlePredioChange(e.target.value)}
              className="text-sm font-bold text-ink-title bg-transparent border-none outline-none cursor-pointer appearance-none truncate pr-2"
            >
              {predios.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={18} className="text-brand-dark/30 shrink-0 ml-1" />
        </div>

        {/* CATEGORÍA */}
        <div className="flex-1 flex w-full md:border-r border-gray-100/50 py-3 md:py-1 px-6 justify-between items-center relative group">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-[10px] text-brand-dark font-bold uppercase tracking-widest mb-1.5 opacity-60">
              Categoría
            </p>
            <select
              value={categoriaId}
              onChange={(e) => handleCategoriaChange(e.target.value)}
              className="text-sm font-bold text-ink-title bg-transparent border-none outline-none cursor-pointer appearance-none truncate pr-2"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={18} className="text-brand-dark/30 shrink-0 ml-1" />
        </div>

        {/* ESTADO */}
        <div className="flex-1 flex w-full py-3 md:py-1 px-6 justify-between items-center relative group">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-[10px] text-brand-dark font-bold uppercase tracking-widest mb-1.5 opacity-60">
              Estado
            </p>
            {esMacho ? (
              <p className="text-sm font-bold text-ink-meta select-none">—</p>
            ) : (
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="text-sm font-bold text-ink-title bg-transparent border-none outline-none cursor-pointer appearance-none truncate pr-2"
              >
                {ESTADOS_HEMBRA.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          {!esMacho && (
            <ChevronDown size={18} className="text-brand-dark/30 shrink-0 ml-1" />
          )}
        </div>

        {/* FILTRAR */}
        <button
          onClick={handleFiltrar}
          disabled={isPending}
          className="w-full md:w-auto bg-brand-dark text-white px-10 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-dark/20 ml-2 disabled:opacity-60 disabled:scale-100"
        >
          <Search size={18} strokeWidth={2.5} />
          <span className="text-sm uppercase tracking-widest font-bold">
            {isPending ? "..." : "Filtrar"}
          </span>
        </button>
      </div>
    </div>
  );
}
