import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { AuthModalProvider } from "@/components/marketing/auth-modal";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthModalProvider>
      <div className="theme-grounds min-h-screen">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
