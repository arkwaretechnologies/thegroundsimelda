import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { BRAND_NAME, BRAND_SHORT_DESCRIPTION, BRAND_WORDMARK } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/50 backdrop-blur-xl">
      <PageShell className="flex h-14 items-center justify-between sm:h-16">
        <Link href="/" className="font-display text-lg font-bold text-pv-ink sm:text-xl">
          {BRAND_WORDMARK.primary}{" "}
          <span className="text-primary">{BRAND_WORDMARK.accent}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-pv-muted md:flex">
          <Link href="/#how" className="hover:text-pv-ink">
            How it works
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Join</Link>
          </Button>
        </div>
      </PageShell>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/30 py-8">
      <PageShell className="text-center text-sm text-muted-foreground">
        <p className="font-display text-base font-semibold text-pv-ink">
          {BRAND_NAME}
        </p>
        <p className="mt-1">{BRAND_SHORT_DESCRIPTION}</p>
      </PageShell>
    </footer>
  );
}
