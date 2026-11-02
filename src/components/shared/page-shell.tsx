import { cn } from "@/lib/utils";

/** Centered content column used across marketing + member pages. */
export function PageShell({
  children,
  className,
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "main" | "section" | "header" | "footer";
}) {
  return (
    <Comp className={cn("mx-auto w-full max-w-[68rem] px-4 sm:px-6", className)}>
      {children}
    </Comp>
  );
}
