import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm text-foreground caret-primary placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_5px_hsl(var(--primary)/0.5),0_0_10px_hsl(var(--primary)/0.3)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
