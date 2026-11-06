"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SignupForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/brand";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[68rem] items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join {BRAND_NAME}</CardTitle>
          <CardDescription>Create your membership account</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm
            next="/dashboard"
            onSuccess={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            onNeedsConfirmation={(email) =>
              toast.success(`Account created — check ${email} to confirm, then log in.`)
            }
          />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
