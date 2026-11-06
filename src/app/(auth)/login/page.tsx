"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/brand";

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Access your {BRAND_NAME} member account</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          next={next}
          onSuccess={() => {
            router.push(next);
            router.refresh();
          }}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[68rem] items-center justify-center px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="glass h-80 w-full max-w-sm animate-pulse rounded-3xl" />}>
        <LoginCard />
      </Suspense>
    </div>
  );
}
