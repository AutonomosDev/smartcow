"use client";

import * as React from "react";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

interface KBUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KBUploadModal({ isOpen, onOpenChange }: KBUploadModalProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadComplete, setUploadComplete] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startUpload = () => {
    setUploading(true);
    // Simulación de carga (solo UI)
    setTimeout(() => {
      setUploading(false);
      setUploadComplete(true);
      setTimeout(() => {
        setUploadComplete(false);
        setFiles([]);
        onOpenChange(false);
      }, 2000);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cargar Documentos</DialogTitle>
          <DialogDescription>
            Alimenta la inteligencia de SmartCow con manuales, registros o protocolos.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {!uploadComplete ? (
            <>
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-3 group",
                  dragActive 
                    ? "border-emerald-100 bg-emerald-50/20" 
                    : "border-white/20 bg-white/40 hover:border-white/40 hover:bg-white/60"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform duration-300">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    Arrastra archivos aquí o haz click para explorar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, XLSX, CSV · Hasta 20MB
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleChange}
                  accept=".pdf,.xlsx,.csv"
                />
              </div>

              {/* Lista de archivos */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                  {files.map((file, i) => (
                    <div 
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                          {file.name.endsWith('.pdf') ? (
                            <FileText size={16} className="text-gray-400" />
                          ) : (
                            <FileSpreadsheet size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(i)}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón de acción */}
              <button
                disabled={files.length === 0 || uploading}
                onClick={startUpload}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                  files.length > 0 
                  ? "bg-[#06200F] text-white shadow-sm hover:shadow-md" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>Procesar {files.length} {files.length === 1 ? 'documento' : 'documentos'}</>
                )}
              </button>
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={32} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">¡Carga exitosa!</p>
                <p className="text-sm text-gray-400">
                  SmartCow está indexando tus documentos para darte mejores respuestas.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
