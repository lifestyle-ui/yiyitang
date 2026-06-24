"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, Settings, Pill, FlaskConical, LogOut,
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
      className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors")}
      style={active
        ? { background: "rgba(255,255,255,0.10)", color: "#faf7f1", fontWeight: 500, borderRadius: "var(--radius-sm)" }
        : { color: "#b3a99d", borderRadius: "var(--radius-sm)" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#d8cabb"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#b3a99d"; }}>
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
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
      style={{ color: "#b3a99d", borderRadius: "var(--radius-sm)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#d8cabb"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#b3a99d"; }}>
      <LogOut className="w-4 h-4 shrink-0" />登出
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen"
      style={{ background: "var(--brown-900)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Logo area */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <Image
            src="/emblem-knockout.png"
            alt="意一堂"
            width={32}
            height={32}
            className="shrink-0 opacity-90"
          />
          <div>
            <p className="text-[14px] leading-tight tracking-[0.12em]"
              style={{ color: "#faf7f1", fontFamily: "var(--font-cjk)", fontWeight: 500 }}>
              意一堂
            </p>
            <p className="text-[10px] leading-tight mt-0.5 tracking-[0.18em] uppercase"
              style={{ color: "#876b57", fontFamily: "var(--font-sans)" }}>
              Health System
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-5">
        <div>
          {navItems.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
        </div>
        <div>
          <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[.18em]"
            style={{ color: "#6f5645", fontFamily: "var(--font-sans)" }}>目錄管理</p>
          {catalogItems.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
        </div>
        <div>
          <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[.18em]"
            style={{ color: "#6f5645", fontFamily: "var(--font-sans)" }}>系統</p>
          {systemItems.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <LogoutButton />
      </div>

      {/* Bottom maroon rule — ESSENTIA brand mark */}
      <div style={{ height: "3px", background: "var(--maroon-700)" }} />
    </aside>
  );
}
