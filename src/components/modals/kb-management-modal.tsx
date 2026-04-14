"use client";

import * as React from "react";
import {
  FileText,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
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
  id: number;
  nombre: string;
  mimeType: string;
  creadoEn: string;
  expiresAt: string;
  status: "active" | "expired";
}

interface KBManagementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  predioId?: number;
  onUploadClick: () => void;
  onDeleteRequest: (file: { id: string; name: string }) => void;
}

export function KBManagementModal({
  isOpen,
  onOpenChange,
  predioId = 0,
  onUploadClick,
  onDeleteRequest,
}: KBManagementModalProps) {
  const [search, setSearch] = React.useState("");
  const [files, setFiles] = React.useState<KBFile[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Cargar archivos cuando se abre el modal
  React.useEffect(() => {
    if (!isOpen || !predioId) return;
    setLoading(true);
    fetch(`/api/kb/list?predio_id=${predioId}`)
      .then((r) => r.json())
      .then((data: { files?: KBFile[] }) => {
        setFiles(data.files ?? []);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [isOpen, predioId]);

  const filteredFiles = files.filter((f) =>
    f.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatSize = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("spreadsheet") || mimeType.includes("csv")) return "XLSX/CSV";
    return "Documento";
  };

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
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      file.status === "expired"
                        ? "bg-red-50 text-red-500"
                        : "bg-gray-50 text-gray-400"
                    )}
                  >
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{file.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatSize(file.mimeType)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">•</span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatDate(file.creadoEn)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {file.status === "active" && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase transition-opacity group-hover:opacity-0">
                      <CheckCircle2 size={10} />
                      Activo
                    </div>
                  )}
                  {file.status === "expired" && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase">
                      <Clock size={10} />
                      Expirado
                    </div>
                  )}

                  <button
                    onClick={() => onDeleteRequest({ id: String(file.id), name: file.nombre })}
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
              {search ? (
                <p className="text-gray-400 text-sm">No se encontraron documentos.</p>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <AlertCircle size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">Sin documentos cargados.</p>
                  <p className="text-gray-300 text-xs">
                    Sube PDFs o planillas para mejorar las respuestas del asistente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
