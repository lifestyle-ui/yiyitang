"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, Settings, Heart, Pill, FlaskConical, LogOut,
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

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link href={href}
      className={cn("flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 text-sm transition-colors",
        active ? "font-medium" : "font-normal")}
      style={active
        ? { background: "#2A2A2A", color: "#F0EDE8" }
        : { color: "#7A7570" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#C8C2B8"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#7A7570"; }}>
      <Icon className="w-4 h-4 shrink-0" />{label}
    </Link>
  );
}

function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };
  return (
    <button onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors"
      style={{ color: "#7A7570" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#C8C2B8"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7A7570"; }}>
      <LogOut className="w-4 h-4 shrink-0" />登出
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen" style={{ background: "#1A1A1A", borderRight: "1px solid #2E2E2E" }}>
      <div className="px-4 py-[18px]" style={{ borderBottom: "1px solid #2E2E2E" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] flex items-center justify-center flex-shrink-0" style={{ border: "1.5px solid #4A4A4A" }}>
            <Heart className="w-3.5 h-3.5" style={{ color: "#C8C2B8" }} />
          </div>
          <div>
            <p className="text-[13px] font-medium leading-tight tracking-wide" style={{ color: "#F0EDE8" }}>意一堂</p>
            <p className="text-[11px] leading-tight" style={{ color: "#6B6560" }}>健康管理系統</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-4">
        <div>
          {navItems.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
        </div>
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: "#4A4540" }}>目錄管理</p>
          {catalogItems.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
        </div>
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: "#4A4540" }}>系統</p>
          {systemItems.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
        </div>
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid #2E2E2E" }}>
        <LogoutButton />
      </div>
    </aside>
  );
}
