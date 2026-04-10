"use client";

/**
 * Chat sidebar desktop — basado en la referencia 21st.dev Sidebar
 * (web_ai_chat_sidebar.png): fondo blanco, Organization dropdown,
 * nav items con iconos, Settings + Account en el footer.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  MessageSquare,
  Layers,
  Users,
  GitCompare,
  BookOpen,
  MessageCircle,
  FileSearch,
  Settings,
  ChevronsUpDown,
  Target,
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
}

function NavItem({ href, icon: Icon, label, badge, active, disabled }: NavItemProps) {
  const base =
    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full text-left";

  if (disabled) {
    return (
      <div className={`${base} text-gray-400 cursor-not-allowed opacity-60`}>
        <Icon size={16} className="flex-shrink-0" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${
        active
          ? "bg-gray-100 text-gray-900 font-medium"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-900 text-white">
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

  return (
    <aside className="w-52 min-h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo + Organization dropdown */}
      <div className="px-3 py-3 border-b border-gray-100">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-1 mb-2">
          <div className="w-5 h-5 rounded bg-brand-dark flex items-center justify-center flex-shrink-0">
            <Target size={11} className="text-brand-light" />
          </div>
          <span className="text-gray-900 text-sm font-semibold">SmartCow</span>
        </div>
        {/* Organization */}
        <button className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-left">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-[8px] text-gray-500 font-bold">O</span>
            </div>
            <span className="text-sm text-gray-700">{orgName ?? "Organización"}</span>
          </div>
          <ChevronsUpDown size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Nav items — igual al mockup 21st.dev */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />
        <NavItem
          href="/chat"
          icon={MessageSquare}
          label="Chat"
          badge="BETA"
          active={pathname === "/chat"}
        />
        <NavItem href="#" icon={BarChart2} label="Reportes" disabled />
        <NavItem href="#" icon={Layers} label="Lotes" disabled />
        <NavItem href="#" icon={Users} label="Animales" disabled />
        <NavItem href="#" icon={GitCompare} label="Potreros" disabled />
        <NavItem href="#" icon={BookOpen} label="Base de Conocimiento" disabled />
        <NavItem href="#" icon={MessageCircle} label="Feedback" disabled />
        <NavItem href="#" icon={FileSearch} label="Reportes PDF" disabled />
      </nav>

      {/* Footer: Settings + Account */}
      <div className="px-2 py-2 border-t border-gray-100 space-y-0.5">
        <NavItem href="#" icon={Settings} label="Ajustes" disabled />
        {/* Account */}
        <button className="flex items-center justify-between w-full px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-gray-600 font-semibold uppercase">
                {userName?.[0] ?? "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-700 font-medium truncate leading-none mb-0.5">
                {userName ?? "Usuario"}
              </p>
              <p className="text-[10px] text-gray-400 truncate leading-none">{userEmail ?? ""}</p>
            </div>
          </div>
          <ChevronsUpDown size={14} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
