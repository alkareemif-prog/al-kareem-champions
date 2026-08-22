import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  ShieldCheck,
  ClipboardList,
  Award,
  Settings,
  Crown,
  ArrowRight,
  IdCard,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FOUNDATION_NAME, LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Al Kareem International Foundation" },
      {
        name: "description",
        content: "Your Registration Number, attempts, results and certificates.",
      },
      { property: "og:title", content: "My Dashboard — Al Kareem International Foundation" },
      { property: "og:description", content: "Track your competitions and certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  competition_admin: "Competition Admin",
  evaluator: "Evaluator",
  competitor: "Competitor",
};

const STATUS_STYLE: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  evaluated: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function DashboardPage() {
  const { user, roles, isAdmin, isEvaluator } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSuperAdmin = roles.includes("super_admin");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["my-attempts", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_attempts")
        .select(
          "id, status, total_score, rank, started_at, submitted_at, competitions(title, results_published)",
        )
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const displayName = profile?.full_name_en ?? user?.email?.split("@")[0] ?? "participant";

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Welcome header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-gold-deep text-xs font-semibold tracking-[0.25em] uppercase">
              Dashboard
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-primary sm:text-3xl">
              Welcome back, {displayName}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((role) =>
                role === "super_admin" ? (
                  <Badge
                    key={role}
                    className="bg-gradient-gold text-accent-foreground gap-1 border-0 shadow-gold"
                  >
                    <Crown className="size-3.5" /> Super Admin
                  </Badge>
                ) : (
                  <Badge key={role} variant="secondary" className="text-primary">
                    {ROLE_LABEL[role] ?? role.replace("_", " ")}
                  </Badge>
                ),
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </div>

        {/* Admin workspace banner */}
        {isSuperAdmin && (
          <Link
            to="/admin"
            className="bg-gradient-emerald mt-8 flex flex-wrap items-center gap-4 rounded-2xl px-6 py-5 text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
          >
            <span className="bg-gradient-gold text-accent-foreground flex size-12 items-center justify-center rounded-xl">
              <ShieldCheck className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold">Admin Workspace</p>
              <p className="text-sm text-primary-foreground/80">
                Manage competitions, question banks, evaluations and certificates.
              </p>
            </div>
            <span className="text-gold-light inline-flex items-center gap-1 text-sm font-semibold">
              Open <ArrowRight className="size-4" />
            </span>
          </Link>
        )}

        {/* ID card + quick actions */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Card className="bg-gradient-emerald relative overflow-hidden rounded-2xl border-0 text-primary-foreground shadow-elegant lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-gold-light inline-flex items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase">
                  <IdCard className="size-4" /> Registration Number
                </span>
                <img src={LOGO_URL} alt={`${FOUNDATION_NAME} logo`} className="h-9 w-9 object-contain" />
              </div>
              <p className="font-display mt-5 text-2xl font-bold tracking-wide tabular-nums">
                {profile?.registration_number ?? "—"}
              </p>
              <div className="mt-5 border-t border-primary-foreground/20 pt-4 text-sm">
                <p className="font-medium">{profile?.full_name_en ?? displayName}</p>
                <p className="text-primary-foreground/70">{user?.email}</p>
                <p className="text-primary-foreground/70 capitalize">
                  Category: {profile?.participant_category ?? "general"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card shadow-sm lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="font-display text-base font-semibold text-primary">Quick actions</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="gold" size="sm">
                  <Link to="/profile">
                    <Settings /> Registration details
                  </Link>
                </Button>
                <Button asChild variant="goldOutline" size="sm">
                  <Link to="/certificates">
                    <Award /> My certificates
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/events">
                    <CalendarDays /> Browse events
                  </Link>
                </Button>
                {isEvaluator && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/evaluate">
                      <ClipboardList /> Evaluation panel
                    </Link>
                  </Button>
                )}
                {isAdmin && !isSuperAdmin && (
                  <Button asChild variant="emerald" size="sm">
                    <Link to="/admin">
                      <ShieldCheck /> Admin
                    </Link>
                  </Button>
                )}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <MiniStat label="Attempts" value={attempts?.length ?? 0} />
                <MiniStat
                  label="Evaluated"
                  value={(attempts ?? []).filter((a: any) => a.status === "evaluated").length}
                />
                <MiniStat
                  label="Pending"
                  value={(attempts ?? []).filter((a: any) => a.status !== "evaluated").length}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts */}
        <h2 className="font-display mt-10 mb-4 text-lg font-semibold text-primary">My attempts</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(attempts ?? []).map((attempt: any) => {
            const published = attempt.competitions?.results_published;
            return (
              <Card key={attempt.id} className="rounded-2xl border-border/60 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display font-semibold text-primary">
                      {attempt.competitions?.title}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium capitalize ${
                        STATUS_STYLE[attempt.status] ?? "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {String(attempt.status).replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-xl bg-muted/60 py-2">
                      <p className="font-display text-lg font-bold text-primary tabular-nums">
                        {published ? attempt.total_score : "—"}
                      </p>
                      <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        Score
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/60 py-2">
                      <p className="font-display text-gold-deep text-lg font-bold tabular-nums">
                        {published && attempt.rank ? `#${attempt.rank}` : "—"}
                      </p>
                      <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        Rank
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/60 py-2">
                      <p className="text-sm font-medium text-primary">
                        {new Date(attempt.submitted_at ?? attempt.started_at).toLocaleDateString()}
                      </p>
                      <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        Date
                      </p>
                    </div>
                  </div>
                  {!published && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Result pending publication by the administration.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {attempts && attempts.length === 0 && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <Trophy className="text-gold-deep size-8" />
              <p className="text-muted-foreground">
                You have not attempted any competition yet.
              </p>
              <Button asChild variant="gold" size="sm">
                <Link to="/events">Browse events</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/60 py-3">
      <p className="font-display text-xl font-bold text-primary tabular-nums">{value}</p>
      <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
