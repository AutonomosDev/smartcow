"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";
import Link from "next/link";

interface SearchPillProps {
  predioName: string | null;
}

export function SearchPill({ predioName }: SearchPillProps) {
  return (
    <div className="w-full max-w-5xl mx-auto -mt-10 relative z-30 px-6">
      <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center gap-2 shadow-2xl shadow-brand-dark/10 border border-white/50">
        
        {/* Filtro: Predio */}
        <div className="flex-1 flex w-full md:border-r border-gray-100/50 py-3 md:py-1 px-6 justify-between cursor-pointer group hover:bg-gray-50/50 rounded-2xl transition-all">
          <div className="flex flex-col">
            <p className="text-[10px] text-brand-dark font-bold uppercase tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">Predio Activo</p>
            <h4 className="text-sm font-bold text-ink-title flex items-center gap-2">
              {predioName ?? "Cargando..."}
            </h4>
          </div>
          <ChevronDown size={18} className="text-brand-dark/30 self-center group-hover:text-brand-dark transition-colors" />
        </div>

        {/* Filtro: Categoría */}
        <div className="flex-1 flex w-full md:border-r border-gray-100/50 py-3 md:py-1 px-6 justify-between cursor-pointer group hover:bg-gray-50/50 rounded-2xl transition-all">
          <div className="flex flex-col">
            <p className="text-[10px] text-brand-dark font-bold uppercase tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">Categoría</p>
            <h4 className="text-sm font-bold text-ink-title">Vacas Lecheras</h4>
          </div>
          <ChevronDown size={18} className="text-brand-dark/30 self-center group-hover:text-brand-dark transition-colors" />
        </div>

        {/* Filtro: Estado */}
        <div className="flex-1 flex w-full py-3 md:py-1 px-6 justify-between cursor-pointer group hover:bg-gray-50/50 rounded-2xl transition-all">
          <div className="flex flex-col">
            <p className="text-[10px] text-brand-dark font-bold uppercase tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">Estado</p>
            <h4 className="text-sm font-bold text-ink-title">Atención Req.</h4>
          </div>
          <ChevronDown size={18} className="text-brand-dark/30 self-center group-hover:text-brand-dark transition-colors" />
        </div>

        {/* Botón Acción */}
        <Link 
          href="/chat"
          className="w-full md:w-auto bg-brand-dark text-white px-10 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-dark/20 ml-2"
        >
          <Search size={18} strokeWidth={2.5} />
          <span className="text-sm uppercase tracking-widest font-bold">Filtrar</span>
        </Link>
      </div>
    </div>
  );
}
