import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "意一堂健康管理系統",
  description: "融合中醫與功能醫學，從根源改善健康問題",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex" style={{ background: "var(--background)" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
