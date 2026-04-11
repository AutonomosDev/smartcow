"use client";

import React from "react";
import Link from "next/link";
import { Target, Bell, Search, ChevronDown } from "lucide-react";

interface TopNavProps {
  userName: string | null | undefined;
  predioName: string | null;
}

export function TopNav({ userName, predioName }: TopNavProps) {
  return (
    <nav className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 px-6 py-4 flex justify-between items-center transition-all duration-300">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-dark flex items-center justify-center shadow-lg shadow-brand-dark/10">
          <Target size={20} className="text-brand-light" />
        </div>
        <div className="flex flex-col">
          <span className="text-ink-title font-bold text-lg tracking-tight leading-none">SmartCow</span>
          <span className="text-ink-meta text-[10px] font-medium uppercase tracking-widest mt-0.5">
            {predioName ?? "Panel de Control"}
          </span>
        </div>
      </div>

      {/* Center Links (Desktop) */}
      <div className="hidden lg:flex items-center gap-8 text-ink-body text-xs font-semibold uppercase tracking-widest">
        <Link href="#" className="hover:text-brand-dark transition-colors border-b-2 border-transparent hover:border-brand-light pb-1">
          Potreros Activos
        </Link>
        <Link href="#" className="hover:text-brand-dark transition-colors border-b-2 border-transparent hover:border-brand-light pb-1">
          Sanidad
        </Link>
        <Link href="#" className="hover:text-brand-dark transition-colors border-b-2 border-transparent hover:border-brand-light pb-1">
          Reportes
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors relative text-ink-body">
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
        </button>
        
        <div className="h-8 w-[1px] bg-gray-100 hidden sm:block mx-1" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-ink-title text-xs font-bold leading-none">{userName ?? "Operario"}</span>
            <span className="text-ink-meta text-[10px] mt-1">Administrador</span>
          </div>
          <div className="w-10 h-10 rounded-2xl border-2 border-brand-light/20 overflow-hidden flex items-center justify-center bg-brand-light/10 group-hover:bg-brand-light/20 transition-all duration-300">
            <span className="text-brand-dark text-sm font-bold uppercase">{userName?.[0] ?? "U"}</span>
          </div>
          <ChevronDown size={14} className="text-ink-meta group-hover:text-brand-dark transition-colors" />
        </div>
      </div>
    </nav>
  );
}
