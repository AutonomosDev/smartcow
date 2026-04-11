"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Grid2X2,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Chat IA",
    href: "/chat",
    icon: MessageSquare,
    enabled: true,
  },
  {
    label: "Lotes",
    href: "/lotes",
    icon: Grid2X2,
    enabled: false,
  },
  {
    label: "Tareas",
    href: "/tasks",
    icon: ClipboardList,
    enabled: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col font-inter">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-50">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex-shrink-0 shadow-sm shadow-blue-100" />
        <span className="text-gray-900 font-bold text-lg tracking-tight">SmartCow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl opacity-40 cursor-not-allowed group"
              >
                <Icon size={18} className="text-gray-400 group-hover:text-gray-500 transition-colors" />
                <span className="text-gray-400 text-sm font-medium">{item.label}</span>
                <span className="ml-auto text-[9px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100/50">
                  Pronto
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-900 transition-colors"}
              />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
