"use client";

import * as React from "react";
import { LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog-v2";

interface UserMenuModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string | null;
  userEmail?: string | null;
  onSettingsClick: () => void;
}

export function UserMenuModal({
  isOpen,
  onOpenChange,
  userName,
  userEmail,
  onSettingsClick,
}: UserMenuModalProps) {
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleSettings = () => {
    onOpenChange(false);
    onSettingsClick();
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <span className="text-xl font-bold text-gray-600">{initials}</span>
          </div>
          <DialogTitle className="text-base">{userName ?? "Usuario"}</DialogTitle>
          <p className="text-[13px] text-gray-400 mt-0.5">{userEmail ?? ""}</p>
        </DialogHeader>

        <div className="mt-4 space-y-1">
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 hover:bg-white/60 transition-colors text-left font-medium border border-transparent hover:border-white/40 backdrop-blur-md bg-white/20"
          >
            <div className="w-8 h-8 rounded-xl bg-white/40 flex items-center justify-center">
              <Settings size={15} className="text-gray-500" />
            </div>
            Ajustes
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-500 hover:bg-red-50/20 transition-colors text-left font-medium border border-transparent hover:border-red-100/20 backdrop-blur-md bg-white/20"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50/20 flex items-center justify-center">
              <LogOut size={15} className="text-red-500" />
            </div>
            Cerrar sesión
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
