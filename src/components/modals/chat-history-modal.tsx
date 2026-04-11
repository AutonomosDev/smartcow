/**
 * src/components/modals/chat-history-modal.tsx
 * Historial de Conversaciones - UI V2 (Pristine White)
 */

"use client";

import * as React from "react";
import { 
  MessageSquare, 
  Search, 
  Clock, 
  Trash2, 
  ChevronRight,
  Calendar,
  Filter
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  date: string;
  group: string;
}

const MOCK_HISTORY: ChatSession[] = [
  { id: "1", title: "Análisis de Pesaje Semanal", preview: "Los novillos del Lote A muestran un incremento...", date: "14:20", group: "Hoy" },
  { id: "2", title: "Protocolo Sanitario Vaca #45", preview: "Se ha registrado la aplicación de vacuna...", date: "09:12", group: "Hoy" },
  { id: "3", title: "Cálculo de Eficiencia March", preview: "El rendimiento del predio subió un 4%...", date: "Ayer", group: "Ayer" },
  { id: "4", title: "Consulta Raciones Lote B", preview: "¿Cuál es la mejor dieta para vacas en...", date: "10 de Abril", group: "Últimos 7 días" },
  { id: "5", title: "Reconciliación de Stock Fertilizantes", preview: "El inventario actual muestra 20 sacos...", date: "8 de Abril", group: "Últimos 7 días" },
];

interface ChatHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (sessionId: string) => void;
}

export function ChatHistoryModal({ isOpen, onOpenChange, onSelect }: ChatHistoryModalProps) {
  const [search, setSearch] = React.useState("");

  const filtered = MOCK_HISTORY.filter(h => 
    h.title.toLowerCase().includes(search.toLowerCase()) || 
    h.preview.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[85vh] font-inherit">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Historial de Conversaciones</DialogTitle>
          <DialogDescription>
            Recupera diálogos previos con SmartCow.
          </DialogDescription>
        </DialogHeader>

        {/* Buscador y Filtros */}
        <div className="px-6 py-4 flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/20 border border-white/40 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:bg-white/40 focus:border-white/60 transition-all font-inherit"
            />
          </div>
          <button className="px-3 py-2 rounded-xl border border-white/40 text-gray-400 hover:text-gray-900 hover:bg-white/40 transition-all">
            <Filter size={16} />
          </button>
        </div>

        {/* Lista de Historial */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 no-scrollbar">
          {filtered.length > 0 ? (
            Array.from(new Set(filtered.map(h => h.group))).map((group) => (
              <div key={group} className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{group}</p>
                <div className="space-y-2">
                  {filtered.filter(h => h.group === group).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelect?.(session.id);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/20 bg-white/40 hover:bg-white/60 hover:border-white/40 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/40 border border-transparent group-hover:border-white/20 flex items-center justify-center text-gray-400 transition-colors">
                          <MessageSquare size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{session.title}</p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{session.preview}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{session.date}</span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">No se encontraron conversaciones.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-50 flex items-center justify-between px-6 bg-gray-50/20">
           <p className="text-[10px] text-gray-400 font-medium">Auto-limpieza de chats inactivos tras 30 días.</p>
           <button className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider">
             Borrar historial completo
           </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
