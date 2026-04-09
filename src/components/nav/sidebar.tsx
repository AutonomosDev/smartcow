"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

  return (
    <aside className="w-64 min-h-screen bg-brand-dark flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-7 h-7 rounded-inner bg-brand-light flex-shrink-0" />
        <span className="text-white font-bold text-base tracking-tight">SmartCow</span>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-inner opacity-30 cursor-not-allowed"
              >
                <Icon size={18} className="text-white/60" />
                <span className="text-white/60 text-sm">{item.label}</span>
                <span className="ml-auto text-[10px] text-white/40 font-medium uppercase tracking-wider">
                  Pronto
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-inner transition-colors group ${
                isActive
                  ? "bg-brand-light/15 text-brand-light"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-brand-light" : "text-white/60 group-hover:text-white"}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <ChevronRight size={14} className="ml-auto text-brand-light/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {session?.user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-pill bg-brand-light/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-light text-xs font-bold uppercase">
                {session.user.name?.[0] ?? "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {session.user.name ?? "Usuario"}
              </p>
              <p className="text-white/40 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
