"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-zinc-400",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
