/**
 * src/components/modals/settings-modal.tsx
 * Ajustes Globales - UI V2 (Pristine White)
 */

"use client";

import * as React from "react";
import { 
  Settings, 
  User, 
  Bell, 
  ShieldSecret, 
  Languages, 
  Moon, 
  Sun,
  Monitor,
  Check,
  ChevronRight,
  Database,
  Cloud,
  Laptop
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "account", label: "Cuenta", icon: User },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "data", label: "Datos & KB", icon: Database },
];

export function SettingsModal({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [activeTab, setActiveTab] = React.useState("general");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] p-0 flex flex-col md:flex-row h-[600px] overflow-hidden font-inherit">
        
        {/* Sidebar de Ajustes */}
        <div className="w-full md:w-64 border-r border-white/20 bg-white/10 p-6 flex flex-col h-full">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Ajustes</h2>
            <p className="text-[11px] text-gray-500 font-medium">Gestiona tu experiencia</p>
          </div>

          <nav className="space-y-1 flex-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-white/40 text-gray-900 shadow-sm ring-1 ring-white/40 backdrop-blur-md" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-white/20"
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 mt-6 border-t border-white/20 flex items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-crosshair">
             <img src="/smartcow_logo.png" className="w-6 h-6 object-contain" alt="" />
             <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none">V2.4.1</span>
          </div>
        </div>

        {/* Contenido de Ajustes */}
        <div className="flex-1 flex flex-col h-full bg-transparent relative">
          <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-white/20 pb-2">Apariencia</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["Claro", "Oscuro", "Sistema"].map((mode, i) => (
                      <button 
                        key={mode}
                        className={cn(
                          "p-4 rounded-2xl border text-center transition-all backdrop-blur-md",
                          i === 0 ? "border-emerald-100/50 bg-emerald-50/20 ring-1 ring-emerald-100/10" : "border-white/20 bg-white/20 hover:bg-white/40 hover:border-white/40"
                        )}
                      >
                         <div className="w-8 h-8 rounded-lg bg-white/20 mx-auto mb-2 flex items-center justify-center text-gray-500">
                           {i === 0 ? <Sun size={18} /> : i === 1 ? <Moon size={18} /> : <Laptop size={18} />}
                         </div>
                         <p className="text-[11px] font-bold text-gray-900">{mode}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-white/20 pb-2">Idioma</h3>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/20 bg-white/20 hover:border-white/40 hover:bg-white/40 transition-all backdrop-blur-md">
                    <div className="flex items-center gap-3 text-gray-500">
                       <Languages size={18} />
                       <span className="text-sm font-bold text-gray-900">Español (Chile)</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </button>
                </section>
              </div>
            )}

            {activeTab !== "general" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50 grayscale">
                 <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200">
                   <Settings size={32} />
                 </div>
                 <p className="text-sm font-bold text-gray-400 tracking-tight">Módulo en Desarrollo</p>
                 <p className="text-[11px] text-gray-300 max-w-[200px]">Estas opciones estarán disponibles en la próxima actualización de SmartCow V2.</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
             <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
             <button onClick={() => onOpenChange(false)} className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-sm">Guardar cambios</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
