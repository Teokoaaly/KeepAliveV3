import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "terminal";
}

const variantClasses: Record<string, string> = {
  default: "border-primary bg-primary/20 text-primary",
  secondary: "border-border bg-secondary text-secondary-foreground",
  destructive: "border-destructive bg-destructive/20 text-destructive",
  outline: "border-border text-foreground",
  success: "border-green-500 bg-green-500/20 text-green-400",
  terminal: "border-accent bg-accent/20 text-accent uppercase tracking-wider shadow-[0_0_5px_hsl(var(--accent)/0.5)]",
};

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center border-2 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

export { Badge };
