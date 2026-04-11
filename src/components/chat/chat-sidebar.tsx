"use client";

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
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useState } from "react";

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
      <div className={`${base} text-gray-400 cursor-not-allowed opacity-60`} title={label}>
        <Icon size={16} className="flex-shrink-0" />
        <span className="whitespace-nowrap overflow-hidden transition-opacity duration-200">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${
        active
          ? "bg-white shadow-sm border border-gray-100 text-gray-900 font-medium"
          : "text-gray-600 hover:bg-white hover:text-gray-900"
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

  return (
    <aside 
      className={`min-h-screen bg-[#F9F9F8] border-r border-[#EAE8E4] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-[260px]'}`}
    >
      {/* Logo + Organization dropdown */}
      <div className="px-3 py-3 border-b border-[#EAE8E4]">
        {/* Logo and Collapse Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-2 py-1 mb-2`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-brand-dark flex items-center justify-center flex-shrink-0">
                <Target size={11} className="text-brand-light" />
              </div>
              <span className="text-gray-900 text-sm font-semibold whitespace-nowrap overflow-hidden">SmartCow</span>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-800 p-1 rounded-md hover:bg-[#efedec] transition-colors"
            title="Toggle Sidebar"
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        {/* Organization */}
        {!isCollapsed && (
          <button className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-white transition-colors text-left border border-transparent hover:border-gray-100 hover:shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
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
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Inicio"
          active={pathname === "/dashboard"}
        />
        <NavItem
          href="/chat"
          icon={MessageSquare}
          label="Chat"
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
      <div className="px-2 py-2 border-t border-[#EAE8E4] space-y-0.5">
        <NavItem href="#" icon={Settings} label="Ajustes" disabled />
        {/* Account */}
        <button className="flex items-center justify-between w-full px-2.5 py-2 rounded-md hover:bg-white transition-colors text-left border border-transparent hover:border-gray-100 hover:shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
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
  );
}
