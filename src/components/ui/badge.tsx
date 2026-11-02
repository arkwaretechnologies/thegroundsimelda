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
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-border bg-white/50",
        variant === "success" && "bg-emerald-100 text-emerald-800",
        variant === "warning" && "bg-amber-100 text-amber-800",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
