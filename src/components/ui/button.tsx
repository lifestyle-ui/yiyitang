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
      variant === "primary" ? { background: "#2C4A3E", color: "#fff", border: "1px solid transparent" }
      : variant === "secondary" ? { background: "#fff", color: "#3A3A3A", border: "1px solid #DDDAD4" }
      : variant === "ghost" ? { background: "transparent", color: "#6A6560", border: "1px solid transparent" }
      : { background: "#B83232", color: "#fff", border: "1px solid transparent" };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85",
          sizeStyles[size],
          className
        )}
        style={{ ...variantStyle, ...style, ['--tw-ring-color' as string]: "#2C4A3E" }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
