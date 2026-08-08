import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { startupStageLabels } from "@/lib/validations";
import { CheckCircle2, Plus, Rocket, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function ProtectedContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: profile, error: profileError },
    { data: startups, error: startupsError },
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("startups")
      .select("id, title, slug, one_pager, stage, niche, is_active")
      .eq("founder_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const isFounder = profile?.role === "founder";

  return (
    <div className="grid w-full gap-8">
      <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Verified server session
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {isFounder ? "Founder dashboard" : "Startup Zone dashboard"}
              </h1>
              <p className="mt-2 text-muted-foreground">Signed in as {user.email ?? "a verified user"}.</p>
            </div>
          </div>
          {isFounder && (
            <Button asChild size="lg">
              <Link href="/protected/startups/new">
                <Plus aria-hidden="true" />
                Publish startup
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="font-semibold">Security boundary</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "Server-side user verification",
              "Session refresh in Next.js Proxy",
              "Ownership derived from the signed-in user",
              "Database row-level security",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="your-startups-heading" className="grid gap-4">
        <div>
          <h2 id="your-startups-heading" className="text-xl font-semibold tracking-tight">
            Your startups
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects published through your founder profile.
          </p>
        </div>

        {profileError || startupsError ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Your startups could not be loaded. Please refresh and try again.
            </CardContent>
          </Card>
        ) : !isFounder ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              A founder profile is required to publish and manage startups.
            </CardContent>
          </Card>
        ) : startups?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {startups.map((startup) => (
              <Card key={startup.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{startup.title}</CardTitle>
                      <CardDescription className="mt-1">/{startup.slug}</CardDescription>
                    </div>
                    <Badge variant={startup.is_active ? "default" : "secondary"}>
                      {startup.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm text-muted-foreground">{startup.one_pager}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {startupStageLabels[startup.stage]}
                    </Badge>
                    {startup.niche.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 py-10">
              <span className="grid size-10 place-items-center rounded-lg bg-muted">
                <Rocket className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">No startups yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publish the first project to make it available through the persisted marketplace data.
                </p>
              </div>
              {isFounder && (
                <Button asChild>
                  <Link href="/protected/startups/new">Publish your first startup</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />}>
      <ProtectedContent />
    </Suspense>
  );
}
