"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoginForm, SignupForm } from "@/components/auth/auth-forms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";

type AuthMode = "signin" | "signup";

type OpenAuthOptions = {
  mode?: AuthMode;
  /** Where to go after a successful sign-in / sign-up. */
  next?: string;
  /** Headline shown above the forms. */
  title?: string;
  description?: string;
};

type AuthModalContextValue = {
  openAuth: (options?: OpenAuthOptions) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside <AuthModalProvider>");
  return ctx;
}

const inputDark =
  "border-[rgba(212,168,69,0.28)] bg-black/40 text-[#f5efe2] placeholder:text-white/35 focus-visible:ring-[#d4a845]";
const submitGold =
  "bg-gold rounded-full text-[#15110a] shadow-[0_10px_30px_rgba(212,168,69,0.25)] hover:brightness-110";
const secondaryDark =
  "rounded-full border-[rgba(212,168,69,0.35)] bg-transparent text-[#f5efe2] hover:bg-[rgba(212,168,69,0.1)]";

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [next, setNext] = useState("/dashboard");
  const [copy, setCopy] = useState<{ title: string; description: string }>({
    title: `Welcome to ${BRAND_NAME}`,
    description: "Sign in or create your member account to continue.",
  });
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const openAuth = useCallback((options: OpenAuthOptions = {}) => {
    setMode(options.mode ?? "signin");
    setNext(options.next ?? "/dashboard");
    setCopy({
      title: options.title ?? `Welcome to ${BRAND_NAME}`,
      description:
        options.description ?? "Sign in or create your member account to continue.",
    });
    setConfirmEmail(null);
    setOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.push(next);
    router.refresh();
  }, [next, router]);

  return (
    <AuthModalContext.Provider value={{ openAuth }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "theme-grounds max-w-md border-[rgba(212,168,69,0.3)] bg-[#0b0b0a] p-0 text-[#f5efe2] shadow-[0_40px_120px_rgba(0,0,0,0.7)] sm:rounded-[1.75rem]",
            "[&>button:last-child]:text-[#f3d27a]"
          )}
        >
          <div className="relative overflow-hidden rounded-t-3xl border-b border-[rgba(212,168,69,0.18)] bg-[radial-gradient(ellipse_80%_120%_at_50%_0%,rgba(15,61,38,0.9),transparent_75%)] px-6 pb-5 pt-7 text-center">
            <Image
              src={BRAND_LOGO_SRC}
              alt=""
              width={140}
              height={52}
              className="mx-auto h-11 w-auto"
            />
            <DialogHeader className="mt-4 text-center">
              <DialogTitle className="text-gold text-center text-xl">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="text-center">
                {copy.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-7">
            {confirmEmail ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(212,168,69,0.4)]">
                  <MailCheck className="h-5 w-5 text-[#f3d27a]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Check your email</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a confirmation link to{" "}
                  <span className="text-[#f3d27a]">{confirmEmail}</span>. Confirm
                  your account, then sign in to book your court.
                </p>
                <Button
                  type="button"
                  className={cn("mt-6 w-full", submitGold)}
                  onClick={() => {
                    setConfirmEmail(null);
                    setMode("signin");
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)}>
                <TabsList className="mt-5 grid w-full grid-cols-2 rounded-full border border-[rgba(212,168,69,0.2)] bg-black/40">
                  <TabsTrigger
                    value="signin"
                    className="rounded-full text-white/60 data-[state=active]:bg-[rgba(212,168,69,0.16)] data-[state=active]:text-[#f3d27a]"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full text-white/60 data-[state=active]:bg-[rgba(212,168,69,0.16)] data-[state=active]:text-[#f3d27a]"
                  >
                    Create account
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="mt-5">
                  <LoginForm
                    idPrefix="modal-login"
                    next={next}
                    onSuccess={handleSuccess}
                    inputClassName={inputDark}
                    submitClassName={submitGold}
                    secondaryClassName={secondaryDark}
                  />
                </TabsContent>
                <TabsContent value="signup" className="mt-5">
                  <SignupForm
                    idPrefix="modal-signup"
                    next={next}
                    onSuccess={handleSuccess}
                    onNeedsConfirmation={setConfirmEmail}
                    inputClassName={inputDark}
                    submitClassName={submitGold}
                    secondaryClassName={secondaryDark}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

type GateOptions = {
  /** Which tab the modal opens on. */
  mode?: AuthMode;
  next?: string;
  title?: string;
  description?: string;
};

/**
 * Members-only action gate: signed-in members go straight to `next`;
 * everyone else gets the sign-in / sign-up modal without leaving the page.
 */
export function useMemberGate() {
  const router = useRouter();
  const { openAuth } = useAuthModal();
  const [checking, setChecking] = useState(false);

  const go = useCallback(
    async ({
      mode = "signin",
      next = "/dashboard/bookings",
      title = "Book your court",
      description = "Sign in or create a free account to reserve court time.",
    }: GateOptions = {}) => {
      setChecking(true);
      let signedIn = false;
      try {
        const { data } = await createClient().auth.getSession();
        signedIn = Boolean(data.session);
      } catch {
        // Supabase not configured — fall through to the modal.
      }
      setChecking(false);

      if (signedIn) {
        router.push(next);
        return;
      }
      openAuth({ mode, next, title, description });
    },
    [openAuth, router]
  );

  return { go, checking };
}

/** "Book a court" button wired to the member gate. */
export function BookCourtButton({
  className,
  children,
  size = "lg",
  ...gate
}: GateOptions & {
  className?: string;
  children: React.ReactNode;
  size?: "sm" | "default" | "lg";
}) {
  const { go, checking } = useMemberGate();

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={() => go(gate)}
      disabled={checking}
      aria-haspopup="dialog"
    >
      {children}
    </Button>
  );
}
