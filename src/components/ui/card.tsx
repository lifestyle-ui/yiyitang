import { cn } from "@/lib/utils";

export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm", className)} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={cn("px-5 py-4 border-b border-slate-100", className)} style={style}>{children}</div>;
}

export function CardTitle({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <h3 className={cn("text-base font-semibold text-slate-800", className)} style={style}>{children}</h3>;
}

export function CardContent({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={cn("px-5 py-4", className)} style={style}>{children}</div>;
}
