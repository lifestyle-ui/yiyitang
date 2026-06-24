"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <>
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </>
  );
}
