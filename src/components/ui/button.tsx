import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "terminal";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<string, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.8)]",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_10px_hsl(var(--destructive)/0.5)]",
  outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-background hover:shadow-[0_0_20px_hsl(var(--primary)/0.8)]",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  ghost: "hover:bg-accent/20 hover:text-accent",
  link: "text-primary underline-offset-4 hover:underline hover:shadow-[0_0_10px_hsl(var(--primary))]",
  terminal: "bg-transparent border-2 border-primary text-primary uppercase tracking-[2px] hover:bg-primary hover:text-background hover:shadow-[0_0_10px_hsl(var(--primary)),0_0_20px_hsl(var(--primary)),0_0_40px_hsl(var(--primary))] active:translate-x-[2px] active:translate-y-[2px]",
};

const sizeClasses: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-8 text-lg",
  icon: "h-10 w-10",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
