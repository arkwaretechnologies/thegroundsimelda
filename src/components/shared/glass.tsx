import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-2xl p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-pv-ink sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-pv-ink">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function WalletBadge({ balanceCents }: { balanceCents: number }) {
  const formatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(balanceCents / 100);

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--pv-green-deep)] px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-primary/20">
      <span className="opacity-80">Wallet</span>
      <span className="tabular-nums">{formatted}</span>
    </div>
  );
}
