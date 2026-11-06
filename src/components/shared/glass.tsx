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
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <div className="gold-rule mt-2.5 max-w-[7rem] text-[7px]">✦</div>
        {description ? (
          <p className="mt-2.5 max-w-md text-sm text-muted-foreground">
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
    <div className="glass rounded-2xl px-3.5 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-[family-name:var(--font-cinzel)] text-xl font-semibold tabular-nums text-[var(--tg-gold-light)] sm:text-2xl">
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
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,168,69,0.4)] bg-[rgba(212,168,69,0.1)] px-3.5 py-1.5 text-sm font-semibold text-[var(--tg-gold-light)]">
      <span className="text-white/60">Wallet</span>
      <span className="tabular-nums">{formatted}</span>
    </div>
  );
}
