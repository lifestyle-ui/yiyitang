import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, style, children, ...props }, ref) => {
    const variantStyle: React.CSSProperties =
      variant === "primary" ? { background: "#5c4638", color: "#fff", border: "1px solid transparent" }
      : variant === "secondary" ? { background: "#fff", color: "#3b332c", border: "1px solid #d8cfc3" }
      : variant === "ghost" ? { background: "transparent", color: "#6b6056", border: "1px solid transparent" }
      : { background: "#b8392c", color: "#fff", border: "1px solid transparent" };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85",
          sizeStyles[size],
          className
        )}
        style={{ ...variantStyle, ...style, ['--tw-ring-color' as string]: "#5c4638" }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
