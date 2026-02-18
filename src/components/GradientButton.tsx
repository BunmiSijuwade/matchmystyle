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
          "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" && "gradient-primary text-primary-foreground shadow-brand hover:scale-105 hover:shadow-glow animate-pulse-glow",
          variant === "outline" && "border border-primary text-primary hover:bg-accent hover:text-accent-foreground hover:scale-105",
          variant === "ghost" && "text-foreground hover:text-primary hover:bg-accent",
          size === "sm" && "text-sm px-4 py-2",
          size === "md" && "text-base px-6 py-3",
          size === "lg" && "text-lg px-8 py-4",
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
