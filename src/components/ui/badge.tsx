"use client";

import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-gold text-primary-foreground",
        variant === "secondary" &&
          "border border-[rgba(212,168,69,0.25)] bg-secondary text-secondary-foreground",
        variant === "outline" &&
          "border border-[rgba(212,168,69,0.3)] bg-transparent text-[var(--tg-gold-light)]",
        variant === "success" &&
          "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
        variant === "warning" &&
          "border border-amber-300/25 bg-amber-300/10 text-amber-200",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
