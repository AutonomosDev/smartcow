"use client";

import * as React from "react";
import { 
  FileText, 
  Trash2, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

interface KBFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: 'active' | 'processing' | 'error';
}

const MOCK_FILES: KBFile[] = [
  { id: '1', name: 'Manual Manejo Ganado 2024.pdf', size: '2.4 MB', uploadedAt: '10 Abr 2024', status: 'active' },
  { id: '2', name: 'Plan Sanitario San Manuel.pdf', size: '1.2 MB', uploadedAt: '11 Abr 2024', status: 'active' },
  { id: '3', name: 'Registros_Pesajes_Q1.xlsx', size: '850 KB', uploadedAt: 'Hoy, 14:20', status: 'processing' },
  { id: '4', name: 'Protocolos_Alimentacion_V2.pdf', size: '3.1 MB', uploadedAt: 'Ayer', status: 'active' },
];

interface KBManagementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick: () => void;
  onDeleteRequest: (file: KBFile) => void;
}

export function KBManagementModal({ 
  isOpen, 
  onOpenChange, 
  onUploadClick, 
  onDeleteRequest 
}: KBManagementModalProps) {
  const [search, setSearch] = React.useState("");

  const filteredFiles = MOCK_FILES.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle>Base de Conocimiento</DialogTitle>
              <DialogDescription>
                Gestiona los documentos que SmartCow utiliza para darte contexto.
              </DialogDescription>
            </div>
            <button 
              onClick={onUploadClick}
              className="flex items-center gap-2 bg-[#06200F] text-white text-[12px] font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Plus size={14} />
              Cargar
            </button>
          </div>
        </DialogHeader>

        {/* Buscador */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar documentos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all font-inherit"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 no-scrollbar">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    file.status === 'error' ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
                  )}>
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium">{file.size}</span>
                      <span className="text-[10px] text-gray-400 font-medium">•</span>
                      <span className="text-[10px] text-gray-400 font-medium">{file.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  {file.status === 'active' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase transition-opacity group-hover:opacity-0">
                      <CheckCircle2 size={10} />
                      Listo
                    </div>
                  )}
                  {file.status === 'processing' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase">
                      <Clock size={10} className="animate-pulse" />
                      En proceso
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase">
                      <AlertCircle size={10} />
                      Error
                    </div>
                  )}

                  {/* Delete Button - Visible on hover */}
                  <button 
                    onClick={() => onDeleteRequest(file)}
                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">No se encontraron documentos.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
