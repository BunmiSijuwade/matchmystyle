import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-all duration-300 ease-out rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none uppercase tracking-[1.5px]",
          variant === "primary" && "bg-foreground text-background hover:bg-foreground/90 hover:translate-y-[-1px] shadow-brand",
          variant === "outline" && "border border-[hsl(28,18%,78%)] text-muted-foreground hover:bg-muted hover:border-primary hover:text-foreground",
          variant === "ghost" && "text-foreground hover:text-primary hover:bg-muted",
          size === "sm" && "text-[11px] px-5 py-2 min-h-[44px] tracking-[1px]",
          size === "md" && "text-[13px] px-6 py-3 min-h-[44px]",
          size === "lg" && "text-[13px] px-8 py-4 min-h-[48px]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";
export default GradientButton;
