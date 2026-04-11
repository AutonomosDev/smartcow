"use client";

import * as React from "react";
import { 
  AlertTriangle,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";
import { cn } from "@/src/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmationModal({ 
  isOpen, 
  onOpenChange, 
  title, 
  description, 
  confirmLabel = "Confirmar", 
  cancelLabel = "Cancelar",
  onConfirm,
  variant = 'danger',
  isLoading = false
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="flex flex-col items-center text-center pt-4">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center mb-4 animate-in fade-in zoom-in duration-300",
            variant === 'danger' ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
          )}>
            <AlertTriangle size={24} />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center mt-2 max-w-[300px]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 p-0 mt-6">
          <button
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              "w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
              variant === 'danger' 
                ? "bg-red-500 text-white hover:bg-red-600 shadow-sm" 
                : "bg-gray-900 text-white hover:bg-black shadow-sm"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : confirmLabel}
          </button>
          <button
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300"
          >
            {cancelLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
