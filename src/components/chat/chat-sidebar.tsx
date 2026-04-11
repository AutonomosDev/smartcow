"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Layers,
  Users,
  GitCompare,
  BookOpen,
  FileSearch,
  Settings,
  ChevronsUpDown,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { OrgSwitcherModal } from "@/src/components/modals/org-switcher-modal";
import { NotificationsModal } from "@/src/components/modals/notifications-modal";
import { SettingsModal } from "@/src/components/modals/settings-modal";
import { UserMenuModal } from "@/src/components/modals/user-menu-modal";
import { KBManagementModal } from "@/src/components/modals/kb-management-modal";
import { KBUploadModal } from "@/src/components/modals/kb-upload-modal";
import { ConfirmationModal } from "@/src/components/modals/confirmation-modal";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, badge, active, disabled, onClick }: NavItemProps) {
  const base =
    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full text-left";

  if (disabled) {
    return (
      <div className={`${base} text-gray-400 cursor-not-allowed opacity-60`} title={label}>
        <Icon size={16} className="flex-shrink-0" />
        <span className="whitespace-nowrap overflow-hidden transition-opacity duration-200">{label}</span>
      </div>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} ${
          active
            ? "bg-white shadow-sm border border-gray-200/60 text-[#06200F] font-semibold"
            : "text-gray-500 hover:bg-white/80 hover:text-gray-900"
        }`}
        title={label}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-200 text-left">{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${
        active
          ? "bg-white shadow-sm border border-gray-200/60 text-[#06200F] font-semibold"
          : "text-gray-500 hover:bg-white/80 hover:text-gray-900"
        }`}
      title={label}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-200">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-900 text-white flex-shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface ChatSidebarProps {
  orgName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

export function ChatSidebar({ orgName, userName, userEmail }: ChatSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Modal states
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isKBOpen, setIsKBOpen] = useState(false);
  const [isKBUploadOpen, setIsKBUploadOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteRequest = (file: { id: string; name: string }) => {
    setDocToDelete(file);
    setIsKBOpen(false);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    // TODO: llamar a server action de delete
    setIsConfirmOpen(false);
    setDocToDelete(null);
  };

  return (
    <>
      <aside
        className={`min-h-screen bg-white border-r border-gray-100 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out font-inherit ${isCollapsed ? "w-16" : "w-[260px]"}`}
        suppressHydrationWarning
      >
        {/* Logo + Organization dropdown */}
        <div className="px-3 py-3 border-b border-[#EAE8E4]">
          {/* Logo and Collapse Toggle */}
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-2 py-1 mb-2`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <img src="/cow_robot.png" alt="smartCow" className="w-8 h-8 object-contain flex-shrink-0 mix-blend-multiply" />
                <span className="text-gray-900 text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden">smartCow</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className="relative text-gray-400 hover:text-gray-800 p-1 rounded-md hover:bg-gray-50/50 transition-colors"
                  title="Notificaciones"
                >
                  <Bell size={15} />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-400 hover:text-gray-800 p-1 rounded-md hover:bg-gray-50/50 transition-colors"
                title="Toggle Sidebar"
              >
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>
          </div>

          {/* Organization */}
          {!isCollapsed && (
            <button
              onClick={() => setIsOrgOpen(true)}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-white transition-colors text-left border border-transparent hover:border-gray-50 hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-[10px] text-gray-500 font-bold">O</span>
                </div>
                <span className="text-sm text-gray-700 whitespace-nowrap overflow-hidden">{orgName ?? "Organización"}</span>
              </div>
              <ChevronsUpDown size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Inicio" active={pathname === "/dashboard"} />
          <NavItem href="/chat" icon={MessageSquare} label="Chat" active={pathname === "/chat"} />
          <NavItem href="/lotes" icon={Layers} label="Lotes" active={pathname === "/lotes"} />
          <NavItem href="/animales" icon={Users} label="Animales" active={pathname === "/animales"} />
          <NavItem href="#" icon={GitCompare} label="Potreros" disabled />
          <NavItem href="#" icon={BookOpen} label="Base de Conocimiento" onClick={() => setIsKBOpen(true)} />
          <NavItem href="/reportes" icon={FileSearch} label="Reportes PDF" active={pathname === "/reportes"} />
        </nav>

        {/* Footer: Settings + Account */}
        <div className="px-2 py-2 border-t border-gray-50 space-y-0.5">
          <NavItem href="#" icon={Settings} label="Ajustes" onClick={() => setIsSettingsOpen(true)} />
          {/* Account */}
          <button
            onClick={() => setIsUserMenuOpen(true)}
            className="flex items-center justify-between w-full px-2.5 py-2 rounded-md hover:bg-white transition-colors text-left border border-transparent hover:border-gray-100 hover:shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-gray-600 font-semibold uppercase">
                  {userName?.[0] ?? "U"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate leading-none mb-0.5">
                    {userName ?? "Usuario"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate leading-none">{userEmail ?? ""}</p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronsUpDown size={14} className="text-gray-400 flex-shrink-0" />}
          </button>
        </div>
      </aside>

      {/* Modales */}
      <OrgSwitcherModal
        isOpen={isOrgOpen}
        onOpenChange={setIsOrgOpen}
        currentOrgId="1"
        onSelect={() => setIsOrgOpen(false)}
      />
      <NotificationsModal isOpen={isNotifOpen} onOpenChange={setIsNotifOpen} />
      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <UserMenuModal
        isOpen={isUserMenuOpen}
        onOpenChange={setIsUserMenuOpen}
        userName={userName}
        userEmail={userEmail}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      <KBManagementModal
        isOpen={isKBOpen}
        onOpenChange={setIsKBOpen}
        onUploadClick={() => {
          setIsKBOpen(false);
          setIsKBUploadOpen(true);
        }}
        onDeleteRequest={handleDeleteRequest}
      />
      <KBUploadModal isOpen={isKBUploadOpen} onOpenChange={setIsKBUploadOpen} />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Eliminar documento"
        description={`¿Eliminar "${docToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </>
  );
}
