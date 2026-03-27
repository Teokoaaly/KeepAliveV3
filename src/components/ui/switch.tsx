"use client";

import * as React from "react";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border-2 border-border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" : "bg-secondary"
        } ${className}`}
        onClick={() => onCheckedChange?.(!checked)}
      >
        <span
          className={`pointer-events-none block h-5 w-5 bg-background border-2 transition-all ${
            checked ? "translate-x-5 border-primary" : "translate-x-0 border-border"
          }`}
        />
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
