import { StartupForm } from "@/components/startup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function NewStartupContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Founder profile unavailable</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>We could not verify your profile. Try again before publishing a startup.</p>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/protected">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (profile.role !== "founder") {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Founder profile required</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>Only founder profiles can publish startups.</p>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/protected">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/protected">← Back to dashboard</Link>
      </Button>
      <StartupForm />
    </div>
  );
}

export default function NewStartupPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-[44rem] w-full max-w-3xl animate-pulse rounded-2xl bg-muted" />}>
      <NewStartupContent />
    </Suspense>
  );
}
