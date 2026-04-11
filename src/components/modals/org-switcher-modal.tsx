/**
 * src/components/modals/org-switcher-modal.tsx
 * Selector de Predio/Organización - UI V2 (Pristine White)
 */

"use client";

import * as React from "react";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  Check, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

interface Org {
  id: string;
  name: string;
  location: string;
  active: boolean;
  status: "productive" | "idle" | "rest";
}

const MOCK_ORGS: Org[] = [
  { id: "1", name: "Fundo El Sauce", location: "Osorno, Chile", active: true, status: "productive" },
  { id: "2", name: "Lechería Los Andes", location: "Santiago, Chile", active: false, status: "productive" },
  { id: "3", name: "Estancia San Manuel", location: "Temuco, Chile", active: false, status: "idle" },
  { id: "4", name: "Parcela Las Acacias", location: "Valdivia, Chile", active: false, status: "rest" },
];

interface OrgSwitcherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentOrgId?: string;
  onSelect?: (org: Org) => void;
}

export function OrgSwitcherModal({ isOpen, onOpenChange, currentOrgId, onSelect }: OrgSwitcherModalProps) {
  const [search, setSearch] = React.useState("");

  const filtered = MOCK_ORGS.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Cambiar de Predio</DialogTitle>
          <DialogDescription>
            Selecciona la unidad productiva que deseas monitorear.
          </DialogDescription>
        </DialogHeader>

        {/* Buscador minimalista */}
        <div className="px-6 py-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar predio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all font-inherit"
            />
          </div>
        </div>

        {/* Lista de Predios */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 no-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  onSelect?.(org);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                  org.id === currentOrgId || org.active
                    ? "border-emerald-100/50 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-100/10"
                    : "border-white/20 bg-white/40 hover:border-white/40 hover:bg-white/60 hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                    org.active ? "bg-emerald-100/20 text-emerald-600" : "bg-white/20 text-gray-400"
                  )}>
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{org.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-medium">{org.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {org.active && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100/30 flex items-center justify-center text-emerald-600">
                      <Check size={14} />
                    </div>
                  )}
                  {!org.active && <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
              </button>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">No se encontraron predios.</p>
            </div>
          )}
        </div>

        {/* Footer: Crear nuevo */}
        <div className="p-6 pt-2 border-t border-gray-50">
          <button className="w-full py-3 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
            <Plus size={16} />
            Vincular nuevo predio
          </button>
          <div className="mt-4 flex items-center justify-center gap-4 opacity-40">
            <div className="flex items-center gap-1.5 grayscale">
              <img src="/cow_robot.png" className="w-4 h-4 object-contain" alt="" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">smartCow Production</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
