"use client";

import { useState } from "react";
import { FontProvider } from "@/src/providers/font-provider";
import { ChatSidebarV2 } from "@/src/components/chat/chat-sidebar-v2";
import { ChatPanelV2 } from "@/src/components/chat/chat-panel-v2";
import { KBUploadModal } from "@/src/components/modals/kb-upload-modal";
import { KBManagementModal } from "@/src/components/modals/kb-management-modal";
import { ConfirmationModal } from "@/src/components/modals/confirmation-modal";
import { OrgSwitcherModal } from "@/src/components/modals/org-switcher-modal";
import { UserProfileModal } from "@/src/components/modals/user-profile-modal";
import { NotificationsModal } from "@/src/components/modals/notifications-modal";
import { ChatHistoryModal } from "@/src/components/modals/chat-history-modal";
import { SettingsModal } from "@/src/components/modals/settings-modal";
import { ChevronLeft, ChevronDown, SquarePen, X } from "lucide-react";
import Link from "next/link";
import { ChatShareButton } from "@/src/components/chat/chat-share-button";

export function ChatPageClientV2({ predioId, initialMessage, nombrePredio, session }: any) {
  // Estados para modales existentes
  const [isKBMgmtOpen, setIsKBMgmtOpen] = useState(false);
  const [isKBUploadOpen, setIsKBUploadOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);

  // Estados para nuevos modales V2
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDeleteRequest = (file: any) => {
    setFileToDelete(file);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log("Eliminando archivo:", fileToDelete);
    setIsConfirmOpen(false);
    setFileToDelete(null);
  };

  const handleOrgSelect = (org: any) => {
    console.log("Cambiando a predio:", org.name);
    // Aquí iría la lógica de redirección o cambio de contexto si fuera necesario
  };

  return (
    <FontProvider>
      {/* ── MODALES ── */}
      <KBManagementModal 
        isOpen={isKBMgmtOpen} 
        onOpenChange={setIsKBMgmtOpen} 
        onUploadClick={() => {
          setIsKBMgmtOpen(false);
          setIsKBUploadOpen(true);
        }}
        onDeleteRequest={handleDeleteRequest}
      />
      <KBUploadModal 
        isOpen={isKBUploadOpen} 
        onOpenChange={setIsKBUploadOpen} 
      />
      <ConfirmationModal 
        isOpen={isConfirmOpen} 
        onOpenChange={setIsConfirmOpen} 
        onConfirm={handleConfirmDelete}
        title="¿Eliminar documento?"
        description={`Esta acción eliminará "${fileToDelete?.name || 'el documento'}" de la base de conocimiento y SmartCow dejará de usarlo como contexto.`}
      />

      <OrgSwitcherModal 
        isOpen={isOrgSwitcherOpen} 
        onOpenChange={setIsOrgSwitcherOpen}
        currentOrgId={predioId}
        onSelect={handleOrgSelect}
      />

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onOpenChange={setIsProfileOpen}
        user={{
          name: session.user.nombre,
          email: session.user.email,
          role: "Administrador SmartCow"
        }}
        onLogout={() => console.log("Cerrando sesión...")}
      />

      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onOpenChange={setIsNotificationsOpen}
      />

      <ChatHistoryModal 
        isOpen={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen}
        onSelect={(id) => console.log("Cargando charla:", id)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
      />

      {/* ── DESKTOP: sidebar izq + chat área ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-white">
        <ChatSidebarV2
          orgName={nombrePredio}
          userName={session.user.nombre}
          userEmail={session.user.email}
          onKBClick={() => setIsKBMgmtOpen(true)}
          onOrgClick={() => setIsOrgSwitcherOpen(true)}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          onHistoryClick={() => setIsHistoryOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
        />
        {/* Área principal de chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
          {/* Header del chat */}
          <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100/50 flex-shrink-0 bg-white sticky top-0 z-10">
            {/* Izquierda: dropdown conversaciones */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
              >
                <span className="text-gray-900 text-sm font-medium text-opacity-50 italic">Nueva conversación...</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
            </div>

            {/* Centro: título */}
            <div 
              onClick={() => setIsOrgSwitcherOpen(true)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors text-[#06200F] cursor-pointer hover:bg-gray-50 font-inherit"
            >
              <span className="text-[15px] font-bold tracking-tight">
                {nombrePredio || "smartCow"}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>

            {/* Derecha: acciones */}
            <div className="flex items-center gap-1">
              <Link href="/chat" className="p-1.5 rounded-md hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600">
                <SquarePen size={16} />
              </Link>
              <ChatShareButton />
              <Link href="/dashboard" className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600">
                <X size={16} />
              </Link>
            </div>
          </header>
          <div className="flex-1 min-h-0">
            <ChatPanelV2
              predioId={predioId}
              initialMessage={initialMessage}
              nombrePredio={nombrePredio}
              userName={session.user.nombre}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE: full-height, fondo blanco ── */}
      <div className="flex md:hidden flex-col h-screen bg-white overflow-hidden font-inherit">
        {/* Header mobile */}
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <Link href="/dashboard" className="p-1 -ml-1 text-gray-400">
            <ChevronLeft size={22} />
          </Link>
          <div className="w-8 h-8 flex items-center justify-center mix-blend-multiply">
            <img src="/cow_robot.png" alt="smartCow" className="w-full h-full object-contain" />
          </div>
          <button onClick={() => setIsProfileOpen(true)} className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
            {session.user.nombre?.[0] ?? "U"}
          </button>
        </header>
        <div className="flex-1 min-h-0">
          <ChatPanelV2
            predioId={predioId}
            initialMessage={initialMessage}
            nombrePredio={nombrePredio}
            userName={session.user.nombre}
            className="bg-transparent"
          />
        </div>
      </div>
    </FontProvider>
  );
}
