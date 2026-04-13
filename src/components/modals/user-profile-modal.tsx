/**
 * src/components/modals/user-profile-modal.tsx
 * Perfil de Usuario y Logout - UI V2 (Pristine White)
 */

"use client";

import * as React from "react";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Camera
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";

interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onLogout?: () => void;
}

export function UserProfileModal({ isOpen, onOpenChange, user, onLogout }: UserProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden font-inherit">
        <DialogHeader className="p-8 pb-4 text-center sm:text-center">
          <div className="mx-auto relative w-20 h-20 mb-4 group">
            <div className="w-full h-full rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 transition-colors">
              <span className="text-2xl font-bold uppercase">{user?.name?.[0] ?? "U"}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900">{user?.name ?? "Usuario"}</DialogTitle>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-gray-400 text-sm">
             <span className="font-medium text-[12px]">{user?.role ?? "Administrador"}</span>
             <span className="text-[10px]">•</span>
             <span className="font-medium text-[12px]">{user?.email ?? ""}</span>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-1.5">
          <div className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cuenta</div>
          
          <button className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/20 hover:border-white/40 hover:bg-white/40 transition-all text-left backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-gray-500">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Configuración de Perfil</p>
                <p className="text-[11px] text-gray-500">Nombre, avatar y preferencias</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </button>

          <button className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/20 hover:border-white/40 hover:bg-white/40 transition-all text-left backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-gray-500">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Seguridad y Acceso</p>
                <p className="text-[11px] text-gray-500">Contraseña y 2FA</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </button>

          <div className="pt-4 border-t border-gray-50 mt-4">
             <button 
              onClick={() => {
                onLogout?.();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-red-500 hover:bg-red-50/50 transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        <div className="p-6 pt-0 text-center">
            <p className="text-[10px] text-gray-300 font-medium">smartCow Platform v1.2.0 • Build 240411</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
