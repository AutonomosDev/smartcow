/**
 * src/components/modals/notifications-modal.tsx
 * Centro de Notificaciones - UI V2 (Pristine White)
 */

"use client";

import * as React from "react";
import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  MoreHorizontal,
  Check,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

interface Notification {
  id: string;
  type: "sanitary" | "system" | "alert";
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "alert", title: "Anomalía de Peso detected", description: "Vaca #34 ha bajado un 5% de peso en 48h.", time: "Hace 10 min", unread: true },
  { id: "2", type: "sanitary", title: "Plan Sanitario Completado", description: "Lote B finalizó el protocolo de vacunación.", time: "Hace 2 horas", unread: true },
  { id: "3", type: "system", title: "Reporte Mensual listo", description: "Tu reporte de eficiencia de Marzo está disponible.", time: "Hoy, 09:15", unread: false },
  { id: "4", type: "alert", title: "Clima: Alerta de Ola de Calor", description: "Se esperan >30°C. Considera hidratación extra.", time: "Ayer", unread: false },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsModal({ isOpen, onOpenChange }: NotificationsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Notificaciones</DialogTitle>
            <button className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
              Marcar todo como leído
            </button>
          </div>
          <DialogDescription>
            Mantente al día con lo que sucede en tus predios.
          </DialogDescription>
        </DialogHeader>

        {/* Feed de Notificaciones */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-3 no-scrollbar">
          {MOCK_NOTIFICATIONS.length > 0 ? (
            MOCK_NOTIFICATIONS.map((notif) => (
              <div 
                key={notif.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer group",
                  notif.unread 
                    ? "border-emerald-100/50 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-100/10" 
                    : "border-white/20 bg-white/40 hover:border-white/40 hover:bg-white/60"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    notif.type === 'alert' ? "bg-amber-50/50 text-amber-500" :
                    notif.type === 'sanitary' ? "bg-emerald-50/50 text-emerald-500" : "bg-blue-50/50 text-blue-500"
                  )}>
                    {notif.type === 'alert' ? <Zap size={18} /> : 
                     notif.type === 'sanitary' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn(
                        "text-sm font-bold tracking-tight truncate pr-2",
                        notif.unread ? "text-gray-900" : "text-gray-700"
                      )}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                      {notif.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">No tienes notificaciones nuevas.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-50 text-center">
          <button className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors py-2 group flex items-center justify-center gap-1.5 mx-auto">
             Ver todo el historial
             <MoreHorizontal size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
