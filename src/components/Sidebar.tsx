"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, Settings, Heart, Pill, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "今日待辦" },
  { href: "/clients", icon: Users, label: "客戶管理" },
  { href: "/tasks", icon: ClipboardList, label: "任務清單" },
];

const catalogItems = [
  { href: "/products", icon: Pill, label: "保健品目錄" },
  { href: "/test-items", icon: FlaskConical, label: "檢測項目" },
];

const systemItems = [
  { href: "/admin", icon: Settings, label: "管理設定" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">意一堂</p>
            <p className="text-xs text-slate-500 leading-tight">健康管理系統</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-4">
        <div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                  isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}>
                <Icon className="w-4 h-4 shrink-0" />{item.label}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">目錄管理</p>
          {catalogItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                  isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}>
                <Icon className="w-4 h-4 shrink-0" />{item.label}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">系統</p>
          {systemItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                  isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}>
                <Icon className="w-4 h-4 shrink-0" />{item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">找回健康的根本力量</p>
      </div>
    </aside>
  );
}
